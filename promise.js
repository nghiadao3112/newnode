const express =require("express");
const bodyParser=require("body-parser");
const session =require('express-session');
const Passport =require('passport');

const app =express();
const flash    = require('connect-flash');
const morgan       = require('morgan');
const server =require("http").Server(app);

const net = require('net');
const ns = net.createServer();
const io=require('socket.io')(server);

var pool = require(__dirname+'/database/sqlmiddleware.js');

var position=1;
var name="admin";
//var sqlquery='update users set x'+position+'=null,y'+position+'=null where email=\"'+name+'\"';
//console.log(sqlquery);
app.get('/',async function(req, res, next){
     var name='admin';
     var em='x';
     sqlquery='select * from mymap where email=\"'+name+'\" and stt=3'; 
     var row= await pool.query(sqlquery);
     /*
     var json={'email':'x','password' : 'y'}
     check = await pool.insert('users',json);
     console.log(check);*/
     console.log(row.length);
     console.log("out sql")
  });
  
/*  app.get('/',function(req, res, next){
   try{
     /*var name='admin';
     var em='x';
     var sqlquery='select * from users';
     var row= await pool.query(sqlquery);
     var x=getRandomInt(0,7);
     console.log(x);
     console.log("out sql");
   }
   catch(err){
     throw err
   } 
  //console.log(row)
  
  });


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
*/









server.listen(7777,()=> console.log('listenning....7777'));
