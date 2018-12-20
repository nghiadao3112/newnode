var flag=false;
var pool = require(__dirname+'/database/sqlmiddleware.js');
var rooms=[];
var loop=[];
var countRoom=0;
require('events').EventEmitter.defaultMaxListeners = 30;

module.exports = function(app, passport,io,boardInfo,ns,room) {

  app.use(function (req, res, next) {
      console.log(req.body);
      
    next()
    });
//====================================================== 
  app.get('/',(req,res)=>{
    res.redirect('/login');
  });    
    
    
//====================LOGIN==================================     
  app.get('/login', function(req, res) {
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });
    
  app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/board',
        failureRedirect : '/login', 
        failureFlash : true
        
    }));
//=====================REGISTER================================= 
  app.get('/register', function(req, res) {
        res.render('register.ejs', { message: req.flash('signupMessage') });
    });
  app.post('/register', passport.authenticate('local-signup', {
        successRedirect : '/login', // Ði?u hu?ng t?i trang hi?n th? profile
        failureRedirect : '/register', // Tr? l?i trang dang ký n?u l?i
        failureFlash : true 
        
    }));
//=====================BOARD================================= 
  app.get('/board',(req,res)=>{
    if (req.isAuthenticated()){
      setImmediate(async function(){
        var play=false;
        var room;
        var vitri;
        for (var i=0;i<boardInfo.length;i++){
          if (req.user.email==boardInfo[i].user){
            boardInfo[i].surrender=false;
            boardInfo[i].state=false;
            play=boardInfo[i].play;
            room=findRoom(rooms,boardInfo[i].room);
            if (room!=null){
              room.countdown=18000;
            }
            break;
          }
        }
        if (play==true){
          console.log('wait');
          res.render('listboard1.ejs',{ useraut:req.user.email,roomaut:room.roomname});
        }
        else{
          res.render('listboard.ejs',{ useraut:req.user.email});
        }
      });            
    }
    else{
      res.redirect('/login');
    }  
  });
  
  
  
        io.of('/board').on('connect', function(socket){
        console.log('someone connected from: ' + socket.handshake.address);
        
        socket.on('select board',function(i,user,check){
          console.log(socket.handshake.address + ': chon board '+(i+1));
          boardInfo[i].status = "Connected";
          boardInfo[i].user=user;
          boardInfo[i].x=0;
          boardInfo[i].y=0;
          boardInfo[i].fire=false;
          if (check==true){
            io.of('/board').emit('board', boardInfo);
         }
       //   console.log('debug line 56')
        });
        socket.on('disconnect board',function(i){
          console.log(socket.handshake.address + ': bo board '+(i+1));
          boardInfo[i].status = "Ready to connect";
          boardInfo[i].user="";
          boardInfo[i].x=0;
          boardInfo[i].y=0;
          boardInfo[i].fire=false;
          io.of('/board').emit('board', boardInfo);
        });
        socket.on('redirect',function(check,roomname){
          if(check==true){
            socket.emit('board', boardInfo);
          }
          else{
            var roomBoard=[];
            console.log('debug redirect')
            for (var i=0;i<boardInfo.length;i++){
              if(boardInfo[i].room==roomname){
                roomBoard.push(boardInfo[i]);
              }
            }
            console.log(roomBoard);
            socket.emit('board', roomBoard);
          }
        });
      })
