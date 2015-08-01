'use strict';

(function() {
  var socket = io();

  var followBtn = document.querySelector('#peer-connect');
  var followed = document.querySelector('#followed');
  var followers = document.querySelector('#followers');
  var accountBtn = document.querySelector('#account-update');
  var statusBtn = document.querySelector('#status-send');
  var statuses = document.querySelector('#statuses');
  var notification = document.querySelector('#notification');
  var account = {};
  var followingList = {};
  var followerList = {};
/*
  socket.on('dataack', function(data) {

    switch (data.type) {
      case 'follow.remove':
        dataack.notification = '(following) removed you ' + data.account.id;
        delete followingList[data.account.id];

        socket.emit('follow', {
          type: 'follow.remove',
          account: data.account
        });
        break;

      case 'follower.remove':
        dataack.notification = '(follower) removed you ' + data.account.id;
        delete followerList[data.account.id];

        socket.emit('follower', {
          type: 'follower.remove',
          account: data.account
        });
        break;
    }

  });
*/
  // Follow someone else's account
  followBtn.onclick = function(ev) {
    ev.preventDefault();

    var followID = document.querySelector('#peer-id').value;
    var followURL = document.querySelector('#peer-domain').value;

    if (!followID.trim() && !followURL.trim()) {
      // todo - add error messaging
      console.log('Invalid follow id and url');
      return;
    }

    console.log('attempting to follow an account ', followID);

    socket.emit('dataack', {
      type: 'follower.add',
      account: account
    });

    console.log('update local following list with followee ', followID);
    socket.emit('follow', {
      type: 'follow.add',
      account: {
        id: followID,
        publicURL: followURL
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
        name: document.querySelector('#acct-name').value || account.id,
        bio: document.querySelector('#acct-bio').value || '?',
        publicURL: document.querySelector('#acct-url').value || 'http://'
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

  function showNotification() {
    notification.classList.add('on');
    setTimeout(function() {
      notification.classList.remove('on');
    }, 5000);
  }

  // Notifications from status updates
  socket.on('statusack', function(data) {
    var li;
    var time;
    var div;

    function generateStatus(stat, type) {
      li = document.createElement('li');
      time = document.createElement('time');
      time.textContent = moment(parseInt(stat.created, 10)).fromNow();
      div = document.createElement('div');
      div.innerHTML = stat.account.name + ': ' + stat.status;
      li.appendChild(time);
      li.appendChild(div);

      if (type === 'add') {
        statuses.insertBefore(li, statuses.firstChild);
      } else {
        statuses.appendChild(li);
      }
    }

    switch (data.type) {
      case 'status.getAll':
        data.statuses.forEach(function(s) {
          generateStatus(s.value);
        });
        break;
      case 'status.add':
        generateStatus(data.status, 'add');
        break;
    }
  });

  // Notifications from following
  socket.on('followack', function(data) {
    var li;
    var a;
    var acct = data.account;

    console.log('Received', data);

    switch (data.type) {
      case 'follow.update':
        console.log(data.type, ': updating acct and sending followers a notification ', acct);
        notification.textContent = acct.name + ' updated their profile';
        showNotification();
        li = document.querySelector('#follow-id-' + acct.id);
        a = li.querySelector('a');
        a.href = acct.publicURL;
        a.textContent = acct.id + ': ' + acct.name;
        break;
      case 'follow.add':
        console.log(data.type, ': following acct and sending them a notification ', acct);
        if (document.querySelector('#follow-id-' + acct.id)) {
          break;
        }
        li = document.createElement('li');
        a = document.createElement('a');
        a.href = acct.publicURL;
        a.textContent = acct.id + ': ' + acct.name;
        li.appendChild(a);
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
          a = document.createElement('a');
          a.href = f.value.publicURL;
          a.textContent = f.value.id + ': ' + f.value.name;
          li.appendChild(a);
          li.id = 'follow-id-' + f.value.id;
          followed.appendChild(li);
        });
    }
  });

  // Notifications from followers
  socket.on('followerack', function(data) {
    var li;
    var a;
    var acct = data.account;

    console.log('Received', data);

    switch (data.type) {
      case 'follower.update':
        console.log(data.type, ': follower updating account and sending a notification ', acct);
        notification.textContent = acct.name + ' updated their profile';
        showNotification();
        li = document.querySelector('#follower-id-' + acct.id);
        a = li.querySelector('a');
        a.href = acct.publicURL;
        a.textContent = acct.id + ': ' + acct.name;
        break;
      case 'follower.add':
        console.log(data.type, ': follower added you and is sending a notification ', acct);
        notification.textContent = acct.name + ' is following your statuses';
        showNotification();
        if (document.querySelector('#follower-id-' + acct.id)) {
          break;
        }
        li = document.createElement('li');
        a = document.createElement('a');
        a.href = acct.publicURL;
        a.textContent = acct.id + ': ' + acct.name;
        li.appendChild(a);
        li.id = 'follower-id-' + acct.id;
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
          a = document.createElement('a');
          a.href = f.value.publicURL;
          a.textContent = f.value.id + ': ' + f.value.name;
          li.appendChild(a);
          li.id = 'follower-id-' + f.value.id;
          followers.appendChild(li);
        });
    }
  });

  // Update the server with your new account changes
  socket.on('accountack', function(data) {
    switch (data.type) {
      case 'account.get':
        document.querySelector('#acct-name').value = data.account.name;
        document.querySelector('#acct-bio').value = data.account.bio;
        document.querySelector('#acct-url').value = data.account.publicURL;
        account.name = data.account.name;
        account.bio = data.account.bio;
        break;
      case 'account.update':
        console.log('account details updated ', data.account);
        notification.textContent = 'your profile is updated';
        showNotification();
        document.querySelector('#acct-name').value = data.account.name;
        document.querySelector('#acct-bio').value = data.account.bio;
        document.querySelector('#acct-url').value = data.account.publicURL;
        account.name = data.account.name;
        account.bio = data.account.bio;
        break;
    }
  });

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

  // Get identifier;
  socket.emit('identifier');

  // Returns your identifier id
  socket.on('identifierack', function(identifier) {
    console.log('received identifier ', identifier);
    account.id = identifier
    document.querySelector('#identifier').textContent = account.id;
  });
}).call(this);
