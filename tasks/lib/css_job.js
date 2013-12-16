var Job = require('./job'),
    util = require('util'),
    ParserConfig = require('./parser_config'),
    grunt = require('grunt');

var CSSJob = function() {
  Job.apply(this, arguments);
};
util.inherits(CSSJob, Job);

CSSJob.prototype.run = function () {
  var self = this,
  getUrl = function (resource) {
    resource = resource.replace(/^['"]/, '').replace(/['"]$/, '');
    return self._replace(resource/*, filename, relativeTo*/);
  };
  return this.buffer.replace(ParserConfig.regcss, function(attr, resource) {
    var ret = getUrl(resource);
    if (!ret) {
      return attr;
    }

    return grunt.template.process("url('<%= url %>')", {
      data: {
        url: ret
      }
    });
  }).replace(ParserConfig.regcssfilter, function (rule, resource) {
    var ret = getUrl(resource);
    if (!ret) {
      return rule;
    }
    
    return rule.replace(resource, ret);
  });
};


module.exports = CSSJob;