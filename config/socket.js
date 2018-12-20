module.exports= (io)=>{
  io.on("connection",(socket)=>{
     console.log('co nguoi ket noi'+socket.id); 
  });

}