/**
 * Module dependencies.
 */

var express = require('express');
var netidMiddlewares = require('lib/netid-middlewares');
var netid_enabled = netidMiddlewares.netid_enabled;
var verified_citizen = netidMiddlewares.verified_citizen;
var utils = require('lib/utils');
var restrict = utils.restrict;
var log = require('debug')('democracyos:netid-api');

var app = module.exports = express();

app.post('/identity/verify', netid_enabled, restrict, verified_citizen, function (req, res) {
  log('Request /identity/verify');

  res.send(200);
});