module.exports = ( testTitle, _CONFIG, MySQLFactory, old = false )->
	_ = require("lodash")._
	should = require('should')
	_startTime = Date.now() - 1000 * 60
	_utils = require( "../lib/utils" )
	DBFactory = null
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

			unless old
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


				it "TABLE.FIND with invalid filter", ( done )->

					tbl.find "wrong", ( err, items )=>
						should.exist( err )
						should.exist( err.name )
						err.name.should.equal( "invalid-filter" )
						done()
						return
					return

			it "TABLE.INSERT string-id", ( done )->
				data = JSON.parse( JSON.stringify( _CONFIG.test.insertTest ) )
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
					data = JSON.parse( JSON.stringify( _CONFIG.test.insertTest ) )
					_id = _utils.randomString( 5 )
					data[ "id" ] = _id
					tbl.set( data, ( err, item )=>
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
					data = JSON.parse( JSON.stringify( _CONFIG.test.insertTest ) )
					data[ "id" ] = _CONFIG.test.getTest.id
					tbl.set( data, ( err, item )=>
						should.exist( err )
						err.code.should.equal( "ER_DUP_ENTRY" )

						done()
						return
					, {} )
					return

			it "TABLE.UPDATE", ( done )->
				data = JSON.parse( JSON.stringify( _CONFIG.test.updateTest[ 0 ] ) )
				data._t = _saveUserT
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
				data = JSON.parse( JSON.stringify( _CONFIG.test.updateTest[ 1 ] ) )
				data._t = _saveUserT

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