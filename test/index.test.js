const { createRobot } = require('probot')
const app = require('..')
const HttpError = require('@octokit/rest/lib/request/http-error')

describe('yamburger', () => {
  let robot
  let github

  beforeEach(() => {
    robot = createRobot()
    app(robot)
  })

  describe('check suite requests', () => {
    beforeEach(() => {
      github = {
        checks: {
          create: jest.fn().mockReturnValue(Promise.resolve({}))
        },
        repos: {
          getContent: jest.fn(() => {
            throw new HttpError('not found', 404, {})
          })
        }
      }

      robot.auth = () => Promise.resolve(github)
    })

    it('ignores check requests not associated with a PR', async () => {
      const payload = require('./payloads/check_suite/requested/no_pulls.json')
      await robot.receive({ event: 'check_suite', payload })
      expect(github.checks.create).toHaveBeenCalled()
      expect(github.checks.create.mock.calls[0][0].conclusion).toBe('neutral')
    })
  })

  describe('a happy path PR', () => {
    const getFiles = require('./payloads/pull_request/getFiles.json')
    const getContent = require('./payloads/repos/getContent/passing.json')

    beforeEach(() => {
      github = {
        checks: {
          create: jest.fn().mockReturnValue(Promise.resolve({
            data: {
              id: 1234
            }
          })),
          update: jest.fn().mockReturnValue(Promise.resolve({
            data: {
              id: 1234
            }
          }))
        },
        pullRequests: {
          getFiles: jest.fn().mockReturnValue(Promise.resolve(getFiles))
        },
        repos: {
          getContent: jest.fn(({owner, repo, path, ref}) => {
            if (path === '.github/yamburger.yaml') {
              throw new HttpError('not found', 404, {})
            } else {
              return getContent
            }
          })
        }
      }

      robot.auth = () => Promise.resolve(github)
    })

    it('kicks off a check when PRs are opened', async () => {
      const payload = require('./payloads/pull_request/opened.json')
      await robot.receive({ event: 'pull_request', payload })
      expect(github.checks.create).toHaveBeenCalled()
      expect(github.checks.create.mock.calls[0][0].status).toBe('in_progress')
      expect(github.pullRequests.getFiles).toHaveBeenCalled()
      expect(github.checks.update).toHaveBeenCalled()
      expect(github.checks.update.mock.calls[0][0].status).toBe('completed')
      expect(github.checks.update.mock.calls[0][0].conclusion).toBe('success')
    })
  })

  describe('a sad path PR', () => {
    const getFiles = require('./payloads/pull_request/getFiles.json')
    const getContent = require('./payloads/repos/getContent/failing.json')

    beforeEach(() => {
      github = {
        checks: {
          create: jest.fn().mockReturnValue(Promise.resolve({
            data: {
              id: 1234
            }
          })),
          update: jest.fn().mockReturnValue(Promise.resolve({
            data: {
              id: 1234
            }
          }))
        },
        pullRequests: {
          getFiles: jest.fn().mockReturnValue(Promise.resolve(getFiles))
        },
        repos: {
          getContent: jest.fn(({owner, repo, path, ref}) => {
            if (path === '.github/yamburger.yaml') {
              throw new HttpError('not found', 404, {})
            } else {
              return getContent
            }
          })
        }
      }

      robot.auth = () => Promise.resolve(github)
    })

    it('kicks off a check when PRs are opened', async () => {
      const payload = require('./payloads/pull_request/opened.json')
      await robot.receive({ event: 'pull_request', payload })
      expect(github.checks.create).toHaveBeenCalled()
      expect(github.checks.create.mock.calls[0][0].status).toBe('in_progress')
      expect(github.pullRequests.getFiles).toHaveBeenCalled()
      expect(github.checks.update).toHaveBeenCalled()
      expect(github.checks.update.mock.calls[0][0].status).toBe('completed')
      expect(github.checks.update.mock.calls[0][0].conclusion).toBe('failure')
      expect(github.checks.update.mock.calls[0][0].output.annotations[0].path).toBe('kubernetes/test/deployments/test.yaml')
    })
  })

  describe('a PR on a repo w/ a custom schema', () => {
    const getFiles = require('./payloads/pull_request/getFiles.json')
    const contentWithCustomSchema = require('./payloads/repos/getContent/contentWithCustomSchema.json')
    const configContent = require('./payloads/repos/getContent/customSchemaConfig.json')

    beforeEach(() => {
      github = {
        checks: {
          create: jest.fn().mockReturnValue(Promise.resolve({
            data: {
              id: 1234
            }
          })),
          update: jest.fn().mockReturnValue(Promise.resolve({
            data: {
              id: 1234
            }
          }))
        },
        pullRequests: {
          getFiles: jest.fn().mockReturnValue(Promise.resolve(getFiles))
        },
        repos: {
          getContent: jest.fn(({owner, repo, path, ref}) => {
            if (path === '.github/yamburger.yaml') {
              return configContent
            } else {
              return contentWithCustomSchema
            }
          })
        }
      }

      robot.auth = () => Promise.resolve(github)
    })

    it('kicks off a check when PRs are opened', async () => {
      const payload = require('./payloads/pull_request/opened.json')
      await robot.receive({ event: 'pull_request', payload })
      expect(github.checks.create).toHaveBeenCalled()
      expect(github.checks.create.mock.calls[0][0].status).toBe('in_progress')
      expect(github.pullRequests.getFiles).toHaveBeenCalled()
      expect(github.checks.update).toHaveBeenCalled()
      expect(github.checks.update.mock.calls[0][0].status).toBe('completed')
      expect(github.checks.update.mock.calls[0][0].conclusion).toBe('success')
    })
  })
})
