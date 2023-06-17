import { ApiHandler } from 'sst/node/api'
import { default as data } from '../data/plugins.json'
import Fuse from 'fuse.js'
import { z } from 'zod'

const querySchema = z.object({
  q: z.string().min(3).max(50),
  tags: z.string().optional(),
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

type PluginData = z.infer<typeof pluginDataSchema>

const responseSchema = z.object({
  results: z.array(pluginDataSchema),
  total: z.number(),
})

type ResponseData = z.infer<typeof responseSchema>

const fuse = new Fuse(data, {
  findAllMatches: true,
  keys: [
    { name: 'name', weight: 3 },
    { name: 'description', weight: 2 },
    { name: 'tags', weight: 1 },
  ],
  includeScore: true,
  useExtendedSearch: true,
})

export const query = ApiHandler(async (evt) => {
  const parsed = querySchema.safeParse(evt.queryStringParameters)
  if (!parsed.success) {
    return {
      status: 400,
      body: JSON.stringify(parsed.error),
    }
  }

  const results = fuse.search(parsed.data.q)

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
