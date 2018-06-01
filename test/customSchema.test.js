const CustomSchema = require('../lib/customSchema')
const yaml = require('js-yaml')

describe('customSchema', () => {
  let schema
  beforeEach(() => {
    const customSchema = new CustomSchema([
      { name: 'env_var', kind: 'scalar' }
    ])
    schema = customSchema.schema()
  })

  it('fails without loading the custom schema', async () => {
    expect(() => {
      yaml.safeLoad('test: !env_var TEST23')
    }).toThrow()
  })

  it('passes with the custom schema', async () => {
    expect(() => {
      yaml.safeLoad('test: !env_var TEST23', { schema: schema })
    }).not.toThrow()
  })

  it('fails with a different tag', async () => {
    expect(() => {
      yaml.safeLoad('test: !asdfasdf TEST23')
    }).toThrow()
  })
})
