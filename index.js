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

var boardInfo=[]; 

var room=[];




//=======================================================
app.set('views', __dirname + '/views'); 
app.set('view engine','ejs');

require(__dirname+'/config/passport.js')(Passport);
//require(__dirname+'/config/socket.js')(io);
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({secret:"mysecret"}));
app.use(Passport.initialize());
app.use(Passport.session());
app.use(flash());  
app.use( express.static("public"));
//===========================================================
require(__dirname+'/config/boardserver.js')(ns,io,boardInfo);
require(__dirname+'/routes.js')(app,Passport,io,boardInfo,ns,room);




//=====================================================/



//=========================================================
ns.listen(5555,()=>console.log('io.....5555'));
server.listen(7777,()=> console.log('listenning....7777'));
