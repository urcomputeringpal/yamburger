# YAMBURGER

## Configuration

YAMBURGER support validating YAML containing custom tags (like `!tag`). To configure the custom tags that are valid for your repository, add a `.github/yamburger.yaml` file you repository like so:

```yaml
tags:
- name: tag1
  kind: scalar # strings / numbers
- name: tag2
  kind: sequence # arrays / lists
- name: tag3
  kind: mapping # hashes / dictionaries
```

An example configuration that adds support for [Home Assistant](https://home-assistant.io)'s [custom YAML tags](https://www.home-assistant.io/docs/configuration/yaml/#using-environment-variables) is available [here](https://github.com/jnewland/ha-config/blob/master/.github/yamburger.yaml).

## Questions?

Please file an issue or send an email to pal@urcomputeringpal.com!

## Hacking

### Testing

    npm run test
