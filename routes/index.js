// Dit is de router van de index. Het enige dat dit doet is een nieuwe lobby aanmaken en de lobby uri doorsturen
// naar de client. Socket en het database zijn hier als variabelen geimporteerd voor makkelijke calling.

const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  const io = req.app.get('socketio');
  const db = req.app.get('db');

  io.on('connection', (socket) => {
    socket.on('newLobby', (data) => {
      db.newLobby((data) => {
        socket.emit('newLobbyUri', data);
      })
    });
  });

  res.render('index', { title: 'Simple Game Lobby' });
});

module.exports = router;
