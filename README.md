Readme
------
CronJob in Nodejs to convert .xls file to .csv and load the data to the database

Usage:
------
1) Run `npm install`
2) Create `.env` file in the project root folder for the database connection. Example:
    ```
    DB_HOST=0.0.0.0
    DB_USER=root
    DB_PORT=3306
    DB_PASSWORD=12345
    DB_DATABASE=aog_development
    ```
3) Set `EXCELPATH` and `LOGPATH` in the `globals.js` file
4) Load `script/tableMaintenixCreation.sql` into your database
5) Run `node job.js`

