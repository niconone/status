(function() {
  var peer = new Peer({key: 'tomy8eqp4jazia4i'});

  var connectBtn = document.querySelector('#peer-connect');
  var id;

  function connect(conn) {
    conn.on('data', function(data) {
      document.querySelector('#message').textContent = data;
      console.log('Received', data);
    });

    conn.send('hello from ' + id);
  }

  peer.on('open', function(i) {
    id = i;
    console.log('My peer ID is: ' + id);
  });

  peer.on('connection', connect);

  connectBtn.onclick = function(ev) {
    ev.preventDefault();

    console.log(document.querySelector('#peer-id').value)

    var conn = peer.connect(document.querySelector('#peer-id').value);

    conn.on('open', function() {
      connect(conn);
    });

    conn.on('error', function(err) {
      console.log(err);
    });
  }
}).call(this);
