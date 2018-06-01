# YAMBURGER

## Overview

> Indentation got you down? Semicolons in the wrong spot? That's a YAMBURGER!

YAMBURGER is a YAML-linting GitHub App. Install it on any repository that contains YAML, and it'll point out *burgers* on any Pull Requests that you open like so:

![](https://user-images.githubusercontent.com/47/40852374-817dab06-6587-11e8-80c8-06b89b8a8546.png)

## Getting started

The authors of YAMBURGER maintain a hosted version of the source code you see here. [Install it today!](https://github.com/apps/yamburger)

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
