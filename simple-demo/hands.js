
var crypto = require('crypto');

var WS = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

require('net').createServer(function(o) {
  var key;
  o.on('data', function(e) {
    if (!key) {
      console.log(e);

      key = e.toString().match(/Sec-WebSocket-Key: (.+)/)[1];
      console.log(key);
      
      // WS的字符串 加上 key, 变成新的字符串后做一次sha1运算，最后转换成Base64
      key = crypto.createHash('sha1').update(key+WS).digest('base64');
      console.log(key);

      // 输出字段数据，返回到客户端，
      o.write('HTTP/1.1 101 Switching Protocol\r\n');
      o.write('Upgrade: websocket\r\n');
      o.write('Connection: Upgrade\r\n');
      o.write('Sec-WebSocket-Accept:' +key+'\r\n');
      // 输出空行，使HTTP头结束
      o.write('\r\n');
    } else {
      // 数据处理
      onmessage(e);
    }
  })
}).listen(8000);

function onmessage(e) {
  console.log(e); // 把数据输出到控制台
}