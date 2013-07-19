module.exports = ( testTitle, _CONFIG, MySQLFactory, old = false )->
	_ = require("lodash")._
	should = require('should')
	moment = require('moment')
	_startTime = Date.now() - 1000 * 60
	_utils = require( "../lib/utils" )
	DBFactory = null

	cbMulti = ( count, cb )->
		return ->
			count--
			if count is 0
				cb()
			return

	describe "----- #{ testTitle } TESTS -----", ->
		before ( done )->
			done()
			return

		describe 'Initialization', ->
			it 'init factory', ( done )->
				DBFactory = new MySQLFactory( _CONFIG.mysql, _CONFIG.tables )
				done()
				return

		describe 'Factory Tests', ->
			unless old
				it "List the existing tables", ( done )->
					DBFactory.list ( err, tables )->
						throw err if err

						tables.should.eql( Object.keys( _CONFIG.tables ) )

						done()
					return

			it "Get a table", ( done )->

				_cnf = _CONFIG.tables[ _CONFIG.test.singleCreateTableTest ]

				_tbl = DBFactory.get( _CONFIG.test.singleCreateTableTest )
				_tbl.should.exist
				_tbl?.name?.should.eql( _cnf.name )

				done()
				return

			it "Try to get a not existend table", ( done )->

				_tbl = DBFactory.get( "notexistend" )
				should.not.exist( _tbl )

				done()
				return

			it "has for existend table", ( done )->

				_has = DBFactory.has( _CONFIG.test.singleCreateTableTest )
				_has.should.be.true unless old

				done()
				return

			it "has for not existend table", ( done )->

				_has = DBFactory.has( "notexistend" )
				_has.should.be.false unless old

				done()
				return

			return

		describe 'Table Tests', ->
			tbl = null
			tbl2 = null
			fieldsTest = [ "id", "firstname"  ]
			allFields = Object.keys( _CONFIG.tables[ _CONFIG.test.getTest.tbl ].fields )

			_saveUserId = null
			_saveUserT = 0

			_testUsers = [] 

			it "get test table", ( done )->

				tbl = DBFactory.get( _CONFIG.test.getTest.tbl )
				tbl?.name?.should.eql( _CONFIG.test.getTest.tbl )

				done()
				return

			it "get test table 2", ( done )->

				tbl2 = DBFactory.get( _CONFIG.test.tokenTable )
				tbl2?.name?.should.eql( _CONFIG.test.tokenTable )

				done()
				return

			it "TABLE.GET", ( done )->
				_id =  _CONFIG.test.getTest.id
				tbl.get _id, ( err, item )=>
					throw err if err

					should.exist( item.id )
					item.id.should.equal( _id )
					done()
					return
				return

			it "TABLE.GET fields as array", ( done )->

				_id =  _CONFIG.test.getTest.id
				tbl.get( _id, ( err, item )=>
					throw err if err
					should.exist( item.id )

					_keys = Object.keys( item )
					_.difference(_keys,fieldsTest).should.have.length(0)
					
					done()
					return
				, fields: fieldsTest )
				return

			it "TABLE.GET fields as string", ( done )->

				_id =  _CONFIG.test.getTest.id
				tbl.get( _id, ( err, item )=>
					throw err if err
					should.exist( item.id )

					_keys = Object.keys( item )
					_.difference(_keys,fieldsTest).should.have.length(0)
					done()
					return
				, fields: fieldsTest.join( ", " ) )
				return

			it "TABLE.GET fields as set", ( done )->

				_id =  _CONFIG.test.getTest.id
				tbl.get( _id, ( err, item )=>
					throw err if err
					should.exist( item.id )

					_keys = Object.keys( item )
					_.difference(_keys,fieldsTest).should.have.length(0)
					done()
					return
				, fields: "set:test" )
				return

			it "TABLE.GET fields `all`", ( done )->

				_id =  _CONFIG.test.getTest.id
				tbl.get( _id, ( err, item )=>
					throw err if err
					should.exist( item.id )
					_keys = Object.keys( item )
					_.difference(_keys,allFields).should.have.length(0)
					done()
					return
				, fields: "all" )
				return

			it "TABLE.GET fields `*`", ( done )->

				_id =  _CONFIG.test.getTest.id
				tbl.get( _id, ( err, item )=>
					throw err if err
					should.exist( item.id )

					_keys = Object.keys( item )
					_.difference(_keys,allFields).should.have.length(0)
					done()
					return
				, fields: "all" )
				return

			it "TABLE.GET fields `idonly`", ( done )->

				_id =  _CONFIG.test.getTest.id
				tbl.get( _id, ( err, item )=>
					throw err if err
					should.exist( item.id )

					_keys = Object.keys( item )
					_.difference(_keys,[ "id" ]).should.have.length(0)
					done()
					return
				, fields: "idonly" )
				return

			it "TABLE.GET fields by filter function", ( done )->

				_id =  _CONFIG.test.getTest.id
				tbl.get( _id, ( err, item )=>
					throw err if err
					should.exist( item.id )

					_keys = Object.keys( item )
					_.difference(_keys,[ "id", "_t", "_u" ]).should.have.length(0)
					done()
					return
				, fields: ( (fld)->
					fld.name.length <= 2 ) )
				return

			it "TABLE.MGET", ( done )->

				_ids = JSON.parse( JSON.stringify( _CONFIG.test.mgetTest.id ) )
				tbl.mget _ids, ( err, items )=>
					throw err if err
					items.should.have.length(2)
					_.difference(_CONFIG.test.mgetTest.id,_.pluck( items, "id" ) ).should.have.length(0)
					done()
					return

				return

			it "TABLE.FIND", ( done )->

				query = JSON.parse( JSON.stringify( _CONFIG.test.findTest.q ) )
				tbl.find query, ( err, items )=>
					throw err if err
					items.should.have.length(2)
					done()
					return

				return

			it "TABLE.FIND with limit", ( done )->

				query = JSON.parse( JSON.stringify( _CONFIG.test.findTest.q ) )
				query.limit = 1
				tbl.find( query, ( err, items )=>
					throw err if err
					items.should.have.length(1)
					done()
					return
				, {} )
				return

			it "TABLE.FIND with subquery", ( done )->

				query = 
					token: 
						"startsWith": "desfire-801e"
				opt = 
					_customQueryFilter:
						"user_id": 
							sub: 
								table: "contracts"
								field: "user_id"
								filter: 
									studio_id: 1
									contracttype: 1

				tbl2.find( query, ( err, items )=>
					throw err if err
					items.should.have.property( "length" ).and.be.above(1)
					done()
					return
				, opt )
				return

			unless old
				###
				it "TABLE.FIND with option `_customQueryFilter`", ( done )->

					query = _CONFIG.test.findTest.q
					tbl.find( query, ( err, items )=>
						should.exist( err )
						should.exist( err.name )
						err.name.should.equal( "deprecated-option" )
						done()
						return
					, { _customQueryFilter: "id = 'abcde'" } )
					return
				###

				it "TABLE.FIND with invalid filter", ( done )->

					tbl.find "wrong", ( err, items )=>
						should.exist( err )
						should.exist( err.name )
						err.name.should.equal( "invalid-filter" )
						done()
						return
					return

			it "TABLE.INSERT string-id", ( done )->
				data =
					firstname: "Test"
					lastname: "Test"
					gender: true
					role: "USER"
					email: "test.#{_utils.randomString( 5 )}@test.de"
					_t: 0

				tbl.set( data, ( err, item )=>
					throw err if err

					_saveUserId = item.id
					_saveUserT = item._t

					item.should.have.property('id')
					item.should.have.property('firstname').and.equal( "Test" )
					item.should.have.property('lastname').and.equal( "Test" )
					item.should.have.property('gender').and.equal( true )
					item.should.have.property('role').and.equal( "USER" )
					item.should.have.property('_t').and.be.above( _startTime )
					item.should.have.property('_u')

					done()
					return
				, {} )
				return

			it "TABLE.INSERT second test case", ( done )->
				data =
					firstname: "Test2"
					lastname: "Test"
					gender: true
					role: "USER"
					email: "test.#{_utils.randomString( 5 )}@test.de"
					_t: 0

				tbl.set( data, ( err, item )=>
					throw err if err

					_testUsers.push item
				
					item.should.have.property('id')
					item.should.have.property('firstname').and.equal( "Test2" )
					item.should.have.property('lastname').and.equal( "Test" )
					item.should.have.property('gender').and.equal( true )
					item.should.have.property('role').and.equal( "USER" )
					item.should.have.property('_t').and.be.above( _startTime )
					item.should.have.property('_u')

					done()
					return
				, {} )
				return

			it "TABLE.INSERT third test case", ( done )->
				data =
					firstname: "Test3"
					lastname: "Test"
					gender: false
					role: "USER"
					email: "test.#{_utils.randomString( 5 )}@test.de"
					_t: 0

				tbl.set( data, ( err, item )=>
					throw err if err

					_testUsers.push item
				
					item.should.have.property('id')
					item.should.have.property('firstname').and.equal( "Test3" )
					item.should.have.property('lastname').and.equal( "Test" )
					item.should.have.property('gender').and.equal( false )
					item.should.have.property('role').and.equal( "USER" )
					item.should.have.property('_t').and.be.above( _startTime )
					item.should.have.property('_u')

					done()
					return
				, {} )
				return

			it "TABLE.INSERT fourth test case", ( done )->
				data =
					firstname: "Test4"
					lastname: "Test"
					gender: true
					role: "USER"
					email: "test.#{_utils.randomString( 5 )}@test.de"
					_t: 0

				tbl.set( data, ( err, item )=>
					throw err if err

					_testUsers.push item
				
					item.should.have.property('id')
					item.should.have.property('firstname').and.equal( "Test4" )
					item.should.have.property('lastname').and.equal( "Test" )
					item.should.have.property('gender').and.equal( true )
					item.should.have.property('role').and.equal( "USER" )
					item.should.have.property('_t').and.be.above( _startTime )
					item.should.have.property('_u')

					done()
					return
				, {} )
				return

			it "TABLE.INSERT autoincrement-id", ( done )->
				data = JSON.parse( JSON.stringify( _CONFIG.test.insertTestToken ) )
				tbl2.set( data, ( err, item )=>
					throw err if err
					
					item.should.have.property('id')
					item.should.have.property('user_id')
					item.should.have.property('studio_id')
					item.should.have.property('token')
					item.should.have.property('_t').and.be.above( _startTime )
					item.should.have.property('_u')

					done()
					return
				, {} )
				return

			unless old
				it "TABLE.INSERT predefined string-id", ( done )->
					_id = _utils.randomString( 5 )
					data =
						id: _id
						firstname: "Test"
						lastname: "Test"
						gender: true
						role: "USER"
						_t: 0
					tbl.set( data, ( err, item )=>
						# special case. A predefined is could allready exist
						if err?.code is "ER_DUP_ENTRY"
							done()
							return

						throw err if err
						
						item.should.have.property('id').and.equal(_id)
						item.should.have.property('firstname').and.equal( "Test" )
						item.should.have.property('lastname').and.equal( "Test" )
						item.should.have.property('gender').and.equal( true )
						item.should.have.property('role').and.equal( "USER" )
						item.should.have.property('_t').and.be.within( _startTime, +Infinity )
						item.should.have.property('_u')

						done()
						return
					, {} )
					return

			
				it "TABLE.INSERT existing predefined string-id", ( done )->
					data =
						id: _CONFIG.test.getTest.id
						firstname: "Test"
						lastname: "Test"
						gender: true
						role: "USER"
						_t: 0
					tbl.set( data, ( err, item )=>
						should.exist( err )
						err.code.should.equal( "ER_DUP_ENTRY" )

						done()
						return
					, {} )
					return

			it "TABLE.UPDATE", ( done )->
				data = 
					lastname: "Update1"
					_t: _saveUserT
				tbl.set( _saveUserId, data, ( err, item )=>
					throw err if err

					item.should.have.property('lastname').and.equal( "Update1" )
					item.should.have.property('_u').and.equal( 1 )
					item.should.have.property('_t').and.be.within( _saveUserT, +Infinity )
					_saveUserT = item._t

					done()
					return
				, {} )
				return

			it "TABLE.UPDATE with crypting passowrd", ( done )->
				data =
					lastname: "Update2"
					password: "test"
					_t: _saveUserT

				tbl.set( _saveUserId, data, ( err, item )=>
					throw err if err

					item.should.have.property('lastname').and.equal( "Update2" )
					item.should.have.property('password').and.include( "$2a$08$" )

					item.should.have.property('_u').and.equal( 2 )
					item.should.have.property('_t').and.be.within( _saveUserT, +Infinity )

					_saveUserT = item._t

					done()
					return
				, {} )
				return

			it "TABLE.UPDATE with event check", ( done )->
				data =
					lastname: "Update3"
					birthday: new Date( 1950,5,15 )
					image: "testimage.jpg"
					role: "TRAINER"
					_t: _saveUserT
				
				_done = cbMulti 5, ->
					tbl.removeListener( "lastname.userchanged", fnEvnt1 )
					tbl.removeListener( "birthday.userchanged", fnEvnt2 )
					tbl.removeListener( "image.userchanged", fnEvnt3 )
					tbl.removeListener( "set", fnEvnt4 )
					done()
					return

				fnEvnt1 = ( field, oldValue, newValue, id )->
					id.should.equal( _saveUserId )
					oldValue.should.equal(  "Update2" )
					newValue.should.equal(  "Update3" )
					_done()
					return
				tbl.on "lastname.userchanged", fnEvnt1

				fnEvnt2 = ( field, oldValue, newValue, id )->
					id.should.equal( _saveUserId )
					should.not.exist( oldValue )
					newValue.toUTCString().should.equal(new Date( 1950,5,15 ).toUTCString())
					_done()
					return
				tbl.on "birthday.userchanged", fnEvnt2
				
				fnEvnt3 = ( field, oldValue, newValue, id )->
					id.should.equal( _saveUserId )
					should.not.exist( oldValue )
					newValue.should.equal(  "testimage.jpg" )
					_done()
					return
				tbl.on "image.userchanged", fnEvnt3

				fnEvnt4 = ( err, item )->
					item.should.have.property('lastname').and.equal( "Update3" )
					item.should.have.property('role').and.equal( "TRAINER" )

					item.should.have.property('_u').and.equal( 3 )
					item.should.have.property('_t').and.be.within( _saveUserT, +Infinity )
					_done()
					return
				tbl.on "set", fnEvnt4
				

				tbl.set( _saveUserId, data, ( err, item )=>
					throw err if err

					item.should.have.property('lastname').and.equal( "Update3" )
					item.should.have.property('role').and.equal( "TRAINER" )

					item.should.have.property('_u').and.equal( 3 )
					item.should.have.property('_t').and.be.within( _saveUserT, +Infinity )

					_saveUserT = item._t

					_done()
					return
				, {} )
				return

			it "TABLE.UPDATE with invalid role", ( done )->

				data =
					lastname: "Update4"
					role: "MILON"
					_t: _saveUserT

				tbl.set( _saveUserId, data, ( err, item )=>
					should.exist( err )
					should.exist( err.name )
					err.name.should.equal( "value-not-allowed" )

					done()
					return
				, {} )
				return

			it "TABLE.UPDATE with with json object", ( done )->
				data =
					lastname: "Update5"
					jsonSettings: 
						a: 123
						b: 456
					_t: _saveUserT

				tbl.set( _saveUserId, data, ( err, item )=>
					throw err if err

					item.should.have.property('lastname').and.equal( "Update5" )

					item.should.have.property('jsonSettings').and.eql
						a: 123
						b: 456

					item.should.have.property('_u').and.equal( 4 )
					item.should.have.property('_t').and.be.within( _saveUserT, +Infinity )

					

					done()
					return
				, {} )
				return

			it "TABLE.UPDATE with wrong `_t` check", ( done )->
				data =
					lastname: "Update6"
					_t: _startTime

				tbl.set( _saveUserId, data, ( err, item )=>
					should.exist( err )
					should.exist( err.name )
					err.name.should.equal( "validation-notequal" )

					should.exist( err.field )
					err.field.should.equal( "_t" )
					
					should.exist( err.value )
					err.value.should.equal( _startTime )

					should.exist( err.curr )
					err.curr.should.equal( _saveUserT )

					done()
					return
				, {} )
				return

			it "TABLE.UPDATE try a manual of `_u`", ( done )->
				data =
					lastname: "Update7"
					_u: 99

				tbl.set( _saveUserId, data, ( err, item )=>
					throw err if err

					item.should.have.property('lastname').and.equal( "Update7" )
					item.should.have.property('_u').and.equal( 5 )
					item.should.have.property('_t').and.be.within( _saveUserT, +Infinity )

					_saveUserT = item._t

					done()
					return
				, {} )
				return

			it "TABLE.UPDATE with existing `mail`", ( done )->
				data =
					lastname: "Update7"
					email: "testmilon@test.de"
					_t: _saveUserT

				tbl.set( _saveUserId, data, ( err, item )=>
					should.exist( err )
					should.exist( err.name )
					err.name.should.equal( "validation-already-existend" )

					should.exist( err.field )
					err.field.should.equal( "email" )


					should.exist( err.value )
					err.value.should.equal( "testmilon@test.de" )
					
					done()
					return
				, {} )
				return

			it "TABLE.HAS", ( done )->
				tbl.has( _saveUserId, ( err, existend )=>
					throw err if err
					existend.should.be.ok
					done()
					return
				, {} )
				return

			it "TABLE.HAS not existend", ( done )->
				tbl.has( "notexist", ( err, existend )=>
					throw err if err
					existend.should.not.be.ok
					done()
					return
				, {} )
				return

			it "TABLE.COUNT", ( done )->
				filter = 
					firstname: "Maxi"
					role: "TRAINER"
				tbl.count( filter, ( err, count )=>
					throw err if err
					should.exist( count )
					count.should.equal( 2 )
					done()
					return
				, {} )
				return

			it "TABLE.COUNT empty", ( done )->
				filter = 
					firstname: "Maxi"
					role: "INVALIDROLE"
				tbl.count( filter, ( err, count )=>
					throw err if err
					should.exist( count )
					count.should.equal( 0 )
					done()
					return
				, {} )
				return

			it "TABLE.INCREMENT", ( done )->
				tbl.increment( _saveUserId, "plansversion", ( err, count )=>
					throw err if err
					should.exist( count )
					count.should.equal( 1 )
					done()
					return
				, {} )
				return

			it "TABLE.INCREMENT second increment", ( done )->
				tbl.increment( _saveUserId, "plansversion", ( err, count )=>
					throw err if err
					should.exist( count )
					count.should.equal( 2 )
					done()
					return
				, {} )
				return

			it "TABLE.INCREMENT unknown field", ( done )->
				tbl.increment( _saveUserId, "unknown", ( err, count )=>
					should.exist( err )
					should.exist( err.name )
					err.name.should.equal( "invalid-field" )

					should.exist( err.field )
					err.field.should.equal( "unknown" )

					done()
					return
				, {} )
				return

			it "TABLE.INCREMENT unknown id", ( done )->
				tbl.increment( "unknown", "plansversion", ( err, count )=>
					should.exist( err )
					should.exist( err.name )
					err.name.should.equal( "not-found" )

					done()
					return
				, {} )
				return

			it "TABLE.DECREMENT", ( done )->
				tbl.decrement( _saveUserId, "plansversion", ( err, count )=>
					throw err if err
					should.exist( count )
					count.should.equal( 1 )
					done()
					return
				, {} )
				return

			it "TABLE.INCREMENT unknown field", ( done )->
				tbl.decrement( _saveUserId, "unknown", ( err, count )=>
					should.exist( err )
					should.exist( err.name )
					err.name.should.equal( "invalid-field" )

					should.exist( err.field )
					err.field.should.equal( "unknown" )

					done()
					return
				, {} )
				return

			it "TABLE.INCREMENT unknown id", ( done )->
				tbl.decrement( "unknown", "plansversion", ( err, count )=>
					should.exist( err )
					should.exist( err.name )
					err.name.should.equal( "not-found" )

					done()
					return
				, {} )
				return

			it "TABLE.DEL", ( done )->
				
				_usr = _testUsers[ 0 ]

				tbl.del( _usr.id, ( err, item )=>
					throw err if err

					item.should.have.property('id')
					item.should.have.property('firstname').and.equal( "Test2" )
					item.should.have.property('lastname').and.equal( "Test" )
					item.should.have.property('gender').and.equal( true )
					item.should.have.property('role').and.equal( "USER" )
					item.should.have.property('_u')
 
					done()
					return
				, {} )
				return

			it "TABLE.GET deleted", ( done )->
				
				_usr = _testUsers[ 0 ]

				tbl.get( _usr.id, ( err, item )=>
					should.exist( err )
					should.exist( err.name )
					err.name.should.equal( "not-found" )
					
					done()
					return
				, {} )
				return

			it "TABLE.DEL deleted", ( done )->
				
				_usr = _testUsers[ 0 ]
				tbl.del( _usr.id, ( err, item )=>
					should.exist( err )
					should.exist( err.name )
					err.name.should.equal( "not-found" )
					
					done()
					return
				, {} )
				return

			it "TABLE.MDEL", ( done )->
				_usrA = _testUsers[ 1 ]
				_usrB = _testUsers[ 2 ]
				ids = [ _usrA.id, _usrB.id ]
				tbl.mdel( ids, ( err, items )=>
					throw err if err

					_.difference(ids,_.pluck( items, "id" ) ).should.have.length(0)

					done()
					return
				, {} )
				return



				