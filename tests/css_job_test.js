/*global describe, it */

var CSSJob = require('../tasks/lib/css_job'),
    cssparse = require('css-parse'),
    sinon = require('sinon'),
    url = require('url'),
    expect = require('chai').expect;

describe('CSS Job', function() {
  
  var globalConfig = {
    cdn: 'http://my.site.com/'
  },
  Snippets = require('./fixtures');
  
  describe('entry event', function() {
    it('should emit every time when we find a url pattern', function(done) {
      var job = new CSSJob(globalConfig),
          callback = sinon.spy();
      job.start(Snippets.css1).on('entry', callback);
      setTimeout(function() {
        expect(callback.callCount).to.equal(1);
        done();
      }, 50);
    });
    
    it('should emit every time when we find a filter url pattern', function(done) {
      var job = new CSSJob(globalConfig),
          callback = sinon.spy();
      job.start(Snippets.css2).on('entry', callback);
      setTimeout(function() {
        expect(callback.callCount).to.equal(1);
        done();
      }, 50);
    });
    
    it('should contain original and replaced url', function(done) {
      var job = new CSSJob(globalConfig),
          callback = sinon.spy();
      job.start(Snippets.css3).on('entry', callback);
      setTimeout(function() {
        var original, parsed;
        parsed = cssparse(Snippets.css3);
        
        expect(callback.calledOnce).to.be.true;
        original = parsed.stylesheet.rules[0].declarations[0].value.match(/url\(([^)]+)\)/i)[1];
        expect(callback.firstCall.args[0].before).to.equal(original);
        expect(callback.firstCall.args[0].after).to.equal(url.resolve(globalConfig.cdn, original));
        done();
      }, 50);
    });
  });
  
  describe('ignore event', function() {
    it('should emit everytime we find find relative url', function(done) {
      var job = new CSSJob(globalConfig),
          callback = sinon.spy();
      job.start(Snippets.css1).on('entry', callback);
      setTimeout(function() {
        expect(callback.callCount).to.equal(1);
        done();
      }, 50);
    });
    //TODO: test other cases to ignore
  });
  
  describe('end event', function() {
    it('should emit end event when finished', function(done) {
      var job = new CSSJob(globalConfig),
          callback = sinon.spy();
      job.start(Snippets.css1).on('end', callback);
      setTimeout(function() {
        expect(callback.callCount).to.equal(1);
        done();
      }, 50);
    });
    
    it('should contain the result string', function(done) {
      var job = new CSSJob(globalConfig),
          callback = sinon.spy();
      job.start(Snippets.css3).on('end', callback);
      setTimeout(function() {
        var result = callback.firstCall.args[0],
            replaced = cssparse(result).stylesheet.rules[0].declarations[0].value.match(/url\(([^)]+)\)/i)[1].replace(/['"]/g,''),
            original = cssparse(Snippets.css3).stylesheet.rules[0].declarations[0].value.match(/url\(([^)]+)\)/i)[1];
        expect(replaced).to.equal(url.resolve(globalConfig.cdn, original));
        done();
      }, 50);
    });
  });
  
  
});