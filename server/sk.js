const ws = require("nodejs-websocket");
var thisOrigin = 'http://localhost:8080';
var clients = [];
// 接受类型 : report message 
// 发送类型 : member message systemInfo notice

// 发送信息
function sendInfo(type, server, mes) {
  let obj = {};
  obj.type = type;
  obj.data = mes;
  server.connections.forEach(function (conn) {
    conn.sendText(JSON.stringify(obj))
  })
}
// 对比前后区别找出谁退出了聊天室
function contrastClients(client, newClient) {
  client.forEach(item => {
    let flag = false;
    newClient.forEach(child => {
      if (item.guid == child.guid) {
        flag = true;
      }
    });
    if (!flag) {
      console.log("%s 离开了聊天室！", item.name)
    }
  });
  client.length = 0;
  client.push(...newClient);
}
// 处理接受信息并发送
function handleMes(server, conn, mes) {
  switch (mes.type) {
    case 'report':
      conn.clientInfo = mes.data;
      contrastClients(clients, clientCount(server));
      console.log("%s 加入了聊天室 ", mes.data.name);
      sendInfo('member', server, clients);
      break;
    case 'message':
      console.log("%s 说了 %s ", mes.data.name, mes.data.data);
      sendInfo('message', server, mes.data);
      break;
  }
}
// 用户退出处理
function updataMember(server) {
  contrastClients(clients, clientCount(server));
  sendInfo('member', server, clients);
}
//获取用户列表
function clientCount(server) {
  if (server) {
    let returnArr = [];
    server.connections.forEach(function (conn) {
      returnArr.push(conn.clientInfo)
    })
    return returnArr;
  }
}

//主服务开始
var server = ws.createServer(function (conn) {
  if (conn.headers.origin !== thisOrigin) {
    conn.close();
    return;
  }
  conn.on("text", function (str) {
    try {
      str = JSON.parse(str)
    } catch (e) {
      console.log('出错了！')
      conn.sendText('CLOSE!')
      conn.close();
    }
    handleMes(server, conn, str)
  })
  conn.on("close", function (code, reason) {
    updataMember(server, conn);
  })
  conn.on("error", function (err) {
    console.log(err)
  })
}).listen(1215);
console.log('websocket在线聊天功能')

//定时查看客户端数目
setInterval(function () {
  updataMember(server)
}, 5000)
