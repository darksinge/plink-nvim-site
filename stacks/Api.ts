import { Api, StackContext } from 'sst/constructs'

export function API({ stack }: StackContext) {
  // const bus = new EventBus(stack, 'bus', {
  //   defaults: {
  //     retries: 10,
  //   },
  // })

  const api = new Api(stack, 'api', {
    // defaults: {
    //   function: {
    //     bind: [bus],
    //   },
    // },
    routes: {
      'GET /': 'packages/functions/src/search.query',
      'GET /search': 'packages/functions/src/search.query',
    },
  })

  // bus.subscribe('todo.created', {
  //   handler: 'packages/functions/src/events/todo-created.handler',
  // })

  stack.addOutputs({
    ApiEndpoint: api.url,
  })
}
