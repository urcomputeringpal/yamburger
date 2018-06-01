const Raven = require('raven')
Raven.config(process.env.SENTRY_DSN).install()
const Yamburger = require('./lib/yamburger')

module.exports = (robot) => {
  robot.log('Heyo')

  const events = [
    'check_suite.requested',
    'check_suite.rerequested',
    'pull_request.opened'
  ]

  robot.on(events, async context => {
    const yam = new Yamburger(context, {logger: robot})
    await yam.findBurgers()
  })
}
