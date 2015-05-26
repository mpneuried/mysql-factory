# import the external modules
mysql = require 'mysql'
utils = require './utils'
moment = require('moment')
_ = require('lodash')._

# # SQLBuilder
# ### extends [Basic](basic.coffee.html)

# return a method to prdefine the options fro all Instances
module.exports = ( options, escape = mysql.escape )->
	
	# Helper to generate the sql statements
	return class SQLBuilder extends require( "./basic" )

		# define the defaults
		defaults: =>
			@extend super,
				# **fields** *String* MySQL default fields
				fields: ["*"]
				# **limit** *Number* MySQL default limit
				limit: 1000
				# **standardFilterCombine** *String* Standard where expression
				standardFilterCombine: "AND"
				# **dateFormats** *String[]* An Array of date formats for date parsing
				dateFormats: [ "YYYY-MM-DD HH:mm:ss.SSSZZ", "YYYY-MM-DD HH:mm:ssZZ", "YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD HH:mm", "DD.MM.YYYY", "YYYY-MM-DD" ]

		###	
		## constructor 

		`new SQLBuilder( _c )`
		
		A SQL Builder instance to generate SQL statements

		@param {Object} _c Basic internal config data. Used to clone a Instance
		###
		constructor: ( @_c = {} )->

			# set some internal keys
			@_c.attrs or= []
			@_c.attrKeys or= []
			@_c.attrNames or= []
			@_c.attrsArrayKeys or= []
			@_c.fieldsets or= {}
			@_c.fieldlist or= []
			@_c.joins or= []

			super( options )
			return

		###
		## initialize
		
		`sql.initialize()`
		
		Initialize the SQLBuilder ánd define the properties

		@api private
		###
		initialize: =>
			@define( "table", @getTable, @setTable )

			@define( "idField", @getIdField, @setIdField )

			@define( "attrs", @getAttrs, @setAttrs )

			@getter( "attrKeys", @getAttrKeys )

			@getter( "attrArrayKeys", @getArrayAttrKeys )

			@define( "fields", @getFields, @setFields )

			@getter( "fieldNames", @getFieldNames )

			@define( "usefieldsets", @getUseFieldsets, @setUseFieldsets )

			@define( "limit", @getLimit, @setLimit )

			@getter( "orderby", @getOrderBy )

			@define( "orderfield", @getOrderField, @setOrderField )

			@define( "forward", @getForward, @setForward )

			@getter( "where", @getWhere )

			@getter( "joins", @getJoins )

			@getter( "hasJoins", @hasJoins )

			@getter( "isFiltered", @hasFilter )

			@define( "defaultLimit", @getDefaultLimit, @setDefaultLimit )

			@log "debug", "initialized"

			return

		# # Public methods
		
		###
		## clone
		
		`sql.clone()`
		
		Clone the current state of the SQLBuilder
		
		@return { SQLBuilder } The cloned Instance
		
		@api public
		###
		clone: =>
			@log "debug", "run clone"
			return new SQLBuilder( JSON.parse( JSON.stringify( @_c ) ) )

		###
		## insert
		
		`sql.insert( attributes )`
		
		Create a insert statement
		
		@param { Object } attributes Attributes to save 
		
		@return { String } Insert statement 
		
		@api public
		###
		insert: ( attributes )=>

			attributes = @_validateAttributes( true, attributes )

			statement = []
			statement.push "INSERT INTO #{ @table }"

			[ _keys, _vals ] = @_getSaveVariables( attributes, true )
			
			statement.push( "( #{ _keys.join( ", " )} )" ) 
			statement.push( "VALUES ( #{ _vals.join( ", " ) } )" )
			return _.compact( statement ).join( "\n" )

		###
		## update
		
		`sql.update( attributes )`
		
		Create a update statement
		
		@param { Object } attributes Attributes to update 
		
		@return { String } update statement 
		
		@api public
		###
		update: ( attributes )=>

			attributes = @_validateAttributes( false, attributes )

			statement = []
			statement.push "UPDATE #{ @table }"

			[ _keys, _vals ] = @_getSaveVariables( attributes, false )

			_sets = []
			for _key, _idx in _keys
				_sets.push( "#{ _key } = #{ _vals[ _idx ] }" ) 
			
			statement.push( "SET #{ _sets.join( ", " ) }" )

			statement.push @where

			return _.compact( statement ).join( "\n" )

		###
		## select
		
		`sql.select( [complex] )`
		
		Create a select statement
		
		@param { Boolean } complex Create a complex select with order by and select
		
		@return { String } select statement 
		
		@api public
		###
		select: ( complex = true )=>

			statement = []
			statement.push "SELECT #{ @fields }"
			statement.push "FROM #{ @table }"
			if @hasJoins?
				statement.push "#{ @joins }"

			statement.push @where

			if complex
				statement.push @orderby

				statement.push @limit

			return _.compact( statement ).join( "\n" )

		###
		## count
		
		`sql.count( [complex] )`
		
		Create a count statement
		
		@return { String } count statement 
		
		@api public
		###
		count: =>

			statement = []
			statement.push "SELECT COUNT( #{ @idField } ) as count" 
			statement.push "FROM #{ @table }"

			statement.push @where

			return _.compact( statement ).join( "\n" )


		###
		## delete
		
		`sql.delete( [complex] )`
		
		Create a delete statement
		
		@return { String } delete statement 
		
		@api public
		###
		del: =>
			statement = []
			statement.push "DELETE"
			statement.push "FROM #{ @table }"

			statement.push @where

			return _.compact( statement ).join( "\n" )

		###
		## filter
		
		`sql.filter( key, pred )`
		
		Define a filter criteria which will be used by the `.getWhere()` method
		
		@param { String|Object } key The filter key or a Object of key and predicate 
		@param { Object|String|Number } pred A prediucate object. For details see [Jed's Predicates ](https://github.com/jed/dynamo/wiki/High-level-API#wiki-predicates)
		
		@return { SQLBuilder } Returns itself for chaining
		
		@api public
		###
		filter: ( key, pred )=>
			# set the filter array if not defined yet
			@_c.filters or= []
			@log "debug", "filter", key, pred

			# run this method recrusive if its defined as a object
			if _.isObject( key )
				for _k, _pred of key
					@filter( _k, _pred )
			else
				if @_c.attrNames.length and key not in @_c.attrNames
					@info "invalid filter", @table, key
					return @

				# create the SQL where statement
				_filter = "#{@table}.#{ key } "

				if pred is null
					# is null if pred is `null`
					_filter += "is NULL"
				else if _.isString( pred ) or _.isNumber( pred )
					# simple `=` filter
					_filter += "= #{ escape( pred ) }"
				else if _.isArray( pred )
					# simple `in (  )` filter
					_filter += "in ( #{ escape( pred ) })"
				else if _.isDate( pred )
					# simple date filter
					_filter += "=  #{ escape( pred.toString() ) }"
				else
					# complex predicate filter
					_operand = Object.keys( pred )[ 0 ]
					_val = pred[ _operand ]
					switch _operand
						when "fn"
							# `use a sql function`
							if _val?
								_filter += if _val? then "= #{  _val }"
						when "=="
							# `column is NULL`
							_filter += if _val? then "= #{ escape( _val ) }" else "is NULL"
						when "!="
							# `column is not NULL`
							_filter += if _val? then "!= #{ escape( _val ) }" else "is not NULL"
						when ">", "<", "<=", ">="
							# `column > ?`, `column < ?`, `column >= ?` or `column <= ?` or for an array `column between ?[0] and ?[1]`
							if _.isArray( _val )
								_filter += "between #{ escape( _val[ 0 ] ) } and #{ escape( _val[ 1 ] ) }"
							else
								_filter += "#{ _operand } #{ escape( _val ) }"
						when "contains"
							# `column like "%?%"`
							_filter += "like #{ escape( "%" + _val + "%" ) }"
						when "!contains"
							# `column not like "%?%"`
							_filter += "not like #{ escape( "%" + _val + "%" ) }"
						when "startsWith"
							# `column like "?%"`
							_filter += "like #{ escape( _val + "%" ) }"
						when "in"
							# `column in ( ?[0], ?[1], ... ?[n] )`
							if not _.isArray( _val )
								_val = [ _val ]
							_filter += "in ( #{ escape( _val ) })"

						when "sub"
							# `column in ( ?[0], ?[1], ... ?[n] )`
							subtable = new SQLBuilder()
							subtable.table = _val.table
							subtable.fields = _val.field
							subtable.filter( _val.filter )
							_filter += "in ( #{ subtable.select( false ) })"

						when "custom"
							_filter += if _val? then "#{  _val }"
				
				# combine the filters with a `AND` or an `OR`
				if @_c.filters?.length
					_cbn = if @_c._filterCombine then @_c._filterCombine else @config.standardFilterCombine
					@_c.filters.push _cbn

				@_c.filters.push( _filter )

				@_c._filterCombine = null

			@

		addJoin: ( type, field, fSqlBuilder, fField, fFilters )=>
			#console.log @table, type, field, fSqlBuilder.table, fField, fFilters
			@_c.filters or= []
			@_c.joins.push
				type: type
				field: field
				table: fSqlBuilder.table
				foreignField: fField
			
			if fFilters? and not _.isEmpty( fFilters )
				@_c.filters = @_c.filters.concat( fSqlBuilder.filter( fFilters ).getFilters() )
			return @

		###
		## or
		
		`sql.or()`
		
		Combine next filter with an `OR`
		
		@return { SQLBuilder } Returns itself for chaining
		
		@api public
		###
		or: =>
			if @_c.filters?.length
				@_c._filterCombine = "OR"
			@

		###
		## and
		
		`sql.and()`
		
		Combine next filter with an `AND`
		
		@return { SQLBuilder } Returns itself for chaining
		
		@api public
		###
		and: =>
			if @_c.filters?.length
				@_c._filterCombine = "AND"
			@

		###
		## filterGroup
		
		`sql.filterGroup( [newGroup] )`
		
		Start a filter group by wrapping it with "()". It will be colsed at the end, with the next group or by calling `.filterGroup( false )`
		
		@param { Boolean } [newGroup=true] Start a new group 
		
		@return { SQLBuilder } Returns itself for chaining
		
		@api public
		###
		filterGroup: ( newGroup = true )=>
			@_c.filters or= []
			_add = 0
			if @_c._filterGroup? and @_c._filterGroup >= 0
				@log "debug", "filterGroup A", @_c.filters, @_c._filterGroup
				if @_c._filterGroup is 0
					@_c.filters.unshift( "(" )
				else
					@_c.filters.splice( @_c._filterGroup, 0, "(" )
				@_c.filters.push( ")" )
				_add = 1
				@log "debug", "filterGroup B", @_c.filters, @_c._filterGroup
				@_c._filterGroup = null
			if newGroup
				@_c._filterGroup = ( @_c.filters?.length or 0 ) + _add
			@

		###
		## setToArray
		
		`sql.setToArray( value )`
		
		Convert a set value to a array
		
		@param { String } value A raw db set value
		
		@return { Array } The converted set as an array 
		
		@api public
		###
		setToArray: ( value )=>
			_lDlm = @config.sqlSetDelimiter.length
			if not value? or value?.length <= _lDlm
				return null
			# remove the first and last delimiter and slipt the set into an array
			value[ _lDlm..-( _lDlm + 1 ) ].split( @config.sqlSetDelimiter )

		convertToType: ( key, value )=>
			if _.isArray( key )
				_ret = []
				for _item in key
					_ret.push @convertToType( _item )
				return _ret
			else if _.isObject( key )
				_ret = {}
				for _key, _val of key when _key in @attrKeys
					_ret[ _key ] = @convertToType( _key, _val )
				return _ret
			else
				if not value?
					return null

				_cnf = @_getAttrConfig( key )
				if _cnf
					switch _cnf.type
						when "string", "S"
							return value.toString()
						when "number", "N"
							if "." in value
								return parseFloat( value )
							else
								return parseInt( value, 10 )

						when "boolean", "B"
							switch value.toString().toLowerCase()
								when "true","1", "y","yes" then return true
								else return false

						when "json", "object", "J", "O"
							if not value? or _.isEmpty( value )
								return {}
							try
								return JSON.parse( value )
							catch
								@error "JSON parse error", value
								return {}

						when "timestamp", "T", "unixtimestamp", "U"
							return parseInt( value, 10 )

						when "date", "D"
							if value is "0000-00-00" # handle special date case if the date is 0 return as not defined
								return null
							if _.isDate( value )
								return value
							else
								return moment( value, @config.dateFormats ).toDate()

						when "array", "A"
							return setToArray( value )

		hasField: ( field )=>
			return field in @attrKeys


	# # Getter and Setter methods
		
		###
		## setTable
		
		`sql.setTable( tbl )`
		
		Set the table
		
		@param { String } tbl Table name 
		
		@api private
		###
		setTable: ( tbl )=>
			@_c.table = tbl
			return

		###
		## getTable
		
		`sql.getTable()`
		
		Get the table
		
		@return { String } Table name 
		
		@api private
		###
		getTable: =>
			if @_c.table?
				@_c.table
			else
				@_handleError( null, "no-table" )

		###
		## setIdField
		
		`sql.setIdField( field )`
		
		Set id field name
		
		@param { String } field Id field name
		
		@api private
		###
		setIdField: ( field )=>
			@_c.idField = field
			return

		###
		## getIdField
		
		`sql.getIdField()`
		
		Get the id field name
		
		@return { String } Field name 
		
		@api private
		###
		getIdField: =>
			if @_c.idField?
				@_c.idField
			else
				@_handleError( null, "no-id-field" )

		###
		## setAttrs
		
		`sql.setAttrs( _attrs )`
		
		Set the attribute configuration
		
		@param { String } _attrs Arrtribute configuration 
		
		@api private
		###
		setAttrs: ( _attrs )=>
			_defAttrCnf = @config.attr
			for key, attr of _attrs
				if key?
					# collect the attribute keys
					@_c.attrKeys.push key
					# collect the attribute keys
					@_c.attrNames.push attr.name
					# set the attribute configuration and extend it with the defauts
					_attr = @extend( {}, _defAttrCnf, attr )
					@_c.attrs.push _attr

					# collect the set type keys
					if attr.type in [ "A", "array" ]
						@_c.attrsArrayKeys.push key
					@_c.fieldlist.push( key )
					if @usefieldsets and attr.fieldsets?
						for fldst in attr.fieldsets
							@_c.fieldsets[ fldst ] = [] unless @_c.fieldsets[ fldst ]?
							@_c.fieldsets[ fldst ].push( key )
			return

		###
		## getAttrs
		
		`sql.getAttrs()`
		
		Get the current attribute configuration
		
		@return { Object } Attribute configuration 
		
		@api private
		###
		getAttrs: =>
			if @_c.attrs?
				@_c.attrs
			else
				[]

		###
		## getAttrKeys
		
		`sql.getAttrKeys()`
		
		Get the keys of all defined attributes
		
		@return { Array } All defined attributes
		
		@api private
		###
		getAttrKeys: =>
			@_c.attrKeys or []

		###
		## getArrayAttrKeys
		
		`sql.getArrayAttrKeys()`
		
		Get all attribute keys of type `array` or `A`
		
		@return { Array } All defined attributes of type array 
		
		@api private
		###
		getArrayAttrKeys: =>
			@_c.attrsArrayKeys or []

		###
		## setOrderField
		
		`sql.setOrderField()`
		
		Set the order by field
				
		@api private
		###
		setOrderField: ( fields )=>
			if _.isArray( fields )
				@_c.orderBy = fields
			else
				@_c.orderBy = for fld in fields.split( "," )
					utils.trim( fld )
			
		###
		## getOrderField
		
		`sql.getOrderField()`
		
		Get the defined order by field. Usualy the range key.
		
		@return { String } Name of the column to define the order 
		
		@api private
		###
		getOrderField: =>
			if @_c.orderBy?
				@_c.orderBy.join( ", " )
			else
				@

		###
		## setForward
		
		`sql.setForward()`
		
		Set the order by direction

		@param { String } _attrs Arrtribute configuration 
				
		@api private
		###
		setForward: ( dir )=>
			if _.isBoolean( dir )
				@_c.forward = dir
			else
				if dir.toLowerCase() is "desc"
					@_c.forward = false
				else
					@_c.forward = true
			
		###
		## getForward
		
		`sql.getForward()`
		
		Get the defined order by field. Usualy the range key.
		
		@return { String } Name of the column to define the order 
		
		@api private
		###
		getForward: =>
			if @_c.forward? then @_c.forward else true

		###
		## getOrderBy
		
		`sql.getOrderBy()`
		
		Get the `ORDER BY` sql
		
		@return { String } Order by sql
		
		@api private
		###
		getOrderBy: =>
			if @forward
				"ORDER BY #{@table}.#{ @orderfield } ASC"
			else
				"ORDER BY #{@table}.#{ @orderfield } DESC"

		###
		## getWhere
		
		`sql.getWhere()`
		
		Construct the `WHERE` sql
		
		@return { String } The sql Where clause
		
		@api private
		###
		getWhere: ( withWhere = true )=>
			_filters = @_c.filters or []
			if _filters.length
				
				@filterGroup( false )
				if withWhere
					"WHERE #{ _filters.join( "\n" ) }"
				else
					_filters.join( "\n" )
			else
				null

		###
		## setFields
		
		`sql.setFields( [fields] )`
		
		Set the fields to select
		
		@param { Array|String } [fields] The fields to select as sql field list or as an array 
		
		@api private
		###
		setFields: ( _fields = @config.fields, special = false )=>
			if _.isFunction( _fields )
				setfields = _.pluck( _.filter(@attrs, _fields ), "name" )
			else if _fields in  [ "all", "*" ]
				setfields = @_c.fieldlist
			else if _fields in [ "idOnly", "idonly" ]
				setfields = [@idField]
			else if @usefieldsets and _fields[..3] is "set:" and @_c.fieldsets[ _fields[4..] ]?
				setfields =  @_c.fieldsets[ _fields[4..] ]
			else if _.isArray( _fields )
				setfields = _fields
			else
				setfields = _fields.split( "," )

			if not special and @_c.attrNames.length
				@_c.fields = _.intersection( setfields, @_c.attrNames )
			else
				@_c.fields = setfields
			return

		###
		## getFields
		
		`sql.getFields()`
		
		Get the field list
		
		@return { String } Sql field list 
		
		@api private
		###
		getFields: =>
			if @_c.fields?.length
				_fdls = []
				for field in @_c.fields
					if field.indexOf( " " ) < 0
						_fdls.push( "#{@table}.#{field}" )
					else
						_fdls.push( field )
				_fdls.join( ", " )
			else
				"*"

		###
		## getFieldNames
		
		`sql.getFieldNames()`
		
		Get a list of fieldnames
		
		@return { String[] } Sql field list 
		
		@api private
		###
		getFieldNames: =>
			if @_c.fields?.length
				_.clone( @_c.fields )
			else
				[]

		###
		## setUseFieldsets
		
		`sql.setUseFieldsets( tbl )`
		
		Use the Fieldset feature
		
		@param { String } tbl UseFieldsets name 
		
		@api private
		###
		setUseFieldsets: ( use )=>
			@_c.usefieldsets = use or false
			return

		###
		## getUseFieldsets
		
		`sql.getUseFieldsets()`
		
		Get the table
		
		@return { String } UseFieldsets name 
		
		@api private
		###
		getUseFieldsets: =>
			if @_c.usefieldsets?
				@_c.usefieldsets
			else
				false

		###
		## setLimit
		
		`sql.setLimit( [_limit] )`
		
		Set the maximum number of returned values
		
		@param { Number } [_limit] The number of returned elements. `0` for unlimited
		
		@api private
		###
		setLimit: ( _limit = @config.limit )=>
			@_c.limit = _limit
			return


		###
		## getLimit
		
		`sql.getLimit()`
		
		Get the `LIMIT` sql
		
		@return { String } The sql limit clause
		
		@api private
		###
		getLimit: =>
			if @_c.limit?
				if @_c.limit is 0
					null
				else
					"LIMIT #{ @_c.limit }"
			else
				"LIMIT #{ @config.limit }"

		###
		## setDefaultLimit
		
		`sql.setDefaultLimit( [_limit] )`
		
		Set the default maximum number of returned values
		
		@param { Number } [_limit] The number of returned elements. `0` for unlimited
		
		@api private
		###
		setDefaultLimit: ( _limit = @config.limit )=>
			@config.limit = _limit
			return


		###
		## getDefaultLimit
		
		`sql.getDefaultLimit()`
		
		Get the default `LIMIT` sql
		
		@return { String } The sql limit clause
		
		@api private
		###
		getDefaultLimit: =>
			@config.limit

		###
		## hasFilter
		
		`sql.hasFilter( id, cb )`
		
		Check if a filter is activated
		
		@return { Boolean } Is filtered 
		
		@api private
		###
		hasFilter: =>
			return @_c.filters.length > 0

		getFilters: =>
			return @_c.filters

		hasJoins: =>
			return @_c.joins.length > 0

		getJoins: =>
			_joins = []
			for _jn in @_c.joins
				_joins.push "#{_jn.type.toUpperCase()} JOIN #{_jn.table} ON #{@table}.#{_jn.field} = #{_jn.table}.#{_jn.foreignField}"
			return _joins.join( "\n" )

	# # Private methods 

		###
		## _validateAttributes
		
		`sql._validateAttributes( isCreate, attributes )`
		
		Validate the attributes before a update or insert
		
		@param { Boolean } isCreate It is a insert 
		@param { Object } attributes Object of attributes to save 
		
		@return { Object } The cleaned attributes 
		
		@api private
		###
		_validateAttributes: ( isCreate, attrs )=>
			_keys = @attrKeys
			_omited = _.difference( Object.keys( attrs ),_keys )
			attrs = _.pick( attrs, _keys )
			if _omited.length
				@info "validateAttributes", "You tried to save a attribute not defined in the model config of `#{ @table }`", _omited
			else
				@debug "validateAttributes", attrs
			return attrs

		###
		## _getAttrConfig
		
		`sql._getAttrConfig( key )`
		
		Get the configuration of a attribute
		
		@param { String } key Attribute/Column/Field name 
		
		@return { Object } Attribute configuration
		
		@api private
		###
		_getAttrConfig: ( name )=>
			for attr in @attrs
				return attr if attr.name is name
			return null

		###
		## _getSaveVariables
		
		`sql._getSaveVariables( attributes )`
		
		Create the keys and values for the update and inser statements
		
		@param { Object } attributes Data object to save 
		
		@return { [_keys,_vals] } `_keys`: An array of all keys to save; `_vals`: An array of all escaped values to save
		
		@api private
		###
		_getSaveVariables: ( attributes, isInsert = false )=>
			_keys = []
			_vals = []
			# loop through all attributes
			for _key, _val of attributes
				_cnf = @_getAttrConfig( _key )
				if _cnf and not _cnf.readonly
					switch _cnf.type
						when "string", "S"
							if _val? and not _.isString( _val )
								_val = _val.toString()

							# create regular values
							if not _val?
								_vals.push( "NULL" )
							else if _val?[ ..2 ] is "IF("
								_vals.push( _val )
							else
								_vals.push( escape( _val ) )
							_keys.push( _key )

						when "number", "N"
							# create regular values
							if not _val?
								_vals.push( "NULL" )
							else if _.isString( _val ) and _val?[ ..2 ] is "IF("
								_vals.push( _val )
							else if _val is "now"
								_vals.push( "UNIX_TIMESTAMP()*1000" )
							else if _val is "incr"
								_vals.push( "IF( #{ _key } is NULL, 0, #{ _key } + 1 )" )
							else if _val is "decr"
								_vals.push( "IF( #{ _key } is NULL, 0, #{ _key } - 1 )" )
							else if _.isString( _val ) and _val?[ ..3 ] is "crmt"
								_count = parseInt( _val[4..], 10 )
								_operand = "+"
								if isNaN( _count )
									_count = 1
								if _count < 0
									_operand = "-"
									_count = _count * -1
								_vals.push( "IF( #{ _key } is NULL, #{ if _operand is "+" then 1 else 0 }, #{ _key } #{ _operand } #{ _count } )" )
							else
								_vals.push( escape( parseFloat( _val ) ) )
							_keys.push( _key )

						when "boolean", "B"
							switch _val.toString().toLowerCase()
								when "true","1", "y","yes" then _vals.push( true )
								else _vals.push( false )
							_keys.push( _key )

						when "json", "object", "J", "O"
							if not _val?
								_vals.push( escape( "{}" ) )
							else
								try
									_vals.push( escape( JSON.stringify( _val ) ) )
							_keys.push( _key )

						when "timestamp", "T"
							if _val is "now"
								_vals.push( "UNIX_TIMESTAMP()*1000" )
							else if _.isDate( _val )
								_vals.push( Math.round( _val.getTime() ) )
							else if _.isString( _val )
								_d = moment( _val, _cnf.dateFormat or @config.dateFormats )
								_vals.push( _d.valueOf() )
							else if _.isNumber( _val )
								# convert s timestamp to ms
								if _val.toString().length is 10
									_vals.push( Math.round( _val * 1000 ) )
								else
									_vals.push( escape( _val ) )
							else
								_vals.push( escape( _val ) )
							_keys.push( _key )

						when "unixtimestamp", "U"
							if _val is "now"
								_vals.push( "UNIX_TIMESTAMP()" )
							else if _.isDate( _val )
								_vals.push( Math.round( _val.getTime() / 1000 ) )
							else if _.isString( _val )
								_d = moment( _val, _cnf.dateFormat or @config.dateFormats )
								_vals.push( _d.unix() )
							else if _.isNumber( _val )
								# convert ms timestamp to s
								if _val.toString().length is 13
									_vals.push( Math.round( _val / 1000 ) )
								else
									_vals.push( escape( _val ) )
							else
								_vals.push( escape( _val ) )
							_keys.push( _key )


						when "date", "D"
							if _val is "now"
								_val = new Date()

							if _.isDate( _val )
								_vals.push( escape( _val ) )
								_keys.push( _key )
							else if _.isDate( ( _m = moment( _val, @config.dateFormats ) )?._d )
								_vals.push( escape( _m.format( "YYYY-MM-DD HH:mm" ) ) )
								_keys.push( _key )

						when "array", "A"
							# create values with the set functions.
							_setval = @_generateSetCommand( _key, _val, @config.sqlSetDelimiter )
							if _setval?
								_vals.push( _setval )
								_keys.push( _key )
							@log "debug", "setCommand", _setval, _val, _key
			return [ _keys, _vals ]
			return null

		# **_generateSetCommandTmpls** *Object* Underscore templates for the set sql commands. Used by the method `_generateSetCommand`
		_generateSetCommandTmpls:
			add: _.template( 'IF( INSTR( <%= set %>,"<%= val %><%= dlm %>") = 0, "<%= val %><%= dlm %>", "" )' )
			rem: _.template( 'REPLACE( <%= set %>, "<%= dlm %><%= val %><%= dlm %>", "<%= dlm %>")' )
			set: _.template( 'IF( <%= key %> is NULL,"<%= dlm %>", <%= key %>)' )

		###
		## _generateSetCommand
		
		`sql._generateSetCommand( key, inp, dlm )`
		
		Generate the sql command to add, reset or remove a elment out of a set string.
		How to handle set within a sql field is described by this [GIST](https://gist.github.com/mpneuried/5704200) 
		
		@param { String } key The field name 
		@param { String|Number|Object } inp the set command as simple string/number or complex set command. More in [API docs](http://mpneuried.github.io/mysql-dynamo/) section " Working with sets"
		@param { String } dlm The delimiter within the field

		@return { String } Return Desc 
		
		@api private
		###
		_generateSetCommand: ( key, inp, dlm )=>
			@log "debug", "_generateSetCommand", key, inp
			
			# set empty
			if not inp?
				escape( dlm )
			
			# set by array
			else if _.isArray( inp )
				if not inp.length
					# set empty by empty array
					escape( dlm )
				else
					# reset by array
					escape( dlm + inp.join( dlm ) + dlm )

			# set by object
			else if _.isObject( inp )
				if inp[ "$reset" ]
					if _.isArray( inp[ "$reset" ] )
						# reset by $reset with an array
						escape( dlm + inp[ "$reset" ].join( dlm ) + dlm )
					else
						# reset by $reset with a single value
						escape( dlm + inp[ "$reset" ] + dlm )
				else
					# run $add or $rem command
					
					# define some vars
					added = []
					usedRem = false

					# convert the key to a expression with the check for an empty field, because a field of type TEXT cannot have a default
					_set = @_generateSetCommandTmpls.set( key:key, dlm:dlm )

					# prefix CONCAT content with the current value
					_add = [ _set ]
					
					# $add command by concat the current value with the new value expressions
					if inp[ "$add" ]?
						# if the content is an array generate multiple add statements
						if _.isArray( inp[ "$add" ] )
							for _inp in _.uniq( inp[ "$add" ] )
								# set added flag to detect any changes
								added.push( _inp )
								_add.push( @_generateSetCommandTmpls.add( val:_inp, set:_set, dlm:dlm ) )
						else
							# set added to detect any changes
							added.push( inp[ "$add" ] )
							_add.push( @_generateSetCommandTmpls.add( val:inp[ "$add" ], set:_set, dlm:dlm ) )
						
						# if any add has been generated overwritethe new set command
						_set = "CONCAT( #{ _add.join( ", " ) } )" if _add.length
					
					# $rem command by nesting replace commands
					if inp[ "$rem" ]?
						# if the content is an array generate multiple rem statements
						if _.isArray( inp[ "$rem" ] )
							for _inp in _.difference( _.uniq( inp[ "$rem" ] ), added )
								# set usedRem to detect any removes
								usedRem = true
								_set = @_generateSetCommandTmpls.rem( val:_inp, set:_set, dlm:dlm )
						else
							# set usedRem to detect any removes
							usedRem = true
							_set = @_generateSetCommandTmpls.rem( val:inp[ "$rem" ], set:_set, dlm:dlm )
					
					# return `null` if nothing has to be changed
					if added.length or usedRem
						_set
					else
						null
			# set by string or number
			else if inp?
				escape( dlm + inp + dlm )

			# noting to set
			else
				null

		# # Error message mapping
		ERRORS: =>
			@extend super,
				"no-tables": "No table defined"
				"no-id-field": "No id field defined"
