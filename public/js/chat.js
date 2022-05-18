const form = document.getElementById('form');
const input = document.getElementById('input');
const messages = document.getElementById('messages');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('chat', input.value);
    input.value = '';
  }
});

socket.on('chat', function (data) {
  const element = `<li style="color:white;">${data.playerName} zegt: ${data.msg}<li>`;

  messages.insertAdjacentHTML('beforeend', element);
  messages.scrollTop = messages.scrollHeight;
});
