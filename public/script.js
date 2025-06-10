const localVideo = document.getElementById('local');
const remoteVideo = document.getElementById('remote');
const callButton = document.getElementById('callButton');
const socket = io();

let pc;
let localStream;

// Get user media immediately
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
  })
  .catch(err => console.error('Failed to get local stream', err));

function startCall() {
  pc = new RTCPeerConnection();

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  pc.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('ice-candidate', event.candidate);
    }
  };

  socket.on('offer', async (offer) => {
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', answer);
  });

  socket.on('answer', async (answer) => {
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  });

  socket.on('ice-candidate', async (candidate) => {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      console.error(e);
    }
  });

  // Only create and send offer when the button is clicked
  (async () => {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', offer);
  })();
}

callButton.addEventListener('click', startCall);
