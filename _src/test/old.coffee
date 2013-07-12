_CONFIG = require './config'
# building db connection with the db connector library
DBConnector = require( "../old/dbconnector" )
root.dbC = 

MySQLFactory = require( "../old/modelfactory" )

testTitle = "Model-Factory OLD"

_CONFIG.mysql = new DBConnector( _CONFIG.mysql )


require( "./tests" )( testTitle, _CONFIG, MySQLFactory, true )

