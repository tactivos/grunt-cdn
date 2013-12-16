// badcase for issue#34, and possibly issue#36

/*global describe, it */

var sinon = require('sinon'),
    cheerio = require('cheerio'),
    HTMLJob = require('../tasks/lib/html_job'),
    expect = require('chai').expect,
    url = require('url');

describe('Issue#34', function() {
  
  describe('HTML job', function() {
    var globalConfig = {
          cdn: "http://my.site.com"
        };
    
    it('should safely ingore <A> tags in a html string', function(done) {
      var job = new HTMLJob(globalConfig),
          callback1 = sinon.spy(),
          callback2 = sinon.spy(),
          str = '<link href="/a.css" /><a href="/b.html">link</a>';
      job.start(str).on('entry', callback1).on('end', callback2);
      setTimeout(function() {
        var parsed = callback2.firstCall.args[0],
            $after;
        expect(parsed).to.be.ok;
        $after = cheerio.load(parsed);
        expect(callback1.calledOnce).to.be.true;
        expect(callback2.calledOnce).to.be.true;
        expect($after('a').attr('href')).to.equal('/b.html');
        expect($after('link').attr('href')).to.equal(url.resolve(globalConfig.cdn, cheerio.load(str)('link').attr('href')));
        done();
      }, 50);
      
    });
    
    it('should safely handle empty href in <A> tags', function(done) {
      var job = new HTMLJob(globalConfig),
          str = '<link href="/a.css" /><a href=\'\'>link</a>',
          callback = sinon.spy();
      job.start(str).on('end', callback);
      setTimeout(function() {
        var result = callback.firstCall.args[0];
        expect(result).to.be.ok;
        console.log(result);
        done();
      }, 50);
      
    });
  });
  
});