module.exports = (grunt) ->

	# Project configuration.
	grunt.initConfig
		pkg: grunt.file.readJSON('package.json')
		watch:
			base:
				files: ["_src/**/*.coffee"]
				tasks: [ "coffee:base", "includereplace" ]

		coffee:
			base:
				expand: true
				cwd: '_src',
				src: ["**/*.coffee"]
				dest: ''
				ext: '.js'

		mochacli:
			options:
				require: [ "should" ]
				reporter: "spec"
				bail: false
				timeout: 3000
				slow: 3

			main: [ "test/general.js" ]

		includereplace:
			pckg:
				options:
					globals:
						version: "<%= pkg.version %>"

					prefix: "@@"
					suffix: ''

				files:
					"index.js": ["index.js"]

	
	# Load npm modules
	grunt.loadNpmTasks "grunt-contrib-watch"
	grunt.loadNpmTasks "grunt-contrib-coffee"
	grunt.loadNpmTasks "grunt-mocha-cli"
	grunt.loadNpmTasks "grunt-include-replace"

	# ALIAS TASKS
	grunt.registerTask "default", "build"
	grunt.registerTask "test", [ "mochacli:main" ]
	grunt.registerTask "w", "watch"
	grunt.registerTask "b", "build"
	grunt.registerTask "t", "test"

	# build the project
	grunt.registerTask "build", [ "coffee:base", "includereplace:pckg", "test" ]
