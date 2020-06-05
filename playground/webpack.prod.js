const common = require("./webpack.common.js");

let appconfig = common[0];
let workerconfig = common[1];
let highlightingconfig = common[2];

appconfig.mode = "production";
workerconfig.mode = "production";
highlightingconfig.mode = "production";

module.exports = [appconfig, workerconfig, highlightingconfig];
