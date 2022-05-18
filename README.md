# Simple Game Lobby
**[Demo versie](https://simple-game-lobby.herokuapp.com/)**

Met een maat ben ik een Battle Royale Tetris aan het bouwen. Dit is de game-lobby die ik hiervoor ontwikkeld heb. 

Hiermee kunnen gebruikers zich verzamelen, een gebruikersnaam kiezen, chatten en zich als ‘ready’ opgeven. Dan vuurt de server een event naar alle sockets met een linkje om het spel te starten.

Hiervoor wordt NodeJS+ExpressJS gebruikt om een webserver op te zetten. EJS met vanillaJS voor de front-end. En SQLite als database. 

## Werking
Een enkele `npm install` zou het geheel lokaal bruikbaar moeten maken.

`/Views` zijn alle client-side front-end bestanden

`/Routes` zijn de serverroutes voor de homepage en lobby

`app.js` past alle middleware toe

`/Bin/Database.js` heeft een database class die alle methods biedt voor het aanpassen of opvragen van database data

`/Bin/www` start de server op