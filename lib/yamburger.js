const yaml = require('js-yaml')
const path = require('path')
const CustomSchema = require('./customSchema')

module.exports = class Yamburger {
  constructor (context, {logger = console}) {
    this.startDate = new Date()
    this.context = context
    this.logger = logger

    if (this.context.payload.check_suite) {
      this.check_suite = this.context.payload.check_suite
      this.pull_requests = this.context.payload.check_suite.pull_requests
      this.head_branch = this.context.payload.check_suite.head_branch
      this.head_sha = this.context.payload.check_suite.head_sha
    } else {
      this.pull_requests = [this.context.payload.pull_request]
      this.head_branch = this.context.payload.pull_request.head.ref
      this.head_sha = this.context.payload.pull_request.head.sha
    }
  }

  async findBurgers () {
    await this.logger.log(`installation=${this.context.payload.installation.id} at=findBurgers`)

    this.config = await this.context.config('yamburger.yaml', { tags: [] })
    const customSchema = new CustomSchema(this.config.tags)
    this.schema = await customSchema.schema()

    if (this.pull_requests.length === 0) {
      await this.logger.log(`installation=${this.context.payload.installation.id} at=noPR`)
      return this.context.github.checks.create(this.context.repo({
        head_branch: this.head_branch,
        name: 'YAMBURGER',
        head_sha: this.head_sha,
        status: 'completed',
        conclusion: 'neutral',
        started_at: this.startDate.toISOString(),
        completed_at: this.startDate.toISOString(),
        output: {
          title: 'YAMBURGER',
          summary: "Not looking for burgers because we didn't find a PR.",
          annotations: [],
          images: []
        },
        headers: {
          accept: 'application/vnd.github.antiope-preview+json'
        }
      }))
    }

    await this.logger.log(`installation=${this.context.payload.installation.id} at=checking`)
    const check = await this.context.github.checks.create(this.context.repo({
      head_branch: this.head_branch,
      name: 'YAMBURGER',
      head_sha: this.head_sha,
      status: 'in_progress',
      started_at: this.startDate.toISOString(),
      output: {
        title: 'YAMBURGER',
        summary: 'All up in ur YAML, lookin for burgers.',
        annotations: [],
        images: []
      },
      headers: {
        accept: 'application/vnd.github.antiope-preview+json'
      }
    }))

    // TODO we want the union of the set of files from all PRs
    const pullRequestUrlParts = this.pull_requests[0].url.split('/')
    const pullRequestNumber = pullRequestUrlParts[pullRequestUrlParts.length - 1]
    const files = await this.context.github.pullRequests.getFiles(this.context.repo({
      number: pullRequestNumber
    }))

    var burgers = 0
    var nothingBurgers = 0
    var annotations = []

    // Iterate through changes in that branch that are YAML, look for burgers
    await Promise.all(files.data.map(async (file) => {
      const filenameParts = file.filename.split('.')
      const extension = filenameParts[filenameParts.length - 1]
      if (extension === 'yaml') {
        const sha = file.blob_url.split('/')[6]
        const blob = await this.context.github.repos.getContent(this.context.repo({
          path: file.filename,
          ref: sha
        }))

        var content = await Buffer.from(blob.data.content, 'base64').toString('ascii')

        var messages = await this.errors(content, file)

        if (messages.length === 0) {
          nothingBurgers += 1
        } else {
          burgers += 1
          await Promise.all(messages.map(async (message) => {
            annotations.push({
              filename: message.filename,
              blob_href: message.blob_href,
              annotation_level: message.annotation_level,
              title: message.yaml.name,
              message: message.yaml.reason,
              raw_details: message.yaml.message,
              start_line: message.yaml.mark.line,
              end_line: (message.yaml.mark.line + 1)
            })
          }))
        }
      }
    }))

    this.logger.log(`${nothingBurgers} nothingburger(s) and ${burgers} burger(s) for ${this.context.payload.installation.id}`)

    const end = new Date()
    if (burgers === 0) {
      return this.context.github.checks.update(this.context.repo({
        check_run_id: check.data.id,
        name: 'YAMBURGER',
        status: 'completed',
        conclusion: 'success',
        completed_at: end.toISOString(),
        output: {
          title: `${nothingBurgers} nothingburger(s)`,
          summary: `${nothingBurgers} YAML documents parsed successfully`,
          annotations: [],
          images: []
        },
        headers: {
          accept: 'application/vnd.github.antiope-preview+json'
        }
      }))
    } else {
      const payload = this.context.repo({
        check_run_id: check.data.id,
        name: 'YAMBURGER',
        status: 'completed',
        conclusion: 'failure',
        completed_at: end.toISOString(),
        output: {
          title: `You've got yourself ${burgers} YAMBURGERS!`,
          summary: `${nothingBurgers} YAML documents parsed successfully. ${burgers} had errors or warnings.`,
          annotations: annotations,
          images: []
        },
        headers: {
          accept: 'application/vnd.github.antiope-preview+json'
        }
      })
      return this.context.github.checks.update(payload)
    }
  }

  async errors (data, file) {
    var messages = []
    try {
      await yaml.safeLoad(data, {
        filename: path.basename(file.filename),
        schema: this.schema,
        onWarning: (w) => {
          messages.push({
            filename: file.filename,
            blob_href: file.blob_url,
            annotation_level: 'warning',
            yaml: w
          })
        }
      })
    } catch (e) {
      messages.push({
        filename: file.filename,
        blob_href: file.blob_url,
        annotation_level: 'failure',
        yaml: e
      })
    }
    return messages
  }
}
