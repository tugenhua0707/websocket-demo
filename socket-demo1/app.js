
var http = require('http');
var fs = require('fs');

var server = http.createServer(function(res, res) {
  fs.readFile('./index.html', function(err, data){
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data, 'utf-8');
  })
}).listen(3000, '127.0.0.1');

console.log('server running at http://127.0.0.1:3000');

var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {
  // 侦听客户端的msg事件
  socket.on('msg', function(data) { 
    // 给除了自己以外的客户端广播消息
    socket.broadcast.emit('msg', data);

    // 给当前的客户端发送消息
    socket.emit('msg', data);
  })
  
});