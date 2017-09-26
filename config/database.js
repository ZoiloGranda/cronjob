var dotEnv = require('dotenv');
dotEnv.config();

var mysql = require('mysql');
var path = require('path');

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
        adapter: process.env.DB_ADAPTER,
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        port: process.env.DB_PORT,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    })
  }
};
