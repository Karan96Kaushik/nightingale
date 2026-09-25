import { defineFunction } from '@aws-amplify/backend'

export const sample = defineFunction({
  name: 'sample',
  entry: './handler.ts',
})
