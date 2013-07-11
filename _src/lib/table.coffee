# import the external modules
_ = require('lodash')._

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

		@builder.fields = "*"

		@builder.orderfield = @sortfield

		@builder.attrs = @settings.fields

		@builder.forward = @sortdirection

		@debug "attrs", @builder.attrs

		return
	
	get: ( id, cb, opt )=>

		# get the standard options
		options = @_getOptions( options, "get" )

		sql = @builder.clone()

		if options.fields?
			sql.fields = options.fields

		sql.filter( @sIdField, id )

		@factory.sql sql.select( false ), ( err, results )=>

			return

		return


	_getOptions: ( options )=>
