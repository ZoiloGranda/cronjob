var _ = require('lodash');
var path = require('path');
var globals = require('./globals.js');
var mysqlcon = require('./config/database.js').mysqlConnection();
var xlsx = require('node-xlsx');
var fs = require('fs');
var cron = require('node-cron');

console.log('Starting CronJob...');
console.log('Running task every 20 seconds');
writeLog('Starting CronJob...');
writeLog('Running task every 20 seconds');
cron.schedule('*/20 * * * * *', function(){
  logStart();
  xlsToTempTable();
  tempTableToMaintenix();
  deleteNullRows();
});

function logStart() {
  writeLog('///////////////////////////////////\n///////////////////////////////////\nStarting log for '+ new Date());
}

function xlsToTempTable() {
  var queryDrop = 'DROP TABLE IF EXISTS tempTable';
  mysqlcon.query(queryDrop, function (error, results, fields) {
    if (error) {
      writeLog('Error dropping table tempTable \n'+error.stack+'\n >>>>>> END ERROR <<<<<<');
      console.trace(error);
    } else {
      console.log('Droped Table tempTable');
      writeLog('Droped Table tempTable');
    }
  })
  var queryCreate = 'CREATE TABLE tempTable LIKE maintenix;'
  mysqlcon.query(queryCreate, function (error, results, fields) {
    if (error) {
      writeLog('Error creating table tempTable \n'+error.stack+'\n >>>>>> END ERROR <<<<<<');
      console.trace(error);
    } else {
      console.log('Created new Table tempTable');
      writeLog('Created new Table tempTable');
    }
  })
  var obj = xlsx.parse(globals.globals.EXCELPATH);
  var rows = [];
  var writeStr = "";
  for (var i = 0; i < obj.length; i++) {
    var sheet = obj[i];
    for (var j = 0; j < sheet['data'].length; j++) {
      rows.push(sheet['data'][j]);
    }
  }
  for (var i = 0; i < rows.length; i++) {
    writeStr += rows[i].join(",") + "\n";
  }
  var date = new Date();
  date = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
  var csvPath = globals.globals.LOGPATH.replace(/\.[^/.]+$/, "")+date+'.csv';
  fs.writeFile(csvPath, writeStr, function(err) {
    if (err) {
      writeLog('Error writing csv file \n'+err.stack+'\n >>>>>> END ERROR <<<<<<');
      console.log(err);
    }
    console.log('Converted CSV file '+csvPath);
    writeLog('Converted CSV file '+csvPath);
  });
  var queryLoadCSV = 'LOAD DATA LOCAL INFILE \''+csvPath+'\' INTO TABLE tempTable FIELDS TERMINATED BY \',\' ENCLOSED BY \'"\' LINES TERMINATED BY \'\n\' IGNORE 1 LINES';
  mysqlcon.query(queryLoadCSV, function (error, results, fields) {
    if (error) {
      writeLog('Error loading CSV into tempTable \n'+error.stack+'\n >>>>>> END ERROR <<<<<<');
      console.trace(error);
    } else {
      console.log('Data loaded successfully into table tempTable');
      writeLog('Data loaded successfully into table tempTable');
    }
  })
};

