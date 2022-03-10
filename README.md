# mysql-factory

[![Build Status](https://david-dm.org/mpneuried/mysql-factory.png)](https://david-dm.org/mpneuried/mysql-factory)
[![NPM version](https://badge.fury.io/js/mysql-factory.png)](http://badge.fury.io/js/mysql-factory)

MySQL ORM solution to simplify the usage of the mysql connector.

[![NPM](https://nodei.co/npm/mysql-factory.png?downloads=true&stars=true)](https://nodei.co/npm/mysql-factory/)

## Test

to run the test start the projects compose mysql server and call:

```sql
MYSQLFAC_TEST_USER=root MYSQLFAC_TEST_PW=abcdefgh MYSQLFAC_TEST_DB=milon_care npm test
```

## Release History

| Version |    Date    | Description                                                                                                 |
| :-----: | :--------: | :---------------------------------------------------------------------------------------------------------- |
|  2.1.1  | 2022-03-09 | wrap all set/insert fields definitions with ` to prevent errors with colliding reserved words; updated deps |
|  2.0.0  | 2018-12-08 | Updated dependencies and require at least node 10                                                           |
|  1.2.2  | 2017-08-10 | Updated dependencies                                                                                        |
|  1.2.1  | 2016-08-10 | Fixed empty id list in mget                                                                                 |
|  1.2.0  | 2016-07-18 | Added table default limit configuration                                                                     |
|  1.1.0  | 2016-07-08 | Added `_customQueryFilter` option to teh methods `.get`, `.mget`, `.has`, `.del` and `._update`             |
|  1.0.0  | 2016-05-09 | String-ID with numbers; Updated dependencies. Especially lodash to 4.x                                      |

[![NPM](https://nodei.co/npm-dl/mysql-factory.png?months=6)](https://nodei.co/npm/mysql-factory/)

## Other projects

| Name                                                                              | Description                                                                                                                                                                                                                 |
| :-------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**node-cache**](https://github.com/tcs-de/nodecache)                             | Simple and fast NodeJS internal caching. Node internal in memory cache like memcached.                                                                                                                                      |
| [**rsmq**](https://github.com/smrchy/rsmq)                                        | A really simple message queue based on redis                                                                                                                                                                                |
| [**redis-heartbeat**](https://github.com/mpneuried/redis-heartbeat)               | Pulse a heartbeat to redis. This can be used to detach or attach servers to nginx or similar problems.                                                                                                                      |
| [**systemhealth**](https://github.com/mpneuried/systemhealth)                     | Node module to run simple custom checks for your machine or it's connections. It will use [redis-heartbeat](https://github.com/mpneuried/redis-heartbeat) to send the current state to redis.                               |
| [**rsmq-cli**](https://github.com/mpneuried/rsmq-cli)                             | a terminal client for rsmq                                                                                                                                                                                                  |
| [**nsq-logger**](https://github.com/mpneuried/nsq-logger)                         | Nsq service to read messages from all topics listed within a list of nsqlookupd services.                                                                                                                                   |
| [**nsq-nodes**](https://github.com/mpneuried/nsq-nodes)                           | Nsq helper to poll a nsqlookupd service for all it's nodes and mirror it locally.                                                                                                                                           |
| [**nsq-watch**](https://github.com/mpneuried/nsq-watch)                           | Watch one or many topics for unprocessed messages.                                                                                                                                                                          |
| [**rest-rsmq**](https://github.com/smrchy/rest-rsmq)                              | REST interface for.                                                                                                                                                                                                         |
| [**redis-sessions**](https://github.com/smrchy/redis-sessions)                    | An advanced session store for NodeJS and Redis                                                                                                                                                                              |
| [**connect-redis-sessions**](https://github.com/mpneuried/connect-redis-sessions) | A connect or express middleware to simply use the [redis sessions](https://github.com/smrchy/redis-sessions). With [redis sessions](https://github.com/smrchy/redis-sessions) you can handle multiple sessions per user_id. |
| [**redis-notifications**](https://github.com/mpneuried/redis-notifications)       | A redis based notification engine. It implements the rsmq-worker to safely create notifications and recurring reports.                                                                                                      |
| [**hyperrequest**](https://github.com/mpneuried/hyperrequest)                     | A wrapper around [hyperquest](https://github.com/substack/hyperquest) to handle the results                                                                                                                                 |
| [**task-queue-worker**](https://github.com/smrchy/task-queue-worker)              | A powerful tool for background processing of tasks that are run by making standard http requests                                                                                                                            |
| [**soyer**](https://github.com/mpneuried/soyer)                                   | Soyer is small lib for server side use of Google Closure Templates with node.js.                                                                                                                                            |
| [**grunt-soy-compile**](https://github.com/mpneuried/grunt-soy-compile)           | Compile Goggle Closure Templates ( SOY ) templates including the handling of XLIFF language files.                                                                                                                          |
| [**backlunr**](https://github.com/mpneuried/backlunr)                             | A solution to bring Backbone Collections together with the browser fulltext search engine Lunr.js                                                                                                                           |
| [**domel**](https://github.com/mpneuried/domel)                                   | A simple dom helper if you want to get rid of jQuery                                                                                                                                                                        |
| [**obj-schema**](https://github.com/mpneuried/obj-schema)                         | Simple module to validate an object by a predefined schema                                                                                                                                                                  |

## The MIT License (MIT)

Copyright © 2016 M. Peter, http://www.tcs.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
