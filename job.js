var _ = require('lodash');
var path = require('path');
var globals = require('./globals.js');
var mysqlcon = require('./development.js').mysqlConnection();
var xlsx = require('node-xlsx');
var fs = require('fs');
var XLSX = require('xlsx');
var cron = require('node-cron');

console.log('Starting CronJob...');
cron.schedule('*/20 * * * * *', function(){
  //importData();
  xlsToTempTable();
  tempTableToMaintenix()
  console.log('Running task every 24 hours');
  writeLog('Running task every 24 hours');
});
/*
function importData() {
  mysqlcon.query('SHOW TABLES FROM '+mysqlcon.config.database+' LIKE \'maintenix\'', function (error, results, fields) {
    if (error){ throw error;}
    if (results[0]==undefined) {
      console.log('Creating Table maintenix');
      writeLog('Creating Table maintenix');
      var queryCreateTable =
      'CREATE TABLE `maintenix` (\
        `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,\
        `AC` varchar(255) DEFAULT NULL,\
        `aircraft_id` varchar(255) DEFAULT NULL,\
        `LOCATION` varchar(255) DEFAULT NULL,\
        `base_id` int(11) DEFAULT NULL,\
        `PART_REQUEST` varchar(255) DEFAULT NULL,\
        `request_date_aog` datetime,\
        `PART_REQUEST_STATUS` varchar(255) DEFAULT NULL,\
        `PRIORITY_CD` varchar(255) DEFAULT NULL,\
        `PART_NO` varchar(255) DEFAULT NULL,\
        `part_id` int(11) DEFAULT NULL,\
        `TASK_BARCODE` varchar(255) DEFAULT NULL,\
        `TASK_NAME` varchar(255) DEFAULT NULL,\
        `TASK_STATUS` varchar(255) DEFAULT NULL,\
        `WP_BARCODE` varchar(255) DEFAULT NULL,\
        `WP_NAME` varchar(255) DEFAULT NULL,\
        `WP_STATUS` varchar(255) DEFAULT NULL,\
        `WORK_TYPE_CD` varchar(255) DEFAULT NULL,\
        CONSTRAINT U_request UNIQUE (`aircraft_id`, `base_id`, `PART_REQUEST`, `request_date_aog`)\
      ) ENGINE=MyISAM DEFAULT CHARSET=latin1';
      mysqlcon.query(queryCreateTable, function (error, results, fields) {
        if (error) throw error;
        console.log('Table maintenix created successfully');
        writeLog('Table maintenix created successfully');
      })
    } else {
      console.log('Table maintenix already created, proceding to load data from excel file');
      writeLog('Table maintenix already created, proceding to load data from excel file');
    }
  });
}
*/

