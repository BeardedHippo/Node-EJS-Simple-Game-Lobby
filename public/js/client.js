const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

const socket = io();

function serverUpdate(d) {
  socket.emit('board', d);
}

form.addEventListener('submit', function (e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat', input.value);
    input.value = '';
  }
});

socket.on('chat', function (msg) {
  const element = `<li style="color:white;">${msg}<li>`;
  messages.insertAdjacentHTML('beforeend', element);
  messages.scrollTop = messages.scrollHeight;
});
