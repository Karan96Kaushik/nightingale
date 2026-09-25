import { defineBackend } from '@aws-amplify/backend'
import { FunctionUrlAuthType, HttpMethod } from 'aws-cdk-lib/aws-lambda'
import { sample } from './functions/sample/resource'

const backend = defineBackend({
  sample,
})

const functionUrl = backend.sample.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [HttpMethod.POST],
    allowedHeaders: ['authorization', 'content-type'],
  },
})

backend.addOutput({
  custom: {
    sampleUrl: functionUrl.url,
  },
})
