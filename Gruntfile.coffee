module.exports = (grunt) ->

	# Project configuration.
	grunt.initConfig
		pkg: grunt.file.readJSON('package.json')
		regarde:
			base:
				files: ["_src/**/*.coffee"]
				tasks: [ "coffee:changed", "includereplace" ]

		coffee:
			changed:
				expand: true
				cwd: '_src'
				src:  [ '<% print( _.first( ((typeof grunt !== "undefined" && grunt !== null ? (_ref = grunt.regarde) != null ? _ref.changed : void 0 : void 0) || ["_src/nothing"]) ).slice( "_src/".length ) ) %>' ]
				# template to cut off `_src/` and throw on error on non-regrade call
				# CF: `_.first( grunt?.regarde?.changed or [ "_src/nothing" ] ).slice( "_src/".length )
				dest: ''
				ext: '.js'

			backend_base:
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
				slow: 1

			main: [ "test/general.js" ]
			#old: [ "test/old.js" ]
			#all: [ "test/general.js" , "test/old.js" ]

		includereplace:
			pckg:
				options:
					globals:
						version: "<%= pkg.version %>"

					prefix: "@@"
					suffix: ''

				files:
					"": ["index.js"]

		docker:
			codedocs:
				expand: true
				src: [ "README.md","_src/index.coffee","_src/lib/*.coffee" ]
				dest: "_docs/"
				options:
					onlyUpdated: false
					colourScheme: "autumn"
					ignoreHidden: false
					sidebarState: true
					exclude: false
					lineNums: true
					js: []
					css: []
					extras: []

	
	# Load npm modules
	grunt.loadNpmTasks "grunt-regarde"
	grunt.loadNpmTasks "grunt-contrib-coffee"
	grunt.loadNpmTasks "grunt-mocha-cli"
	grunt.loadNpmTasks "grunt-include-replace"
	grunt.loadNpmTasks "grunt-docker"


	# just a hack until this issue has been fixed: https://github.com/yeoman/grunt-regarde/issues/3
	grunt.option('force', not grunt.option('force'))
	
	# ALIAS TASKS
	grunt.registerTask "watch", "regarde"
	grunt.registerTask "docs", "docker"
	grunt.registerTask "default", "build"
	grunt.registerTask "test", [ "mochacli:main" ]

	# build the project
	grunt.registerTask "build",[ "coffee", "includereplace", "test" ]
