var mysql = require('mysql-json'); 

// node -v must > 8.x 
var util = require('util');


//  !!!!! for node version < 8.x only  !!!!!
// npm install util.promisify
//require('util.promisify').shim();
// -v < 8.x  has problem with async await so upgrade -v to v9.6.1 for this to work. 



// connection pool https://github.com/mysqljs/mysql   [1]
var pool = new mysql({
				  host     : 'localhost',
				  user     : 'root',
				  password : '1',
          database : 'user_manage'
				});

// Promisify for Node.js async/await.
 pool.connect=util.promisify(pool.connect)
 pool.query = util.promisify(pool.query)
 pool.findByPrimaryKey=util.promisify(pool.findByPrimaryKey)
 pool.insert= util.promisify(pool.insert)
 pool.update=util.promisify(pool.update)
 pool.delete=util.promisify(pool.delete)


 module.exports = pool