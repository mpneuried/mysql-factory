#**modelfactory** is a module to config, init and get the signle DB-abstraction models.
#
#To **init** it you have to add a code like this
#
#     Modelfactory = require('./modules/modelfactory.js').Modelfactory
#     modelFactory = new Modelfactory( dbC )
#
#To **use** it you have to add a code like this
#
#     dbModel = modelFactory.get( 'MyModel' )
#
# ###import modules
Datamodel = require('./datamodel').Datamodel
async = require( 'async' )
moment = require( 'moment' )
_ = require('lodash')._
#Tpman = require( './treepackage' )

#internal helper function to add the elements of an array to another array
_arrayInclude = ( arrBase, arrAdd )->
	arrAdd = [ arrAdd ] if not _.isArray( arrAdd )
	arrBase.push( aEl ) for aEl in arrAdd when _.indexOf( arrBase, aEl ) < 0 if arrAdd
	arrBase

_arrayRemove = ( arr, val )->
   part for part in arr when part isnt val


# ## Superclass to manage models
module.exports = class Modelfactory
	# ### constructor
	# **constructor to handle default options and init calls**  
	# **connector:** { DB-connection instance } *DB-connection instance*  
	constructor: ( @connector, @datamodels )->
		#@inittree = INITTREE
		
		@models = {}
		
		# run initialisation
		@_initModels()
		@_wireModels( @inittree )

	# ### _initModels 
	# *init all models but do not call the init method*  
	_initModels: ->
		for modelname, modeldata of @datamodels
			#if modeldata._isTreeModel
			#	@models[ modelname ] = new Tpman( _.extend( modeldata, { connector: @connector, factory: @, autoinit: false } ) )
			#else
			@models[ modelname ] = new Datamodel( _.extend( modeldata, { connector: @connector, factory: @, autoinit: false } ) )

			# add all defined event function to the model 
			for events, fn of modeldata.events
				@models[ modelname ].on( event, _.bind( fn, @models[ modelname ], event ) ) for event in events.split( ',' )
		return
	
	# ### _wireModels 
	# *wire all defined models besed on the initTree*  
	# **modeltree:** { Object } *language to load* 
	_wireModels: ( modeltree )->
		
		for modelname, submodels of modeltree
			if submodels is null and @has( modelname )
				@get( modelname ).init()
			else if  submodels isnt null
				@_wireModels( submodels )
				@get( modelname ).init()
		return
	
	# ### get 
	# *get a single model*  
	# **modelname:** { String } *name of a model* 
	get: ( modelname )->
		@models[ modelname ] or null
	
	# ### has 
	# *check existance aof a model*  
	# **modelname:** { String } *name of a model* 
	has: ( modelname )->
		@models[ modelname ] ? true

# ### export the Superclass
module.exports = Modelfactory

# ## Tree for initializing the models one after another
INITTREE = 
	"Contracts": null
	"Apikeys": null
	"Studios":
		"Users": 
			"Tokens": null
		"Trainingplans":
			"Templates": null
			"Trainingelements": null
		"Devicetypes":
			"Devices": null
			"Nodegroups": 
				"Trainingitems": 
					"Powersettings": null
					"Traininglogs": null
				"Nodes": 
					"Servosettings": null
