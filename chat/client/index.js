

var $input = document.querySelector('#input');
var $content = document.querySelector('.content');
var $sendBtn = document.querySelector('#sendBtn');
var $loginbutton = document.querySelector('#loginbutton');
var $inputName = document.querySelector("#name");
var $chatbox = document.querySelector('#chatbox');
var $loginbox = document.querySelector('#loginbox');

var socket = io();
// 保存所有的用户
var saveUsers = [];

var username = '';
// 监听发送按钮事件
$sendBtn.onclick = function() {
  var msg = strEscape($input.value);
  if (!msg) {
    return;
  }
  // socket发送消息
  socket.emit('client message', {
    text: msg,
    time: new Date(),
    username: username
  }, () => {
    console.log('发送成功');
  });

  // 消息显示到页面上
  $content.innerHTML += '<div class="list">\
                          <div class="user-name oneself">'+username+'</div>\
                          <div class="section section-self">'+ msg +'</div>\
                        </div>';
  // input的值 清空
  $input.value = ''; 
};

function strEscape(str) {
  var div = document.createElement('div');
  if (div.innerText) {
    div.innerText = str;
  } else {
    div.textContent = str;
  }
  return div.innerHTML;
}
function setUsername() {
  username = $inputName.value.replace(/(^\s*)|(\s*$)/g, "");
  if (!username) {
    return; 
  }
  socket.emit('login', { username: username });
}
function beginChat(data) {
  console.log(data)
  $chatbox.style.display = 'block';
  $loginbox.style.display = 'none';
  var str = username + '进入聊天室';
  $content.innerHTML += '<div class="list">\
                          <div class="info">'+ str +'</div>\
                        </div>';
  // 渲染在线成员
  renderOnlinePeople(data);
}
function renderOnlinePeople(data) {

  var ihtml = '<li data-nickname="'+username+'">\
                <div class="icon"></div>\
                <div class="nickname user-self">'+username+'</div>\
              </li>';
  $('#list-group').html(ihtml);
  var dhtml = '';
  // 添加别人
  for (let user of data.userGroup) {
    if (username && (user.username !== username)) {
      dhtml += '<li data-nickname="'+user.username+'">\
                  <div class="icon"></div>\
                  <div class="nickname">'+user.username+'</div>\
                </li>';
    }
  }
  $('#list-group').append(dhtml);
}
/**
 * @param flag 为1代表好友上线，-1代表好友下线
 * @param data 存储用户信息
 */
function comAndLeave(flag, data) {
  if (flag === 1) {
    var dhtml = '<li data-nickname="'+data.username+'">\
                  <div class="icon"></div>\
                  <div class="nickname">'+data.username+'</div>\
                </li>';
    $('#list-group').append(dhtml);
  } else if(flag === -1) {
    if (data.username) {
      var str = data.username + '离开聊天室';
      $content.innerHTML += '<div class="list">\
                              <div class="info">'+ str +'</div>\
                            </div>';
      // 找到该用户 并且删除掉
      $('#list-group').find($(`li[data-nickname='${data.username}']`)).remove();
    }
  }
  
}
$loginbutton.onclick = function() {
  setUsername();
};
$inputName.onkeyup = function(e) {
  if (e.keyCode === 13) { 
    setUsername();
  }
}

// 监听用户离开聊天室
socket.on('oneLeave', (data) => {
  comAndLeave(-1, data);
});


// 监听登录成功的事件
socket.on('loginSuccess', (data) => {
  // 如果服务器返回的用户名和我们登录的用户名相同的话，那就登录
  if (username === data.username) {
    beginChat(data);
  } else {
    comAndLeave(1, data);
  }
});
// 用户名重名
socket.on('usernameErr', (data) => {
  alert(data.err);
});
// 接收信息
socket.on('server message', (data) => {
  var username = data.username;
  renderOnlinePeople(data);
  $content.innerHTML += '<div class="list">\
                            <p class="user-name">'+ username +'</p>\
                            <div class="section">'+ data.text +'</div>\
                          </div>';
});



