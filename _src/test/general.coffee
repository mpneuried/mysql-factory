_CONFIG = require './config'


MySQLFactory = require( "../index" )

testTitle = "mySQL Factory"


require( "./tests" )( testTitle, _CONFIG, MySQLFactory )
