type FunctionUrlEvent = {
  body?: string | null
  isBase64Encoded?: boolean
  requestContext?: { http?: { method?: string } }
}

type FunctionUrlResult = {
  statusCode: number
  headers?: Record<string, string>
  body: string
}

export const handler = async (event: FunctionUrlEvent): Promise<FunctionUrlResult> => {
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 204, body: '' }
  }

  let name = 'world'
  if (event.body) {
    try {
      const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body
      const parsed = JSON.parse(raw) as { name?: unknown }
      if (typeof parsed.name === 'string' && parsed.name.trim()) name = parsed.name.trim()
    } catch {
      name = 'world'
    }
  }

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: `Hello, ${name}` }),
  }
}
