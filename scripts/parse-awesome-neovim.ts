#!/usr/bin/env ts-node
import * as fs from 'node:fs'
import * as path from 'node:path'

interface Plugin {
  name: string
  url: string
  description: string
  tags: string[]
  stars: number
}

class Iter<T> {
  i: number
  constructor(readonly arr: T[]) {
    this.i = 0
  }

  next(): T | null {
    return this.arr[this.i++] ?? null
  }

  peek(): T | null {
    return this.arr[this.i] ?? null
  }
}

const main = () => {
  const fin = fs
    .readFileSync(
      path.join(__dirname, '../packages/functions/data/awesome-neovim.md'),
    )
    .toString()

  const lines = fin.split('\n').map((line) => line.trim())

  const lineIter = new Iter(lines)

  const plugins: Plugin[] = []
  let labels: string[] = []
  let level = 0
  let line = lineIter.next()

  while (line != null) {
    const labelMatch = line.match(/(#{2,})\s+(.*)$/)
    if (labelMatch) {
      const [, hashes, label] = labelMatch
      const tempLevel = hashes.split('#').length
      if (tempLevel > level) {
        labels.push(label)
      } else {
        labels = [label]
      }
      level = tempLevel
    }

    const itemMatch = line.match(/- \[(.*)\]\((.*)\)\s+-\s+(.*)$/)
    if (itemMatch) {
      const [, name, url, description] = itemMatch
      plugins.push({
        name,
        url,
        description,
        tags: labels.map((label) => label.toLowerCase()),

        // TODO: fetch stars from github
        // NOTE: Before we do this, we need to figure out how to increase
        // relevance of search results with more stars.
        stars: 0,
      })
    }

    line = lineIter.next()
  }

  const outfile = path.join(
    __dirname,
    '../packages/functions/data/plugins.json',
  )
  fs.writeFileSync(outfile, JSON.stringify(plugins, null, 3))
  console.log(`Wrote ${plugins.length} plugins to ${outfile}`)
}

if (module === require.main) {
  main()
}
