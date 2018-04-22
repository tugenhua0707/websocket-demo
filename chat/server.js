
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 7777;

// 保存所有用户的信息
var users = [];
let usersNum = 0;

//将socket和用户名匹配
const _sockets = [];   

app.use(express.static(__dirname + '/client'));
  
// 监听客户端的链接，回调函数会传递本次链接的socket
io.on('connection', (socket) => {
  usersNum ++;
  console.log(`当前有${usersNum}个用户连接上服务器了`);

  // 监听用户离开
  socket.on('disconnect', () => {
    usersNum --;
    console.log(`当前有${usersNum}个用户连接上服务器了`);

    //触发用户离开的监听
    socket.broadcast.emit("oneLeave",{username: socket.username});
    //删除用户
    users.forEach(function (user,index) {
      if(user.username === socket.username) {
        users.splice(index, 1);       //找到该用户，删除
      }
    });
  });

  // 监听用户登录
  socket.on('login', (data) => {
    socket.username = data.username;
    for (let user of users) {
      // 如果用户名存在的话
      if (user.username == data.username) {
        socket.emit('usernameErr',{err: '用户名重复'});
        socket.username = null;
        break;
      }
    }
    if (socket.username) {
      users.push({
        username: data.username,
        message: []
      });
      //保存socket
      _sockets[socket.username] = socket;

      // 将所有用户数组传过去
      data.userGroup = users;
      // 触发loginSuccess 登录成功的事件, 广播形式触发
      io.emit('loginSuccess',data);
    }
  });

  // 接收客户端发来的消息
  socket.on('client message', (data) => {
    // 广播给除自己以外的客户端
    data.userGroup = users;
    socket.broadcast.emit('server message', data);
  });
});

server.listen(port, () => {
  console.log('listening on %d...', port);
});