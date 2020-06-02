const common = require('./webpack.common.js');

let appconfig = common[0];
let workerconfig = common[1];
let highlightingconfig = common[2];

appconfig.mode = "development"
workerconfig.mode = "development"
highlightingconfig.mode = "development"

module.exports = [appconfig,workerconfig,highlightingconfig]
