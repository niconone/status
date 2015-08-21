'use strict';

(function() {
  var socket = io();

  var statuses = document.querySelector('#statuses');

  // Notifications from status updates
  socket.on('feedack', function(data) {
    var li;
    var time;
    var div;

    function generateStatus(stat) {
      li = document.createElement('li');
      time = document.createElement('time');
      time.textContent = moment(parseInt(stat.created, 10)).fromNow();
      div = document.createElement('div');
      div.innerHTML = stat.status;
      li.appendChild(time);
      li.appendChild(div);
      li.id = 'item-status-' + stat.created + '-' + stat.id;

      if (data.type === 'feed.add') {
        statuses.insertBefore(li, statuses.firstChild);
      } else {
        statuses.appendChild(li);
      }
    }

    if (data.type === 'feed.add') {
      generateStatus(data.status);
    } else {
      data.statuses.forEach(function(s) {
        generateStatus(s.value);
      });
    }
  });

  // Get user feed
  socket.emit('feed', {
    type: 'feed.getAll'
  });
}).call(this);
