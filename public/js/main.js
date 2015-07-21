'use strict';

(function() {
  var socket = io();

  var followBtn = document.querySelector('#peer-connect');
  var followed = document.querySelector('#followed');
  var followers = document.querySelector('#followers');
  var accountBtn = document.querySelector('#account-update');
  var statusBtn = document.querySelector('#status-send');
  var statuses = document.querySelector('#statuses');
  var account = {};
  var followingList = {};
  var followerList = {};

  var apiKey;
  var peer;

  function connect(conn) {
    conn.on('data', function(data) {
      var dataack = {
        type: data.type
      };

      switch (data.type) {
        case 'follow-add':
          dataack.notification = '(following) added you ' + data.account.id;
          followingList[data.account.id] = data.account;

          socket.emit('follow', {
            type: 'follow.add',
            account: data.account
          });
          break;
        case 'follow-remove':
          dataack.notification = '(following) removed you ' + data.account.id;
          delete followingList[data.account.id];

          socket.emit('follow', {
            type: 'follow.remove',
            account: data.account
          });
          break;
        case 'follower-add':
          dataack.notification = '(follower) added you ' + data.account.id;
          followerList[data.account.id] = data.account;

          socket.emit('follower', {
            type: 'follower.add',
            account: data.account
          });
          break;
        case 'follower-remove':
          dataack.notification = '(follower) removed you ' + data.account.id;
          delete followerList[data.account.id];

          socket.emit('follower', {
            type: 'follower.remove',
            account: data.account
          });
          break;
        case 'status-add':
          dataack.notification = 'status add ' + data.status;

          socket.emit('status', {
            type: 'status.add',
            status: data.status
          });
          break;
        case 'status-remove':
          dataack.notification = 'status remove ' + data.status;
          break;
        case 'follow-account':
          dataack.notification = 'updated their account ' + data.account.id;
          followingList[data.account.id] = data.account;

          socket.emit('follow', {
            type: 'follow.update',
            account: data.account
          });
          break;
        case 'follower-account':
          dataack.notification = 'updated their account ' + data.account.id;
          followerList[data.account.id] = data.account;

          socket.emit('follower', {
            type: 'follower.update',
            account: data.account
          });
          break;
      }

      document.querySelector('#message').textContent = dataack.notification;
      console.log('Received', data);
    });
  }

  // Follow someone else's account
  followBtn.onclick = function(ev) {
    ev.preventDefault();

    var followID = document.querySelector('#peer-id').value;
    var conn = peer.connect(followID);
    console.log('attempting to follow an account ', followID);

    conn.on('open', function() {
      console.log('notify followee of add ', followID);
      conn.send({
        type: 'follower-add',
        account: account
      });
    });

    conn.on('error', function(err) {
      console.log(err);
    });

    console.log('update local following list with followee ', followID);
    socket.emit('follow', {
      type: 'follow.add',
      account: {
        id: followID
      }
    });

    document.querySelector('#peer-id').value = '';
  };

  // Update your public account details
  accountBtn.onclick = function(ev) {
    ev.preventDefault();

    console.log('attempting to update account details');
    socket.emit('account', {
      type: 'account.update',
      account: {
        name: document.querySelector('#acct-name').value || '?',
        bio: document.querySelector('#acct-bio').value || '?'
      }
    });
  };

  // Send a status update
  statusBtn.onclick = function(ev) {
    ev.preventDefault();

    console.log('attempting to send a status update to connected followers');
    socket.emit('status', {
      type: 'status.add',
      status: {
        status: document.querySelector('#status-message').value,
        account: account
      }
    });

    document.querySelector('#status-message').value = '';
  };

  // Returns api key from the server
  socket.on('apiack', function(peerKey) {
    console.log('received peerjs apiKey ', peerKey);
    apiKey = peerKey;
  });

  // Notifications from status updates
  socket.on('statusack', function(data) {
    var f;
    var conn;
    var li;
    var time;
    var p;

    var status = data.status;

    switch (data.type) {
      case 'status.getAll':
        data.statuses.forEach(function(s) {
          li = document.createElement('li');
          time = document.createElement('time');
          time.textContent = s.value.created;
          p = document.createElement('p');
          p.textContent = s.value.account.name + ': ' + s.value.status;
          li.appendChild(time);
          li.appendChild(p);
          statuses.appendChild(li);
        });
        break;
      case 'status.add':
        if (account.id == status.account.id) {
          console.log(data.type, ': your status add is being sent to connected followers ', data);
          for (f in followerList) {
            conn = peer.connect(f);

            conn.on('open', function() {
              conn.send({
                type: 'status-add',
                status: status
              });
            });
          }
        }

        li = document.createElement('li');
        time = document.createElement('time');
        time.textContent = data.status.created;
        p = document.createElement('p');
        p.textContent = status.account.name + ': ' + status.status;
        li.appendChild(time);
        li.appendChild(p);
        statuses.insertBefore(li, statuses.firstChild);
        break;
      case 'status.remove':
        if (account.id == status.account.id) {
          console.log(data.type, ': your status remove is being sent to connected followers ', data);
          for (f in followerList) {
            conn = peer.connect(f);

            conn.on('open', function() {
              conn.send({
                type: 'status-remove',
                status: status.status
              });
            });
          }
        }

        // todo - remove message
        break;
    }
  });

  // Notifications from following
  socket.on('followack', function(data) {
    var li;
    var acct = data.account;

    switch (data.type) {
      case 'follow.update':
        console.log(data.type, ': updating acct and sending followers a notification ', acct);
        li = document.querySelector('#follow-id-' + acct.id);
        li.textContent = acct.id + ': ' + acct.name;
        break;
      case 'follow.add':
        console.log(data.type, ': following acct and sending them a notification ', acct);
        if (document.querySelector('#follow-id-' + acct.id)) {
          break;
        }
        li = document.createElement('li');
        li.textContent = acct.id + ': ' + acct.name;
        li.id = 'follow-id-' + acct.id;
        followed.appendChild(li);
        break;
      case 'follow.remove':
        console.log(data.type, ': unfollowing acct and sending them a notification', acct);
        followed.removeChild('follow-id-' + acct.id);
        break;
      case 'follow.getAll':
        console.log(data.type, ': getting all following ', data.following);

        while (followers.hasChildNodes()) {
          followed.removeChild(followed.firstChild);
        }

        data.following.forEach(function(f) {
          followingList[f.value.id] = f.value;
          li = document.createElement('li');
          li.textContent = f.value.id + ': ' + f.value.name;
          li.id = 'follow-id-' + f.value.id;
          followed.appendChild(li);
        });
    }
  });

  // Notifications from followers
  socket.on('followerack', function(data) {
    var li;
    var acct = data.account;

    switch (data.type) {
      case 'follower.update':
        console.log(data.type, ': follower updating account and sending a notification ', acct);
        li = document.querySelector('#follower-id-' + acct.id);
        li.textContent = acct.id + ': ' + acct.name;
        break;
      case 'follower.add':
        console.log(data.type, ': follower added you and is sending a notification ', acct);
        if (document.querySelector('#follower-id-' + acct.id)) {
          break;
        }
        li = document.createElement('li');
        li.textContent = acct.id + ': ' + acct.name;
        li.id = 'id-' + acct.id;
        followers.appendChild(li);
        break;
      case 'follower.remove':
        console.log(data.type, ': follower removed you and is sending a notification ', acct);
        followers.removeChild('follower-id-' + acct.id);
        break;
      case 'follower.getAll':
        console.log(data.type, ': getting all followers ', data.followers);

        while (followers.hasChildNodes()) {
          followers.removeChild(followers.firstChild);
        }

        data.followers.forEach(function(f) {
          followerList[f.value.id] = f.value;
          li = document.createElement('li');
          li.textContent = f.value.id + ': ' + f.value.name;
          li.id = 'follower-id-' + f.value.id;
          followers.appendChild(li);
        });
    }
  });

  // Returns your identifier id
  socket.on('identifierack', function(identifier) {
    console.log('received identifier ', identifier);
    account.id = identifier;
    document.querySelector('#identifier').textContent = identifier;
  });

  // Update the server with your new account changes
  socket.on('accountack', function(data) {
    switch (data.type) {
      case 'account.get':
        document.querySelector('#acct-name').value = data.account.name;
        document.querySelector('#acct-bio').value = data.account.bio;
        account.name = data.account.name;
        account.bio = data.account.bio;
        break;
      case 'account.update':
        console.log('account details updated ', data.account);
        document.querySelector('#acct-name').value = data.account.name;
        document.querySelector('#acct-bio').value = data.account.bio;
        account.name = data.account.name;
        account.bio = data.account.bio;

        for (var f in followerList) {
          var conn = peer.connect(f);

          conn.on('open', function() {
            conn.send({
              type: 'follower-account',
              account: data.account
            });

            conn.send({
              type: 'follow-account',
              account: data.account
            });
          });
        }
        break;
    }
  });

  // Ask for your identifier from the server
  socket.emit('identifier');

  // Get account details
  socket.emit('account', {
    type: 'account.get'
  });

  // Get your following list
  socket.emit('follow', {
    type: 'follow.getAll'
  });

  // Get your follower list
  socket.emit('follower', {
    type: 'follower.getAll'
  });

  // Get feed
  socket.emit('status', {
    type: 'status.getAll'
  });

  // Let's wait until we get all that server data via websockets before we access it
  setTimeout(function() {
    console.log('connecting to peerjs server');
    peer = new Peer(account.id, {key: apiKey, debug: 3});
    peer.on('connection', connect);
  }, 500);
}).call(this);
