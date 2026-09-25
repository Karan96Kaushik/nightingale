export function speakerSlug(speaker: string) {
  return speaker
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Public URL for the MP3 the dialogue generator writes for this plan line. */
export function dialogueAudioSrc(day: number, index: number, speaker: string) {
  const folder = `day-${String(day).padStart(2, '0')}`
  const fileName = `${String(index).padStart(2, '0')}-${speakerSlug(speaker)}.mp3`
  return `/audio/${folder}/${fileName}`
}
