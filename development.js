var mysql = require('mysql');
var path = require('path');
var connections = require('./connections.js');

module.exports = {
  models: {
    connection: 'someMysqlServer'
  },
  log: {
    level: "info"
  },
  //to use the connection just use (change path to corresponding folderh)
  //var mysqlcon = require(path.join(path.resolve(), 'config/env', 'development.js')).mysqlConnection();
  mysqlConnection: function() {
    return mysql.createConnection({
      host: connections.connections.someMysqlServer.host,
      user: connections.connections.someMysqlServer.user,
      port: connections.connections.someMysqlServer.port,
      password: connections.connections.someMysqlServer.password,
      database: connections.connections.someMysqlServer.database
    })
  }
};
