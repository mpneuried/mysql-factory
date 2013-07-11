_CONFIG = require './config'

_ = require("lodash")._
should = require('should')

MySQLFactory = require( "../index" )
_utils = require( "../lib/utils" )

testTitle = "mySQL Factory"

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
			_has.should.be.true

			done()
			return

		it "has for not existend table", ( done )->

			_has = DBFactory.has( "notexistend" )
			_has.should.be.false

			done()
			return

		return

	describe 'Table Tests', ->
		tbl = null
		it "get test table", ( done )->

			tbl = DBFactory.get( _CONFIG.test.getTest.tbl )
			tbl?.name?.should.eql( _CONFIG.test.getTest.tbl )

			done()
			return

		it "table.get", ( done )->
			_id =  _CONFIG.test.getTest.id
			tbl.get _id, ( err, result )=>
				throw err if err

				should.exist( result.id )

				item.id.should.equal( _id )
				done()
				return
			return