/*global describe, it */

var expect = require('chai').expect,
    cheerio = require('cheerio'),
    url = require('url'),
    HTMLJob = require('../tasks/lib/html_job'),
    CSSJob = require('../tasks/lib/css_job'),
    Snippets = {
      'image1': '<img src="/pic.png" />'
    };

describe('Job Bascis', function() {
  
  var globalConfig = {
    cdn: "http://my.site.com/"
  };
  
  describe('HTML Job', function() {
    it('should replace absolute url string for source tags like <img> and <script>', function(done) {
      var job = new HTMLJob(globalConfig);
      
      job.start(Snippets.image1).on("entry", function() {
        
      }).on('end', function(result) {
        expect(result).to.be.ok;
        var $ = cheerio.load(result);
        expect($('img').attr('src')).to.equal(url.resolve(globalConfig.cdn, "pic.png"));
        done();
      });
    });
  });
  
});