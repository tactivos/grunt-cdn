var CSSJob = require('./css_job'),
    HTMLJob = require('./html_job');

exports.css = function(options) {
  return new CSSJob(options);
};

exports.html = function(options) {
  return new HTMLJob(options);
};