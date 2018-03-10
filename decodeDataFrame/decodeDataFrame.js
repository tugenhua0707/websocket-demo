
var crypto = require('crypto');

var WS = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

require('net').createServer(function(o) {
  var key;
  o.on('data', function(e) {
    if (!key) {

      key = e.toString().match(/Sec-WebSocket-Key: (.+)/)[1];
      
      // WS的字符串 加上 key, 变成新的字符串后做一次sha1运算，最后转换成Base64
      key = crypto.createHash('sha1').update(key+WS).digest('base64');

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
/* 
 >> 含义是右移运算符，
   右移运算符是将一个二进制位的操作数按指定移动的位数向右移动，移出位被丢弃，左边移出的空位一律补0.
 比如 11 >> 2, 意思是说将数字11右移2位。
 首先将11转换为二进制数为 0000 0000 0000 0000 0000 0000 0000 1011 , 然后把低位的最后2个数字移出，因为该数字是正数，
 所以在高位补零，则得到的最终结果为：0000 0000 0000 0000 0000 0000 0000 0010，转换为10进制是2.
  

 << 含义是左移运算符
   左移运算符是将一个二进制位的操作数按指定移动的位数向左移位，移出位被丢弃，右边的空位一律补0.
 比如 3 << 2, 意思是说将数字3左移2位，
 首先将3转换为二进制数为 0000 0000 0000 0000 0000 0000 0000 0011 , 然后把该数字高位(左侧)的两个零移出，其他的数字都朝左平移2位，
 最后在右侧的两个空位补0，因此最后的结果是 0000 0000 0000 0000 0000 0000 0000 1100，则转换为十进制是12(1100 = 1*2的3次方 + 1*2的2字方)

 注意1： 在使用补码作为机器数的机器中，正数的符号位为0，负数的符号位为1(一般情况下). 
       比如：十进制数13在计算机中表示为00001101,其中第一位0表示的是符号

 注意2：负数的二进制位如何计算？
       比如二进制的原码为 10010101，它的补码怎么计算呢？
       首先计算它的反码是 01101010； 那么补码 = 反码 + 1 = 01101011

 再来看一个列子：
 -7 >> 2 意思是将数字 -7 右移2位。
 负数先用它的绝对值正数取它的二进制代码，7的二进制位为： 0000 0000 0000 0000 0000 0000 0000 0111 ，那么 -7的二进制位就是 取反，
 取反后再加1，就变成补码。
 因此-7的二进制位： 1111 1111 1111 1111 1111 1111 1111 1001，
 因此 -7右移2位就成 1111 1111 1111 1111 1111 1111 1111 1110 因此转换成十进制的话 -7 >> 2 ，值就变成 -2了。
*/
function decodeDataFrame(e) {

  var i = 0, j, s, arrs = [],
    frame = {
      // 解析前两个字节的基本数据
      FIN: e[i] >> 7,
      Opcode: e[i++] & 15,
      Mask: e[i] >> 7,
      PayloadLength: e[i++] & 0x7F
    };

    // 处理特殊长度126和127
    if (frame.PayloadLength === 126) {
      frame.PayloadLength = (e[i++] << 8) + e[i++];
    }
    if (frame.PayloadLength === 127) {
      i += 4; // 长度一般用4个字节的整型，前四个字节一般为长整型留空的。
      frame.PayloadLength = (e[i++] << 24)+(e[i++] << 16)+(e[i++] << 8) + e[i++];
    }
    // 判断是否使用掩码
    if (frame.Mask) {
      // 获取掩码实体
      frame.MaskingKey = [e[i++], e[i++], e[i++], e[i++]];
      // 对数据和掩码做异或运算
      for(j = 0, arrs = []; j < frame.PayloadLength; j++) {
        arrs.push(e[i+j] ^ frame.MaskingKey[j%4]);
      }
    } else {
      // 否则的话 直接使用数据
      arrs = e.slice(i, i + frame.PayloadLength);
    }
    // 数组转换成缓冲区来使用
    arrs = new Buffer(arrs);
    // 如果有必要则把缓冲区转换成字符串来使用
    if (frame.Opcode === 1) {
      arrs = arrs.toString();
    }
    // 设置上数据部分
    frame.PayloadLength = arrs;
    // 返回数据帧
    return frame;
}

function onmessage(e) {
  console.log(e)
  e = decodeDataFrame(e);  // 解析数据帧
  console.log(e);  // 把数据帧输出到控制台
}