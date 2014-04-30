/**
 * Module dependencies.
 */

var log = require('debug')('democracyos:netid-middlewares');
var config = require('lib/config');
var netid = require('lib/netid');

exports.netid_enabled = function (req, res, next) {
  if (config('netid enabled')) {
    next();
  } else {
    res.send(404);
  }
};

exports.verified_citizen = function (req, res, next) {
  if (!req.user) return res.send(500);
  if (!config('netid enabled')) return next();
  if (config('netid enabled') && !req.user.netid) {
    log('citizen has not enabled netid');
    return res.send(500);
  }
  netid.isVerified(req.user, function(err, verified) {
    if (err) {
      log('netid responded with an error: %s', err.message || err);
      return res.send(500);
    }
    if (!verified) {
      log('netid responded identity %s is not verified', req.user.id);
      return res.send(403);
    }
    next();
  });
};