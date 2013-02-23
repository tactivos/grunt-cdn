module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		cdn: {
            options: {
                cdn: 'http://cdn.cloudfront.net/container/',
                flatten: false
            },
            dist: {
                src: ['./static/*.html', './static/*.css', './static/*.soy'],
                dest: './dist/static/'
            }
		}
	});

    grunt.registerTask('default', ['cdn']);
};
