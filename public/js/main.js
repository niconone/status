'use strict';

(function() {
  var socket = io();

  var connectBtn = document.querySelector('#peer-connect');
  var id;
  var peer;
  var apiKey;

  function connect(conn) {
    console.log('attempting data');
    conn.on('data', function(data) {
      console.log('received data');
      document.querySelector('#message').textContent = data;
      console.log('Received', data);
    });

    conn.send('hello from ' + id);
  }

  connectBtn.onclick = function(ev) {
    ev.preventDefault();

    var conn = peer.connect(document.querySelector('#peer-id').value);
    console.log(document.querySelector('#peer-id').value)
    conn.on('open', function() {
      connect(conn);
    });

    conn.on('error', function(err) {
      console.log(err);
    });
  };

  socket.on('identifierack', function(identifier) {
    id = identifier;

    document.querySelector('#identifier').textContent = identifier;
  });

  socket.on('apiack', function(peerKey) {
    apiKey = peerKey;
  });

  socket.emit('identifier');

  setTimeout(function() {
    peer = new Peer(id, {key: apiKey});
    peer.on('connection', connect);
  }, 200);
}).call(this);
