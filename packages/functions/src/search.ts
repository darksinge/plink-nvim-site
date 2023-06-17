import { ApiHandler } from 'sst/node/api'
import { search } from '@find-tabnvim/core/search'
import { z } from 'zod'

const querySchema = z.object({
  q: z.string().min(3).max(50),
  tag: z.string().optional(),
})

const pluginDataSchema = z
  .object({
    name: z.string(),
    url: z.string().url(),
    description: z.string(),
    tags: z.array(z.string()),
    score: z.number(),
    stars: z.number().optional(),
  })
  .partial()

const responseSchema = z.object({
  results: z.array(pluginDataSchema),
  total: z.number(),
})

type ResponseData = z.infer<typeof responseSchema>

export const query = ApiHandler(async (evt) => {
  const parsed = querySchema.safeParse(evt.queryStringParameters)
  if (!parsed.success) {
    return {
      status: 400,
      body: JSON.stringify(parsed.error),
    }
  }

  const results = search(parsed.data)

  const body: ResponseData = responseSchema.parse({
    results: results.map(({ item, score = 0 }) => {
      return {
        ...item,
        score: +score.toFixed(6),
      }
    }),
    total: results.length,
  })

  return {
    headers: {
      'content-type': 'application/json',
    },
    statusCode: 200,
    body: JSON.stringify(body),
  }
})
