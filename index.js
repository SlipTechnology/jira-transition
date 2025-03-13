const fs = require('fs')
const YAML = require('yaml')
const core = require('@actions/core')

const configPath = `${process.env.HOME}/jira/config.yml`
const Action = require('./action')

// eslint-disable-next-line import/no-dynamic-require
const githubEvent = require(process.env.GITHUB_EVENT_PATH)
const config = YAML.parse(fs.readFileSync(configPath, 'utf8'))

async function exec () {
  try {
    const result = await new Action({
      githubEvent,
      argv: parseArgs(),
      config,
    }).execute()

    if (result) {
      const extendedConfig = Object.assign({}, config, result)

      fs.writeFileSync(configPath, YAML.stringify(extendedConfig))

      return
    }

    console.log('Failed to transition issue.')
    process.exit(78)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

function parseArgs () {
  const transition = core.getInput('transition')
  const transitionId = core.getInput('transitionId')
  const jql = core.getInput('jql')
  const issue = core.getInput('issue')

  if(!issue && !jql){
    throw new Error('Error: please specify either an issue or jql')
  }

  if (!transition && !transitionId) {
    // Either transition _or_ transitionId _must_ be provided
    throw new Error('Error: please specify either a transition or transitionId')
  }

  return {
    issue,
    transition,
    transitionId,
    jql
  }
}

exec()
