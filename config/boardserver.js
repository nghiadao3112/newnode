var clients=[];
var flag=false;
var info={};
var pool = require('/home/ubuntu/newnode/database/sqlmiddleware.js');

module.exports=(ns,io,boardInfo)=>{
 
ns.on('connection', function connection(socketnet) {
  
  socketnet.name = socketnet.remoteAddress + ":" + socketnet.remotePort 
  clients.push(socketnet);
  info.name=socketnet.name;
  info.status="Ready to connect";
  info.user="";
  info.x=0;
  info.y=0
  info.fire=false;
  info.surrender=false;
  info.room=null;
  info.state=false;
  info.play=false;
  boardInfo.push(info);
  info={};
  
  //console.log('debug 000000000000000000000000000')
  io.of('/board').emit('board',boardInfo);
  socketnet.write("Board Name = " + socketnet.name + "\n");
  socketnet.setEncoding('utf8');  
  console.log("Have a connection !!!!!!! from "+socketnet.name );
  
  io.of('/board').on('connect', function(socket){
    socket.on('isshot',function(index){
      console.log(socketnet.name,index,boardInfo[index].name);
      if ((boardInfo[index].name==socketnet.name) && (flag==false)) {
        console.log('DANG BI BAN',socketnet.name);
        socketnet.write('\nbiban\n');
      }
      
    });
  });
  socketnet.on('data',async function(data){
    //console.log(socketnet.name,data);
    for (var i=0;i<boardInfo.length;i++){
      if (socketnet.name==boardInfo[i].name){  
        if (data=='4') {
          boardInfo[i].x=boardInfo[i].x-1;
        }
        if (data=='6') {
          boardInfo[i].x=boardInfo[i].x+1;
        }
        if (data=='2') {
          boardInfo[i].y=boardInfo[i].y-1;
        }
        if (data=='8') { 
          boardInfo[i].y=boardInfo[i].y+1;
        }
        if (data=='5') {
          boardInfo[i].fire=true;
          var position = boardInfo[i].x*10+boardInfo[i].y;
          var sqlquery='select * from users where email=\"'+boardInfo[i].user+'\"';
          var result=await pool.query(sqlquery);
          /*console.log('board Serverrrrrrrrrrr');
          console.log(result);*/
          sqlquery='select * from mymap where email=\"'+result[0].enemy+'\" and id_b='+position;
          var result1=await pool.query(sqlquery);
          if ((result1[0].stt==1) &&(result[0].turn==1)){
            socketnet.write("\ntrung\n");
            //broadcast(socketnet.name + " joined the chat\n", socketnet);
          }
          
          //21312333333333
        }
        if (boardInfo[i].x==-1){
          boardInfo[i].x=7;
        }
        if (boardInfo[i].x==8){
          boardInfo[i].x=0;
        }
        if (boardInfo[i].y==-1){
          boardInfo[i].y=7;
        }
        if (boardInfo[i].y==8){
          boardInfo[i].y=0;
        }
      }
    }
   // console.log(boardInfo);
    io.of('/board').emit('update map',boardInfo)
  });
  /*socketnet.setTimeout(90000);
  socketnet.on('timeout', () => {
    console.log('socket timeout');
    socketnet.end();
  });
  */
  
  socketnet.on('error',function(err){});
  var disconnectLocation;
  socketnet.on('close',function(err){
    for(var i = 0;i < clients.length;i++  ){
      if(clients[i]==socketnet){
        console.log("disconnected from "+socketnet.name);
        clients.splice(i,1);
      }
      if(boardInfo[i].name==socketnet.name){
        boardInfo.splice(i,1);
        disconnectLocation=i;
      }
    }
    io.of('/board').emit('disconnected controller',disconnectLocation);
    console.log("mat ket noi");
    console.log(disconnectLocation);
    io.of('/board').emit('board', boardInfo);  
  });
  
  
}); 
 
function changeFlag(){
  flag=false;
}
 
 
 
 
 
 
 }