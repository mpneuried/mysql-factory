#**templatefactory** is a module to load, compile and render EJS templates.
#
#To **init** it you have to add a code like @
#
#     myDM = new Datamodel( {  ... } )
#
#To **use** it do something like @
#
#     myDM.get 123, ( err, res )->

# ###import modules
sys = require( "sys" )
async = require( "async" )
moment = require('moment')
_ = require('lodash')._
_.string = require("underscore.string")
EventEmitter = require( "events" ).EventEmitter

utils = require( "../lib/utils" )

bcrypt = require( "bcrypt" )

redisHashPrefix = "modeldata:"
_timestampField = "_t"

# ## Superclass to manage templates
# ## Note !
# every public method will return a structure:  
# `{ success: true, data: { "data returned by method"  errorcode: "unique_error_code", msg: "Error Message" }`  
# the requested data will be returned through the `data` key.
class Datamodel extends EventEmitter
	
	tablename: "tablename"
	cachekey: null
	fields: {}
	relations: {}
	sIdField: "id"
	hasStringId: false
	autoinit: true
	
	defaultGetOptions:
		fields: "all"
	
	# ### constructor
	# #### *extends the node.js EventsEmitter*  
	# **constructor to handle default options**  
	# **settings:** { Object } *Settings object:*  
	#  
	# - **connector**: *TODO*  
	constructor: ( settings ) ->
		@settings = settings
		@init()
	# ### init 
	# *TODO*
	init:->
		
		@connector = @settings.connector if @settings.connector
		@tablename = @settings.tablename if @settings.tablename
		@cachekey = "#{ redisHashPrefix }#{ @settings.tablename }:" if @settings.useRedisCache
		@sIdField = @settings.sIdField if @settings.sIdField
		@fields = @settings.fields if @settings.fields
		@relations = @settings.relations if @settings.relations
		@factory = @settings.factory if @settings.factory
		if _.isBoolean( @settings.hasStringId ) and @settings.hasStringId
			@hasStringId = true
		else
			@hasStringId = false
		
		if _.isBoolean( @settings.useFieldsets ) and @settings.useFieldsets
			@useFieldsets = true
		else
			@useFieldsets = false
		

		@redis = null
		
		@_initFields()

		# init sorting
		if @settings.sortfield?
			@sortfield = @_reduceSortFields( @settings.sortfield )
			@sortdirection = @settings.sortdirection.toUpperCase() or "ASC"
		
		@_loadIDs()
		
		@oIdField = @fields[ @sIdField ]

		@emit( "loaded" )
	
	# ### get 
	# *get data form model*    
	# **id:** { Number } *id to get*  
	# **callback:** { Function|String } *callbackfunction*  
	# **options:** { Object }[opt.] *special options for getting element*  
	get: ( id, callback, options )->
		# set default options
		options = _.extend( { type: "get", forceDBload: false, _customQueryEnd: "" }, @defaultGetOptions, options ) 
		filter = {}
		
		fnGet = ( filter, callback, options )->
			filterReturn = @_generateFilter( filter )
			
			sStatement = "SELECT #{ @_getFields( options.fields ).join( ", " ) } FROM #{ @tablename } #{ filterReturn.filter } #{ options._customQueryEnd }"
			
			@connector.query( sStatement, filterReturn.args, _.bind( @_singleReturn, @, options, filter, callback ) )

		if @settings.useRedisCache and @cachekey and not options.forceDBload
			@redis.get @cachekey + id, ( err, res )=>
				if res is null
					filter[ @sIdField ] = id
					fnGet.call( @, filter, callback, options )
				else
					@_generalReturnObject( 0, callback, JSON.parse( res ), options.type )
		else
			if _.isArray( @sIdField ) and not( _.isString( id ) or _.isNumber( id ) )
				fnGet.call( @, id, callback, options )
			else if _.isString( id ) or _.isNumber( id )
				filter[ @sIdField ] = id
				fnGet.call( @, filter, callback, options )
			else
				@_generalReturnObject( "wrong-id-type", callback, id, options.type )
		return
	
	# ### mget 
	# *get multiple elements* 
	# **aIds:** { Array } *Array of id"s to get*  
	# **RETURN.data** { Array }: array of element data"s or "null" if no element will be found
	mget: ( aIds, callback, options)->
		# set default options
		options = _.extend( { type: "mget", _customQueryEnd: "" }, @defaultGetOptions, options )
		filter = {}

		if aIds and aIds.length
			filter[ @sIdField ] = aIds
			filterReturn = @_generateFilter( filter )
			
			sStatement = "SELECT #{ @_getFields( options.fields ).join( ", " ) } FROM #{ @tablename } #{ filterReturn.filter } #{ @_getSorting( options ) } #{ @_getLimiterStatement( filter ) } #{ options._customQueryEnd }"

			@connector.query( sStatement, filterReturn.args, _.bind( @_multiReturn, @, options, aIds, callback ) )
		else
			@_generalReturnObject( "passed-empty", callback, [], options.type )
		return
	
	# ### getRel 
	# *TODO* 
	# **id:** { String|Number } *Array of id"s to get*  
	# **relation** { String }: *TODO*
	# **callback** { Function }: *TODO*  
	# **options** { Object }: *TODO*
	getRel: ( id, relation, callback, options)->
		options = _.extend( { type: "getrel" }, @defaultGetOptions, options )
		oRelation = @_getRelation( relation )
		if oRelation
			oRelation.get( id, callback )
		else
			@_generalReturnObject( "relation-notfound", callback, { id: id , relation: relation }, options.type )
		return

	# ### has 
	# check if a id is available
	# **id:** { Number } *id to get*  
	has: ( id, callback, options )->
		options = _.extend( { type: "has" }, @defaultGetOptions, options )
		# set default options
		filter = {}
		filter[ @sIdField ] = id
		@count( filter, callback, options )
		return
	
	# ### count 
	# count data by filter object
	# **filter:** { Object } *key = tuple to filter, value= value to filter for*
	count: ( filter, callback, options)->
		# set default options
		options = _.extend( { type: "count", _customQueryEnd: "" }, @defaultGetOptions, options )
		filter or= {}

		filterReturn = @_generateFilter( filter )
		
		sStatement = "SELECT COUNT( #{ @sIdField } ) AS count FROM #{ @tablename } #{ filterReturn.filter } #{ options._customQueryEnd }"
		
		@connector.query( sStatement, filterReturn.args, _.bind( @_countReturn, @, options, filter, callback ) )
		return

	# ### find 
	# find data by filter object
	# **filter:** { Object } *key = tuple to filter, value= value to filter for*
	find: ( filter, callback, options)->
		# set default options
		options = _.extend( { type: "find", _customQueryEnd: "" }, @defaultGetOptions, options )
		
		if options._customQueryFilter?
			filterReturn = options._customQueryFilter( filter )
		else
			filterReturn = @_generateFilter( filter )
		
		sStatement = options._customQueryFind or "SELECT #{ @_getFields( options.fields ).join( ", " ) } FROM #{ @tablename } #{ filterReturn.filter } #{ @_getSorting( options ) } #{ @_getLimiterStatement( filter ) } #{ options._customQueryEnd }"
		
		@connector.query( sStatement, filterReturn.args, _.bind( @_multiReturn, @, options, filter, callback ) )
		return
	
	# ### search 
	# *search through columns defined with search = true* 
	# **term:** { String } *term to search for*
	search: ( term, filter, callback, options)->
		# set default options
		options = _.extend( { type: "search", _customQueryEnd: "" }, @defaultGetOptions, options )
		filter or= {}

		filterReturn = @_generateFilter( filter )
		filterReturnSearch = @_generateSearchFilter( term, filterReturn.args, !filterReturn.filter.length )
		
		sStatement = "SELECT #{ @_getFields( options.fields ).join( ", " ) } FROM #{ @tablename } "
		if filterReturn.filter.length
			sStatement += filterReturn.filter
			sStatement += " AND ( 1=0 "

		sStatement += filterReturnSearch.filter
		if filterReturn.filter.length
			sStatement += " )"

		if options._customQueryEnd.length
			sStatement += " #{ @_getSorting( options ) } #{ @_getLimiterStatement( filter ) } #{ options._customQueryEnd }"
		
		@connector.query( sStatement, filterReturnSearch.args, _.bind( @_multiReturn, @, options, term, callback ) )
		return
	
	# ### set 
	# set or create a new element  
	# if no id is pass a new Element will be created.
	# **id:** { Number }[opt.] *id to set*
	# **data:** { Number } *id to set*
	set: ( id, data, callback, options )->
		# set default options
		filter = {}
		args = []
		aRelationKeys = @_getRelationKeys()
		isUpdate = false

		if arguments.length is 2
			callback = data
			data = id
			id = null
			options = {}
			
		else if arguments.length is 3 and ( _.isString( callback ) or _.isFunction( callback ) )
			options = {}
			isUpdate = true
		
		else if arguments.length is 3 and ( _[ if @hasStringId then "isString" else "isNumber" ]( id ) )
			isUpdate = true

		else if arguments.length is 3
			isUpdate = false
			options = callback
			callback = data
			data = id
			id = null
		
		else if arguments.length is 4 and id
			isUpdate = true
		

		options = _.extend( { type: "set" }, @defaultGetOptions, options )
		
		@validate isUpdate, id, data, callback, options, ( data )=>
			if isUpdate

				# do an update
				dataReturn = @_generateSetOrUpdate( false, data, args )
				args = dataReturn.args
				
				if _.isNumber( id ) or _.isString( id )
					filter[ @sIdField ] = id
				else
					filter = id
				
				filterReturn = @_generateFilter( filter, args )
				args = filterReturn.args

				sStatement = options._customQueryUpdate or "UPDATE #{ @tablename } #{ dataReturn.statement } #{ filterReturn.filter }"

				@connector.query( sStatement, args, _.bind( @_setReturn, @, options, filter, callback ) )
				# TODO add relation remove and save
				
			else
				# do a create
				

				# define insert function
				fnInsert = ( data )=>
					aDataKeys = _.keys( data )
					aRelDataKeys = _.intersection( aRelationKeys, aDataKeys )
					
					if _.isArray( @sIdField )
						for idKey of @sIdField
							filter[ idKey ] = data[ idKey ] if filter[ idKey ] = data[ idKey ]
					else if data[ @sIdField ]
						filter[ @sIdField ] = data[ @sIdField ]

					# only pass data witch is not a relation
					dataReturn = @_generateSetOrUpdate true, _.reduce( data, ( memo, obj, key )->
						memo[ key ] = obj if _.indexOf( aRelDataKeys, key ) < 0
						memo
					, {} )
					
					sStatement = "INSERT INTO #{@tablename}" + dataReturn.statement
					args = dataReturn.args
					
					if aRelDataKeys.length
						fnSeriesCall = {}
						fnSeriesCall[ @tablename ] = ( cb )=>
							@connector.query sStatement, args, _.bind( @_setReturn, @, options, filter, ( err, res )->
								cb( err, res )
							)
						
						for relkey, idx in aRelDataKeys
							if @_hasRelation( relkey )
								fnSet = @_getRelation( relkey ).set
								if fnSet
									fnSeriesCall[ relkey ] = ( cb )=>
										fnSet id[ @sIdField ], data[ relkey ], ( err, res )->
											cb( err, res )									
						
						async.series fnSeriesCall, ( err, res )=>
							oReturn = {}
							if !err
								oReturn = res[ @tablename ]
								delete res[ @tablename ]
								callback err, _.extend( oReturn, _.reduce( res, ( memo, obj, key )->
									memo[ key ] = obj if key isnt @tablename
									memo 
								,@ ) ) 
							else
								callback( err, res )
					else
						@connector.query( sStatement, args, _.bind( @_setReturn, @, options, filter, callback ) )
				
				if @hasStringId
					@_generateNewID data[ @sIdField ], ( newId )=>
						data[ @sIdField ] = newId
						filter[ @sIdField ] = newId
						fnInsert( data )
				else
					fnInsert( data )
		return
	
	# ### del 
	# delete a element
	# **id:** { Number } *id to delete*
	# **RETURN.data** { Number }: id of the element witch will be deleted
	del: ( id, callback, options)->
		# convert delete filter for timestamp and flat id 
		if ( _.isNumber( id ) or _.isString( id ) )
			id = 
				id: id

		# set default options
		options = _.extend( { type: "del", useValidation: false }, @defaultGetOptions, options )
		#get old data before delete the current row
		@get id.id, ( err, res )=>
			if not err
				options.data2del = [ res ]
				@mdel( id, callback, options )
			else
				@_generalReturnObject( "notfound", callback, res, options.type )
			return
		return
	
	# ### mdel 
	# delete multiple elements
	# **aIds:** { Array } *an Array of elements to delete*
	# **RETURN.data** { Array }: an Array of elements witch will be deleted
	mdel: ( filter, callback, options )->
		# set default options
		options = _.extend( { type: "mdel", data2del: null, useValidation: true }, @defaultGetOptions, options )
		filter or= {}
		filterSave = utils.extend( true, {}, filter )

		fnDel = ( filter, callback, options )=>
			if filter
				
				#function to run delete
				fnQueuryDel = ( oFilter )=>
					if options._customQueryFilter?
						filterReturn = options._customQueryFilter( filter )
					else
						filterReturn = @_generateFilter( filter )
					sStatement = "DELETE FROM #{ @tablename } #{ filterReturn.filter }"
					@connector.query( sStatement, filterReturn.args, _.bind( @_delReturn, @, options, oFilter, callback ) )

				#define filter through all possible options
				oFilter = {}
				if _.isArray( filter )
					if filter.length > 1
						oFilter[ @sIdField ] = filter
					else if filter.length is 1
						oFilter[ @sIdField ] = filter[ 0 ]
				
				else if _.isString( filter ) or _.isNumber( filter ) or _.isBoolean( filter )
					oFilter[ @sIdField ] = filter
				else 
					oFilter = filter
				
				if oFilter.id isnt undefined and @_hasField( _timestampField )
					if options.useValidation
						validation = @_validateField( @_getField( _timestampField ), oFilter[ _timestampField ], options.data2del[ 0 ][ _timestampField ], true, oFilter.id, options, callback )
					
					if not options.useValidation or validation.success
						fnQueuryDel( oFilter )
					else
						return
				else
					fnQueuryDel( oFilter )
					console.log "!WARNING! DELETE without id!", filter, options.data2del if oFilter.id is undefined
 				
			else
				@_generalReturnObject( "passed-empty", callback, [], options.type )
			return
		
		
		if not options.data2del
			@find filter, ( err, res )=>
				if not err and res.length
					options.data2del = res
					fnDel( filterSave, callback, options )
				else if not err
					@_generalReturnObject( "notfound", callback, res, options.type )
				else
					callback( err, res )
				return
		else
			fnDel( filter, callback, options )
		return
	
	# ### increment 
	# increment a numeric column by 1
	# **id:** { Number }[opt.] *id to set*
	# **column:** { String } *the column to in/decrement*
	# **callback:** { Function|String } *callbackfunction*  
	# **options:** { Object }[opt.] *special options for getting element*  
	increment: ( id, column, callback, options)->
		options = _.extend( { type: "increment" }, @defaultGetOptions, options )
		# call basic crement method
		@_crement( id, column, 1, callback, options )
		return
	
	# ### decrement 
	# increment a numeric column by 1
	# **id:** { Number }[opt.] *id to set*
	# **column:** { String } *the column to in/decrement*
	# **callback:** { Function|String } *callbackfunction*  
	# **options:** { Object }[opt.] *special options for getting element*  
	decrement: ( id, column, callback, options)->
		options = _.extend( { type: "increment" }, @defaultGetOptions, options )
		# call basic crement method
		@_crement( id, column, -1, callback, options )
		return

	# ### _crement 
	# add or substract a numeric value to a number column
	# **id:** { Number }[opt.] *id to set*
	# **column:** { String } *the column to in/decrement*
	# **value:** { number } *the value to add*
	# **callback:** { Function|String } *callbackfunction*  
	# **options:** { Object }[opt.] *special options for getting element*  
	_crement: ( id, column, value, callback, options)->
		options = _.extend( { type: "_crement" }, @defaultGetOptions, options )

		# define options and filter
		options.column = column 
		filter = {}
		filter[ @sIdField ] = id if id
		filterReturn = @_generateFilter( filter )

		# check value for valid number
		value = parseInt( value, 10 )
		if not _.isNumber( value )
			# return an error
			@_generalReturnObject( "not-a-numbervalue", callback, [], options.type )

		# check if column is a number field
		field = @_getField( column )
		if field and field.type is "number"
			# generate statement to add or substract the field
			sStatement = "UPDATE #{ @tablename } SET #{ column } = #{ column } + #{ value } #{ filterReturn.filter }"
			@connector.query sStatement, filterReturn.args, ( err, res )=>
				if not err
					# on successfull de/increment read the current value
					filterReturn = @_generateFilter( filter )
					sStatement = "SELECT #{ column } AS count FROM #{ @tablename } #{ filterReturn.filter }"
					@connector.query( sStatement, filterReturn.args, _.bind( @_countReturn, @, options, filter, callback ) )
				else
					@_generalReturnObject( "sql-error", callback, [], options.type )
				return
		else
			# return an error
			@_generalReturnObject( "not-a-numberfield", callback, [], options.type )

		return
	
	validate: ( isUpdate, id, data, callback, options, fn )->
		fnValidate = ( oldData = {} )=>
			aErrors = []
			aCheckFns = []
			for fieldname, field of @fields
				aCheckFns.push _.bind(
					@_validateField,
					@,
					field,
					( if data and data[ fieldname ] isnt undefined then data[ fieldname ] else null ),
					( if isUpdate and oldData and oldData[ fieldname ] isnt undefined then oldData[ fieldname ] else null ),
					isUpdate,
					id,
					options
				)
			
			async.parallel aCheckFns, ( err, validations )=>

				for validation in validations when validation isnt null
					data[ validation.field.name ] = validation.value if validation.value isnt null
					aErrors.push( validation ) if not validation.success

				if aErrors.length
				#	@_generalReturnObject( "validation-required", callback, field.name, null )
					error = _.first( aErrors )
					_err = 
						message: "this value already exists"
						field: error.field.name
						data: error
						success: false

					@_generalReturnObject( error.type , callback, _err , null )
				else
					fn( data )
				return

			return
		
		if isUpdate and id
			useGet = _.isNumber( id ) or _.isString( id )
			@[ if useGet then "get" else "find" ] id, ( err, res )=>
				if not err
					fnValidate( if useGet then res else res[ 0 ] )
				else
					@_generalReturnObject( "notfound", callback, res, options.type )
		else
			fnValidate( null )

		return
	
	# ## private methods


	# ### _validateField 
	# validate a field
	# **field:** { String } *name of the field*
	# **value:** { any } *value to validate*
	# **RETURN** { Object }: the corrected data element
	_validateField: ( field, value, oldValue, isUpdate, id, options, cba )->
		
		#convert data
		try #prevent converting from throwing errors
			switch field.type
				when "string"		then value = value.toString()		if value isnt null and not _.isString( value )
				when "boolean"
					if value isnt null
						if value is false or value < 1 or value.length < 1
							value = false
						else
							value = true
				when "number"		then value = parseInt( value, 10 )	if value isnt null and not _.isEmpty( value ) and not _.isNumber( value )
				when "timestamp"	then value = parseInt( value, 10 )	if value isnt null and not _.isEmpty( value ) and not _.isNumber( value )
				# TODO implement a functional date converter
				when "date"
					if _.isDate( value )
						value = value.toISOString()
					else if _.isDate( ( _m = moment( value, [ "YYYY-MM-DD", "DD.MM.YYYY", "YYYY-MM-DD HH:mm" ] ) )._d )
						value = _m.format( "YYYY-MM-DD HH:mm" )

				when "json"
					if value? and not ( _.isString( value ) or _.isNumber( value ) or _.isBoolean( value ) )
						try
							value = JSON.stringify( value )
						catch error
							cba null, { value: value, success: false, field: field, type: "validation-jsonerror" }
							return
		catch error

		#validate data
		asyncChecks = []
		for rulename, rule of field.validation
			if rulename is "isRequired" and rule and value is undefined
				cba null, { value: value, success: false, field: field, type: "validation-required" }
				return
			
			if not options?.equalOldValueIgnore
				if rulename is "equalOldValue" and rule and isUpdate and value isnt oldValue
					cba null, { value: value, success: false, field: field, type: "validation-notequal" }
					return
			
			if rulename is "bcrypt" and rule and value
				salt = bcrypt.genSaltSync( rule.rounds or 8 )
				value = bcrypt.hashSync( value, salt)

			if rulename is "setTimestamp" and rule
				value = "UNIX_TIMESTAMP()*1000"

			if rulename is "allreadyExistend" and rule and value and value isnt oldValue
				if not options?.allreadyExistendNoCase?
					asyncChecks.push "allreadyExistend"
				else if value?.toLowerCase() isnt oldValue?.toLowerCase()
					asyncChecks.push "allreadyExistend"

			if rulename is "notAllowedForValue" and rule and value and value isnt oldValue and value is rule
				cba null, { value: value, success: false, field: field, type: "value-not-allowed" }
				return

			if rulename is "fireEventOnChange" and rule and value isnt oldValue
				@emit( field.name + "." + rule, oldValue, value, id )
				
			else if rulename is "incrementOnSave" and rule
				if _.isNumber( oldValue ) then value = ++oldValue else value = 0

		
		if asyncChecks.length

			fnA = []

			for asyncCheck in  asyncChecks
				switch asyncCheck
					when "allreadyExistend"
						fnA.push _.bind( ( value, field, cba )->
							_filter = {}
							_filter[ field.name ] = value

							@count _filter, ( err, cRet )=>
								if err 
									cba( err )
								else if cRet.count > 0
									cba( { value: value, success: false, field: field, type: "validation-already-existend" } )
								else
									cba( null )
								return
							return
						@, value, field ) 

			async.parallel fnA, ( err )=>
				if err
					cba null, err
				else
					cba null, { value: value, success: true, field: field }
				return
		else
			cba null, { value: value, success: true, field: field }
		return
		
	
	_initFields: ->

		if @useFieldsets
			@fieldsets = {}	
			for fieldname, field of @fields
				if field.fieldsets
					for fieldsetname in field.fieldsets
						@fieldsets[ fieldsetname ] = [] if not @fieldsets[ fieldsetname ]?
						@fieldsets[ fieldsetname ].push( fieldname )
		else
			@fieldsets = null

		for fieldname, relation of @relations
			relModel = null
			relation.get = null
			relation.set = null
			switch relation.type
				when "rel_1"
					relModel = @factory.get( relation.relModel )
					relation.get = ( id, callback )=>
						@get id, ( err, res )=>
							relModel.get( res[ relation.field ], callback ) unless err
				when "rel_n"
					relModel = @factory.get( relation.relModel )
					relation.get = ( id, callback )=>
						forignRel = relModel._getRelation( relation.relation )
						oFilter = {}
						oFilter[ forignRel.field ] = id
						relModel.find( oFilter, callback )
				when "rel_nm"
					relModelBase = @factory.get( relation.relModel )

					for relfieldname, relfield of relModelBase.settings.fields
						if relation.foreignfield is relfieldname
							
							relModel = @factory.get( relfield.relModel )
							relation.get = ( id, callback )=>
								oFilter = {}
								oFilter[ relfieldname ] = {}
								oFilter[ relfieldname ].val = id
								oFilter[ relfieldname ].reltable = relModelBase.settings.tablename
								oFilter[ relfieldname ].foreignfield = relfield.foreignfield
								relModel.find( oFilter, callback )
								return
							
							relation.set = _.bind( ( id, aData, callback )->
								aSetfn = []

								for val, idx in aData
									data = {}
									data[ relfieldname ] = val
									data[ relfield.foreignfield ] = id
									
									# generate a array of callbacks to run them via async
									aSetfn.push ( cb )=>
										relModelBase.set data, ( err, res )->
											cb( err, res )
											return
										return
									
								async.parallel( aSetfn, callback )
								return
							 @ )

	_loadIDs: ->
		# TODO: Load id"s to local cache to pervent double id"s
		
		# preload cache 
		if @cachekey
			@find {}, ( err, aData )=>
				if not err
					redMulti = []
					for data in aData
						redMulti.push( [ "set", @cachekey + data[ @sIdField ], JSON.stringify( data ) ] )
					@redis.multi( redMulti ).exec()
				return

				
	_generateNewID: ( id, callback )->
		# TODO: generate a new String ID
		if arguments.length <= 1
			callback = id
			id = null
		
		if id
			sId = id
		else
			if @settings.createIdString? and _.isFunction( @settings.createIdString )
				sId = @settings.createIdString()
			else
				sId = utils.randomString( 5 )
		
		@has sId, ( err, res )=>
			if !err and !res
				callback( sId )
			else
				@_generateNewID( callback )
		return	
	
	_singleReturn: ( options, id, callback, err, result, meta)->
		if not err
			result = if result.length then result[ 0 ] else null
			result = @_postProcess( result )
			result = @_generateReturnObject ( if result is null then "notfound" else 0 ), result
			# only set cache if request was successful and all fields were requested 
			if @cachekey and result.success and options.fields is "all"
				if _.isString( id ) or _.isNumber( id )
					@redis.set( @cachekey + id, JSON.stringify( result.data ) )
				else if id[ @sIdField ]
					@redis.set( @cachekey + id[ @sIdField ], JSON.stringify( result.data ) )

			@_generalReturn( callback, result, options.type )
		else
			@_generalReturnObject( 'sql-error', callback, err, options.type )
		return
	
	_multiReturn: ( options, id, callback, err, result, meta)->
		if not err
				#result = 	if result.length then result else null
			for val, idx in result
				val = @_postProcess( val )
			
			if @cachekey and result and result.length and options.fields is "all"
				for val, idx in result
					@redis.set( @cachekey + val[ @sIdField ], JSON.stringify( val ) )

			if result isnt null and options.fields is "idonly"
				resHelp = [] 
				for val in result
					resHelp.push( val[ @sIdField ] )
				result = resHelp

			result = @_generateReturnObject ( if result is null then "notfound" else 0 ), result 
			@_generalReturn( callback, result, options.type )
		else
			@_generalReturnObject( 'sql-error', callback, err, options.type )
		return
	
	_countReturn: ( options, id, callback, err, result, meta)->
		if not err
			if options.type is "has"
				if result and result.length and result[ 0 ].count > 0
					result = true
				else
					result = false
			
			else
				if result and result.length and result[ 0 ].count isnt undefined
					result = result[ 0 ]
				else
					result = 
						count: 0 

				if _.string.include( options.type, "crement" )
					result = 
						version: result.count
						column: options.column
						id: id.id

			result = @_generateReturnObject ( result is null ? "notfound" : 0 ), result
			@_generalReturn( callback, result, options.type )
		else
			@_generalReturnObject( 'sql-error', callback, err, options.type )
		return
	
	_setReturn: ( options, filter, callback, err, result, meta )->
		if not err
			if meta.insertId
				# handle after insert
				@get( meta.insertId, callback, { type: options.type, fields: "all", forceDBload: true } )
			else if meta.affectedRows >= 1 and ( if _.isArray( @sIdField ) then filter else filter[ @sIdField ] )
				# handle after insert
				@get( ( if _.isArray( @sIdField ) then filter else filter[ @sIdField ] ), callback, { type: options.type, fields: "all", forceDBload: true } )
			else
				# handle after update
				if meta.affectedRows >= 1
					@find( filter, callback, { type: options.type, fields: "all" } )
				else
					result = @_generateReturnObject( "notfound", result )
					@_generalReturn( callback, result, options.type )
		else
			@_generalReturnObject( 'sql-error', callback, err, options.type )
		return 
	
	_delReturn: ( options, filter, callback, err, result, meta )->
		if not err
			if meta.affectedRows >= 1
				args = []
				if _.isArray( filter[ @sIdField ] )
					for sId in filter[ @sIdField ]
						args.push @cachekey + sId.replace( /"/g, "" )
				else
					args.push @cachekey + filter[ @sIdField ]
				
				@redis.del.apply( @redis, args )
				@_generalReturnObject( 0, callback, options.data2del, options.type )
			else
				@_generalReturnObject( "notfound", callback, result, options.type )
		else
			@_generalReturnObject( 'sql-error', callback, err, options.type )
		return
	 
	_generalReturn: ( callback, result, type )=>
		err = null
		if not result.success
			err = 
				errorcode: result.errorcode
				msg: result.msg
				data: result.data
			err.field = result.data.field if result.data?.field?

		if _.isFunction( callback )
			callback( err, result.data )
		else if _.isString( callback )
			@emit( type + "." + callback, err, result )

		@emit( type, err, result )
		return
	
	_generateReturnObject: ( errorcode, result )=>
		oReturn = {}
		if errorcode
			oReturn = 
				success: false
				errorcode: errorcode
				msg: @ERRORS[ errorcode ] or ( if result and result[ 'message' ] then result[ 'message' ] else result )
				data: if result is undefined then null else result

		else
			oReturn =
				success: true
				errorcode: null
				msg: null
				data: result

		return oReturn
	
	_generalReturnObject: ( errorcode, callback, result, type )=>
		@_generalReturn( callback, @_generateReturnObject( errorcode, result ), type )
	

	_postProcess: ( result )=>
		if _.isArray( result )
			@_postProcess( resultEl ) for resultEl in result
		else
			for fieldname, field of @fields when result and result[ fieldname ]
				result[ fieldname ] = @_postProcessField( field, result[ fieldname ] )
		result
	
	_postProcessField: ( field, value )=>
		try #prevent converting from throwing errors
			switch field.type
				when "string"		then value = value.toString()		if value isnt null and not _.isString( value )
				when "boolean"
					if value is false or value < 1 or value.length < 1
						value = false
					else
						value = true
				when "number"		then value = parseInt( value, 10 )	if value isnt null and not _.isNumber( value )
				when "timestamp"	then value = parseInt( value, 10 )	if value isnt null and not _.isNumber( value )
				# TODO implement a functional date converter
				# when "date"			then value = new Date( value ).toString()	if not _.isDate( value )
				when "json"
					if value isnt null and ( _.isString( value ) or _.isNumber( value ) or _.isBoolean( value ) )
						value = JSON.parse( value )
		catch error
			console.log "Convert Error", error
		value
		

	# ### _generateFilter 
	# generate a filter String
	# **filter:** { Object } *Filterobject*
	# **RETURN** { Object }: { filter: "mySQL Filter String", args: [ "filter", "args" ] }
	_generateFilter: ( filter, args = [])->
		oReturn = { filter: "", args: args }
		isFirstWhere = true
		
		for field, val of filter
			# oField = @_getField( field ) # currently not necessary 
			# check for valid field
			if @_hasField( field )

				if isFirstWhere
					oReturn.filter += "WHERE #{ field } "
					isFirstWhere = false
				else
					oReturn.filter += "AND #{ field } "

				if _.isObject( val ) and val.val? and val.operator?
					oReturn.filter += "#{ val.operator } ? "
					oReturn.args.push( val.val )
				else if _.isArray( val )
					oReturn.filter += "IN (?) "
					oReturn.args.push( val )
				else if val and val.reltable isnt undefined
						oReturn.filter += "IN ( SELECT #{ field } FROM #{ val.reltable } WHERE #{val.foreignfield} IN (?) ) "
						oReturn.args.push( val.val )
				else
					oReturn.filter += "= ? "
					oReturn.args.push( val )
		oReturn
	
	_generateSearchFilter: ( term, args = [], isFirstWhere = true )->
		oReturn = { filter: "", args: args }
		aSearchFields = @_getFields ( field )-> not not field.search

		for field in aSearchFields
			if isFirstWhere
				oReturn.filter += "WHERE #{ field.name } "
				isFirstWhere = false
			else
				oReturn.filter += "OR #{ field.name } "

			oReturn.filter += " LIKE \"%#{ term }%\" "
		
		oReturn
	
	
	_generateSetOrUpdate: ( isCreate, data, args = [] )->
		oReturn = { statement: "", args: args }
		isFirstSet = true
		sFields = ""
		sValues = ""
		
		if isCreate
			oReturn.statement = ""
		else
			oReturn.statement = " SET "
		for field, val of data
			# oField = @_getField( field ) # currently not necessary 
			# check for valid field
			
			if @_hasField( field ) and not ( field is @sIdField and not ( @hasStringId and isCreate ) )
				# only add a UPDATE statement of the field if it exists and is not the id-field 
				if isFirstSet
					isFirstSet = false
				else
					if isCreate
						sFields += ", "
						sValues += ", "
					else
						oReturn.statement += ", "

				if isCreate
					sFields += field
					sValues += "?"
				else
					oReturn.statement += field + " = ? "

				oReturn.args.push( val )
		
		oReturn.statement += "(" + sFields + ") " + "VALUES (" + sValues + ") " if isCreate
		
		oReturn
	
	
	_getRelationKeys: ->
		_.keys( @relations )
	
	
	_getRelation: ( relation )->
		@relations[ relation ] or null
	
	
	_hasRelation: ( relation )->
		if @relations[ relation ] then true else false
	
	
	# ### _getFields
	# get all fields or fields filtered by a function.   
	# **fnFilter:** { Function } *function to filter the fields*
	# **RETURN.data** { Array }: an Array of fieldnames
	_getFields: ( fnFilter = "all" )->
		if fnFilter and _.isFunction( fnFilter )
			_.pluck( _.filter(@fields, fnFilter ), "name" )
		else
			if @useFieldsets and _.isString( fnFilter ) and _.string.startsWith( fnFilter, "set:" )
				setName = fnFilter.replace( "set:", "" )
				if @fieldsets[ setName ]?
					@fieldsets[ setName ]
				else
					[]
			else if _.isString( fnFilter ) and fnFilter is "all"
				_.keys(@fields)
			else if _.isString( fnFilter ) and fnFilter is "idonly"
				[ @sIdField ]
			else if _.isArray( fnFilter )
				_.intersection( _.pluck( @fields, 'name' ), fnFilter )
			else if _.isString( fnFilter )
				fnFilter.split( ',' )
	
	_getField: ( field )->
		@fields[ field ] or null
	
	
	_hasField: ( field )->
		if @fields[ field ] then true else false
	
	_reduceSortFields: ( sortfield )=>
		if sortfield?
			_sF = if sortfield? and _.isArray( sortfield ) then sortfield else sortfield.split( "," )
		else
			_sF = @sortfield
		return _.intersection( _sF, @_getFields() )
		

	_getSorting: ( options )=>
		field = null
		dir = @sortdirection or "ASC"
		dir = options.sortdirection.toUpperCase() if options.sortdirection? and _.include( [ 'ASC', 'DESC' ], options.sortdirection.toUpperCase() )

		field = @_reduceSortFields( options.sortfield )
		if field?.length
			"ORDER BY #{ field.join( ", " ) } #{ dir }"
		else
			""
	
	# ### _generateFilter 
	# generate a LIMIT filter. if limit is set in options, its possible to define a offset
	# **filter:** { Object } *Options object. Relevant keys are `offset` and `limit`*  
	# **RETURN** { String }: *SQL-statement fragment for limit method*  
	_getLimiterStatement: ( options )=>
		limit = options.limit or null
		offset = options.offset or null

		params = []

		# add offset value
		params.push( offset ) if offset 
		if limit
			params.push( limit )
		else
			# if no limit is defined ignore the offset value
			""
		
		# generate the LIMIT statement
		if params.length
			"LIMIT #{ params.join( ", " ) }"
		else
			""
	
	ERRORS: 
		"notfound": "Dataset not found"
		"relation-notfound": "Relation not found or defined"
		"passed-empty": "You have passed a empty data"
		"not-a-numberfield": "The passed column is not defined or not type of number"
		#"not-a-numberfield": "The passed value is not type of number"


####export the constructor 
exports.Datamodel = Datamodel
