const socket = io();

// Sockets
socket.on('newLobbyUri', (data) => {
  window.location.href = `${window.location}lobby/${data}`;
});

// Functions
function newLobby() {
  socket.emit('newLobby');
}
