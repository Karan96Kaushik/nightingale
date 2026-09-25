export function speakerSlug(speaker: string) {
  return speaker
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function dayFolder(day: number) {
  return `day-${String(day).padStart(2, '0')}`
}

/** Public URL for the MP3 the generator writes for this dialogue line. */
export function dialogueAudioSrc(day: number, index: number, speaker: string) {
  const fileName = `${String(index).padStart(2, '0')}-${speakerSlug(speaker)}.mp3`
  return `/audio/${dayFolder(day)}/${fileName}`
}

/** Public URL for the MP3 the generator writes for this vocabulary phrase. */
export function vocabAudioSrc(day: number, index: number) {
  return `/audio/${dayFolder(day)}/vocab-${String(index).padStart(2, '0')}.mp3`
}

/** Public URL for the MP3 the generator writes for this grammar example. */
export function grammarAudioSrc(day: number, pointIndex: number, exampleIndex: number) {
  const point = String(pointIndex).padStart(2, '0')
  const example = String(exampleIndex).padStart(2, '0')
  return `/audio/${dayFolder(day)}/grammar-${point}-${example}.mp3`
}

/** Public URL for the MP3 the generator writes for this speaking starter. */
export function practiceAudioSrc(day: number, index: number) {
  return `/audio/${dayFolder(day)}/practice-${String(index).padStart(2, '0')}.mp3`
}

/** Text actually spoken for a starter. Fill-in blanks are dropped; alternatives become separate sentences. */
export function practiceSpeechText(line: string) {
  return line
    .replace(/…\s+(?=\p{Lu})/gu, '. ')
    .replace(/…/g, '')
    .replace(/\.\.\./g, '')
    .replace(/ \/ /g, '. ')
    .replace(/\.{2,}/g, '.')
    .replace(/\s+/g, ' ')
    .replace(/\s+\./g, '.')
    .trim()
}
