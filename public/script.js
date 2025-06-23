const socket = io();
const animation = document.getElementById('animation');

function showAnimation(text) {
  animation.textContent = text;
  animation.style.display = 'block';
  setTimeout(() => { animation.style.display = 'none'; }, 2000);
}

socket.on('both-users-connected', () => {
  showAnimation("✅ Both users are now connected.");
});

// Add rest of peer connection setup...
