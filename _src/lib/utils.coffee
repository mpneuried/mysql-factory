_ = require('lodash')._

module.exports =

	# simple serial flow controll
	runSeries: (fns, callback) ->
		return callback()	if fns.length is 0
		completed = 0
		data = []
		iterate = ->
			fns[completed] (results) ->
				data[completed] = results
				if ++completed is fns.length
					callback data	if callback
				else
					iterate()

		iterate()

	# simple parallel flow controll
	runParallel: (fns, callback) ->
		return callback() if fns.length is 0
		started = 0
		completed = 0
		data = []
		iterate = ->
			fns[started] ((i) ->
				(results) ->
					data[i] = results
					if ++completed is fns.length
						callback data if callback
						return
			)(started)
			iterate() unless ++started is fns.length

		iterate()

	# check for a single `true` element in an array
	checkArray: ( ar )->

		if _.isArray( ar )
			_.any( ar, _.identity )
		else
			_.identity( ar )

	generateUID: ->
		"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace /[xy]/g, (c) ->
			r = Math.random() * 16 | 0
			v = (if c is "x" then r else (r & 0x3 | 0x8))
			return v.toString 16

	trim: ( str )->
		return str.replace(/^\s+|\s+$/g, '')