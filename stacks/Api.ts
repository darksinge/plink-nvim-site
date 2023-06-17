import { Api, StackContext } from 'sst/constructs'

export function API({ stack }: StackContext) {
  const api = new Api(stack, 'api', {
    routes: {
      'GET /search': 'packages/functions/src/search.query',
      'GET /tags': 'packages/functions/src/tags.get',
    },
  })

  stack.addOutputs({
    ApiEndpoint: api.url,
  })
}
