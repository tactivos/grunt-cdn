var Job = require('./job'),
    util = require('util'),
    ParserConfig = require('./parser_config');

var HTMLJob = function() {
  Job.apply(this, arguments);
};
util.inherits(HTMLJob, Job);

HTMLJob.prototype.run = function () {
  var self = this, i, j, replacer;
  
  replacer = function(match, resource) {
    return match.replace(resource, self._replace(resource/*, filename, relativeTo*/));
  };
  return ParserConfig.htmlsplitters.reduce(function(value, htmlsplitter) {
    for (i=0; i<htmlsplitter.splitters.length; i++) {
      value = value.split(htmlsplitter.splitters[i]);
      for (j=1; j<value.length; j++) {
        var tagEnd = value[j].indexOf('>') + 1,
          tag = value[j].substring(0, tagEnd),
          rest = value[j].substring(tagEnd);                
        value[j] = (tag.replace(htmlsplitter.rgx, replacer) + rest);
      }
      value = value.join(htmlsplitter.splitters[i]);
    }
    return value;
  }, this.buffer);
};


module.exports = HTMLJob;