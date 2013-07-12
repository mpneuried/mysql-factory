# import the external modules
_ = require('lodash')._
moment = require('moment')

# # MySQL Dynamo Table
# ### extends [Basic](basic.coffee.html)

# Work with the data of a table
module.exports = class MySQLTable extends require( "./basic" )

	# define the defaults
	defaults: =>
		# extend the parent defaults
		@extend super, 
			tablename: null
			# name of id-field
			sIdField: "id"
			# define id as a string [ default: false ]
			hasStringId: false
			# use fieldset feature
			useFieldsets: false
			# database fields
			sortfield: "id"
			sortdirection: "decs"
			fields: {}
			createIdString: null

	###	
	## constructor 

	`new MySQLTable( _model_settings, options )`
	
	Define the getter and setter and configure teh table.

	@param {Object} _model_settings Model configuration.
	@param {Object} options Basic config object

	###
	constructor: ( @settings, options )->	
		
		# set internal values
		@factory = options.factory

		@getter "tablename", =>
			@settings.tablename

		@getter "sIdField", =>
			@settings.sIdField

		@getter "hasStringId", =>
			@settings.hasStringId or false

		@getter "sortfield", =>
			@settings.sortfield or @sIdField

		@getter "sortdirection", =>
			@settings.sortdirection or "desc"
		
		super( options )
		

		@info "init table", @tablename, @sIdField

		return

	###
	## initialize
	
	`table.initialize()`
	
	Initialize the Table object
	
	@api private
	###
	initialize: =>

		SQLBuilder = ( require( "./sql" ) )( logging: @config.logging )

		@builder = new SQLBuilder()
			
		@builder.table = @tablename

		@builder.idField = @sIdField

		@builder.usefieldsets = @settings.useFieldsets

		@builder.attrs = @settings.fields

		@builder.fields = "all"

		@builder.orderfield = @sortfield

		@builder.forward = @sortdirection

		return
	
	get: ( id, cb, opt = {} )=>

		# get the standard options
		options = @_getOptions( opt, "get" )

		sql = @builder.clone()

		if options.fields?
			sql.fields = options.fields

		sql.filter( @sIdField, id )

		@factory.exec( sql.select( false ), @_handleSingle( "get", id, opt, cb ) )

		return

	mget: ( ids, cb, opt = {} )=>

		# get the standard options
		options = @_getOptions( opt, "get" )

		sql = @builder.clone()

		if options.fields?
			sql.fields = options.fields

		sql.filter( @sIdField, ids )

		@factory.exec( sql.select(), @_handleList( "mget", ids, opt, cb ) )

		return

	find: ( filter, cb, opt = {} )=>

		if not filter? or not _.isObject( filter )
			@_handleError( cb, "invalid-filter" )
			return

		# get the standard options
		options = @_getOptions( opt, "get" )

		sql = @builder.clone()

		if options.fields?
			sql.fields = options.fields

		if filter?.limit?
			sql.limit = filter.limit
			if filter.offset?
				sql.offset = filter.offset
			filter = _.omit( filter, [ "offset", "limit" ] )
		else if options?.limit?
			sql.limit = options.limit
			if options.offset?
				sql.offset = options.offset

		if options._customQueryFilter?
			@_handleError( cb, "deprecated-option", key: "_customQueryFilter" )
			return 

		sql.filter( filter )

		@factory.exec( sql.select(), @_handleList( "mget", filter, opt, cb ) )

		return

	_getOptions: ( options, type )=>
		_opt = @extend(
			fields: "all"
			_customQueryEnd: ""
		, options )

		return _opt


	_handleSingle: ( type, args..., cb )=>
		return ( err, results, meta )=>
			if err?
				cb( err )
				return

			if _.isArray( results )
				results = _.first( results )

			if not results?
				@_handleError( cb, "not-found" )
				return

			#@emit type, id, results
			cb( null, results )
			return

	_handleList: ( type, args..., cb )=>
		return ( err, results, meta )=>
			if err?
				cb( err )
				return

			#@emit type, id, results
			cb( null, results )
			return

	# # Error message mapping
	ERRORS: =>
		@extend super, 
			"not-found": "Element not found"
			"deprecated-option": "You tried to use the deprecated option: `<% key %>`"
			"invalid-filter": "A filter has of the .find()` method to be an object"