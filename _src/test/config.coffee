utils = require( "../lib/utils" )
_envVars = process.env

module.exports  =
	mysql:
		showQueryTime: true
		host: if _envVars.MYSQLFAC_TEST_HOST? then _envVars.MYSQLFAC_TEST_HOST else 'localhost'
		user: if _envVars.MYSQLFAC_TEST_USER? then _envVars.MYSQLFAC_TEST_USER else 'root'
		password : if _envVars.MYSQLFAC_TEST_PW? then _envVars.MYSQLFAC_TEST_PW else 'root'
		database: if _envVars.MYSQLFAC_TEST_DB? then _envVars.MYSQLFAC_TEST_DB else "mysql-factory-test"
		timezone: "+0100"
		logging:
			severity: "warning"
	###
		returnFormat: ( err, result )=>
			oReturn = {}
			if err?
				_data = {}
				for _k, _v of err when _k not in [ "name", "message" ]
					_data[ _k ] = _v

				oReturn = 
					success: false
					errorcode: err.name
					msg: err.message
					data: _data

			else
				oReturn =
					success: true
					errorcode: null
					msg: null
					data: result

			return oReturn
	###
		

	test:
		singleCreateTableTest: "Users"

		getTest:
			tbl: "Users"
			id: "Dwrpf"

		mgetTest:
			id: [ "Dwrpf", "tjMGQ" ]

		findTest:
			q:
				firstname: "Local"
				role: "MILON"
			count: 1

		contractsTable: "Contracts"

		tokenTable: "Tokens"

		tokenStartsWith: "desfire-rjVTdC"
		insertTestToken:
			user_id: "Dwrpf"
			studio_id: 1
			token: "desfire-#{utils.randomString( 15 )}"
			_t: 0

	tables:
		"Users":
			# database tablename
			tablename: "users"
			# name of id-field
			sIdField: "id"
			# define id as a string [ default: false ]
			hasStringId: true
			defaultStringIdLength: 5
			# add redis as cache in front of the get method [ default: false ]
			# use fieldset feature
			useFieldsets: true
			# database fields
			sortfield: "firstname,lastname"
			sortdirection: "asc"
			limit: 500
			fields:
				"id": 				{ name: "id",			fieldsets: [ "ls", "det", "test" ], search: false, type: "string" }
				"thirdparty_id": 	{ name: "thirdparty_id",fieldsets: [ "det" ], search: false, type: "string" }
				"password": 		{ name: "password",		fieldsets: [ "det" ], search: false, type: "string", validation: { bcrypt: { rounds: 10 } }  }
				"isactive": 		{ name: "isactive",		fieldsets: [ "det" ], search: false, type: "boolean", validation: { fireEventOnChange: "userchanged" } }
				"firstname": 		{ name: "firstname",	fieldsets: [ "ls", "det", "test" ], search: true,  type: "string", validation: { isRequired: true, fireEventOnChange: "userchanged" } }
				"lastname": 		{ name: "lastname",		fieldsets: [ "ls", "det" ], search: true,  type: "string", validation: { isRequired: true, fireEventOnChange: "userchanged" } }
				"address": 			{ name: "address",		fieldsets: [ "det" ], search: true,  type: "string" }
				"city": 			{ name: "city",			fieldsets: [ "det" ], search: true,  type: "string" }
				"zip": 				{ name: "zip",			fieldsets: [ "det" ], search: true,  type: "string" }
				"lastlogin": 		{ name: "lastlogin",	fieldsets: [ "det" ], search: false, type: "unixtimestamp" }
				"email": 			{ name: "email",		fieldsets: [ "ls", "det" ], search: true,  type: "string", validation: { allreadyExistend: "email" } }
				"phone": 			{ name: "phone",		fieldsets: [ "det" ], search: true,  type: "string" }
				"mobile": 			{ name: "mobile",		fieldsets: [ "det" ], search: true,  type: "string" }
				"birthday": 		{ name: "birthday",		fieldsets: [ "det" ], search: false, type: "date", validation: { fireEventOnChange: "userchanged" } }
				"gender":	 		{ name: "gender",		fieldsets: [ "det" ], search: false, type: "boolean", validation: { isRequired: true } }
				"image":	 		{ name: "image",		fieldsets: [ "ls","det" ], search: false, type: "string", validation: { fireEventOnChange: "userchanged" }  }
				"isdeleted": 		{ name: "isdeleted",	fieldsets: [], search: false, type: "boolean" }
				"deletedate": 		{ name: "deletedate",	fieldsets: [], search: false, type: "timestamp" }
				"role": 			{ name: "role",			fieldsets: [ "det" ], search: false, type: "string", validation: { isRequired: true, notAllowedForValue: "MILON" } }
				"trainer_id": 		{ name: "trainer_id",	fieldsets: [ "ls", "det" ], search: false, type: "string", validation: { fireEventOnChange: "userchanged" } }
				"plansversion":		{ name: "plansversion",	fieldsets: [ "det" ], search: false, type: "number" }
				"currplan":			{ name: "currplan",		fieldsets: [ "det" ], search: false, type: "number", validation: { fireEventOnChange: "planchanged" } }
				"curritem":			{ name: "curritem",		fieldsets: [ "det" ], search: false, type: "number" }
				"lang":				{ name: "lang",			fieldsets: [ "det" ], search: false, type: "string" }
				"rights_cardio":	{ name: "rights_cardio",fieldsets: [ "det" ], search: false, type: "number" }
				"rights_traintec":	{ name: "rights_traintec",fieldsets: [ "det" ], search: false, type: "number" }
				"jsonSettings":		{ name: "jsonSettings",	fieldsets: [ "det" ], search: false, type: "json" }
				"colors":			{ name: "colors",		fieldsets: [ "det" ], search: false, type: "json", validation: { fireEventOnChange: "userchanged" } }
				"_t": 				{ name: "_t",			fieldsets: [ "ls", "det" ], search: false, type: "number", validation: { isRequired: true, equalOldValue: true, setTimestamp: true } }
				"_u": 				{ name: "_u",			fieldsets: [ "ls", "det" ], search: false, type: "number", validation: { incrementOnSave: true } }

			# database relations

			events:
				"currplan.planchanged": ( field, oldValue, newValue )->
					#console.log "EVENT", "USERS-EVENT: currplan.planchanged", field, oldValue, newValue 
					return
				
				"firstname.userchanged,lastname.userchanged,birthday.userchanged,trainer_id.userchanged,image.userchanged,isactive.userchanged,colors.userchanged": ( evnt, oldValue, newValue, id )->
					#console.log "EVENT", "USERS-EVENT: userchanged", evnt, oldValue, newValue, id 
					return


				"mdel,del,set,increment": ( eventname, err, res )->
					#console.log "EVENT", "USERS-EVENT: mdel,del,set,increment",  eventname, err, res
					return
				"mdel,del": ( eventname, err, res )->
					#console.log "EVENT", "USERS-EVENT: mdel,del,set,increment",  eventname, err, res
					return
		
		"Studios":
			tablename: "studios"
			sIdField: "id"
			fields:
				"id": 				{ name: "id",			search: false, type: "number" }
				"studioname": 		{ name: "studioname",	search: false, type: "string", validation: { isRequired: true } }
				"customernumber": 	{ name: "customernumber",search: false, type: "string", validation: { isRequired: true, allreadyExistend: "customernumber" } }
				"short": 			{ name: "short",		search: false, type: "string", validation: { isRequired: true, allreadyExistend: "short" } }
				"address": 			{ name: "address",		search: false, type: "string", validation: { isRequired: true } }
				"city": 			{ name: "city",			search: false, type: "string", validation: { isRequired: true } }
				"zip": 				{ name: "zip",			search: false, type: "string", validation: { isRequired: true } }
				"image":	 		{ name: "image",		search: false, type: "string" }
				"usersversion":		{ name: "usersversion",	search: false, type: "number" }
				"contractsversion":	{ name: "contractsversion",	search: false, type: "number" }
				"devicesversion":	{ name: "devicesversion",search: false, type: "number" }
				"devicetypesversion":{ name: "devicetypesversion",search: false, type: "number" }
				"nodesversion":		{ name: "nodesversion",	search: false, type: "number" }
				"nodegroupsversion":{ name: "nodegroupsversion",search: false, type: "number" }
				"jsonSettings":		{ name: "jsonSettings",	search: false, type: "json" }
				"tokencontingent": 	{ name: "tokencontingent",search: false, type: "number" }
				"remainingtokens": 	{ name: "remainingtokens",search: false, type: "number" }
				"_t": 				{ name: "_t",			search: false, type: "number", validation: { isRequired: true, equalOldValue: true, setTimestamp: true } }
				"_u": 				{ name: "_u",			search: false, type: "number", validation: { incrementOnSave: true } }
				"country": 			{ name: "country",		search: false, type: "string", validation: { isRequired: false } }
				"type": 				{ name: "type",			search: false, type: "number", validation: { isRequired: false }  }

			events:
				"set": ( eventname, err, res )->
					#console.log "EVENT", "STUDIOS-EVENT: set",  eventname, err, res
					return

				"mdel,del": ( eventname, err, res )->
					#console.log "EVENT", "STUDIOS-EVENT: mdel,del",  eventname, err, res
					return

				"mdel,del,set": ( eventname, err, res )->
					#console.log "EVENT", "STUDIOS-EVENT: mdel,del,set",  eventname, err, res
					return


		"Contracts":
			tablename: "contracts"
			sIdField: "id"
			useFieldsets: true
			fields:
				"id":				{ name: "id",			fieldsets: [ "ls", "det" ], search: false, type: "number" }
				"user_id": 			{ name: "user_id",		fieldsets: [ "ls", "det" ], search: false, type: "string" }
				"contractnumber":	{ name: "contractnumber",fieldsets: [ "ls", "det" ], search: false, type: "string" }
				"contracttype":		{ name: "contracttype",	fieldsets: [ "ls", "det" ], search: false, type: "number", validation: { isRequired: true } }
				"contractbegin":	{ name: "contractbegin",fieldsets: [ "det" ], search: false, type: "date", validation: { isRequired: true } }
				"paiduntil":		{ name: "paiduntil",	fieldsets: [ "det" ], search: false, type: "date" }
				"isautorenew":		{ name: "isautorenew",	fieldsets: [ "det" ], search: false, type: "boolean", validation: { isEmail: true } }
				"istest":			{ name: "istest",		fieldsets: [ "det" ], search: false, type: "boolean", validation: { isEmail: true } }
				"referrer_id":		{ name: "referrer_id",	fieldsets: [ "det" ], search: false, type: "rel_11", relModel: "Users" }
				"referrername":		{ name: "referrername",	fieldsets: [ "det" ], search: false, type: "string" }
				"studio_id":		{ name: "studio_id",	fieldsets: [ "ls", "det" ], search: false, type: "number" }
				"_t": 				{ name: "_t",			fieldsets: [ "det" ], search: false, type: "number", validation: { isRequired: true, equalOldValue: true, setTimestamp: true } }
				"_u": 				{ name: "_u",			fieldsets: [ "det" ], search: false, type: "number", validation: { incrementOnSave: true } }


			# solution to inject logic on events.
			events:
				"mdel,del": ( eventname, err, res )->
					#console.log "EVENT", "CONTRACTS-EVENT: mdel,del",  eventname, err, res
					return
							

				"set": ( eventname, err, res )->
					#console.log "EVENT", "CONTRACTS-EVENT: set",  eventname, err, res
					return
		
		"Tokens":
			tablename: "tokens"
			sIdField: "id"
			fields:
				"id": 				{ name: "id",			search: false, type: "number" }
				"user_id": 			{ name: "user_id",		search: false, type: "string", validation: { isRequired: true } }
				"studio_id": 		{ name: "studio_id",	search: false, type: "number", validation: { isRequired: true } }
				"token": 			{ name: "token",		search: false, type: "string", validation: { isRequired: true, allreadyExistend: "token" } }
				"_t": 				{ name: "_t",			search: false, type: "number", validation: { isRequired: true, equalOldValue: true, setTimestamp: true } }
				"_u": 				{ name: "_u",			search: false, type: "number", validation: { incrementOnSave: true } }


			events:
				"mdel,del,set": ( eventname, err, res )->
					#console.log "EVENT", "TOKENS-EVENT: mdel,del,set",  eventname, err, res
					return


		"Apikeys":
			tablename: "apikeys"
			sIdField: "apikey"
			hasStringId: true
			fields:
				"apikey": 			{ name: "apikey",		search: false, type: "string" }
				"studio_id": 		{ name: "studio_id",	search: false, type: "number", validation: { isRequired: true } }
				"jsonOptions":		{ name: "jsonOptions",	search: false, type: "json" }

			createIdString: ->
				utils.generateUID()