//=======================FIND ENEMY===============================   
  app.get('/findEnemy',(req,res)=>{
    if (req.isAuthenticated()){
      setImmediate(function(){
        var index=findIndexUser(boardInfo,req.user.email);
        var check=findUserInRoom(rooms,req.user.email);
        if (index != -1){
          if (boardInfo[index]==null){
            return res.redirect('/board');
          }
          if((boardInfo[index].room==null)&& (check!=null)){
            boardInfo[index].room=check.roomname;
            return res.redirect('play')
          }
          var room=findRoom(rooms,boardInfo[index].room);
          if (room!=null){
            room.countdown=18000;
          }
          boardInfo[index].state=false;
          boardInfo[index].play=false;
          res.render('match',{message: req.flash('checkenemy'), useraut:req.user.email,indexaut:index});
        }
        else{
          return res.redirect('/board');
        }
      });
      
      
      
    }
    else{
      res.redirect('/login');
    }
  });
  io.of('/board').on('connect', function(socket){
        socket.on('refreshroom',function(){
          socket.emit('roomlist',rooms);
        });
        
        socket.on('createroom',function(id){
          //console.log(rooms);
          //console.log(boardInfo);
          console.log(id);
          var index=findIndexUser(boardInfo,id);
          if(boardInfo[index].room==null) {
            
            var temp={};
            temp.countdown=18000;
            temp.roomname=boardInfo[index].user+countRoom;
            boardInfo[index].room=temp.roomname;
            countRoom++;
            temp.user1=boardInfo[index].user;
            temp.user2=null;
            temp.player=1;
            temp.board=false;
            temp.surrender=false;
            rooms.push(temp);
            loop[rooms.length-1]=setInterval(function(){temp.countdown--;}, 1000);
            socket.emit('roomlist',rooms);
          }
        });
        socket.on('leaveroom',function(id){
          var index=findIndexUser(boardInfo,id);
          if(boardInfo[index].room!=null){
            boardInfo[index].room=null;
            for (var i=0;i<rooms.length;i++){
              if (rooms[i].user1==id){
                rooms[i].user1=null;
                rooms[i].player=1;
                if(rooms[i].user2==null){
                  rooms.splice(i,1);
                  loop.splice(i,1);
                }
                break;
              }
              else if (rooms[i].user2==id){
                rooms[i].user2=null;
                rooms[i].player=1;
                if(rooms[i].user1==null){
                  rooms.splice(i,1);
                  loop.splice(i,1);
                }
                break;
              }
            };
            socket.emit('roomlist',rooms); 
          }  
        });
        socket.on('out',function(user){
          for (var i=0;i<rooms.length;i++){
            if (rooms[i].user1==user){
              rooms[i].user1=null;
              rooms[i].player=1;
              break;
            }
            else if (rooms[i].user2==user){
              rooms[i].user2=null;
              rooms[i].player=1;
              break;
            }
          }
          socket.emit('roomlist',rooms); 
        })
        socket.on('joinroom',function(i,user){
          console.log('joinroom');
          console.log(i,user);
          var index=findIndexUser(boardInfo,user);
          if ((boardInfo[index].room==null) && (rooms[i].player==1)){  
            boardInfo[index].room=rooms[i].roomname;
            if(rooms[i].user2==null){
              rooms[i].user2=boardInfo[index].user;
              rooms[i].player=2;
            }
            else{
              rooms[i].user1=boardInfo[index].user;
              rooms[i].player=2;
            }
            socket.emit('roomlist',rooms);
          }
        });
        socket.on('start',async function(user){
            var index=findIndexUser(boardInfo,user);
            console.log(user ,"debugggggggggggggg")
            var room=findRoom(rooms,boardInfo[index].room);
            console.log(room);
            if((room!=null) &&(room.player==2) ){
              try{
                console.log('debug2222222222222222222');
                var sqlquery;
                var rand;
                var name=user;
                var enemy;
                if (room.user1==name){
                  enemy=room.user2;
                }
                else{
                  enemy=room.user1;
                }
                /*sqlquery='delete from mymap where email="'+name+'"'; 
                var query=await pool.query(sqlquery);
                
                console.log(name);
                console.log(sqlquery);
                console.log(query);
                */
                sqlquery='update users set enemy="'+enemy+'" where email="'+name+'"';
                await pool.query(sqlquery);
                sqlquery='select * from mymap where email="'+name+'"';
                var query=await pool.query(sqlquery);
                var id_b;
                //console.log("start debuggggggggggg",query.length);
                if (query.length==0){
                  for (var i=0;i<8;i++){
                    for(var j=0;j<8;j++){
                      id_b=i*10+j;
                      sqlquery='INSERT INTO mymap ( email,id_b,stt) values (\"'+name+'\",'+id_b+',0)';
                      sql= await pool.query(sqlquery);
                    }
                  }
                  for (var i=0;i<8;i++){
                      rand =getRandomInt(0,7)+i*10;
                      console.log(i,rand);
                      sqlquery='update mymap set stt=1 where id_b='+rand+' and email=\"'+name+'\"';
                      var sql= await pool.query(sqlquery);
                      //console.log(sql);
                  }
                }
                else{
                  for (var i=0;i<8;i++){
                    for(var j=0;j<8;j++){
                        id_b=i*10+j;
                        sqlquery='update mymap set stt=0 where email=\"'+name+'\"';
                        sql= await pool.query(sqlquery);
                      }
                    }
                    for (var i=0;i<8;i++){
                      rand =getRandomInt(0,7)+i*10;
                      console.log(i,rand);
                      sqlquery='update mymap set stt=1 where id_b='+rand+' and email=\"'+name+'\"';
                      var sql= await pool.query(sqlquery);
                      //console.log(sql);
                    }
                }
                sqlquery='update users set turn=true where email=\"'+name+'\"';
                await pool.query(sqlquery);
                /*sqlquery='select * from users where email=\"'+name+'\"';
                var result =await pool.query(sqlquery);*/
                sqlquery='update users set turn=false where email=\"'+enemy+'\"';
                await pool.query(sqlquery);
                socket.emit('play');
              }
            catch(err){
                  throw err
              }
            }
        });      
      });
      
      
      
      
      
      
  /*app.post('/findEnemy',async function(req,res){
    if (req.isAuthenticated()){
      let enemyname=req.body.enemy;
      io.of('/findEnemy').emit('joinroom',enemyname);
      /*let myname=req.user.email;
      console.log(enemyname);
      console.log(myname);  
      if (enemyname==myname){
        req.flash('checkenemy','Can\' play with yoursefl (-_-)');
        return res.redirect('/findEnemy');
      }
      else{
        for(var i=0;i<boardInfo.length;i++){
          if (enemyname==boardInfo[i].user){
            req.flash('checkenemy','Let\'s playy!!!!!!!!!!!!!!!!!!!!!!!!! ');
            var sqlquery='UPDATE users SET enemy=\"'+enemyname+'\" WHERE email=\"'+myname+'\"';
            var info= await pool.query(sqlquery);
            console.log(info);
            return res.redirect('/refresh');
          }
        }
      req.flash('checkenemy','Can\'t find enemy (-_-)');    
      return res.redirect('/findEnemy');  
      }
      */
 /*     
    }
    else{
      res.redirect('/login');
    }
  });
  */
