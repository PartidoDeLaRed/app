/**
 * Module dependencies.
 */

var identity = require('./identity-template');
var identityStatus = require('./identity-status');
var serialize = require('serialize');
var classes = require('classes');
var Emitter = require('emitter');
var request = require('request');
var citizen = require('citizen');
var events = require('events');
var render = require('render');
var empty = require('empty');
var o = require('query');
var t = require('t');
var config = require('config');
var log = require('debug')('democracyos:settings-identity');

/**
 * Expose IdentityView
 */

module.exports = IdentityView;

/**
 * Creates a identity enabling view
 */

function IdentityView() {
  if (!(this instanceof IdentityView)) {
    return new IdentityView();
  };

  this.build();
  this.switchOn();
}

/**
 * Mixin with `Emitter`
 */

Emitter(IdentityView.prototype);

IdentityView.prototype.build = function () {
  this.el = render.dom(identity);
  this.button = o('.btn-start', this.el);
  this.loading = o('.loading', this.el);
  this.identityInstructions = o('.start-instructions', this.el);
  this.events = events(this.el, this);
}

IdentityView.prototype.loadIdentityStatus = function () {
  var view = this;
  if (citizen.netid) {

    request
    .post('/identity/verify')
    .send()
    .end(function(err, res) {
      var status = '';
      var verified = false;
      if (res.status == 200) {
        status = t('settings.identity-validation.identity-verified');
        verified = true;
      } else if (res.status == 403) {
        status = t('settings.identity-validation.identity-not-verified');
      } else {
        status = t('settings.identity-validation.error-verifying');
      }

      var options = {};
      options.url = config['netid instructions url'];
      options.status = status;
      options.hideInstructions = verified;
      var template = render.dom(identityStatus, options);
      o('.identity-settings .form-group', view.el).appendChild(template);
      if (!verified) {
        classes(view.button).remove('hide');
      }
    });
  } else {
    classes(view.button).remove('hide');
  }
}

/**
 * Turn on event bindings
 */

IdentityView.prototype.switchOn = function() {
  if (!citizen.netid) {
    this.events.bind('click .btn-start', 'onclick');
  }
  this.on('success', this.onsuccess.bind(this));
  this.on('error', this.onerror.bind(this));
  this.loadIdentityStatus();
}

/**
 * Turn off event bindings
 */

IdentityView.prototype.switchOff = function() {
  this.events.unbind();
  this.off();
}

/**
 * Handle `onclick` form event
 *
 * @param {Event} ev
 * @api private
 */

IdentityView.prototype.onclick = function(ev) {
  this.button.innerHTML = t('settings.identity-validation.processing');
  classes(this.loading).remove('hide');
  this.messages([]);
  this.status = 'processing';
  var endpoint = '/settings/identity';
  var view = this;

  request
  .post(endpoint)
  .send()
  .end(function(err, res) {
    if (!res || !res.ok || err) {
      log('Fetch error: %s', err || res.error);
      return setTimeout(view.onprocesserror.bind(view), 750, new Error(t('settings.identity-validation.request-error')));
    };
    if (res.body && res.body.error) {
      log('Fetch error: %s', res.body.error);
      return setTimeout(view.onprocesserror.bind(view), 750, res.body.error);
    };
    view.emit('success', res.body);
  });
}


/**
 * Handle activate `error` event with
 * logging and display
 *
 * @param {String} error
 * @api private
 */

IdentityView.prototype.onprocesserror = function(error) {
  classes(this.loading).add('hide');
  this.button.innerHTML = t('settings.identity-validation.start');
  this.emit('error', error);
}

/**
 * Handle `error` event with
 * logging and display
 *
 * @param {String} error
 * @api private
 */

IdentityView.prototype.onerror = function(error) {
  log('Error: %o', error);
  this.messages([error]);
}

/**
 * Handle `error` event with
 * logging and display
 *
 * @param {String} error
 * @api private
 */

IdentityView.prototype.onsuccess = function() {
  log('Identity enabling updated');
  var view = this;
  citizen.load('me');
  citizen.ready(function () {
    view.button.innerHTML = t('settings.identity-validation.started');
    classes(view.identityInstructions).add('hide');
    classes(view.button).add('on');
    classes(view.loading).add('hide');
    view.events.unbind('click', 'onclick');
    view.loadIdentityStatus();
  })
}

/**
 * Fill messages list
 *
 * @param {Array} msgs
 * @param {string} type
 * @api public
 */

IdentityView.prototype.messages = function(msgs, type) {
  var ul = o('ul.form-messages', this.el);
  empty(ul);

  msgs.forEach(function(m) {
    var li = document.createElement('li');
    li.innerHTML = m;
    classes(li).add(type || 'error');
    ul.appendChild(li);
  });
}

/**
 * Renders to provided `el`
 * or delivers view's `el`
 *
 * @param {Element} el
 * @return {IdentityView|Element}
 * @api public
 */

IdentityView.prototype.render = function(el) {
  if (1 === arguments.length) {

    // if string, then query element
    if ('string' === typeof el) {
      el = o(el);
    };

    // if it's not currently inserted
    // at `el`, then append to `el`
    if (el !== this.el.parentNode) {
      el.appendChild(this.el);
    };

    return this;
  };

  return this.el;
}