function tempTableToMaintenix() {
  var queryLoadData = 'INSERT INTO `maintenix` (`AC`,`LOCATION`,`PART_REQUEST`,`PART_REQUEST_STATUS`,`PRIORITY_CD`,\
    `PART_NO`,`QTY_UNIT_CD`,`PART_TYPE_CD`,`PART_USE_CD`,`INV_CLASS_CD`,`TASK_BARCODE`,\
    `TASK_NAME`,`TASK_STATUS`,`WP_BARCODE`,`WP_NAME`,`WP_STATUS`,`WORK_TYPE_CD`,`REQ_QT`,\
    `REQUEST_CREATION`,`TASK_CREATION`)\
    SELECT `AC`,`LOCATION`,`PART_REQUEST`,`PART_REQUEST_STATUS`,`PRIORITY_CD`,`PART_NO`,\
    `QTY_UNIT_CD`,`PART_TYPE_CD`,`PART_USE_CD`,`INV_CLASS_CD`,`TASK_BARCODE`,`TASK_NAME`,\
    `TASK_STATUS`,`WP_BARCODE`,`WP_NAME`,`WP_STATUS`,`WORK_TYPE_CD`,`REQ_QT`,`REQUEST_CREATION`,\
    `TASK_CREATION` \
    FROM `tempTable`\
    ON DUPLICATE KEY UPDATE `maintenix`.`AC`=`tempTable`.`AC`,\
    `maintenix`.`LOCATION`=`tempTable`.`LOCATION`,\
    `maintenix`.`PART_REQUEST`=`tempTable`.`PART_REQUEST`,\
    `maintenix`.`PART_REQUEST_STATUS`=`tempTable`.`PART_REQUEST_STATUS`,\
    `maintenix`.`PRIORITY_CD`=`tempTable`.`PRIORITY_CD`,\
    `maintenix`.`PART_NO`=`tempTable`.`PART_NO`,\
    `maintenix`.`QTY_UNIT_CD`=`tempTable`.`QTY_UNIT_CD`,\
    `maintenix`.`PART_TYPE_CD`=`tempTable`.`PART_TYPE_CD`,\
    `maintenix`.`PART_USE_CD`=`tempTable`.`PART_USE_CD`,\
    `maintenix`.`INV_CLASS_CD`=`tempTable`.`INV_CLASS_CD`,\
    `maintenix`.`TASK_BARCODE`=`tempTable`.`TASK_BARCODE`,\
    `maintenix`.`TASK_NAME`=`tempTable`.`TASK_NAME`,\
    `maintenix`.`TASK_STATUS`=`tempTable`.`TASK_STATUS`,\
    `maintenix`.`WP_BARCODE`=`tempTable`.`WP_BARCODE`,\
    `maintenix`.`WP_NAME`=`tempTable`.`WP_NAME`,\
    `maintenix`.`WP_STATUS`=`tempTable`.`WP_STATUS`,\
    `maintenix`.`WORK_TYPE_CD`=`tempTable`.`WORK_TYPE_CD`,\
    `maintenix`.`REQ_QT`=`tempTable`.`REQ_QT`,\
    `maintenix`.`REQUEST_CREATION`=`tempTable`.`REQUEST_CREATION`,\
    `maintenix`.`TASK_CREATION`=`tempTable`.`TASK_CREATION`';
    mysqlcon.query(queryLoadData, function (error, results, fields) {
      if (error) {
        writeLog('Error loading data into maintenix table \n'+error.stack+'\n >>>>>> END ERROR <<<<<<');
        console.trace(error);
      } else {
        console.log('Data loaded into table maintenix successfully');
        writeLog('Data loaded into table maintenix successfully');
      }
    })
  }

  function deleteNullRows() {
    var queryDeleteNulls = 'DELETE FROM `aog_development`.`maintenix`\
    WHERE `AC` = "" AND `LOCATION` IS NULL AND `PART_REQUEST` IS NULL AND `PART_REQUEST_STATUS` IS NULL AND\
    `PRIORITY_CD` IS NULL AND `PART_NO` IS NULL AND `QTY_UNIT_CD` IS NULL AND `PART_TYPE_CD` IS NULL AND\
    `PART_USE_CD` IS NULL AND `INV_CLASS_CD` IS NULL AND `TASK_BARCODE` IS NULL AND `TASK_NAME` IS NULL AND\
    `TASK_STATUS` IS NULL AND `WP_BARCODE` IS NULL AND `WP_NAME` IS NULL AND `WP_STATUS` IS NULL AND\
    `WORK_TYPE_CD` IS NULL AND `REQ_QT` IS NULL AND `REQUEST_CREATION`  IS NULL AND`TASK_CREATION`  IS NULL;';
    mysqlcon.query(queryDeleteNulls, function (error, results, fields) {
      if (error) {
        writeLog('Error deleting null rows from maintenix table \n'+error.stack+'\n >>>>>> END ERROR <<<<<<');
        console.trace(error);
      } else {
        console.log('Deleted null rows successfully');
        writeLog('Deleted null rows successfully');
      }
      ;
    })
  }

  function writeLog(newLine){
    var date = new Date();
    date = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
    newLine+='\n';
    fs.appendFile(path.resolve('log', globals.globals.LOGPATH+date+'.txt'), newLine, function (err) {
      if (err) {
        console.trace(err);
      };
    });
  }
