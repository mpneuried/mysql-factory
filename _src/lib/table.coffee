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
		
		@define( "limit", ( =>@builder.defaultLimit ), ( ( _limit )=>@builder.defaultLimit = _limit ) )

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
		SQLBuilder = ( require( "./sql" ) )( logging: @config.logging, @escape )

		@builder = new SQLBuilder()
			
		@builder.table = @tablename

		@builder.idField = @sIdField

		@builder.usefieldsets = @settings.useFieldsets

		@builder.attrs = @settings.fields

		@builder.fields = "all"

		@builder.orderfield = @sortfield

		@builder.forward = @sortdirection

		return

	escape: ( val )=>
		return @factory.pool.escape( val )
	
	get: ( id, cb, opt = {} )=>

		cb = @_wrapCallback( cb )

		# get the standard options
		options = @_getOptions( opt, "get" )

		sql = @builder.clone()

		if options.fields?
			sql.fields = options.fields

		sql.filter( @sIdField, id )

		@factory.exec( sql.select( false ), @_handleSingle( "get", id, opt, cb ) )

		return

	mget: ( ids, cb, opt = {} )=>

		cb = @_wrapCallback( cb )

		# get the standard options
		options = @_getOptions( opt, "get" )

		sql = @builder.clone()

		if options.fields?
			sql.fields = options.fields

		sql.filter( @sIdField, ids )

		@factory.exec( sql.select(), @_handleList( "mget", ids, opt, sql, cb ) )

		return

	find: ( filter, cb, opt = {} )=>

		cb = @_wrapCallback( cb )

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

		sql.filter( filter )

		if options._customQueryFilter?
			sql.filter( options._customQueryFilter )

		if options._customQueryEnd?
			@_handleError( cb, "deprecated-option", key: "_customQueryEnd" )
			return 

		@factory.exec( sql.select(), @_handleList( "mget", filter, opt, sql, cb ) )

		return

	set: ( id, data, cb, options )=>

		cb = @_wrapCallback( cb )

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

		cb = @_wrapCallback( cb )

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

	insert: ( data, cb, options = {} )=>

		cb = @_wrapCallback( cb )

		sql = @builder.clone()
		
		options.insertRetry = if data[ @sIdField ]? then +Infinity else 0

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

	has: ( id, cb, opt = {} )=>

		cb = @_wrapCallback( cb )

		# get the standard options
		options = @_getOptions( opt, "has" )

		sql = @builder.clone()

		sql.filter( @sIdField, id )

		@factory.exec( sql.count(), @_handleSingle( "has", id, opt, cb ) )

		return

	count: ( filter, cb, opt = {} )=>

		cb = @_wrapCallback( cb )

		# get the standard options
		options = @_getOptions( opt, "count" )

		sql = @builder.clone()

		if options._customQueryEnd?
			@_handleError( cb, "deprecated-option", key: "_customQueryEnd" )
			return 

		if options._customQueryFilter?
			sql.filter( options._customQueryFilter )

		sql.filter( filter )

		@factory.exec( sql.count(), @_handleSingle( "count", filter, opt, cb ) )

		return

	increment: ( id, field, cb, opt = {} )=>

		@_crement( id, field, +1, cb, opt )
		
		return

	decrement: ( id, field, cb, opt = {} )=>

		@_crement( id, field, -1, cb, opt )
		
		return

	del: ( id, cb, opt = {} )=>
		
		cb = @_wrapCallback( cb )

		# get the standard options
		options = @_getOptions( opt, "count" )

		sql = @builder.clone()

		sql.filter( @sIdField, id )
		stmts = [ sql.select( false ), sql.del() ]

		@factory.exec( stmts, @_handleSingle( "del", id, opt, cb ) )

		return

	mdel: ( filter, cb, opt = {} )=>
		
		cb = @_wrapCallback( cb )

		# get the standard options
		options = @_getOptions( opt, "count" )

		sql = @builder.clone()

		sql.filter( filter )

		if options._customQueryFilter?
			sql.filter( options._customQueryFilter )

		if not sql.isFiltered
			@_handleError( cb, "no-filter" )
			return

		stmts = [ sql.select( false ), sql.del() ]

		@factory.exec( stmts, @_handleSingle( "mdel", filter, opt, sql, cb ) )

		return

	getFieldNames: ( fields )=>
		_sql = @builder.clone()
		_sql.fields = fields if fields?
		_sql.fieldNames

	_crement: ( id, field, count, cb, opt = {} )=>

		cb = @_wrapCallback( cb )
		_type = if count > 0 then "increment" else "decrement"

		# get the standard options
		options = @_getOptions( opt, "count" )

		sql = @builder.clone()

		if not sql.hasField( field )
			@_handleError( cb, "invalid-field", method: _type, field: field )
			return

		sql.filter( @sIdField, id )

		sql.setFields( "#{sql.fields}, #{ field } AS count", true )

		_data = {}
		_data[ field ] = "crmt" + count

		stmt = [ sql.update( _data ), sql.select( false ) ]

		@factory.exec( stmt, @_handleSingle( _type, id, opt, cb ) )

		return

	_update: ( args, cb )=>
		{ id, data, sql, options } = args

		@debug "update", id, data

		sql.filter( @sIdField, id )
		
		_getStmt = @builder.clone().filter( @sIdField, id ).select( false ) 
		stmts = [ _getStmt, sql.update( data ), _getStmt ]

		@factory.exec( stmts, @_handleSave( "set", id, data, options, sql, cb ) )

		return

	_insert: ( args, cb )=>
		{ id, data, sql, options } = args

		if data[ @sIdField ]?
			_id = data[ @sIdField ]
		else
			if @hasStringId
				_id = @_generateNewID()
				data[ @sIdField ] = _id
			else
				_id =  { "fn": "LAST_INSERT_ID()" }

		@debug "insert", data
		stmts = [ sql.insert( data ) ]

		stmts.push @builder.clone().filter( @sIdField, _id ).select( false )

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

			options._changedValues or= {}
			options._changedValues[ field.name ] or= null

			_validation = field.validation or {}

			if not isUpdate and _validation.isRequired is true and not value?
				@_handleError( cb, "validation-required", field: field.name )
				return

			if not isUpdate and _validation.isRequired is true and not value?
				@_handleError( cb, "validation-required", field: field.name )
				return

			if _validation.bcrypt? and value?
				# change a crypt field to the crypted version
				salt = bcrypt.genSaltSync( _validation.bcrypt.rounds or @config.defaultBcryptRounds )
				data[ field.name ] = bcrypt.hashSync( value, salt )

			if _validation.setTimestamp is true and field.type in [ "string", "number", "S", "N", "timestamp", "T", "date", "D" ]
				# special command to run `UNIX_TIMESTAMP()*1000`
				options._changedValues[ field.name ] = data[ field.name ]
				data[ field.name ] = "now"

			if _validation.incrementOnSave is true and field.type in [ "number", "N" ]
				# special command to run `field = field + 1`
				options._changedValues[ field.name ] = data[ field.name ]
				if isUpdate
					data[ field.name ] = "incr"
				else
					data[ field.name ] = 0
					
			if _validation.notAllowedForValue? and value?

				if value is _validation.notAllowedForValue
					# it is not allowed to write this value
					@_handleError( cb, "value-not-allowed", field: field.name, value: _validation.notAllowedForValue )
					return
				else
					options._changedValues[ field.name ] = data[ field.name ]
					# if the not allowed value is saved in db it's not possible to overwite it.
					data[ field.name ] = "IF( #{field.name} != \"#{ _validation.notAllowedForValue }\", \"#{ value }\", #{field.name} )"


			# rules to be check after the return
			if options?.equalOldValueIgnore isnt true and _validation.equalOldValue is true and isUpdate is true# and value?
				# the field should exist
				if not value?
					@_handleError( cb, "validation-notequal-required", field: field.name )
					return
				# add a filter for the equal test. On return there has to be a check to detect the error based on the returning data.
				sql.filter( field.name, value )
				options._afterSave[ field.name ].checkEqualOld = true

			if _validation.fireEventOnChange? 
				options._afterSave[ field.name ].fireEventOnChange = _validation.fireEventOnChange

			if _validation.allreadyExistend?
				options._afterSave[ field.name ].allreadyExistend = _validation.allreadyExistend

			cb( null )
			return

	_generateNewID: ( id )=>
		if not id? 
			id = @config.createIdString()

		return id

	_getOptions: ( options, type )=>
		_opt = @extend(
			fields: "all"
		, options )

		return _opt


	_handleSingle: ( type, args..., cb )=>

		return ( err, results, meta )=>
			if err?
				cb( err )
				return

			if _.isArray( results )
				if type in [ "increment", "decrement", "del" ]
					if type is "del"
						[ _get, _save ] = results
					else
						[ _save, _get ] = results
					if not _save?.affectedRows
						@_handleError( cb, "not-found" )
						return

					results = _.last( _get )

				else if type in [ "mdel" ]
					[ _get, _save ] = results
					if not _save?.affectedRows
						cb( null, [] )
						return
					results = _get
				else
					results = _.first( results )

			switch type
				when "has"
					if results?.count >= 1
						cb( null, true )
					else
						cb( null, false )
				when "count", "increment", "decrement"
					if results?.count >= 1
						cb( null, parseInt( results?.count, 10 ) )
					else
						cb( null, 0 )

					@emit( type, null, @builder.convertToType( results ) )
				else

					if not results?
						@_handleError( cb, "not-found" )
						return

					#@emit type, id, results
					_ret = @builder.convertToType( results ) 
					cb( null, _ret )
					
					@emit( type, null, _ret )

			return

	_handleList: ( type, args..., cb )=>
		[ filter, opt, sql ] = args
		return ( err, results, meta )=>
			if err?
				cb( err )
				return

			if opt.fields in [ "idOnly", "idonly" ]
				cb( null, _.pluck( results, @sIdField ) )
			else
				#@emit type, id, results
				cb( null, @builder.convertToType( results ) )
			return

	_handleSave: ( type, id, data, options, sql, cb )=>
		return ( err, results )=>
			# check for a duplicate entry on a string id insert and retry
			if @hasStringId and not id? and err?.code is "ER_DUP_ENTRY" and err.message.indexOf( "PRIMARY" ) >= 0 and options?.insertRetry < @config.stringIdInsertRetrys
				@warning "detected double sting id insert, so retry", data[ @sIdField ]

				options.insertRetry++

				data[ @sIdField ] = @_generateNewID()

				_valData = 
					id: null
					data: data
					sql: sql
					options: options
				@_insert( _valData, cb )
				return

			else if err?.code is "ER_DUP_ENTRY"
				for _field, _val of options._afterSave when not _.isEmpty( _val )
					if err.message.indexOf( _val.allreadyExistend ) >= 0
						@_handleError( cb, "validation-already-existend", { field: _field, value: options?._changedValues?[ _field ] or data[ _field ] } )
						return
				cb( err )
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

		_new = @builder.convertToType( _new )

		_old = @builder.convertToType( _old ) if _old?

		# check id on insert
		if not id? and not @hasStringId and _saveMeta.insertId isnt _new.id
			@_handleError( cb, "wrong-insert-return" )

		for _field, _val of options._afterSave when not _.isEmpty( _val )
			if id? and _val.checkEqualOld? and _saveMeta.affectedRows is 0
				_errData =
					value: options?._changedValues?[ _field ] or data[ _field ]
					field:
						name: _field
				@_handleError( cb, "validation-notequal", { field: _field, curr: _old?[ _field ], value: _errData.value }, _errData )
				return

			if id? and _val.fireEventOnChange? and _old?[ _field ] isnt _new?[ _field ]
				@emit "#{ _field }.#{ _val.fireEventOnChange }", _old[ _field ], _new[ _field ], id

		if _saveMeta.affectedRows is 0
			@_handleError( cb, "not-found" )
			return

		@emit( "set", null, _new )

		cb( null, _new )

		return

	_wrapCallback: ( cb )=>
		if @config.returnFormat?
			return ( err, ret )=>
				if err?
					cb( @config.returnFormat( err ) )
					return

				if _.isArray( ret )
					_ret = for item in ret
						@config.returnFormat( null, item )
					cb( err, _ret )
				else
					cb( err, @config.returnFormat( null, ret ) )
				return
		else
			return cb

	# # Error message mapping
	ERRORS: =>
		@extend super, 
			"not-found": "Element not found"
			"deprecated-option": "You tried to use the deprecated option: `<%= key %>`"
			"invalid-filter": "A filter has of the .find()` method to be an object"
			"too-few-arguments": "To use the `.<%= method %>()` method you have to define at least `<%= min %>` arguments"
			"validation-required": "The field `<%= field %>` is required."
			"validation-notequal-required": "The field `<%= field %>` is required to do a validation equal the old value."
			"value-not-allowed": "It's not allowed to write the value `<%= value %>`to the field `<%= field %>`"
			"wrong-insert-return": "The select after the insert query returns the wrong row."
			"validation-notequal": "`equalOldValue` validation error. The value of `<%= field %>` do not match the current save value. You tried to save `<%= value %>` but `<%= curr %>` is necessary"
			"validation-already-existend": "The value `<%= value %>` for field `<%= field %>` already exists."
			"invalid-field": "The field `<%= field %>` is not defined for the method `<%= method %>`"
			"no-filter": "You have to define at least one valid filter"