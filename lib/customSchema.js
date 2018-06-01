const yaml = require('js-yaml')
const DEFAULT_SAFE_SCHEMA = require('js-yaml/lib/js-yaml/schema/default_safe.js')

// There are myriad flavors of data structures, but they can all be adequately
// represented with three basic primitives: mappings (hashes/dictionaries),
// sequences (arrays/lists) and scalars (strings/numbers).

module.exports = class CustomSchema {
  constructor (tags) {
    this.tags = tags
  }

  schema () {
    const yamlTags = []
    this.tags.forEach((tag) => {
      tag = new yaml.Type(`!${tag.name}`, { kind: tag.kind })
      yamlTags.push(tag)
    })

    return yaml.Schema.create(DEFAULT_SAFE_SCHEMA, yamlTags)
  }
}
