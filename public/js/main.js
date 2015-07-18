'use strict';

(function() {
  var socket = io();

  var followBtn = document.querySelector('#peer-connect');
  var followed = document.querySelector('#followed');
  var id;
  var peer;
  var apiKey;

  function connect(conn) {
    conn.on('data', function(data) {
      document.querySelector('#message').textContent = data;
      console.log('Received', data);
    });

    conn.send('added you: ' + id);
  }

  function syncOnlineFollowers() {

  }

  followBtn.onclick = function(ev) {
    ev.preventDefault();

    var followID = document.querySelector('#peer-id').value;

    var conn = peer.connect(followID);

    conn.on('open', function() {
      connect(conn);
      socket.emit('follow', {
        id: followID,
        bio: 'test'
      });
    });

    conn.on('error', function(err) {
      console.log(err);
    });
  };

  socket.on('apiack', function(peerKey) {
    apiKey = peerKey;
  });

  socket.on('followack', function(followID) {
    var li = document.createElement('li');
    li.textContent = followID;
    followed.appendChild(li);
  });

  socket.on('identifierack', function(identifier) {
    id = identifier;

    document.querySelector('#identifier').textContent = identifier;
  });

  socket.emit('identifier');

  setTimeout(function() {
    peer = new Peer(id, {key: apiKey});
    peer.on('connection', connect);
  }, 200);
}).call(this);
