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
		ejs: 'html'
	};

	var reghtml = new RegExp(/<(?:img|link|source|script).*\b(?:href|src)=['"]([^https?\:\/\/]\w[^'"]+)['"].*\/?>/ig);

	var regcss = new RegExp(/url\(([^)]+)\)/ig);

	grunt.registerMultiTask('cdn', "Properly prepends a CDN url to those assets referenced with absolute paths (but not URLs)", function() {
		var files = this.filesSrc;
		var dest = this.data.dest;
		var options = this.options();
		var relativeTo = options.cdn;
		files.forEach(function(filepath) {
                        var type = path.extname(filepath).replace(/^\./, '');
			content = grunt.file.read(filepath);
			content = content.toString(); // sometimes css is interpreted as object
			if (!supportedTypes[type]) { //next
				console.warn("unrecognized extension: <%= type %> - <%= filepath %>");
				return;
			}

			if (type == "html") {
				content = html(content, filepath, relativeTo);
			} else if (type === "css") {
				content = css(content, filepath, relativeTo);
			}
			// write the contents to destination
			grunt.file.write(filepath, content);
		});
	});

	function html(content, filename, relativeTo) {
		return content.replace(reghtml, function(match, resource) {
			return match.replace(resource, cdnUrl(resource, filename, relativeTo));
		});
	};

	function css(content, filename, relativeTo) {
		return content.replace(regcss, function(attr, resource) {
			resource = resource.replace(/^['"]/, '').replace(/['"]$/, '');
			var url = cdnUrl(resource, filename, relativeTo);
			if (!url) return attr;

			return grunt.template.process("url('<%= url %>')", {
				data: {
					url: url
				}
			});
		});
	};

	function cdnUrl(resource, filename, relativeTo) {
		// skip those absolute urls
		if (resource.match(/^https?:\/\//i) || resource.match(/^\/\//) || resource.match(/^data:/i)) {
			grunt.verbose.writeln("skipping " + resource + " it's an absolute (or data) URL");
			return;
		}

		var resourceUrl = url.parse(resource);

		// if path is relative let it be
		if (!grunt.file.isPathAbsolute(resourceUrl.pathname)) {
			grunt.verbose.writeln("skipping " + resource + " it's a relative URL");
			return;
		}
		var src = path.join(relativeTo, resourceUrl.pathname).replace(/:\/(\w)/, '://$1');
		return grunt.template.process("<%= url %><%= search %><%= hash %>", {
			data: {
				url: src,
				hash: (resourceUrl.hash || ''), // keep the original hash too
				search: (resourceUrl.search || '') // keep the original querystring
			}
		});
	}
};
