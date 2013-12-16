/*global describe, it */

var expect = require('chai').expect,
    cheerio = require('cheerio'),
    sinon = require('sinon'),
    url = require('url'),
    Job = require('../tasks/lib/job');

describe('Job Basics', function() {
  
  var globalConfig = {
        cdn: "http://my.site.com/"
      },
      Snippets = require("./fixtures");

  it('should emit "entry" event every time a replacement occurs', function(done) {
    var job = new Job(globalConfig),
        callback = sinon.spy();
    job.start(Snippets.simple1).on('entry', callback);
    setTimeout(function() {
      expect(callback.called).to.be.true;
      expect(callback.callCount).to.equal(2);
      done();
    }, 10);
  });
  
  it('should emit "end" event after finish', function(done) {
    var job = new Job(globalConfig);
    job.start(Snippets.simple1).on('end', function() {
      done();
    });
  });
    
  it('should emit ignore event every time a ignore rule is hit', function(done) {
    var job = new Job(globalConfig),
        callback = sinon.spy();
    job.start(Snippets.simple2).on('ignore', callback);
    setTimeout(function() {
      expect(callback.callCount).to.equal(2);
      done();
    }, 10);
  });
  
});