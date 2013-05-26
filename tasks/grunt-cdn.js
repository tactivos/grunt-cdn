/*
 * grunt-cdn
 * https://github.com/tactivos/grunt-cdn
 *
 * Copyright (c) 2012 Johnny G. Halife & Mural.ly Dev Team
 */
module.exports = function(grunt) {

	var fs = require('fs');
	var url = require('url');
	var path = require('path');
	var crypto = require('crypto');

	var supportedTypes = {
		html: 'html',
		css: 'css',
		soy: 'html',
		ejs: 'html',
		hbs: 'html'
	};

	var reghtml = new RegExp(/<(?:img|link|source|script).*\b(?:href|src)=['"]([^'"\{]+)['"].*\/?>/ig);

	var regcss = new RegExp(/url\(([^)]+)\)/ig);

	grunt.registerMultiTask('cdn', "Properly prepends a CDN url to those assets referenced with absolute paths (but not URLs)", function() {
		var files = this.filesSrc;
		var relativeTo = this.data.cdn;
        var self = this;

		files.forEach(function(filepath) {
            var type = path.extname(filepath).replace(/^\./, '');
			content = grunt.file.read(filepath);
			content = content.toString(); // sometimes css is interpreted as object
			if (!supportedTypes[type]) { //next
				console.warn("unrecognized extension: <%= type %> - <%= filepath %>");
				return;
			}

            grunt.log.subhead('cdn:' + type + ' - ' + filepath);

			if (supportedTypes[type] == "html") {
				content = html.call(self, content, filepath, relativeTo);
			} else if (supportedTypes[type] === "css") {
				content = css.call(self, content, filepath, relativeTo);
			}
			// write the contents to destination
			grunt.file.write(filepath, content);
		});
	});

	function html(content, filename, relativeTo) {
        var self = this;
		return content.replace(reghtml, function(match, resource) {
			return match.replace(resource, cdnUrl.call(self, resource, filename, relativeTo));
		});
	};

	function css(content, filename, relativeTo) {
        var self = this;
		return content.replace(regcss, function(attr, resource) {
			resource = resource.replace(/^['"]/, '').replace(/['"]$/, '');
			var url = cdnUrl.call(self, resource, filename, relativeTo);
			if (!url) return attr;

			return grunt.template.process("url('<%= url %>')", {
				data: {
					url: url
				}
			});
		});
	};

	function cdnUrl(resource, filename, relativeTo) {
        var options = this.options();
		// skip those absolute urls
		if (resource.match(/^https?:\/\//i) || resource.match(/^\/\//) || resource.match(/^data:/i)) {
			grunt.verbose.writeln("skipping " + resource + " it's an absolute (or data) URL");
			return resource;
		}

		var resourceUrl = url.parse(resource);

        // if flatten is true then we will convert all paths to absolute here!
        if (options.flatten) {
            resourceUrl.pathname = '/' + resourceUrl.pathname.replace(/^(\.\.?\/)+/, '');
        }

        if (options.match) {
            if (typeof options.match === 'function') {
                if (!options.match(resourceUrl, resource)) {
                    grunt.verbose.writeln("skipping " + resource + ", not matched");
                    return resource;
                }
            } else {
                if (!resourceUrl.pathname.match(options.match)) {
                    grunt.verbose.writeln("skipping " + resource + ", not matched");
                    return resource;
                }
            }
        }

		// if path is relative let it be
		if (!grunt.file.isPathAbsolute(resourceUrl.pathname)) {
			grunt.verbose.writeln("skipping " + resource + " it's a relative URL");
			return resource;
		}

        // if stripDirs then loop through and strip
        if (options.stripDirs) {
            if (typeof options.stripDirs === 'string') {
                options.stripDirs = [options.stripDirs];
            }
            options.stripDirs.forEach(function(dirname) {
                var re = new RegExp('\/('+dirname+'\/)', 'g');
                resourceUrl.pathname = resourceUrl.pathname.replace(re, '');
            });
        }

        var src = path.join(relativeTo, resourceUrl.pathname).replace(/:\/(\w)/, '://$1');

        // if using protocol-relative CDN URL re-add the leading double-slash removed by path.join
        if (relativeTo.match(/^\/\/\w/)) {
            src = src.replace(/^\/(\w)/, '\/\/$1');
        }

        grunt.log.writeln('Changing ' + resourceUrl.pathname.cyan + ' -> ' + src.cyan);
		return grunt.template.process("<%= url %><%= search %><%= hash %>", {
			data: {
				url: src,
				hash: (resourceUrl.hash || ''), // keep the original hash too
				search: (resourceUrl.search || '') // keep the original querystring
			}
		});
	}
};
