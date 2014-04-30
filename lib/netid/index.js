/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter;
var log = require('debug')('democracyos:netid');
var request = require('superagent');
var config = require('lib/config');

function NetId() {
  if (!(this instanceof NetId)) return new NetId();
  this.$_state = 'initializing';
  this.$_options = config('netid');
  this.$_endpoints = this.$_options['endpoints'];
  this.$_baseUrl = this.$_options['base url'];

  log('options %j', this.$_options);
  log('endpoints %j', this.$_endpoints);
  log('base url %j', this.$_baseUrl);
  this.authenticate();
};

/**
 * Inherits from `EventEmitter`.
 */

NetId.prototype.__proto__ = EventEmitter.prototype;

NetId.prototype.authenticate = function() {
  this.$_state = 'authenticating';

  var endpoint = this.$_endpoints['request token'];
  var req = this.request(endpoint.method, endpoint.path);

  req.send({
    "client_id": this.$_options['client id'],
    "client_secret": this.$_options['client secret'],
    "grant_type": "client_credentials"
  });

  log('request for credentials');

  req.$_request.set('Content-Type', 'application/x-www-form-urlencoded');
  req.$_request.end(onend.bind(this));

  function onend(err, res) {
    var u = res ? res.body : null;

    if (err || !res.ok) {
      this.$_state = 'error';
      return;
    };
    if (!u || u.error) {
      this.$_state = 'error';
      return;
    };

    for (var prop in u) {
      if (u.hasOwnProperty(prop)) {
        this[prop] = u[prop]
      }
    }

    this.$_state = "authenticated";
    this.emit('authenticated');
    var next = this.expires_in * 1000 - 6000;
    setTimeout(this.authenticate.bind(this), next);
    log('next access token will be requested in %dms', next)
  }
}

NetId.prototype.ready = function(fn) {
  var _this = this;

  function done() {
    if ("authenticated" === _this.state()) {
      return fn();
    } else {
      // here we should handle other states...
    }
  }

  if ("authenticated" === this.state()) {
    setTimeout(done, 0);
  } else {
    this.once("authenticated", done);
  }

  return this;
};

NetId.prototype.state = function() {
  return this.$_state;
}

NetId.prototype.request = function(method, path) {
  var req = NetIdRequest(this);
  req[method.toLowerCase()](path.toLowerCase());
  if (!~["authenticated", "authenticating"].indexOf(this.state())) {
    this.authenticate();
  }
  return req;
}

NetId.prototype.isVerified = function(user, fn) {
  var endpoint = this.$_endpoints['verified identity'];
  var req = this.request(endpoint.method, endpoint.path);
  req.send({
    email: user.email
  });

  req.end(function(err, res) {
    if (err || !res.ok) {
      return fn(err);
    }
    if (!res.body || res.body.error) {
      return fn(err);
    }
    if (res.body.status == 403) {
      return fn(null, false);
    }
    fn(null, true);
  });
}

NetId.prototype.signup = function(user, fn) {
  var endpoint = this.$_endpoints['create identity'];
  var req = this.request(endpoint.method, endpoint.path);
  
  req.send({
    email: user.email,
    firstname: user.firstName,
    lastname: user.lastName,
    foreignId: user.id
  });

  req.end(function(err, res) {
    if (res && res.status == 409) {
      var err = new Error();
      err.message = "Identity already exists";
      return fn(err);
    }
    if (err || !res.ok) {
      return fn(err || res.error);
    }
    if (!res.body || res.body.error) {
      return fn(err);
    }
    fn(null, user);
  });
}

function NetIdRequest(manager) {
  if (!(this instanceof NetIdRequest)) return new NetIdRequest(manager);
  this.$_manager = manager;
}

NetIdRequest.prototype.get = function(path) {
  this.$_request = request.get(this.url(path));
}

NetIdRequest.prototype.post = function(path) {
  this.$_request = request.post(this.url(path));
}

NetIdRequest.prototype.send = function(data) {
  this.$_request.send(data);
}

NetIdRequest.prototype.query = function(data) {
  this.$_request.query(data);
}

NetIdRequest.prototype.url = function(path) {
  return this.$_manager.$_baseUrl + path;
}

NetIdRequest.prototype.end = function(fn) {
  var req = this.$_request;
  var manager = this.$_manager;  

  if (manager.access_token) req.set('Authorization', "Bearer " + manager.access_token);

  req.set('Content-Type', 'application/x-www-form-urlencoded');
  req.end(fn);
}

module.exports = NetId();
