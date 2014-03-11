/*
 * grunt-cdn
 * https://github.com/tactivos/grunt-cdn
 *
 * Copyright (c) 2012 Johnny G. Halife & Mural.ly Dev Team
 */
module.exports = function(grunt) {
  // var url = require('url');
  var path = require('path'),
      ParserConfig = require('./lib/parser_config');

  grunt.registerMultiTask('cdn', "Properly prepends a CDN url to those assets referenced with absolute paths (but not URLs)", function() {
    var done = this.async(),
        files = this.files,
        engine = require('./lib/engine'),
        options = this.options(),
        key,
        supportedTypes = Object.create(ParserConfig.supportedTypes),
        activeJobs = 0;

    for(key in options.supportedTypes){
      if(options.supportedTypes.hasOwnProperty(key)) {
        supportedTypes[key] = options.supportedTypes[key];
      }
    }

    files.forEach(function(file) {
      file.src.forEach(function (filepath) {
        var type = path.extname(filepath).replace(/^\./, ''),
            filename = path.basename(filepath),
            destfile = (file.dest && file.dest !== filepath) ? path.join(file.dest, filename) : filepath,
            content = grunt.file.read(filepath).toString(),
            job; // sometimes css is interpreted as object

        if (!supportedTypes[type]) { //next
          console.warn("unrecognized extension:" + type + " - " + filepath);
          return;
        }

        grunt.log.subhead('cdn:' + type + ' - ' + filepath);

        // Incrementing counter of active jobs
        activeJobs++;
          
        if (supportedTypes[type] === "html") {
          job = engine.html(options);
        } else if (supportedTypes[type] === "css") {
          job = engine.css(options);
        }
        job.start(content).on("entry", function (data) {
          grunt.log.writeln('Changing ' + data.before.cyan + ' -> ' + data.after.cyan);
        }).on("ignore", function (data) {
          grunt.verbose.writeln("skipping " + data.resource, data.reason);
        }).on("end", function (result) {
          // write the contents to destination
          grunt.file.write(destfile, result);
            
          activeJobs--; // The job is done
          if (activeJobs === 0) { // Checking if all jobs are done
            done();
          }
        });
      });
    });
  });



};
