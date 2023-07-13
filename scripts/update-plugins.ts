import axios from 'axios'
import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'
import _ from 'lodash'

const parsedResultSchema = z.object({
  name: z.string(),
  stars: z.coerce.number().int(),
  openIssues: z.coerce.number().int(),
  updated: z.coerce.date(),
  description: z.string().optional(),
})

type ParsedResult = z.infer<typeof parsedResultSchema>

const pluginSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  description: z.string(),
  tags: z.array(z.string()),
  stars: z.number().int(),
  updatedAt: z.coerce.date().optional(),
  openIssues: z.number().int().optional(),
})

type Plugin = z.infer<typeof pluginSchema>

const isResult = (item: ParsedResult | null): item is ParsedResult =>
  item != null

const re =
  /(?<name>[^\s]+)\s+(?<stars>\d+)\s+(?<openIssues>\d+)\s+(?<updated>[^\s]+)(\s+(?<description>.*$))?/

const fout = path.resolve(__dirname, '../packages/core/src/data/plugins.json')

const fetchPlugins = async (): Promise<Plugin[]> => {
  // const { data } = await axios.get('https://nvim.sh/s')
  const data = fs.readFileSync(path.join(__dirname, './nvim.sh.txt')).toString()

  if (typeof data !== 'string') {
    throw new Error('expected data to be a string')
  }

  const lines = data
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length)

  // first line are the column names
  lines.splice(0, 1)

  const results: ParsedResult[] = lines
    .map((line) => {
      const match = re.exec(line)
      const result = parsedResultSchema.safeParse(match?.groups ?? {})
      return result.success ? result.data : null
    })
    .filter(isResult)

  return results.map((result) => ({
    ...result,
    url: `https://github.com/${result.name}`,
    tags: [],
    description: result.description ?? 'No description',
  }))
}

const mergeRight = (lhs: Plugin, rhs?: Plugin): Plugin => {
  const { stars, openIssues, updatedAt, description, tags } = rhs ?? {}
  if (stars != null) {
    lhs.stars = stars
  }

  if (openIssues != null) {
    lhs.openIssues = openIssues
  }

  if (updatedAt) {
    lhs.updatedAt = updatedAt
  }

  if (description) {
    lhs.description = description
  }

  if (tags) {
    lhs.tags = [...new Set(...[...tags, ...lhs.tags])]
  }

  return lhs
}

const mergePlugins = (results: Plugin[]): Plugin[] => {
  const existingPlugins: Plugin[] = z
    .array(pluginSchema)
    .parse(JSON.parse(fs.readFileSync(fout).toString()))

  const existingPluginsByName = _.keyBy(existingPlugins, (plugin) =>
    plugin.name.toLowerCase(),
  )

  const [newPlugins, pluginsToMerge] = _.partition(
    results,
    ({ name }) => existingPluginsByName[name.toLowerCase()],
  )

  return [
    ...newPlugins,
    ...pluginsToMerge.map((plugin) =>
      mergeRight(plugin, existingPluginsByName[plugin.name.toLowerCase()]),
    ),
  ]
}

const main = async () => {
  const results = await fetchPlugins()
  const plugins = mergePlugins(results)
  const json = _.sortBy(plugins, ({ name }) => name.toLowerCase())
  console.log('plugins:', JSON.stringify(json, null, 2))
  fs.writeFileSync(fout, JSON.stringify(json, null, 2))
}

if (require.main === module) {
  main()
    .then((result) => {
      console.log(result)
      process.exit(0)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
