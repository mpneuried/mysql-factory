module.exports = ( testTitle, _CONFIG, MySQLFactory, old = false )->
	_ = require("lodash")._
	should = require('should')

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
			fieldsTest = [ "id", "firstname"  ]
			allFields = Object.keys( _CONFIG.tables[ _CONFIG.test.getTest.tbl ].fields )
			it "get test table", ( done )->

				tbl = DBFactory.get( _CONFIG.test.getTest.tbl )
				tbl?.name?.should.eql( _CONFIG.test.getTest.tbl )

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