//=====================REFRESH DATA=================================  
 /*app.get('/refresh',async function(req, res, next){
    if (req.isAuthenticated()){
      try{
        var sqlquery;
        var rand;
        var name=req.user.email;
        sqlquery='delete from mymap where email=\"'+name+'\"'; 
        await pool.query(sqlquery);
        var id_b;
        for (var i=0;i<8;i++){
          for(var j=0;j<8;j++){
            id_b=i*10+j;
            sqlquery='INSERT INTO mymap ( email,id_b,stt) values (\"'+name+'\",'+id_b+',0)';
            sql= await pool.query(sqlquery);
          }
        }
        for (var i=0;i<8;i++){
          rand =getRandomInt(0,7)+i*10;
          sqlquery='update mymap set stt=1 where id_b='+rand+' and email=\"'+name+'\"';
          var sql= await pool.query(sqlquery);
          //console.log(sql);
        }
        sqlquery='update users set turn=true where email=\"'+name+'\"';
        await pool.query(sqlquery);
        sqlquery='select * from users where email=\"'+name+'\"';
        var result =await pool.query(sqlquery);
        sqlquery='update users set turn=false where email=\"'+result[0].enemy+'\"';
        await pool.query(sqlquery);
        return res.redirect('/findEnemy')
      }
      catch(err){
          throw err
      }
    }
    else{
       res.redirect('/login');
    }  
 });
 */
