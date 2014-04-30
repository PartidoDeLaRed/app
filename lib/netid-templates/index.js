/**
 * Module dependencies.
 */

var o = require('query');
var render = require('render');
var empty = require('empty');

/**
 * Expose View
 */

exports.render = renderTemplate;
exports.templates = templates;
exports.handleError = handleError;

function renderTemplate(template, container) {
  if ('string' == typeof container) {
    container = o(container);
  }
  template = render.dom(templates(template));
  empty(container).appendChild(template);
}

function templates(template) {
  return require('./' + template);
}

function handleError(err, res, container) {
  if (err || !res.ok) {
    if (!res || res.status == 500) {
      this.render('identity-verification-error', container);
      return false;
    } else if (res.status == 403) {
      this.render('identity-not-verified', container);
      return false;
    }
  }
  if ('string' == typeof container) {
    container = o(container);
  } 
  empty(container);
  return true;
}