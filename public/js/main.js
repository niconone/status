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
  var feed = document.querySelector('#feed-profile-view');
  var closePreview = feed.querySelector('.close');
  var profileDetails = document.querySelector('#profile-details h2');
  var followDetails = document.querySelector('#follow-details h2');
  var profileClose = document.querySelector('#profile-details .close');
  var followClose = document.querySelector('#follow-details .close');

  var account = {};
  var followingList = {};
  var followerList = {};

  profileDetails.onclick = profileClose.onclick =
  followDetails.onclick = followClose.onclick = function(ev) {
    var parent = ev.target.parentNode;

    if (ev.target.parentNode.classList.contains('actions')) {
      parent = ev.target.parentNode.parentNode;
    }
    if (parent.classList.contains('on')) {
      parent.classList.remove('on');
    } else {
      parent.classList.add('on');
    }
  };

  closePreview.onclick = function(ev) {
    ev.preventDefault();
    feed.classList.remove('on');
    feed.querySelector('iframe').src = '';
  };

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

    followID.value = '';
    followURL.value = '';
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
    var button;
    var a;

    function generateStatus(stat, type) {
      li = document.createElement('li');
      a = document.createElement('a');
      a.href = stat.account.publicURL + '/feed';
      a.classList.add('user-feed');
      a.textContent = stat.account.name || stat.account.id;
      a.onclick = function(ev) {
        ev.preventDefault();
        feed.querySelector('iframe').src = this.href;
        feed.classList.add('on');
      };
      li.appendChild(a);
      time = document.createElement('time');
      time.textContent = moment(parseInt(stat.created, 10)).fromNow();
      div = document.createElement('div');
      div.innerHTML = stat.status;
      li.appendChild(time);
      li.appendChild(div);
      li.id = 'item-status-' + stat.created + '-' + stat.id;
      div = document.createElement('div');
      div.classList.add('actions');
      button = document.createElement('button');
      button.textContent = 'x';
      button.id = 'status-' + stat.created + '-' + stat.id;
      button.onclick = function(ev) {
        ev.preventDefault();

        if (confirm('Confirm status deletion?')) {
          console.log('deleting');
          socket.emit('status', {
            type: 'status.remove',
            key: this.id
          });
        }
      };

      div.appendChild(button);
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
      case 'status.remove':
        console.log(data.status, statuses.querySelector('#item-' + data.status));
        statuses.removeChild(statuses.querySelector('#item-' + data.status));
        break;
    }
  });

  function updateFollowing(data) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = data.publicURL;
    a.textContent = data.name || data.id;
    a.onclick = function(ev) {
      ev.preventDefault();
      feed.querySelector('iframe').src = this.href;
      feed.classList.add('on');
    };
    var button = document.createElement('button');
    button.textContent = 'x';
    button.onclick = function(ev) {
      ev.preventDefault();

      if (confirm('Confirm unfollow?')) {
        console.log('unfollowing ', data.id);
        socket.emit('follow', {
          type: 'follow.remove',
          account: {
            id: data.id
          }
        });
      }
    };
    li.appendChild(a);
    li.appendChild(button);
    li.id = 'follow-id-' + data.id;
    followed.appendChild(li);
  }

  // Notifications from following
  socket.on('followack', function(data) {
    var acct = data.account;

    console.log('Received', data);

    switch (data.type) {
      case 'follow.update':
        console.log(data.type, ': updating acct and sending followers a notification ', acct);
        notification.textContent = acct.name + ' updated their profile';
        //showNotification();
        var li = document.querySelector('#follow-id-' + acct.id);
        if (li) {
          var a = li.querySelector('a');
          a.href = acct.publicURL + '/feed';
          a.textContent = acct.name || acct.id;
        }
        break;
      case 'follow.add':
        console.log(data.type, ': following acct and sending them a notification ', acct);
        if (document.querySelector('#follow-id-' + acct.id)) {
          break;
        }
        updateFollowing(acct);
        break;
      case 'follow.remove':
        console.log(data.type, ': unfollowing acct and sending them a notification', acct);
        console.log(document.querySelector('#follow-id-' + acct.id))
        followed.removeChild(document.querySelector('#follow-id-' + acct.id));
        break;
      case 'follow.getAll':
        console.log(data.type, ': getting all following ', data.following);

        while (followers.hasChildNodes()) {
          followed.removeChild(followed.firstChild);
        }

        data.following.forEach(function(f) {
          followingList[f.value.id] = f.value;
          updateFollowing(f.value);
        });
        break;
    }
  });

  function updateFollowers(data) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = data.publicURL;
    a.textContent = data.name || data.id;
    a.onclick = function(ev) {
      ev.preventDefault();
      feed.querySelector('iframe').src = this.href;
      feed.classList.add('on');
    };
    li.appendChild(a);
    li.id = 'follower-id-' + data.id;
    followers.appendChild(li);
  }

  // Notifications from followers
  socket.on('followerack', function(data) {
    var acct = data.account;

    console.log('Received', data);

    switch (data.type) {
      case 'follower.update':
        console.log(data.type, ': follower updating account and sending a notification ', acct);
        //showNotification();
        var li = document.querySelector('#follower-id-' + acct.id);
        if (li) {
          var a = li.querySelector('a');
          a.href = acct.publicURL + '/feed';
          a.textContent = acct.name || acct.id;
        }
        break;
      case 'follower.add':
        console.log(data.type, ': follower added you and is sending a notification ', acct);
        notification.textContent = acct.name + ' is following your statuses';
        showNotification();
        if (document.querySelector('#follower-id-' + acct.id)) {
          break;
        }
        updateFollowers(acct);
        break;
      case 'follower.remove':
        console.log(data.type, ': follower removed you and is sending a notification ', acct);
        followers.removeChild(document.querySelector('#follower-id-' + acct.id));
        break;
      case 'follower.getAll':
        console.log(data.type, ': getting all followers ', data.followers);

        while (followers.hasChildNodes()) {
          followers.removeChild(followers.firstChild);
        }

        data.followers.forEach(function(f) {
          followerList[f.value.id] = f.value;
          updateFollowers(f.value);
        });
        break;
    }
  });

  function updateAccountDetails(data) {
    document.querySelector('#acct-name').value = data.account.name;
    document.querySelector('#acct-bio').value = data.account.bio;
    document.querySelector('#acct-url').value = data.account.publicURL;
    account.name = data.account.name;
    account.bio = data.account.bio;
    account.publicURL = data.account.publicURL;
  }

  // Update the server with your new account changes
  socket.on('accountack', function(data) {
    switch (data.type) {
      case 'account.get':
        updateAccountDetails(data);
        break;
      case 'account.update':
        console.log('account details updated ', data.account);
        notification.textContent = 'your profile is updated';
        showNotification();
        updateAccountDetails(data);
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
    account.id = identifier;
    document.querySelector('#identifier').textContent = account.id;
  });
}).call(this);
