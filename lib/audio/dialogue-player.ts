import { dialogueAudioSrc } from '@/lib/audio/dialogue-path'
import { speakSpanish, stopSpeaking } from '@/lib/speech'
import type { DialogueLine } from '@/lib/curriculum/types'

export type DialogueClip = {
  src: string
  text: string
}

export type DialoguePlayback = 'idle' | 'playing' | 'paused'

let playback = 0
let playbackState: DialoguePlayback = 'idle'
let current: HTMLAudioElement | null = null
let settleCurrent: ((result: 'ended' | 'missing' | 'stopped') => void) | null = null
const listeners = new Set<(state: DialoguePlayback) => void>()

function setPlaybackState(next: DialoguePlayback) {
  playbackState = next
  for (const listener of listeners) listener(next)
}

export function subscribeDialogue(listener: (state: DialoguePlayback) => void) {
  listeners.add(listener)
  listener(playbackState)
  return () => listeners.delete(listener)
}

export function dialogueClips(day: number, lines: DialogueLine[]): DialogueClip[] {
  return lines.map((line, index) => ({
    src: dialogueAudioSrc(day, index, line.speaker),
    text: line.spanish,
  }))
}

export function stopDialogue() {
  playback += 1
  current?.pause()
  current = null
  settleCurrent?.('stopped')
  settleCurrent = null
  stopSpeaking()
  setPlaybackState('idle')
}

export function pauseDialogue() {
  if (playbackState !== 'playing') return
  current?.pause()
  if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) window.speechSynthesis.pause()
  setPlaybackState('paused')
}

export function resumeDialogue() {
  if (playbackState !== 'paused') return
  setPlaybackState('playing')
  if (current) {
    void current.play()
    return
  }
  if (typeof window !== 'undefined' && window.speechSynthesis?.paused) window.speechSynthesis.resume()
}

function isCurrent(token: number) {
  return token === playback
}

function playFile(src: string): Promise<'ended' | 'missing' | 'stopped'> {
  return new Promise((resolve) => {
    const audio = new Audio(src)
    current = audio
    let settled = false
    const finish = (result: 'ended' | 'missing' | 'stopped') => {
      if (settled) return
      settled = true
      if (settleCurrent === finish) settleCurrent = null
      if (current === audio) current = null
      resolve(result)
    }
    settleCurrent = finish
    audio.addEventListener('ended', () => finish('ended'))
    audio.addEventListener('error', () => finish('missing'))
    void audio.play().catch(() => {
      if (playbackState === 'paused' && current === audio) return
      finish('missing')
    })
  })
}

async function playClip(clip: DialogueClip, token: number) {
  const result = await playFile(clip.src)
  if (!isCurrent(token) || result === 'stopped') return
  if (result === 'missing') await speakSpanish(clip.text)
}

export async function playDialogueLine(clip: DialogueClip, onActive: (index: number | null) => void, index: number) {
  stopDialogue()
  const token = playback
  setPlaybackState('playing')
  onActive(index)
  await playClip(clip, token)
  if (!isCurrent(token)) return
  onActive(null)
  setPlaybackState('idle')
}

export async function playDialogueSequence(clips: DialogueClip[], onActive: (index: number | null) => void) {
  stopDialogue()
  const token = playback
  setPlaybackState('playing')
  for (let index = 0; index < clips.length; index += 1) {
    if (!isCurrent(token)) return
    onActive(index)
    await playClip(clips[index], token)
  }
  if (!isCurrent(token)) return
  onActive(null)
  setPlaybackState('idle')
}
