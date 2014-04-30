/**
 * Module dependencies.
 */

var settings = require('./settings-container');
var Password = require('settings-password');
var Profile = require('settings-profile');
var Identity = require('settings-identity');
var request = require('request');
var classes = require('classes');
var citizen = require('citizen');
var render = require('render');
var title = require('title');
var empty = require('empty');
var page = require('page');
var o = require('query');
var config = require('config');

page("/settings/:page?", valid, citizen.required, function(ctx, next) {
  var page = ctx.params.page || "profile";
  var container = render.dom(settings);
  var content = o('.settings-content', container);

  var profile = new Profile;
  var password = new Password;
  var identity = new Identity;

  // prepare wrapper and container
  empty(o('#content')).appendChild(container);

  // set active section on sidebar
  if (o('.active', container)) {
    classes(o('.active', container)).remove("active");
  };

  classes(o('[href="/settings/' + page + '"]:parent', container)).add("active");

  // Set page's title
  title(o('[href="/settings/' + page + '"]').textContent);

  // render all settings pages
  profile.render(content);
  password.render(content);
  identity.render(content);

  // Display current settings page
  classes(o("#" + page + "-wrapper", container)).remove("hide");
});

/**
 * Check if page is valid
 */

function valid(ctx, next) {
  var page = ctx.params.page || "profile";
  var validUrls = ['profile', 'password'];
  if (config['netid enabled']) {
    validUrls.push('identity');
  }
  if (~validUrls.indexOf(page)) return next();
  // if else, I should render 404... or redirect home
}