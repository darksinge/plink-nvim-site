import { SSTConfig } from 'sst'
import { API } from './stacks/Api'

export default {
  config() {
    return {
      name: 'find-tabnvim',
      region: 'us-east-1',
      stage: 'dev',
      profile: 'personal',
    }
  },
  stacks(app) {
    app.stack(API)
  },
} satisfies SSTConfig
