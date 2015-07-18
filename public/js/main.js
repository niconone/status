'use strict';

(function() {
  var socket = io();

  var followBtn = document.querySelector('#peer-connect');
  var followed = document.querySelector('#followed');
  var followers = document.querySelector('#followers');
  var accountBtn = document.querySelector('#account-update');
  var account = {};

  var apiKey;
  var id;
  var peer;

  function connect(conn) {
    conn.on('data', function(data) {
      var dataack = {
        type: data.type
      };

      switch (data.type) {
        case 'follow-add':
          dataack.notification = 'added you ' + data.account.id;
          break;
        case 'follow-remove':
          dataack.notification = 'removed you';
          break;
        case 'follower-add':
          dataack.notification = 'someone you follow added you';
          break;
        case 'follower-remove':
          dataack.notification = 'someone you follow removed you';
          break;
        case 'status-follower':
          break;
        case 'status-following':
          break;
        case 'follower-account':
          dataack.notification = 'updated their account';
          socket.emit('follow', {
            type: 'add',
            account: data.account
          });
          break;
      }
      console.log('------- ', data, dataack)
      document.querySelector('#message').textContent = dataack.notification;
      console.log('Received', data);
    });
  }

  // Follow someone else's account
  followBtn.onclick = function(ev) {
    ev.preventDefault();

    var followID = document.querySelector('#peer-id').value;
    var conn = peer.connect(followID);

    conn.on('open', function() {
      conn.send({
        type: 'follow-add',
        account: account
      });
    });

    conn.on('error', function(err) {
      console.log(err);
    });

    socket.emit('follow', {
      type: 'add',
      account: {
        id: followID
      }
    });
  };

  // Update your public account details
  accountBtn.onclick = function(ev) {
    ev.preventDefault();

    // todo - replace with follow array
    var followID = document.querySelector('#peer-id').value;
    var conn = peer.connect(followID);

    conn.on('open', function() {
      conn.send({
        type: 'follower-account',
        account: account
      });
    });

    socket.emit('account', {
      name: document.querySelector('#acct-name').value || '?',
      bio: document.querySelector('#acct-bio').value || '?'
    });
  };

  // Returns api key from the server
  socket.on('apiack', function(peerKey) {
    apiKey = peerKey;
  });

  // Notifications from following
  socket.on('followack', function(data) {
    var li;

    switch (data.type) {
      case 'add':
        if (document.querySelector('#id-' + data.id)) {
          break;
        }
        li = document.createElement('li');
        li.textContent = data.id + ': ' + data.name;
        li.id = 'id-' + data.id;
        followed.appendChild(li);
        break;
      case 'remove':
        followed.removeChild('id-' + data.id);
        break;
      case 'getAll':
        data.following.forEach(function(f) {
          console.log(f)
          li = document.createElement('li');
          li.textContent = f.id + ': ' + f.name;
          li.id = 'id-' + f.id;
          followed.appendChild(li);
        });
    }
  });

  // Notifications from followers
  socket.on('followerack', function(data) {
    var li;

    switch (data.type) {
      case 'add':
        if (document.querySelector('#id-' + data.id)) {
          break;
        }
        li = document.createElement('li');
        li.textContent = data.id + ': ' + data.name;
        li.id = 'id-' + data.id;
        followers.appendChild(li);
        break;
      case 'remove':
        followers.removeChild('id-' + data.id);
        break;
      case 'getAll':
        data.followers.forEach(function(f) {
          li = document.createElement('li');
          li.textContent = f.id + ': ' + f.name;
          li.id = 'id-' + f.id;
          followers.appendChild(li);
        });
    }
  });

  // Returns your identifier id
  socket.on('identifierack', function(identifier) {
    id = identifier;
    account.id = id;
    document.querySelector('#identifier').textContent = identifier;
  });

  // Update the server with your new account changes
  socket.on('accountack', function(acct) {
    document.querySelector('#acct-name').textContent = acct.name;
    document.querySelector('#acct-bio').textContent = acct.bio;
    account = {
      name: acct.name,
      bio: acct.bio
    };

    // todo - replace with follow array
    var followID = document.querySelector('#peer-id').value;
    var conn = peer.connect(followID);

    conn.on('open', function() {
      conn.send({
        type: 'follower-account',
        account: account
      });
    });
  });

  // Ask for your identifier from the server
  socket.emit('identifier');

  // Get your following list
  socket.emit('follow', {
    type: 'getAll'
  });

  // Get your follower list
  socket.emit('follower', {
    type: 'getAll'
  });

  // Let's wait until we get all that server data before we access it
  setTimeout(function() {
    peer = new Peer(id, {key: apiKey});
    peer.on('connection', connect);
  }, 200);
}).call(this);
