const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;

const peers = {};
let myVideoStream;

let USER_ID, ROOM_ID;


const joinForm = document.getElementById('join-form');
joinForm.addEventListener('submit', event => {
  event.preventDefault();

  ROOM_ID = document.getElementById('room-id-input').value;
  USER_ID = document.getElementById('user-id-input').value;

  if (!ROOM_ID || !USER_ID) {
    alert('Room ID and User ID are required');
    return;
  }

  navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  }).then(stream => {
    if (stream) {
      myVideoStream = stream;
      addVideoStream(myVideo, stream);

      socket.on('user-connected', userId => {
        if (userId !== USER_ID) connectToNewUser(userId, stream);
      });

      socket.on('existing-users', existingUsers => {
        existingUsers.forEach(user => {
          if (user.id !== USER_ID) connectToNewUser(user.id, stream);
        });
      });

      socket.on('user-disconnected', userId => {
        if (peers[userId]) {
          peers[userId].destroy();
          delete peers[userId];
        }
      });

      socket.emit('join-room', ROOM_ID, USER_ID);
    } else {
      console.error('Could not get media stream');
    }
  }).catch(err => {
    console.error('Failed to get user media', err);
  });
});

function connectToNewUser(userId, stream) {
  const peer = new SimplePeer({
    initiator: true,
    trickle: false,
    stream: stream
  });

  peer.on('signal', data => {
    socket.emit('join-room', ROOM_ID, userId, data);
  });

  peer.on('stream', userVideoStream => {
    addVideoStream(userId, userVideoStream);
  });

  peers[userId] = peer;
  broadcastStream(peer, stream); // Broadcast the user's stream to everyone
}

function addVideoStream(userId, stream) {
  const video = document.createElement('video');
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.appendChild(video);
}

function broadcastStream(peer, stream) {
  for (const userId in peers) {
    if (userId !== USER_ID) {
      peer.signal(peers[userId].initiator ? peers[userId].initiator : peers[userId].receiver);
    }
  }
}

document.getElementById('muteButton').addEventListener('click', () => {
  if (myVideoStream && myVideoStream.getAudioTracks().length > 0) {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    myVideoStream.getAudioTracks()[0].enabled = !enabled;
  }
});

document.getElementById('stopVideo').addEventListener('click', () => {
  if (myVideoStream && myVideoStream.getVideoTracks().length > 0) {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    myVideoStream.getVideoTracks()[0].enabled = !enabled;
  }
});
