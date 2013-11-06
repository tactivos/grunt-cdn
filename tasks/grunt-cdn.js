/*
 * grunt-cdn
 * https://github.com/tactivos/grunt-cdn
 *
 * Copyright (c) 2012 Johnny G. Halife & Mural.ly Dev Team
 */
module.exports = function (grunt) {

    var fs = require('fs');
    var url = require('url');
    var path = require('path');
    var crypto = require('crypto');

    var reghtmls = [
        new RegExp(/<(?:img|source|script).*\b(?:src)=['"](?!.*\/\/)([^'"\{]+)['"].*\/?>/ig),
        new RegExp(/<(?:link).*\b(?:href)=['"](?!.*\/\/)([^'"\{]+)['"].*\/?>/ig),
        new RegExp(/<script.*\bdata-main=['"](?!.*\/\/)([^'"\{]+)['"].*\/?>/ig)
    ];

    var regcss = new RegExp(/url\(([^)]+)\)/ig);
    var regcssfilter = new RegExp(/filter[\w\.\:]+\(src=['"]([^'"]+)['"]/ig);
    var ignorePath = null;

    grunt.registerMultiTask('cdn', "Properly prepends a CDN url to those assets referenced with absolute paths (but not URLs)", function () {
        var self = this;
        var files = this.files;
        var options = this.options();
        var relativeTo = this.options().cdn;
        ignorePath = this.options().ignorePath;

        var supportedTypes = {
            html: 'html',
            css: 'css',
            soy: 'html',
            ejs: 'html',
            hbs: 'html'
        };

        for (var key in options.supportedTypes) {
            supportedTypes[key] = options.supportedTypes[key];
        }

        for (key in options.reghtmls) {
            reghtmls.push(new RegExp(options.reghtmls[key]));
        }

        files.forEach(function (file) {
            file.src.forEach(function (filepath) {
                var type = path.extname(filepath).replace(/^\./, ''),
                    filename = path.basename(filepath),
                    destfile = file.dest ? path.join(file.dest, filename) : filepath,
                    content = grunt.file.read(filepath);
                content = content.toString(); // sometimes css is interpreted as object

                if (!supportedTypes[type]) { //next
                    console.warn("unrecognized extension:" + type + " - " + filepath);
                    return;
                }

                grunt.log.subhead('cdn:' + type + ' - ' + filepath);

                if (supportedTypes[type] == "html") {
                    content = html.call(self, content, filepath, relativeTo);
                } else if (supportedTypes[type] === "css") {
                    content = css.call(self, content, filepath, relativeTo);
                }

                // write the contents to destination
                grunt.file.write(destfile, content);
            });
        });
    });

    function html(content, filename, relativeTo) {
        var self = this;
        return reghtmls.reduce(function (value, reghtml) {
            while (reghtml.exec(value) !== null) {
                value = value.replace(reghtml, function (match, resource) {
                    return match.replace(resource, cdnUrl.call(self, resource, filename, relativeTo));
                });

            }
            return value;
        }, content);
    }

    function css(content, filename, relativeTo) {
        var self = this,
            getUrl = function (resource) {
                resource = resource.replace(/^['"]/, '').replace(/['"]$/, '');
                var url = cdnUrl.call(self, resource, filename, relativeTo);
                return url;
            };
        return content.replace(regcss,function (attr, resource) {
            var url = getUrl(resource);
            if (!url) return attr;

            return grunt.template.process("url('<%= url %>')", {
                data: {
                    url: url
                }
            });
        }).replace(regcssfilter, function (rule, resource) {
            var url = getUrl(resource);
            if (!url) return rule;

            return rule.replace(resource, url);
        });
    }

    function cdnUrl(resource, filename, relativeTo) {
        var options = this.options();
        // skip those absolute urls
        if (resource.match(/^https?:\/\//i) || resource.match(/^\/\//) || resource.match(/^data:/i)) {
            grunt.verbose.writeln("skipping " + resource + " it's an absolute (or data) URL");
            return resource;
        }

        if (ignorePath && resource.match(ignorePath)) {
            return resource;
        }

        var resourceUrl = url.parse(resource);

        if (resourceUrl.protocol === "about:") {
            return resource;
        }

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
        if (!options.flatten && !grunt.file.isPathAbsolute(resourceUrl.pathname)) {
            grunt.verbose.writeln("skipping " + resource + " it's a relative URL");
            return resource;
        }

        // if stripDirs then loop through and strip
        if (options.stripDirs) {
            if (typeof options.stripDirs === 'string') {
                options.stripDirs = [options.stripDirs];
            }
            options.stripDirs.forEach(function (dirname) {
                var re = new RegExp('\/(' + dirname + '\/)', 'g');
                resourceUrl.pathname = resourceUrl.pathname.replace(re, '');
            });
        }

        var src = path.join(relativeTo, resourceUrl.pathname).replace(/\\/g, '/').replace(/:\/(\w)/, '://$1');

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