//===================PLAY===================================  
  app.get('/play',function(req,res,next){
    if (req.isAuthenticated()){
      var indexCheck=findIndexUser(boardInfo,req.user.email);
      //console.log(boardInfo);
      var roomCheck=findIndexRoom(rooms,boardInfo[indexCheck].room);
      if ((indexCheck!= -1) && (roomCheck!=-1) ) {
        rooms[roomCheck].board=false;
        rooms[roomCheck].surrender=false;
        boardInfo[indexCheck].play=true;
        res.render('play.ejs',{ useraut:req.user.email,indexaut:indexCheck});
      }
      else{
        res.redirect('/board');
      }
      
    }
    else{
      res.redirect('/login');
    }  
  
  });
  
  
        io.of('/board').on('connect', function(socket){
        console.log('Play from: ' + socket.id);
        var temp1;
        socket.on('updateState',async function(user){
          console.log('updatestate',user);
          console.log(rooms);
          var sqlquery='select * from users where email=\"'+user+'\"';
          var result=await pool.query(sqlquery);
          var indexEnemy=findIndexUser(boardInfo,result[0].enemy);
          var indexUser=findIndexUser(boardInfo,user);
          boardInfo[indexUser].state=true;
          var indexRoom=findIndexRoom(rooms,boardInfo[indexUser].room);
          if ((boardInfo[indexUser].state==true) && (boardInfo[indexEnemy].state==true)){
            rooms[indexRoom].countdown=90;
          }
          else{
            rooms[indexRoom].countdown=1800;
          }
        })
        socket.on('get user',async function(temp){

          var index =findIndexUser(boardInfo,temp);
          if(index==-1) return 0;
          try{
           var sqlquery='select * from users where email=\"'+temp+'\"';
           var row= await pool.query(sqlquery);
           sqlquery='select * from mymap where email=\"'+temp+'\"';
           var map = await pool.query(sqlquery);
           var map_ta=new Array(8);
           for (var i=0;i<map_ta.length;i++){
             map_ta[i]=new Array(8);
           }
           for(var i=0;i<map.length;i++){
               var y=(map[i].id_b)%10;
               var x=((map[i].id_b)-y)/10;
               if (map[i].stt==1){map_ta[x][y]="A";}
               if (map[i].stt==2){map_ta[x][y]="S";}
               if (map[i].stt==3){map_ta[x][y]="B";}
           }
           var map_dich=new Array(8);
           for (var i=0;i<map_dich.length;i++){
             map_dich[i]=new Array(8);
           }
           sqlquery='select * from mymap where email=\"'+row[0].enemy+'\"';
           map = await pool.query(sqlquery);  
           for(var i=0;i<map.length;i++){
               var y=(map[i].id_b)%10;
               var x=((map[i].id_b)-y)/10;
               if (map[i].stt==2){map_dich[x][y]="S";}
               if (map[i].stt==3){map_dich[x][y]="B";}
           }
           //console.log(socket.id,row[0].turn);
           var index_dich=findIndexUser(boardInfo,row[0].enemy);
           var stateUser=boardInfo[index].state;
           var stateEnemy=false;
           if (index_dich!=-1){
             stateEnemy=boardInfo[index_dich].state;
           }
           var room=findRoom(rooms,boardInfo[index].room);
           var countdown;
           var roomBoard;
           var roomSurrender;
           //console.log(room);
           if (room==null){
             countdown=18000;
             roomBoard=false
             roomSurrender=false;
           }
           else{
             countdown=room.countdown;
             roomBoard=room.board;
             roomSurrender=room.surrender;
           }
           socket.emit('update tadich',map_ta,map_dich,boardInfo,index,index_dich,row[0].turn,countdown,stateUser,stateEnemy,roomBoard,roomSurrender);
           temp1=temp;
          }
          catch(err){
            throw err;
          }
        });
        socket.on('user fire',async function(index){
          try{
           //console.log('user fire',socket.id);
           boardInfo[index].fire=false;
           var sqlquery='select * from users where email=\"'+temp1+'\"';
           var row= await pool.query(sqlquery);
           /*console.log(row);
           console.log(temp1);
           console.log(row[0].turn);
           */
           var checkEnemy=findIndexUser(boardInfo,row[0].enemy);
           if ((row[0].turn==true) && (boardInfo[index].state==true) && (boardInfo[checkEnemy].state==true)){
             var check=false;
             sqlquery='select * from mymap where email=\"'+row[0].enemy+'\"';
             var map = await pool.query(sqlquery);
             var sql;
             var position=boardInfo[index].x * 10 + boardInfo[index].y;
             //console.log('debuggggggggggggg');
             //console.log(position);
             for (var i=0;i<map.length;i++){
               if (map[i].id_b==position) {
                 if (map[i].stt==0){
                   sqlquery='update mymap set stt=2 where email=\"'+row[0].enemy+'\" and id_b='+position;
                   sql=await pool.query(sqlquery);
                 }
                 else if(map[i].stt==1){
                   sqlquery='update mymap set stt=3 where email=\"'+row[0].enemy+'\" and id_b='+position;
                   sql=await pool.query(sqlquery);
                   check=true;
                 }
                 break;
               }
             }  
             var map_ta=new Array(8);
             for(var i=0;i<map_ta.length;i++){
               map_ta[i]=new Array(8);
             }
             
             for(var i=0;i<map.length;i++){
               var y=(map[i].id_b)%10;
               var x=((map[i].id_b)-y)/10;
               if (map[i].stt==1){map_ta[x][y]="A";}
               if (map[i].stt==2){map_ta[x][y]="S";}
               if (map[i].stt==3){map_ta[x][y]="B";}
             }
             
             var map_dich=new Array(8);
             for (var i=0;i<map_dich.length;i++){
               map_dich[i]=new Array(8);
             }
             sqlquery='select * from mymap where email=\"'+row[0].enemy+'\"';
             map = await pool.query(sqlquery);  
             for(var i=0;i<map.length;i++){
               var y=(map[i].id_b)%10;
               var x=((map[i].id_b)-y)/10;
               if (map[i].stt==2){map_dich[x][y]="S";}
               if (map[i].stt==3){map_dich[x][y]="B";}
             }
             sqlquery='update users set turn=false where email=\"'+temp1+'\"';
             var update=await pool.query(sqlquery); 
             sqlquery='update users set turn=true where email=\"'+row[0].enemy+'\"';  
             update=await pool.query(sqlquery); 
             var index_dich=findIndexUser(boardInfo,row[0].enemy);
             if (check==true){
               check=false;
               socket.emit('checkshot',index_dich);
             }
             var stateUser=boardInfo[index].state;
             var stateEnemy=boardInfo[index_dich].state;
             var room=findRoom(rooms,boardInfo[index].room);
             room.countdown=90;
             socket.emit('update tadich',map_ta,map_dich,boardInfo,index,index_dich,false,room.countdown,stateUser,stateEnemy,false,false);          
           }
          }
		  catch(err){
             throw err;
           }
        });
      socket.on('disconnect', function(err){
         
         console.log('someone disconnect : ' + socket.id);
       });
       socket.on('surrender',function(user){
         var index=findIndexUser(boardInfo,user)
         var i=findIndexRoom(rooms,boardInfo[index].room);
         rooms[i].surrender=true;
         console.log('surrenderrrrrrrrrr');
         console.log(rooms);
       });
       socket.on('changeBoard',function(user){
         var index=findIndexUser(boardInfo,user)
         var i=findIndexRoom(rooms,boardInfo[index].room);
         rooms[i].board=true;
       })        
      });
