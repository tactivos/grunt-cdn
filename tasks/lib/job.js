var EventEmitter = require('events').EventEmitter,
    util = require('util'),
    path = require('path'),
    url = require('url'),
    grunt = require('grunt'),
    ParseConfig = require('./parser_config');


var Job = function(options) {
  EventEmitter.apply(this, arguments);
  this.options = options;
};
util.inherits(Job, EventEmitter);

Job.prototype.start = function (content) {
  var self = this;
  this.buffer = content;
  setTimeout(function() {
    var result = self.run();
    self.emit("end", result);
  }, 0);
  return this;
};

Job.prototype.end = function () {
  this.emit("end", this.buffer);
  return this;
};

Job.prototype._replace = function (resource) {
  var options = this.options,
      self = this,
      ignorePath = this.options.ignorePath,
      relativeTo = this.options.cdn;

  // absolute urls will not be passed into this function
  // skip those absolute urls
  // if (resource.match(/^https?:\/\//i) || resource.match(/^\/\//) || resource.match(/^data:/i)) {
  //   self.emit("ignore", {
  //     resource: resource,
  //     reason: "ignored on purpose"
  //   });
  //   return resource;
  // }

  if (ignorePath) {
    if (Array.isArray(ignorePath)) {
      for (var i = 0, len = ignorePath.length; i < len; ++i) {
        if (resource.match(ignorePath[i])) {
          self.emit("ignore", {
            resource: resource,
            reason: "ignore on purpose"
          });
          return resource;
        }
      }
    } else if (resource.match(ignorePath)) {
      self.emit("ignore", {
        resource: resource,
        reason: "ignore on purpose"
      });
      return resource;
    }
  }

  var resourceUrl = url.parse(resource);

  if(resourceUrl.protocol === "about:" || resourceUrl.protocol === "data:" || !resourceUrl.pathname) {
    return resource;
  }

  // if flatten is true then we will convert all paths to absolute here!
  if (options.flatten) {
    resourceUrl.pathname = '/' + resourceUrl.pathname.replace(/^(\.\.?\/)+/, '');
  }

  if (options.match) {
    if (typeof options.match === 'function') {
      if (!options.match(resourceUrl, resource)) {
        self.emit("ignore", {
          resource: resource,
          reason: "not matched"
        });
        return resource;
      }
    } else {
      if (!resourceUrl.pathname.match(options.match)) {
        self.emit("ignore", {
          resource: resource,
          reason: "not matched"
        });
        return resource;
      }
    }
  }

  // if path is relative let it be
  if (!options.flatten && !grunt.file.isPathAbsolute(resourceUrl.pathname)) {
    self.emit("ignore", {
      resource: resource,
      reason: "it's a relative URL"
    });
    return resource;
  }

  // if stripDirs then loop through and strip
  if (options.stripDirs) {
    if (typeof options.stripDirs === 'string') {
      options.stripDirs = [options.stripDirs];
    }
    options.stripDirs.forEach(function(dirname) {
      var re = new RegExp('\/('+dirname+'\/)', 'g');
      resourceUrl.pathname = resourceUrl.pathname.replace(re, '');
    });
  }

  var src = path.join(relativeTo, resourceUrl.pathname).replace(/\\/g, '/').replace(/:\/(\w)/, '://$1');

  // if using protocol-relative CDN URL re-add the leading double-slash removed by path.join
  if (relativeTo.match(/^\/\/\w/)) {
    src = src.replace(/^\/(\w)/, '\/\/$1');
  }

  self.emit('entry', {
    before: resourceUrl.pathname,
    after: src
  });
  return grunt.template.process('<%= url %><%= search %><%= hash %>', {
    data: {
    url: src,
    hash: (resourceUrl.hash || ''), // keep the original hash too
    search: (resourceUrl.search || '') // keep the original querystring
    }
  });
};

Job.prototype.run = function () {
  var self = this;
  return self.buffer.split('\n').map(function(item) {
    return self._replace(item);
  }).join('\n');
};


module.exports = Job;
