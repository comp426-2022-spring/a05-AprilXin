// Put your database code here

const database = require('better-sqlite3');
const logdb = new database('log.db');

const stmt = logdb.prepare(`
    SELECT name FROM sqlite_master WHERE type = 'table' and name = 'accesslog';
`);

let row = stmt.get();

if (row == undefined) {
    console.log('Log database missing. Creating log database.');
    const sqlInit = `
        CREATE TABLE accesslog (
            id INTEGER PRIMARY KEY, 
            remoteaddr VARCHAR, 
            remoteuser VARCHAR, 
            time VARCHAR, 
            method VARCHAR, 
            url VARCHAR, 
            protocol VARCHAR,
            httpversion NUMERIC, 
            status INTEGER, 
            referer VARCHAR,
            useragent VARCHAR
        );
    `
    logdb.exec(sqlInit);
} else {
    console.log('Log database exists.');
}

module.exports = logdb;
