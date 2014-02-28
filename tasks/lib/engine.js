var CSSJob = require('./css_job'),
    HTMLJob = require('./html_job'),
    Job = require('./job'),
    util = require('util');

exports.css = function(options) {
  return new CSSJob(options);
};

exports.html = function(options) {
  return new HTMLJob(options);
};

exports.registerJob = function(usr_ctor) {
  var ctor = function() {
    Job.apply(this, arguments);
    usr_ctor.apply(this, arguments);
  };

  var proto = usr_ctor.prototype;

  util.inherits(usr_ctor, Job);

  for(key in proto){
    if(proto.hasOwnProperty(key)) {
      usr_ctor.prototype[key] = proto[key];
    }
  }

  util.inherits(ctor, usr_ctor);

  var o = new usr_ctor();

  return function(options) {
    return new ctor(options);
  }
};
