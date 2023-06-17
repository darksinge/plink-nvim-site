import { ApiHandler } from 'sst/node/api'
import { getTags } from '@find-tabnvim/core/search'

export const get = ApiHandler(async () => {
  const tags = getTags()
  return {
    headers: {
      'content-type': 'application/json',
    },
    statusCode: 200,
    body: JSON.stringify({ tags }),
  }
})
