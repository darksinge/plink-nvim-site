import { Api, StackContext } from 'sst/constructs'

export function API({ stack }: StackContext) {
  const api = new Api(stack, 'api', {
    routes: {
      'GET /search': 'packages/functions/src/search.query',
      'GET /tags': 'packages/functions/src/tags.get',
    },
    defaults: {
      throttle: {
        burst: 100,
        rate: 10,
      },
    },
  })

  stack.addOutputs({
    ApiEndpoint: api.url,
  })
}
