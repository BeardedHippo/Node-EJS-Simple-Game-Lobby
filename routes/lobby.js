// Dit is de router voor de lobby. Hier gebeurt wat meer. Hier ga ik stukje voor stukje langs.

const express = require('express');
const router = express.Router();

router.get('/:lobbyId', function(req, res, next) {
  const io = req.app.get('socketio');
  const db = req.app.get('db');

  // Eerst een check of de lobby uri klopt
  db.doesLobbyExist((response) => {
    if (response === true) {
      io.once('connection', (socket) => {
        const lobbyUri = req.params.lobbyId;

        // PlayerData is ervoor om voor de client data te onthouden die hij nodig kan hebben, zodat het database niet
        // altijd nodig is.
        let playerData = {
          playerName: '',
          totalPlayers: 0,
          readyPlayers: 0,
          checkCaller: false,
        }

        // Een client kan zichzelf éénmaal opgeven. Daarna wordt er in het database een nieuwe speler gemaakt en joined
        // de speler de lobby van de uri. Vervolgens wordt er in het database gecontroleerd welke andere spelers er zijn.
        // Vervolgens wordt er een emit gemaakt naar iedereen in de lobby, dat er een nieuwe speler is.
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

        // Als een client disconnect wordt er eerst gekeken of die client wel een speler was. Scheelt een hoop processing.
        // Daarna wordt de speler verwijdert en krijgt de spelers van de lobby een notificatie dat die speler weg is.
        // Dan update de lobby van de andere spelers.
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

        // De readycheck gaat erom of alle spelers klaar zijn voor het starten van de game. Omdat hier veel events aan
        // gekoppeld staan heb ik alles in één socket listener gezet die op basis van een switch case de juiste response
        // levert.
        socket.on('readycheck', (event) => {
          switch(event.event) {
            // De increaes en decrease total players heeft ermee te maken om checks te doen voordat het database
            // benaderd hoeft te worden.
            case 'increasePlayers':
              playerData.totalPlayers++
              break;
            case 'decreasePlayers':
              playerData.totalPlayers--
              break;

            // De readychecks gaat 2x heen en weer. Eerst geeft een speler aan om klaar te zijn. De server laat dit aan
            // andere clients weten. De clients geven aan dat die speler wel of niet klaar is. Het moment dat alle
            // clients aan hebben gegeven dat ze ready zijn, dan word the spel gestart.
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
