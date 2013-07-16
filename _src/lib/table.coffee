# import the external modules
_ = require('lodash')._
moment = require('moment')
async = require('async')
bcrypt = require( "bcrypt" )

# import the internal modules
utils = require( "./utils" )

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

			defaultBcryptRounds: 8

			createIdString: ->utils.randomString( 5 )

			stringIdInsertRetrys: 5

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

	set: ( id, data, cb, options )=>
		aL = arguments.length
		switch aL
			when 4 then @update( id, data, cb, options )
			when 3 
				if _.isFunction( data )
					# id = data; data = cb; cb = options
					@insert( id, data, cb )
				else
					@update( id, data, cb, {} )
			when 2
				# id = data; data = cb; 
				@insert( id, data, {} )
			when 1
				@_handleError( cb, "too-few-arguments", { method: "set", min: 2 } )
		return

	update: ( id, data, cb, options = {} )=>

		sql = @builder.clone()

		_valData = 
			isUpdate: true
			id: id
			data: data
			sql: sql
			options: options

		@_validate _valData, ( err, data )=>
			if err
				cb( err )
				return
			@_update( _valData, cb )
			return
		return

	_update: ( args, cb )=>
		{ id, data, sql, options } = args

		@debug "update", id, data

		sql.filter( sql.idField, id )
		
		_getStmt = @builder.clone().filter( sql.idField, id ).select( false ) 
		stmts = [ _getStmt, sql.update( data ), _getStmt ]

		@factory.exec( stmts, @_handleSave( "set", id, data, options, sql, cb ) )

		return

	insert: ( data, cb, options = {} )=>

		sql = @builder.clone()

		options.insertRetry = 0

		_valData = 
			isUpdate: false
			id: null
			data: data
			sql: sql
			options: options

		@_validate _valData, ( err )=>
			if err
				cb( err )
				return
			@_insert( _valData, cb )
			return

	_insert: ( args, cb )=>
		{ id, data, sql, options } = args

		if data[ sql.idField ]?
			_id = data[ sql.idField ]
		else
			if @hasStringId
				_id = @_generateNewID()
				data[ sql.idField ] = _id
			else
				_id =  { "fn": "LAST_INSERT_ID()" }

		@debug "insert", data
		stmts = [ sql.insert( data ) ]

		stmts.push @builder.clone().filter( sql.idField, _id ).select( false )

		@factory.exec( stmts, @_handleSave( "set", null, data, options, sql, cb ) )

		return

		


	_validate: ( args, cb )=>
		aFns = []
		for attr in args.sql.attrs
			aFns.push @_validateField( attr, args.data[ attr.name ], args )

		async.parallel aFns, ( err, results )=>
			if err
				cb( err )
				return
			cb( null )
			return

		return

	_validateField: ( field, value, args )=>
		{ id, data, sql, options, isUpdate } = args
		return ( cb )=>
			
			options._afterSave or= {}
			options._afterSave[ field.name ] or= {}

			_validation = field.validation or {}

			if not isUpdate and _validation.isRequired is true and not value?
				@_handleError( cb, "validation-required", field: field.name )
				return

			if _validation.bcrypt? and value?
				# change a crypt field to the crypted version
				salt = bcrypt.genSaltSync( _validation.bcrypt.rounds or @config.defaultBcryptRounds )
				data[ field.name ] = bcrypt.hashSync( value, salt )

			if _validation.setTimestamp is true and field.type in [ "string", "number", "S", "N", "timestamp", "T", "date", "D" ]
				# special command to run `UNIX_TIMESTAMP()*1000`
				data[ field.name ] = "now"

			if _validation.incrementOnSave is true and field.type in [ "number", "N" ]
				# special command to run `field = field + 1`
				if isUpdate
					data[ field.name ] = "incr"
				else
					data[ field.name ] = 0
					
			if _validation.notAllowedForValue? and value?

				if value is _validation.notAllowedForValue
					# it is not allowed to write this value
					@_handleError( cb, "value-not-allowed", field: field.name, value: validation.notAllowedForValue )
					return
				else
					# if the not allowed value is saved in db it's not possible to overwite it.
					data[ field.name ] = "IF( #{field.name} != \"#{ _validation.notAllowedForValue }\", \"#{ value }\", #{field.name} )"


			# rules to be check after the return
			
			if options?.equalOldValueIgnore isnt true and _validation.equalOldValue is true and isUpdate is true and value?
				# add a filter for the equal test. On return there has to be a check to detect the error based on the returning data.
				sql.filter( field.name, value )
				options._afterSave[ field.name ].checkEqualOld = true

			if _validation.fireEventOnChange? 
				options._afterSave[ field.name ].fireEventOnChange = _validation.fireEventOnChange

			if _validation.allreadyExistend is true
				options._afterSave[ field.name ].allreadyExistend = true

			cb( null )
			return

	_generateNewID: ( id )=>
		if not id? 
			id = @config.createIdString()

		return id

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

	_handleSave: ( type, id, data, options, sql, cb )=>
		return ( err, results )=>
			# check for a duplicate entry on a string id insert and retry
			if @hasStringId and not id? and err?.code is "ER_DUP_ENTRY" and err.message.indexOf( "PRIMARY" ) and not data[ sql.idField ]? and options?.insertRetry < @config.stringIdInsertRetrys
				@warning "detected double sting id insert, so retry", data[ sql.idField ]

				options.insertRetry++

				_valData = 
					id: null
					data: data
					sql: sql
					options: options
				@_insert( _valData, cb )
				return

			else if err?
				cb( err )
				return

			@_afterSave results, id, data, options, ( err, item )=>
				if err
					cb( err )
					return
				#@emit type, id, results
				cb( null, item )
				return

			return

	_afterSave: ( results, id, data, options, cb )=>

		if id?
			[ _old, _saveMeta, _new ] = results
		else
			[ _saveMeta, _new ] = results

		if _new? and _.isArray( _new )
			_new = _.first( _new )

		if _old? and _.isArray( _old )
			_old = _.first( _old )

		# check id on insert
		if not id? and not @hasStringId and _saveMeta.insertId isnt _new.id
			@_handleError( cb, "wrong-insert-return" )

		for _field, _val of options._afterSave when not _.isEmpty( _val )
			if id? and _val.fireEventOnChange? and _old[ _field ] isnt _new[ _field ]
				@emit "#{ _field }.#{ _val.fireEventOnChange }", _field, _old[ _field ], _new[ _field ]

		cb( null, @builder.convertToType( _new ) )

		return
	# # Error message mapping
	ERRORS: =>
		@extend super, 
			"not-found": "Element not found"
			"deprecated-option": "You tried to use the deprecated option: `<%= key %>`"
			"invalid-filter": "A filter has of the .find()` method to be an object"
			"too-few-arguments": "To use the `.<%= method %>()` method you have to define at least `<%= min %>` arguments"
			"validation-required": "The field `<%= field %>` is required."
			"value-not-allowed": "It's not allowed to write the value `<%= value %>`to the field `<%= field %>`"
			"wrong-insert-return": "The select after the insert query returns the wrong row."