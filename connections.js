
module.exports.connections = {

//MYSQL WORKBENCH VERSION NUEVA
/*someMysqlServer: {
    adapter: 'sails-mysql',
    host: '127.0.0.1',
    user: 'root',
    password: '192511244',
    database: 'aog_development'
  },*/

  //DOCKERMYSQL WORKBENCH VERSION 5.1.73
  //Example docker command
  //$ docker run -d --name mysql5.1 -p 3306:3306 -e MYSQL_ROOT_PASSWORD=12345 vsamov/mysql-5.1.73:latest
  someMysqlServer: {
      adapter: 'sails-mysql',
      host: '0.0.0.0',
      user: 'root',
      port:'3307',
      password: '12345',
      database: 'aog_development'
    }
  };
