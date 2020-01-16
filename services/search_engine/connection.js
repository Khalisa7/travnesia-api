var elasticsearch = require('elasticsearch')
var client = new elasticsearch.Client({
  host: 'http://elastic.elk.edev.space/',
  //disable log:trace for log when deploy

  log: {
    type: 'file',
    level: 'trace',
    path: './trace.log'
  }
})

module.exports = client
