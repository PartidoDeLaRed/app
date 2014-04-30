/**
 * Module dependencies.
 */

var express = require('express');
var utils = require('lib/utils');
var restrict = utils.restrict;
var log = require('debug')('democracyos:settings');
var t = require('t-component');
var netid = require('lib/netid');
var netidMiddlewares = require('lib/netid-middlewares');
var netid_enabled = netidMiddlewares.netid_enabled;

/**
 * Exports Application
 */

var app = module.exports = express();

app.post('/profile', restrict, function(req, res, next) {
  var citizen = req.user;
  log('Updating citizen %s profile', citizen.id);

  citizen.firstName = req.body.firstName;
  citizen.lastName = req.body.lastName;
  // Temporarily disable email submission, until we fix the whole flow
  // Also check  ./settings-profile/view.js
  // Fixes https://github.com/DemocracyOS/app/issues/223
  // citizen.email = req.body.email;

  if (citizen.isModified('email')) {
    log('Citizen must validate new email');
    citizen.emailValidated = false;
  };

  citizen.save(function(err) {
    if (err) return res.send(500);
    res.send(200);
  });
});

app.post('/password', restrict, function(req, res, nex) {
  var citizen = req.user;
  var current = req.body.current_password;
  var password = req.body.password;
  log('Updating citizen %s password', citizen.id);

  // !!:  Use of passport-local-mongoose plugin method
  // `authenticate` to check if user's current password is Ok.
  citizen.authenticate(current, function(err, authenticated, message) {
    if (err) return res.send(500, err.message);
    if (!authenticated) return res.send(403, t('Current password is invalid'));

    citizen.setPassword(password, function(err) {
      if (err) return res.send(500, err.message);

      citizen.save(function(err) {
        if (err) return res.send(500, err.message);
        res.send(200);
      });
    });
  });
});

app.post('/identity', netid_enabled, restrict, function (req, res, next) {
  var citizen = req.user;

  if (!citizen.netid) {
    netid.signup(citizen, onresponse);

    function onsave(err) {
      if (err) return res.send(500);

      res.send(200);
    }

    function onresponse(err, user) {
      if (!err || /exists/gi.test(err.message)) {
        if (err && /exists/gi.test(err.message)) {
          log('netid responded email %s already exists', citizen.email);
        }

        citizen.netidEnabledAt = Date.now();
        citizen.save(onsave);
        return res.send(200);
      } else {
        res.send(500);
      }
    }
  } else {
    res.send(403);
  }
});