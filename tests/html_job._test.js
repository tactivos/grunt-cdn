/*global describe, it */

var expect = require('chai').expect,
    cheerio = require('cheerio'),
    url = require('url'),
    HTMLJob = require('../tasks/lib/html_job'),
    Snippets = require("./fixtures");


describe("HTML Job", function() {
  var globalConfig = {
    cdn: "http://my.site.com/"
  };
  
  describe("entry event", function() {
    
    it('should contain original and replaced url', function() {
      var job = new HTMLJob(globalConfig);
      job.start(Snippets.image1).on('entry', function(data) {
        expect(data.before).to.equal(cheerio.load(Snippets.image1)('img').attr('src'));
        expect(data.after).to.equal(url.resolve(globalConfig.cdn, "pic.png"));
      });
    });
    
  });
  
  describe("end evnet", function() {
    it("should contain the result string", function(done) {
      var job = new HTMLJob(globalConfig);
    
      job.start(Snippets.image1).on('end', function(result) {
        expect(result).to.be.ok;
        var $ = cheerio.load(result);
        expect($('img').attr('src')).to.equal(url.resolve(globalConfig.cdn, "pic.png"));
        done();
      });
      
    });
  });
  
  
});