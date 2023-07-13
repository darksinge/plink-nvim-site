import axios from 'axios'
import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'
import _ from 'lodash'
import * as prettier from 'prettier'

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
    lhs.tags = [...new Set([...tags, ...lhs.tags])]
  }

  return lhs
}

const mergePlugins = (rhs: Plugin[], lhs: Plugin[]): Plugin[] => {
  const rhsNames = _.keyBy(rhs, ({ name }) => name.toLowerCase())
  const lhsNames = _.keyBy(lhs, ({ name }) => name.toLowerCase())

  const names = [
    ...new Set(
      [...lhs.map((result) => result.name), ...rhs.map((p) => p.name)].map(
        (name) => name.toLowerCase(),
      ),
    ),
  ]

  const plugins = []
  for (const name of names) {
    const lhs = rhsNames[name]
    const rhs = lhsNames[name]
    if (lhs && rhs) {
      plugins.push(mergeRight(lhs, rhs))
    } else {
      plugins.push(lhs ?? rhs)
    }
  }

  return plugins
}

const writeFile = async (plugins: Plugin[]): Promise<string> => {
  const prevFile = fs.readFileSync(fout)
  fs.writeFileSync(fout.replace(/\.json$/, '.bak.json'), prevFile)

  const options = await prettier.resolveConfig(path.resolve(__dirname, '../'))
  if (!options) {
    throw new Error('could not find config file for prettier')
  }

  options.parser = 'json'
  const json = prettier.format(JSON.stringify(plugins), options)
  fs.writeFileSync(fout, json)
  return json
}

const main = async () => {
  const results = await fetchPlugins()

  const existingPlugins: Plugin[] = z
    .array(pluginSchema)
    .parse(JSON.parse(fs.readFileSync(fout).toString()))

  const plugins = mergePlugins(existingPlugins, results)
  plugins.sort((a, b) => {
    return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
  })

  return writeFile(plugins)
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
