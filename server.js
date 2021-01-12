const express = require('express')
const app = express()
const http = require('http').createServer(app);
const SSHTerminal = require('ssh2').Client;
const port = process.env.port || 8000;
const json = require('./public/login')

app.use(express.static(__dirname + "/public"))

app.get('/',(req,res)=>{
  res.writeHead(200, {});
  return res.end();
})

const io = require('socket.io')(http);
  io.on('connection', function(socket) {
    const conn = new SSHTerminal();
    conn.on('ready', function() {
      socket.emit('server', 'Connection to shell established\r\n\n');
      conn.shell(function(err, stream) {
        if (err)
          return socket.emit('server', 'Shell error ' + err.message);
        socket.on('client', function(data) {
          stream.write(data);
        });
        stream.on('data', function(d) {
          socket.emit('server', d.toString('binary'));
        }).on('close', function() {
          conn.end();
        });
      });
    }).on('close', function() {
      socket.emit('server', '\nConnection logged off successfully\n');
    }).on('error', function(err) {
      socket.emit('server', 'Connection error: ' + err.message +'\r\n');
    }).connect({
      host: json.host,
      username: json.username,
      password: json.password
    });
  });

http.listen(port, () => console.log(`Active on ${port} port`))