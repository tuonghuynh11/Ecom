import Client from 'ioredis'
// redlock does not expose declarations in the installed package.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Redlock from 'redlock'
import envConfig from 'src/shared/config'

const redis = new Client(envConfig.REDIS_URL)

const redlock = new Redlock([redis], {
  // The max number of times Redlock will attempt to lock a resource
  // before erroring.
  retryCount: 3,

  // the time in ms between attempts
  retryDelay: 200, // time in ms
})

export { redlock }
