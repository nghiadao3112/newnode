var mysql = require('mysql'); 

// node -v must > 8.x 
var util = require('util');


//  !!!!! for node version < 8.x only  !!!!!
// npm install util.promisify
//require('util.promisify').shim();
// -v < 8.x  has problem with async await so upgrade -v to v9.6.1 for this to work. 



// connection pool https://github.com/mysqljs/mysql   [1]
var pool = mysql.createPool({
          connectionLimit : 20,
				  host     : 'localhost',
				  user     : 'root',
				  password : '1',
          database : 'user_manage'
				});


// Ping database to check for common exception errors.
pool.getConnection((err, connection) => {
if (err) {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection was closed.')
    }
    if (err.code === 'ER_CON_COUNT_ERROR') {
        console.error('Database has too many connections.')
    }
    if (err.code === 'ECONNREFUSED') {
        console.error('Database connection was refused.')
    }
}

if (connection) connection.release()

 return
 })

// Promisify for Node.js async/await.
 pool.query = util.promisify(pool.query)



 module.exports = pool