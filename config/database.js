var dotEnv = require('dotenv');
dotEnv.config();

var mysql = require('mysql');
var path = require('path');

module.exports = {
  mysqlConnection: function() {
    return mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        port: process.env.DB_PORT,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    })
  }
};