function xlsToTempTable() {
  var workbook = XLSX.readFile(globals.globals.EXCELPATH, { sheetRows: 1 });
  var workbook2 = XLSX.readFile(globals.globals.EXCELPATH);
  var prequery = '';
  var aircraftsIds=[];
  var baseIds=[];
  var partIds=[];
  _.forEach(workbook2.Sheets['Sheet 1'], function(value, key) {
    if (key.charAt()=='A'){
      aircraftsIds.push(value.v);
    }
    if (key.charAt()=='B'){
      baseIds.push(value.v);
    }
    if (key.charAt()=='F'){
      partIds.push(value.v);
    }
  });
  _.forEach(workbook.Sheets['Sheet 1'], function(value, key) {
    if (value.v) {
      prequery += ' ' + value.v + ' VARCHAR(255),';
    }
  });
  prequery = prequery.replace(/,\s*$/, "");
  var queryDrop = 'DROP TABLE IF EXISTS tempTable';
  var queryCreate = 'CREATE TABLE tempTable LIKE maintenix;'
  var dropTable = mysqlcon.query(queryDrop);
  dropTable.on('error', function(err) {
    if (err)
    console.trace('error:', err);
  })
  .on('result', function(result) {
    console.log('Droped Table tempTable');
    writeLog('Droped Table tempTable');
  })
  var createTable = mysqlcon.query(queryCreate);
  createTable.on('error', function(err) {
    if (err)
    console.trace('error:', err);
  })
  .on('result', function(result) {
    console.log('Created new Table tempTable');
    writeLog('Created new Table tempTable');
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
  var csvPath = globals.globals.EXCELPATH.replace(/\.[^/.]+$/, "")+date+'.csv';
  fs.writeFile(csvPath, writeStr, function(err) {
    if (err) {
      return console.log(err);
    }
    console.log('Converted CSV file '+csvPath);
    writeLog('Converted CSV file '+csvPath);
  });
  var queryLoadCSV = 'LOAD DATA LOCAL INFILE \''+csvPath+'\' INTO TABLE tempTable FIELDS TERMINATED BY \',\' ENCLOSED BY \'"\' LINES TERMINATED BY \'\n\' IGNORE 1 LINES'
  var loadCSV = mysqlcon.query(queryLoadCSV);
  loadCSV.on('error', function(err) {
    if (err)
    console.trace('error:', err);
  })
  .on('result', function(result) {
    console.log('Data loaded successfully into table tempTable');
    writeLog('Data loaded successfully into table tempTable');
  })
  /*
  //ADD COLUMN aircraft_id
  var addAircraftIdColumn = mysqlcon.query('ALTER TABLE tempTable ADD COLUMN aircraft_id VARCHAR(255) AFTER AC;');
  addAircraftIdColumn.on('error', function(err) {
    if (err)
    console.trace('error:', err);
  })
  .on('result', function(result) {
    console.log('Added aircraft_id column successfully');
    writeLog('Added aircraft_id column successfully');
  })
  // Add ids to aircraft_id
  aircraftsIds = _.uniq(aircraftsIds);
  aircraftsIds.shift();
  _.forEach(aircraftsIds, function(value, key) {
    var fillAircraft_id = mysqlcon.query('UPDATE aog_development.tempTable \
    SET tempTable.aircraft_id = (SELECT id FROM aog_development.tbas_aircraft \
      WHERE tbas_aircraft.license_place = "'+value+'")\
      WHERE tempTable.AC = "'+value+'";');
      fillAircraft_id.on('error', function(err) {
        if (err)
        console.trace('error:', err);
      })
      .on('result', function(result) {
        console.log('Added Aircraft'+value+ ' successfully');
        writeLog('Added Aircraft'+value+ ' successfully');
      })
    });
    //ADD COLUMN base_id
    var addBaseIdColumn = mysqlcon.query('ALTER TABLE tempTable ADD COLUMN base_id INT AFTER LOCATION;');
    addAircraftIdColumn.on('error', function(err) {
      if (err)
      console.trace('error:', err);
    })
    .on('result', function(result) {
      console.log('Added base_id column successfully');
      writeLog('Added base_id column successfully');

    })
    // Add ids to base_id
    baseIds = _.uniq(baseIds);
    baseIds.shift();
    _.forEach(baseIds, function(value, key) {
      var fillAircraft_id = mysqlcon.query('UPDATE aog_development.tempTable \
      SET tempTable.base_id= (\
        SELECT id FROM aog_development.tbas_base\
        WHERE tbas_base.code = "'+value.slice(0,3)+'")\
        WHERE tempTable.LOCATION = "'+value+'";');
        fillAircraft_id.on('error', function(err) {
          if (err)
          console.trace('error:', err);
        })
        .on('result', function(result) {
          console.log('Added Base '+value+ ' successfully');
          writeLog('Added Base '+value+ ' successfully');

        })
      });
      //ADD COLUMN part_id
      var addPartIdColumn = mysqlcon.query('ALTER TABLE tempTable ADD COLUMN part_id INT AFTER PART_NO;');
      addPartIdColumn.on('error', function(err) {
        if (err)
        console.trace('error:', err);
      })
      .on('result', function(result) {
        console.log('Added part_id column successfully');
        writeLog('Added part_id column successfully');
      })
      //ADD COLUMN request_date_aog
      var addRequestDateAogColumn = mysqlcon.query('ALTER TABLE aog_development.tempTable \
      ADD COLUMN request_date_aog DATETIME\
      AFTER PART_REQUEST;');
      addRequestDateAogColumn.on('error', function(err) {
        if (err)
        console.trace('error:', err);
      })
      .on('result', function(result) {
        console.log('Added request_date_aog column successfully');
        writeLog('Added request_date_aog column successfully');
      })
      // Add ids to part_id
      partIds = _.uniq(partIds);
      partIds.shift();
      _.forEach(partIds, function(value, key) {
        var fillPart_id = mysqlcon.query("UPDATE aog_development.tempTable \
        SET tempTable.part_id= (\
          SELECT id FROM aog_development.tbas_element\
          WHERE tbas_element.number = '"+value.replace('"', '')+"')\
          , tempTable.request_date_aog = '"+randomDate(0987906428957,5098765431296,1,23)+"' \
          WHERE tempTable.PART_NO = '"+value+"';");
          fillPart_id.on('error', function(err) {
            if (err)
            console.trace('error:', err);
          })
          .on('result', function(result) {
            console.log('Added Part N° '+value.replace('"', '')+ ' successfully');
            writeLog('Added Part N° '+value.replace('"', '')+ ' successfully');

          })
        });
        */
      };

      function randomDate(start, end, startHour, endHour) {
        var moment = require('moment');
        var date = new Date(+start + Math.random() * (end - start));
        var hour = startHour + Math.random() * (endHour - startHour) | 0;
        date.setHours(hour);
        return moment(date).format("YYYY-MM-DD HH:mm:ss");;
      }

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
            if (error) throw error;
            console.log('Data loaded into table maintenix successfully');
            writeLog('Data loaded into table maintenix successfully');
          })
        }

        function writeLog(newLine){
          var date = new Date();
          date = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate();
          var csvPath = globals.globals.EXCELPATH.replace(/\.[^/.]+$/, "")+date+'.csv';
          var logPath = csvPath.replace(/\.[^/.]+$/, "")+'.txt'
          newLine+='\n';
          fs.appendFile(path.resolve('xls_csv', logPath), newLine, function (err) {
            if (err) throw err;
          });
        }
