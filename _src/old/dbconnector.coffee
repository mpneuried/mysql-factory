#**dbconnector** is a module to handle the connection to mysql.
# it abstracts the complex sequence of connectig to mySQL, use a table and run a query to a single line of code.
#
#To **init** it you have to add a code like this
#
#     DBConnector = require( "./libs/dbconnector" ).DBConnector
#     dbC = new DBConnector( {
#        user: "root",
#        password: "never",
#        port: "3307",
#        host: "127.0.0.1",
#        database: "milonst",
#        logLevel: 1,
#        disconnectAfterQuery: true 
#     } )
#
#To **use** it you do something like that:
#
#     dbC.query( "SELECT * FROM mytable WHERE id = ?", [123], ( err, result )-> )
#

# ###import modules
sys = require( "sys" )
EventEmitter = require( "events" ).EventEmitter
_ = require('lodash')._

# ## Superclass to handle mysql connections
class DBConnector extends EventEmitter
	# ### constructor
	# #### *extends the node.js EventsEmitter*  
	# **constructor to handle default options**  
	# **settings:** { Object } *Settings object:*  
	#  
	# - **user**: { String } *MySQL username*  
	# - **password**: { String } *MySQL password*  
	# - **host**: { String } *MySQL host*  
	# - **port**: { String } *MySQL port*  
	# - **database**: { String } *MySQL database*  
	# - **disconnectAfterQuery**: { Boolean } *Setting to enable automatich disconnecting after all running querys are done*  
	# - **logLevel**: { Number } *Level of logging: 0= no logging 1= error logging 2= info logging* 
	# - **type**: { String } *type of database. currently fixed to mysql* 
	constructor: ( settings ) -> 
		@user = settings.user or null
		@password = settings.password or null
		@host = settings.host or "localhost"
		@port = settings.port or "3306"
		@database = settings.database or null
		@disconnectAfterQuery = false

		@logLevel = 0

		# currently fixed to mysql. later is could extended to other database systems
		@type = settings.type ? "mysql"
		
		# counter of actually open querys to prevent disconnection
		@runningQuerys = 0
		@runningConnections = 0

		# setup db connection
		switch @type
			when "mysql"
				# load mysql module
				mySQLClient = require("../mysql-old/").Client
				@native = new mySQLClient()

				# run setup for current type
				@_setupConnection()
			else
				# type not defined
				@native = false
		
		# local var to save connection state
		@isConnected = false
		
		@isConnecting = false
		
		@queue = []
		return
	
	# ### connect 
	# *connect to the database*  
	# *usualy this function is call internal*  
	# **callback:** { Function } *function to be called after connection*
	connect: ( callback ) ->
		if @native
			if not @isConnected
				@_log 2, "connect:start", @native
				@isConnecting = true
				++@runningConnections
				# start mysql connection
				@native.connect (err, results)=>
					if err
						@_log 1, "connect", err
						throw err
					# wire connection to the defined database
					@_connectDatabase callback 
					@_log 2, "connect:done" 
					return
				return
			else
				# if connection is already establish run the callback immediately  
				@_log 2, "connect:allready-connected", err
				callback() if callback
				@emit "connected", false
				return
		else
			throw new SetupFailed "nativ connector ist not initialized"
			return
	
	# ### disconnect
	# *disconect the database connection  *
	# *usualy this function is call internal*
	disconnect: ->
		# only disconnect if no more quersy are running
		if @runningQuerys is 0 
			--@runningConnections
			@native.end()
			@isConnected = false
			@_log 2, "disconnect:done"
		return
	
	# ### query 
	# *run a databse query*
	# *if the database is not connected this method will run `connect()` first.*  
	# **callback:** { Function } *function to be called after connection*  
	# or  
	# **callback:** { String } *name of Event which will be fired on success*  
	# or.  
	# **callback** { undefined } *a "success" event will be fired at the end of a successful query*
	query: ( statement, aArgs, callback )=>

		# check if connection ist established
		if @isConnected
			# increse the running querys
			++@runningQuerys
			@_log 2, "query:start:stmt", @_prepareStatement( statement )
			@_log 2, "query:start:args", @_prepareQueryArgs( aArgs )
			#console.log "QUERY", statement, aArgs
			# run the native mysql query
			@native.query(
				@_prepareStatement( statement ),
				@_prepareQueryArgs( aArgs ),
				_.bind( @_queryCallback, this, callback )
			)

			@_log 2, "query:done"
		else if @isConnecting
			@_addToQueue( @query, arguments, this )
		else
			# if no connection is established call ´connect()´ first
			@connect( _.bind( @query, this, statement, aArgs, callback ) )
		return

	# ### isConnected 
	# *chek if the connection is currently open*  
	# **RETURN** { Boolean }: *state if connection is open*
	isConnected: ->
		@isConnected
	
	# ##Private methods:

	# ### _queryCallback 
	# *internal callback method for ´query()´*  
	# *this method will check for an error and run the given callback or fire an event*  
	# **Do not use it external**
	_queryCallback: ( callback, err, results, meta ) ->
		@_log 2, "query-result",results.length
		# check fo an error
		if err 
			@_log( 1, "query-result", err )
		
		if arguments.length <= 3
			meta = results
			results = null
		
		# check for type of callback. Function-call or event
		if _.isFunction( callback )
			callback( err, results, meta )
		else if  _.isString( callback )
			@emit( err, callback, results, meta )
		else
			@emit( "success", results, meta )
		
		# decrease the running querys
		--@runningQuerys
		
		@disconnect() if @disconnectAfterQuery
		return
	
	# ### _prepareStatement 
	# *prepare the given statement.*  
	# **Do not use it external**
	_prepareStatement: ( statement )->
		statement
	
	# ### _prepareQueryArgs 
	# *prepare the given arguments.*  
	# **Do not use it external**
	_prepareQueryArgs: ( aArgs ) ->
		aArgs
	
	# ### _connectDatabase 
	# *method to init the database connection*  
	# **Do not use it external**
	_connectDatabase: ( callback ) ->
		@_log 2, "use:start"
		# run use query to define the connected database
		@native.query("USE " + @database , (err, results)=>
			throw err if err
			
			# set connected to true
			@isConnected = true
			@isConnecting = false
			
			callback() if callback
						
			@_runQueue()
			# fire event to inform other of established connection
			@emit "connected", true
			return
		)
		@_log 2, "use:done"
		return
	
	# ### _setupConnection 
	# *setup the connection with the defined instance settings*  
	# **Do not use it external**
	_setupConnection: ->
		if @user and @password
			@_log 2, "setup:start"
			# set the mysql specific client data
			@native.user = @user
			@native.password = @password
			@native.host = @host #only needed if your mysql server isn"t on your localhost
			@native.port = @port
			@_log 2, "setup:done"
		else
			# throw an errror
			@_log 1, "setup", "User or password not defined."
			throw new AuthenticationFailed "User or password not defined."
		return
	
	# ### _log 
	# *print logs to console.*  
	# **lvl:** { Number } *information level of message*  
	# **type:** { String } *name or type of the logged data*  
	# **args:** { any } *data to log*  
	# **Do not use it external**
	_log: ( lvl, type, args ) ->
		if  lvl is 1 and @logLevel >= lvl
			console.log( "DBConnector-ERROR: ", @runningConnections, @runningQuerys, type, args ? null )
		else if  lvl is 2 and @logLevel >= lvl
			console.log( "DBConnector-INFO: ", @runningConnections, @runningQuerys, type, args ? null )
		return
	

	_addToQueue: ( fn, args, context ) ->
		@queue.push( { fn: fn, args: args, context: context } )
		return

	_runQueue: ->
		if  @queue.length
			data = @queue[ 0 ]
			data.fn.apply( data.context, data.args )
			@queue = _.rest( @queue )
			@_runQueue()
		return



# ### Special Error messages
# generate special Error Objects
AuthenticationFailed = (msg)->
	@name = "DBConnector:AuthenticationFailed"
	Error.call(this, msg)
	Error.captureStackTrace(this, arguments.callee)

SetupFailed = (msg)->
	@name = "DBConnector:SetupFailed"
	Error.call(this, msg)
	Error.captureStackTrace(this, arguments.callee)

# ### export the Superclass
module.exports = DBConnector;