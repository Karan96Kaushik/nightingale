export const CONJUGATION_PERSONS = [
  { id: 'yo', label: 'yo' },
  { id: 'tu', label: 'tú' },
  { id: 'el', label: 'él / ella' },
  { id: 'nosotros', label: 'nosotros' },
  { id: 'ellos', label: 'ellos / ellas' },
] as const

export type ConjugationPersonId = (typeof CONJUGATION_PERSONS)[number]['id']

export type VerbForm = {
  person: ConjugationPersonId
  spanish: string
  english: string
}

export type VerbConjugation = {
  id: string
  infinitive: string
  english: string
  note: string
  forms: VerbForm[]
}

export type ConjugationGroup = {
  id: string
  title: string
  description: string
  verbs: VerbConjugation[]
}

function forms(
  yo: [string, string],
  tu: [string, string],
  el: [string, string],
  nosotros: [string, string],
  ellos: [string, string],
): VerbForm[] {
  return [
    { person: 'yo', spanish: yo[0], english: yo[1] },
    { person: 'tu', spanish: tu[0], english: tu[1] },
    { person: 'el', spanish: el[0], english: el[1] },
    { person: 'nosotros', spanish: nosotros[0], english: nosotros[1] },
    { person: 'ellos', spanish: ellos[0], english: ellos[1] },
  ]
}

export const CONJUGATION_GROUPS: ConjugationGroup[] = [
  {
    id: 'plan',
    title: 'In the two-week plan',
    description: 'These are the chunks from the daily lessons, written out as five present forms.',
    verbs: [
      {
        id: 'ser',
        infinitive: 'ser',
        english: 'to be — who and what',
        note: 'Who someone is, where they are from, and a lasting quality. No un or una before a job.',
        forms: forms(
          ['soy', 'I am'],
          ['eres', 'you are'],
          ['es', 'he / she is'],
          ['somos', 'we are'],
          ['son', 'they are'],
        ),
      },
      {
        id: 'estar',
        infinitive: 'estar',
        english: 'to be — place and feeling',
        note: 'Where someone is, and how they feel right now.',
        forms: forms(
          ['estoy', 'I am'],
          ['estás', 'you are'],
          ['está', 'he / she is'],
          ['estamos', 'we are'],
          ['están', 'they are'],
        ),
      },
      {
        id: 'tener',
        infinitive: 'tener',
        english: 'to have',
        note: 'Also hunger, age, and tener que (have to). Yo is tengo. The stem is tien- except nosotros.',
        forms: forms(
          ['tengo', 'I have'],
          ['tienes', 'you have'],
          ['tiene', 'he / she has'],
          ['tenemos', 'we have'],
          ['tienen', 'they have'],
        ),
      },
      {
        id: 'querer',
        infinitive: 'querer',
        english: 'to want',
        note: 'Followed by a thing or another verb. The stem is quier- except nosotros.',
        forms: forms(
          ['quiero', 'I want'],
          ['quieres', 'you want'],
          ['quiere', 'he / she wants'],
          ['queremos', 'we want'],
          ['quieren', 'they want'],
        ),
      },
      {
        id: 'ir',
        infinitive: 'ir',
        english: 'to go',
        note: 'Each form is its own word. Voy a is going to a place or about to do something. Vamos is also let’s go.',
        forms: forms(
          ['voy', 'I go'],
          ['vas', 'you go'],
          ['va', 'he / she goes'],
          ['vamos', 'we go'],
          ['van', 'they go'],
        ),
      },
      {
        id: 'hacer',
        infinitive: 'hacer',
        english: 'to do, to make',
        note: 'Only yo is irregular: hago.',
        forms: forms(
          ['hago', 'I do'],
          ['haces', 'you do'],
          ['hace', 'he / she does'],
          ['hacemos', 'we do'],
          ['hacen', 'they do'],
        ),
      },
    ],
  },
  {
    id: 'more',
    title: 'More common irregulars',
    description: 'High-frequency present forms that do not follow the regular endings. They are not a daily lesson.',
    verbs: [
      {
        id: 'poder',
        infinitive: 'poder',
        english: 'to be able to, can',
        note: 'The stem is pued- except nosotros.',
        forms: forms(
          ['puedo', 'I can'],
          ['puedes', 'you can'],
          ['puede', 'he / she can'],
          ['podemos', 'we can'],
          ['pueden', 'they can'],
        ),
      },
      {
        id: 'decir',
        infinitive: 'decir',
        english: 'to say, to tell',
        note: 'Yo is digo, and tú is dices.',
        forms: forms(
          ['digo', 'I say'],
          ['dices', 'you say'],
          ['dice', 'he / she says'],
          ['decimos', 'we say'],
          ['dicen', 'they say'],
        ),
      },
      {
        id: 'ver',
        infinitive: 'ver',
        english: 'to see',
        note: 'Only yo adds a syllable: veo.',
        forms: forms(
          ['veo', 'I see'],
          ['ves', 'you see'],
          ['ve', 'he / she sees'],
          ['vemos', 'we see'],
          ['ven', 'they see'],
        ),
      },
      {
        id: 'saber',
        infinitive: 'saber',
        english: 'to know a fact or a skill',
        note: 'Only yo is irregular: sé.',
        forms: forms(
          ['sé', 'I know'],
          ['sabes', 'you know'],
          ['sabe', 'he / she knows'],
          ['sabemos', 'we know'],
          ['saben', 'they know'],
        ),
      },
      {
        id: 'venir',
        infinitive: 'venir',
        english: 'to come',
        note: 'Yo is vengo. The stem is vien- except nosotros.',
        forms: forms(
          ['vengo', 'I come'],
          ['vienes', 'you come'],
          ['viene', 'he / she comes'],
          ['venimos', 'we come'],
          ['vienen', 'they come'],
        ),
      },
      {
        id: 'dar',
        infinitive: 'dar',
        english: 'to give',
        note: 'Yo is doy. The other forms look like a regular -ar verb.',
        forms: forms(
          ['doy', 'I give'],
          ['das', 'you give'],
          ['da', 'he / she gives'],
          ['damos', 'we give'],
          ['dan', 'they give'],
        ),
      },
      {
        id: 'salir',
        infinitive: 'salir',
        english: 'to leave, to go out',
        note: 'Only yo is irregular: salgo.',
        forms: forms(
          ['salgo', 'I leave'],
          ['sales', 'you leave'],
          ['sale', 'he / she leaves'],
          ['salimos', 'we leave'],
          ['salen', 'they leave'],
        ),
      },
      {
        id: 'poner',
        infinitive: 'poner',
        english: 'to put',
        note: 'Only yo is irregular: pongo.',
        forms: forms(
          ['pongo', 'I put'],
          ['pones', 'you put'],
          ['pone', 'he / she puts'],
          ['ponemos', 'we put'],
          ['ponen', 'they put'],
        ),
      },
    ],
  },
]

export const CONJUGATION_VERBS = CONJUGATION_GROUPS.flatMap((group) => group.verbs)

export function conjugationPersonLabel(person: ConjugationPersonId): string {
  return CONJUGATION_PERSONS.find((item) => item.id === person)?.label ?? person
}
