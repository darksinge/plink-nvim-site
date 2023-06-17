import { default as plugins } from './data/plugins.json'
import { sortBy } from 'lodash'
import Fuse from 'fuse.js'

const fuse = new Fuse(plugins, {
  keys: [
    { name: 'name', weight: 3 },
    { name: 'description', weight: 2 },
    { name: 'tags', weight: 1 },
  ],
  includeScore: true,
  useExtendedSearch: true,
  threshold: 0.5,
})

const searchOpts = {
  limit: 50,
} as const

interface SearchParams {
  q: string
  tag?: string
}

export const search = ({ q, tag }: SearchParams) => {
  if (tag) {
    return fuse.search(
      {
        $and: [{ name: q }, { description: q }, { tags: tag }],
      },
      searchOpts,
    )
  }
  return fuse.search(q, searchOpts)
}

const tagCounts: Record<string, { tag: string; count: number }> =
  plugins.reduce<Record<string, { count: number; tag: string }>>(
    (acc, { tags }) => {
      for (const tag of tags) {
        if (acc[tag]?.count) {
          acc[tag].count += 1
        } else {
          acc[tag] = { count: 1, tag }
        }
      }
      return acc
    },
    {},
  )

const tags = sortBy(Object.values(tagCounts), 'count')
  .reverse()
  .map(({ tag }) => tag)

export const getTags = () => [...tags]