//=====================ROOM=============================
 /*app.get('/room',function(req, res, next){
    if (req.isAuthenticated()){
       res.render('room.ejs');
       io.of('/room').on('connect', function(socket){
         
       });
        
    }
    else{
       res.redirect('/login');
    }  
 });
 app.post('/room',function(req,res,next){
   if (req.isAuthenticated()){
       var room=req.body.room;
      
       
    }
    else{
       res.redirect('/login');
    
 });
*/
//======================================================  
/* app.get('/test',function(req, res, next){
    if (req.isAuthenticated()){
        
        var sqlquery='select * from users';
        var row= await pool.query(sqlquery);
     console.log(row);      
     console.log("out sql")
    }
    else{
       res.redirect('/login');
    }  
 });
//======================================================
 app.get('/test1',async function(req, res, next){
  // io.on('send-data-from-board',function(data));      
   io.on('send-data-from-board', function(data){
     console.log(data);
   });  
 });
*/ 

};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function findIndexUser(boardInfo,user)
{
  for(var i = 0;i < boardInfo.length;i++){
    if(boardInfo[i].user == user)
      return i;
  }
  return -1;
}
function findRoom(rooms,roomname){
  for(var i = 0;i < rooms.length;i++){
    if(rooms[i].roomname == roomname)
      return rooms[i];
  }
  return null;
}
function findUserInRoom(rooms,user){
  for(var i = 0;i < rooms.length;i++){
    if ((rooms[i].user1 == user) || (rooms[i].user2 == user))
      return rooms[i];
  }
  return null;
}

function findIndexRoom(rooms,roomname){
  for(var i = 0;i < rooms.length;i++){
    if(rooms[i].roomname == roomname)
      return i;
  }
  return -1;
}