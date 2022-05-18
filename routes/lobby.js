const express = require('express');
const router = express.Router();

router.get('/:lobbyId', function(req, res, next) {
  const io = req.app.get('socketio');
  const db = req.app.get('db');

  db.doesLobbyExist((response) => {
    if (response === true) {
      io.once('connection', (socket) => {
        const lobbyUri = req.params.lobbyId;
        let playerData = {
          playerName: '',
          totalPlayers: 0,
          readyPlayers: 0,
          checkCaller: false,
        }

        socket.once('newPlayer', (playerName) => {
          db.newPlayer(async (playerName) => {
            playerData.playerName = playerName;

            await socket.join(lobbyUri);

            db.getAllPlayers((allPlayers) => {

              io.to(lobbyUri).emit('updateLobby', {event: "newplayer", allPlayers});
              playerData.totalPlayers = allPlayers.length - 1;
            }, lobbyUri);

          }, playerName, lobbyUri, socket.id);
        })

        socket.on('disconnect', () => {
          if (playerData.playerName === '') {
            return
          }

          db.removePlayer(async () => {
            db.getAllPlayers((allPlayers) => {
              io.to(lobbyUri).emit('updateLobby', {event: "idlePlayer", allPlayers});
            }, lobbyUri);

          }, socket.id);
        });

        socket.on('chat', (msg) => {
          io.to(lobbyUri).emit('chat', {playerName: playerData.playerName, msg});
        });

        socket.on('readycheck', (event) => {
          switch(event.event) {
            case 'increasePlayers':
              playerData.totalPlayers++
              break;
            case 'decreasePlayers':
              playerData.totalPlayers--
              break;
            case 'setReadyStatus':
              if (typeof(event.content) === "boolean") {
                playerData.checkCaller = false;

                if (event.content === true) {
                  playerData.checkCaller = true;
                  io.to(lobbyUri).emit('preparations', "readycheck");
                }
              }
              break;
            case 'readycheckResponse':
              if (event.content === true) {
                db.updatePlayer(event.content, socket.id);
                playerData.readyPlayers++

                if (playerData.readyPlayers === playerData.totalPlayers && playerData.checkCaller === true) {
                  db.getAllPlayers((allPlayers) => {
                    const condition = (player) => player.readyStatus === false;

                    if (allPlayers.some(condition) === false) {
                      io.to(lobbyUri).emit('preparations', "gameready");
                      console.log('Start game officially')
                    }
                  }, lobbyUri);
                }
              } else if (event.content === false) {
                playerData.checkCaller = false;
              }
              break;
            default:
              console.log('Invalid event type detected.')
          }
        })
      });
      res.render('lobby', { title: 'Simple Game Lobby' });
    } else {
      res.redirect('/');
    }
  }, req.params.lobbyId);
});

module.exports = router;
