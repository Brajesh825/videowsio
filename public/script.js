const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;

const peers = {};
let myVideoStream;

const joinForm = document.getElementById('join-form');
joinForm.addEventListener('submit', event => {
  event.preventDefault();

  const ROOM_ID = document.getElementById('room-id-input').value;
  const USER_ID = document.getElementById('user-id-input').value;

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
        if (userId) {
          connectToNewUser(userId, stream);
        }
      });

      socket.on('existing-users', userIds => {
        if (userIds) {
          userIds.forEach(userId => {
            if (userId !== USER_ID) connectToNewUser(userId, stream);
          });
        }
      });

      socket.on('user-disconnected', userId => {
        if (peers[userId]) peers[userId].close();
      });
    } else {
      console.error('Could not get media stream');
    }
  }).catch(err => {
    console.error('Failed to get user media', err);
  });

  socket.emit('join-room', ROOM_ID, USER_ID);
});

function connectToNewUser(userId, stream) {
  const peer = new SimplePeer({
    initiator: true,
    trickle: false,
    stream: stream
  });

  if (peer) {
    peer.on('signal', data => {
      if (data) {
        socket.emit('join-room', ROOM_ID, userId, data);
      }
    });

    peer.on('stream', userVideoStream => {
      if (userVideoStream) {
        const userVideo = document.createElement('video');
        addVideoStream(userVideo, userVideoStream);
      }
    });

    peer.on('close', () => {
      userVideo.remove();
    });

    peers[userId] = peer;
  }
}

function addVideoStream(video, stream) {
  if (video && stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
      video.play();
    });
    videoGrid.append(video);
  } else {
    console.error('Invalid parameters to addVideoStream');
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
