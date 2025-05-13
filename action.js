const _ = require('lodash')
const Jira = require('./common/net/Jira')

module.exports = class {
  constructor ({ githubEvent, argv, config }) {
    this.Jira = new Jira({
      baseUrl: config.baseUrl,
      token: config.token,
      email: config.email,
    })

    this.config = config
    this.argv = argv
    this.githubEvent = githubEvent
  }

  async execute () {
    const { argv } = this

    const issueId = argv.issue
    const jql = argv.jql
    if(jql){
      const issues = await this.Jira.executeJql(jql)
      for(const issue of issues.issues){
        await this.transitionIssue(issue.key, argv);
      }
    } else {
      await this.transitionIssue(issueId, argv);
    }
    return {}
  }

  async transitionIssue(issueId, argv){
    const { transitions } = await this.Jira.getIssueTransitions(issueId)

    const transitionToApply = _.find(transitions, (t) => {
      if (t.id === argv.transitionId) return true
      if (t.name.toLowerCase() === argv.transition.toLowerCase()) return true
    })

    if (!transitionToApply) {
      console.log(`Please specify transition name or transition id. Selection:${argv.transition}`)
      console.log('Possible transitions:')
      if(!transitions || transitions.length === 0) {
        console.log('No transitions available.')
        return
      }
      transitions.forEach((t) => {
        console.log(`{ id: ${t.id}, name: ${t.name} } transitions issue to '${t.to.name}' status.`)
      })

      return
    }

    console.log(`Selected transition:${JSON.stringify(transitionToApply, null, 4)}`)

    await this.Jira.transitionIssue(issueId, {
      transition: {
        id: transitionToApply.id,
      },
    })

    const transitionedIssue = await this.Jira.getIssue(issueId)

    console.log(`Changed ${issueId} status to : ${_.get(transitionedIssue, 'fields.status.name')} .`)
    console.log(`Link to issue: ${this.config.baseUrl}/browse/${issueId}`)

    return {}
  }
}
