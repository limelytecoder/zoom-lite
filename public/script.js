const localVideo = document.getElementById('local');
const remoteVideo = document.getElementById('remote');
const callButton = document.getElementById('startCall');
const toggleVideoBtn = document.getElementById('toggleVideo');
const toggleAudioBtn = document.getElementById('toggleAudio');
const chatInput = document.getElementById('chatInput');
const sendChat = document.getElementById('sendChat');
const chatLog = document.getElementById('chatLog');

const socket = io();

let pc;
let localStream;
let dataChannel;

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  .then(stream => {
    localStream = stream;
    localVideo.srcObject = stream;
  })
  .catch(err => console.error('Stream error:', err));

function appendMessage(msg, from = 'You') {
  const p = document.createElement('p');
  p.textContent = `${from}: ${msg}`;
  chatLog.appendChild(p);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function setupPeerConnection() {
  pc = new RTCPeerConnection();

  dataChannel = pc.createDataChannel('chat');
  dataChannel.onmessage = e => appendMessage(e.data, 'Peer');

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  pc.ontrack = e => {
    remoteVideo.srcObject = e.streams[0];
  };

  pc.ondatachannel = e => {
    e.channel.onmessage = ev => appendMessage(ev.data, 'Peer');
  };

  pc.onicecandidate = e => {
    if (e.candidate) {
      socket.emit('ice-candidate', e.candidate);
    }
  };

  socket.on('offer', async offer => {
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('answer', answer);
  });

  socket.on('answer', async answer => {
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  });

  socket.on('ice-candidate', async candidate => {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  });
}

callButton.onclick = async () => {
  setupPeerConnection();
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('offer', offer);
};

toggleVideoBtn.onclick = () => {
  const videoTrack = localStream.getVideoTracks()[0];
  if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
  toggleVideoBtn.textContent = videoTrack.enabled ? 'Turn Off Video' : 'Turn On Video';
};

toggleAudioBtn.onclick = () => {
  const audioTrack = localStream.getAudioTracks()[0];
  if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
  toggleAudioBtn.textContent = audioTrack.enabled ? 'Mute' : 'Unmute';
};

sendChat.onclick = () => {
  const message = chatInput.value.trim();
  if (message && dataChannel && dataChannel.readyState === 'open') {
    dataChannel.send(message);
    appendMessage(message);
    chatInput.value = '';
  }
};

chatInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') sendChat.click();
});
