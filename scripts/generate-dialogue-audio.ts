/**
 * Write one MP3 per dialogue line with Amazon Polly's generative engine.
 *
 * Uses the mis-api-full profile from ~/.aws/credentials. Set AWS_PROFILE to
 * use another profile. Polly runs in us-east-1 unless POLLY_REGION is set.
 * The profile has no region, and a shell AWS_REGION is not used, because
 * Spanish generative voices are not in every region.
 *
 * Lucia and Sergio (es-ES) are the course voices. Pedro (es-US) is only used
 * when a second man shares a scene with Alex. Spanish generative voices are
 * not offered in eu-west-2, ca-central-1, or eu-central-2.
 *
 * Dialogue lines come from each plan.json under spanish/. Those files override
 * the matching day in lib/curriculum/builtin-days.ts. Adding another plan.json
 * there includes it here on the next run.
 *
 *   npm run audio:dialogues
 *   npm run audio:dialogues -- --day 1
 *   npm run audio:dialogues -- --dry-run
 *   npm run audio:dialogues -- --force
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DescribeVoicesCommand,
  PollyClient,
  SynthesizeSpeechCommand,
  type LanguageCode,
  type VoiceId,
} from '@aws-sdk/client-polly'
import { fromIni } from '@aws-sdk/credential-provider-ini'
import { assemblePlan } from '../lib/curriculum/assemble.ts'
import { BUILTIN_DAYS } from '../lib/curriculum/builtin-days.ts'
import type { DayPlan } from '../lib/curriculum/types.ts'

type PollyVoice = {
  voiceId: VoiceId
  languageCode: LanguageCode
}

const LUCIA: PollyVoice = { voiceId: 'Lucia', languageCode: 'es-ES' }
const SERGIO: PollyVoice = { voiceId: 'Sergio', languageCode: 'es-ES' }
const PEDRO: PollyVoice = { voiceId: 'Pedro', languageCode: 'es-US' }

const SPEAKER_VOICES: Record<string, PollyVoice> = {
  Ana: LUCIA,
  Marta: LUCIA,
  Sofía: LUCIA,
  Noa: LUCIA,
  Elena: LUCIA,
  Lucía: LUCIA,
  Inés: LUCIA,
  Dependienta: LUCIA,
  Local: LUCIA,
  Alex: SERGIO,
  Luis: SERGIO,
  Pablo: SERGIO,
  Diego: SERGIO,
  Camarero: PEDRO,
  Nico: PEDRO,
  Omar: PEDRO,
}

const AWS_PROFILE_NAME = 'mis-api-full'
const REGIONS_WITHOUT_SPANISH_GENERATIVE = new Set(['eu-west-2', 'ca-central-1', 'eu-central-2'])

function awsProfile() {
  return process.env.AWS_PROFILE || AWS_PROFILE_NAME
}

type ManifestLine = {
  index: number
  speaker: string
  spanish: string
  voiceId: VoiceId
  languageCode: LanguageCode
  file: string
  textHash: string
}

type ManifestDay = {
  title: string
  lines: ManifestLine[]
}

type Manifest = {
  engine: 'generative'
  region: string
  sampleRate: '24000'
  days: Record<string, ManifestDay>
}

type Job = {
  day: number
  title: string
  index: number
  speaker: string
  spanish: string
  voice: PollyVoice
  relativeFile: string
  absoluteFile: string
  textHash: string
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const audioDir = join(root, 'public', 'audio')
const manifestPath = join(audioDir, 'manifest.json')

function parseArgs(argv: string[]) {
  const days = new Set<number>()
  let force = false
  let dryRun = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--force') {
      force = true
      continue
    }
    if (arg === '--dry-run') {
      dryRun = true
      continue
    }
    const value = arg === '--day' ? argv[++i] : arg.startsWith('--day=') ? arg.slice('--day='.length) : null
    if (value == null) throw new Error(`Unknown argument: ${arg}`)
    if (!value) throw new Error('--day needs a day number, for example --day 1')
    for (const part of value.split(',')) {
      const day = Number(part)
      if (!Number.isInteger(day) || day < 1) throw new Error(`Invalid day: ${part}`)
      days.add(day)
    }
  }

  return { days, force, dryRun }
}

function speakerSlug(speaker: string) {
  return speaker
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function textHash(voice: PollyVoice, spanish: string) {
  return createHash('sha256').update(`${voice.voiceId}\n${voice.languageCode}\n${spanish}`).digest('hex').slice(0, 16)
}

function voiceFor(speaker: string): PollyVoice {
  const voice = SPEAKER_VOICES[speaker]
  if (!voice) throw new Error(`No Polly voice mapped for speaker "${speaker}"`)
  return voice
}

async function loadPlan(): Promise<DayPlan[]> {
  const spanishDir = join(root, 'spanish')
  const sources: { source: string; value: unknown }[] = []

  async function walk(dir: string, prefix: string) {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return
      throw error
    }
    for (const entry of entries) {
      const relative = `${prefix}/${entry.name}`
      if (entry.isDirectory()) {
        await walk(join(dir, entry.name), relative)
      } else if (entry.name === 'plan.json') {
        const raw = await readFile(join(dir, entry.name), 'utf8')
        sources.push({ source: relative, value: JSON.parse(raw) as unknown })
      }
    }
  }

  await walk(spanishDir, 'spanish')
  if (sources.length === 0) {
    throw new Error(`No plan.json files under ${spanishDir}`)
  }
  console.log(`dialogues from ${sources.map((entry) => entry.source).join(', ')}`)
  return assemblePlan(sources, BUILTIN_DAYS)
}

function buildJobs(plan: DayPlan[], dayFilter: Set<number>): Job[] {
  const jobs: Job[] = []

  for (const day of plan) {
    if (dayFilter.size > 0 && !dayFilter.has(day.day)) continue
    const seen = new Map<string, VoiceId>()

    day.dialogue.lines.forEach((line, index) => {
      const spanish = line.spanish.trim()
      if (!spanish) throw new Error(`Day ${day.day} line ${index} is empty`)
      if (spanish.length > 3000) throw new Error(`Day ${day.day} line ${index} is over Polly's 3000 character limit`)

      const voice = voiceFor(line.speaker)
      const previous = seen.get(line.speaker)
      if (previous && previous !== voice.voiceId) {
        throw new Error(`Day ${day.day}: ${line.speaker} is mapped to more than one voice`)
      }
      seen.set(line.speaker, voice.voiceId)

      const folder = `day-${String(day.day).padStart(2, '0')}`
      const fileName = `${String(index).padStart(2, '0')}-${speakerSlug(line.speaker)}.mp3`
      const relativeFile = `/audio/${folder}/${fileName}`
      jobs.push({
        day: day.day,
        title: day.dialogue.title,
        index,
        speaker: line.speaker,
        spanish,
        voice,
        relativeFile,
        absoluteFile: join(root, 'public', relativeFile.slice(1)),
        textHash: textHash(voice, spanish),
      })
    })

    const speakers = [...seen.entries()]
    if (new Set(speakers.map(([, voiceId]) => voiceId)).size !== speakers.length) {
      const clash = speakers.map(([speaker, voiceId]) => `${speaker}=${voiceId}`).join(', ')
      throw new Error(`Day ${day.day} gives two speakers the same voice (${clash})`)
    }
  }

  if (jobs.length === 0) throw new Error('No dialogue lines matched. Check --day.')
  return jobs
}

async function readManifest(): Promise<Manifest | null> {
  try {
    const raw = await readFile(manifestPath, 'utf8')
    return JSON.parse(raw) as Manifest
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null
    throw error
  }
}

function previousLine(manifest: Manifest | null, job: Job): ManifestLine | undefined {
  return manifest?.days[String(job.day)]?.lines.find((line) => line.index === job.index && line.file === job.relativeFile)
}

async function fileExists(path: string) {
  try {
    const info = await stat(path)
    return info.isFile()
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return false
    throw error
  }
}

function region() {
  return process.env.POLLY_REGION || 'us-east-1'
}

function assertSpanishGenerativeRegion(selected: string) {
  if (!REGIONS_WITHOUT_SPANISH_GENERATIVE.has(selected)) return
  throw new Error(
    `${selected} does not offer Spanish generative voices. Set POLLY_REGION to us-east-1, eu-central-1, or us-west-2.`,
  )
}

async function assertVoicesAvailable(client: PollyClient, jobs: Job[]) {
  const available = new Set<string>()
  let nextToken: string | undefined
  do {
    const page = await client.send(new DescribeVoicesCommand({ Engine: 'generative', NextToken: nextToken }))
    for (const voice of page.Voices ?? []) {
      if (voice.Id) available.add(voice.Id)
    }
    nextToken = page.NextToken
  } while (nextToken)

  const required = [...new Set(jobs.map((job) => job.voice.voiceId))]
  const missing = required.filter((voiceId) => !available.has(voiceId))
  if (missing.length === 0) return
  throw new Error(
    `Generative voice ${missing.join(', ')} is not available in ${region()}. Use us-east-1, eu-central-1, or us-west-2.`,
  )
}

function isThrottle(error: unknown) {
  return error instanceof Error && (error.name === 'ThrottlingException' || error.name === 'TooManyRequestsException')
}

async function synthesize(client: PollyClient, job: Job) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await client.send(
        new SynthesizeSpeechCommand({
          Engine: 'generative',
          OutputFormat: 'mp3',
          SampleRate: '24000',
          TextType: 'text',
          Text: job.spanish,
          VoiceId: job.voice.voiceId,
          LanguageCode: job.voice.languageCode,
        }),
      )
      if (!response.AudioStream || !('transformToByteArray' in response.AudioStream)) {
        throw new Error(`Polly returned no audio for day ${job.day} line ${job.index}`)
      }
      return await response.AudioStream.transformToByteArray()
    } catch (error) {
      if (!isThrottle(error) || attempt === 3) throw error
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt))
    }
  }
  throw new Error(`Polly throttled day ${job.day} line ${job.index}`)
}

async function removeStaleAudio(jobs: Job[]) {
  const byDay = new Map<number, Set<string>>()
  for (const job of jobs) {
    const keep = byDay.get(job.day) ?? new Set<string>()
    keep.add(job.absoluteFile)
    byDay.set(job.day, keep)
  }

  for (const [day, keep] of byDay) {
    const folder = join(audioDir, `day-${String(day).padStart(2, '0')}`)
    let names: string[]
    try {
      names = await readdir(folder)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') continue
      throw error
    }
    for (const name of names) {
      if (!name.endsWith('.mp3')) continue
      const path = join(folder, name)
      if (!keep.has(path)) await unlink(path)
    }
  }
}

function manifestFrom(jobs: Job[], selectedRegion: string, existing: Manifest | null, dayFilter: Set<number>): Manifest {
  const days: Record<string, ManifestDay> = {}
  if (existing && dayFilter.size > 0) {
    for (const [day, entry] of Object.entries(existing.days)) {
      if (!dayFilter.has(Number(day))) days[day] = entry
    }
  }

  for (const job of jobs) {
    const key = String(job.day)
    const entry = days[key] ?? { title: job.title, lines: [] }
    entry.title = job.title
    entry.lines.push({
      index: job.index,
      speaker: job.speaker,
      spanish: job.spanish,
      voiceId: job.voice.voiceId,
      languageCode: job.voice.languageCode,
      file: job.relativeFile,
      textHash: job.textHash,
    })
    days[key] = entry
  }

  for (const entry of Object.values(days)) {
    entry.lines.sort((a, b) => a.index - b.index)
  }

  return {
    engine: 'generative',
    region: selectedRegion,
    sampleRate: '24000',
    days,
  }
}

async function main() {
  const { days, force, dryRun } = parseArgs(process.argv.slice(2))
  const selectedRegion = region()
  const profile = awsProfile()
  assertSpanishGenerativeRegion(selectedRegion)
  console.log(`aws profile ${profile}, region ${selectedRegion}`)
  const jobs = buildJobs(await loadPlan(), days)
  const existing = await readManifest()

  let skipped = 0
  let written = 0
  const client = dryRun
    ? null
    : new PollyClient({
        region: selectedRegion,
        credentials: fromIni({ profile }),
      })
  if (client) await assertVoicesAvailable(client, jobs)

  for (const job of jobs) {
    const label = `day ${job.day} ${job.speaker} (${job.voice.voiceId})`
    const previous = previousLine(existing, job)
    const unchanged = !force && previous?.textHash === job.textHash && (await fileExists(job.absoluteFile))
    if (unchanged) {
      skipped += 1
      console.log(`skip  ${label}`)
      continue
    }
    if (dryRun) {
      written += 1
      console.log(`would write ${job.relativeFile}  ${label}`)
      continue
    }
    const bytes = await synthesize(client!, job)
    await mkdir(dirname(job.absoluteFile), { recursive: true })
    await writeFile(job.absoluteFile, bytes)
    written += 1
    console.log(`wrote ${job.relativeFile}  ${label}`)
  }

  if (!dryRun) {
    await removeStaleAudio(jobs)
    const manifest = manifestFrom(jobs, selectedRegion, existing, days)
    await mkdir(audioDir, { recursive: true })
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    console.log(`wrote /audio/manifest.json`)
  }

  console.log(dryRun ? `dry run: ${written} to generate, ${skipped} unchanged` : `wrote ${written}, skipped ${skipped}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
