const sqlite3 = require('sqlite3');
const dbPath = ('./bin/database.db');

class Database {
    constructor() {}

    insert(table, column, value, callback) {
        const amountOfValues = (value.length > 1) ? Array(value.length + 1).join("?, ").slice(0, value.length * 3 - 2) : "?";
        const sql = `INSERT INTO ${table}(${column}) VALUES (${amountOfValues})`;

        this.connect();
        this.newDb.run(sql, value, (err) => {
            callback(err);
        });
        this.close();
    }

    delete(sql, value, callback) {
        this.connect();
        this.newDb.run(sql, value, (err) => {
            if (err) {
                return console.error(err.message);
            } else {
                callback();
            }
        });
        this.close();
    }

    connect() {
        this.newDb = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                return console.error(err.message);
            }
        });
    }

    close() {
        this.newDb.close((err) => {
            if (err) {
                return console.error(err.message);
            }
        });
    }

    newLobby(callback) {
        const newLobbyUri = Math.random().toString(36).substring(2, 15);

        this.insert('lobbies', 'lobby_uri', [newLobbyUri], (res) => {
            if (res) {
                if (res.errno === 19) {
                    const newLobbyUri = Math.random().toString(36).substring(2, 15);

                    this.insert('lobbies', 'lobby_uri', [newLobbyUri], err => {
                        if (err) {
                            console.log(err.message);
                        } else {
                            callback(newLobbyUri);
                        }
                    });
                } else {
                    console.log(res.message);
                }
            } else {
                callback(newLobbyUri);
            }
        });
    }

    doesLobbyExist(callback, lobbyUri) {
        const sql = `SELECT lobby_uri lobbyUri FROM lobbies WHERE lobby_uri = ?`;

        this.connect();
        this.newDb.get(sql, [lobbyUri], (err, row) => {
            if (err) {
                return console.error(err.message)
            } else {
                return row
                    ? callback(true)
                    : callback(false)
            }
        })
        this.close();
    }

    newPlayer(callback, playerName, lobbyUri, socket) {
        this.insert('players', 'player_name, lobby, socket', [playerName, lobbyUri, socket], (err) => {
            if (err) {
                console.log(err.message);
            } else {
                callback(playerName);
            }
        })
    }

    removePlayer(callback, socket) {
        const sql = `DELETE FROM players WHERE socket=(?)`;
        this.delete(sql, socket, callback);
    }

    getAllPlayers(callback, lobbyUri) {
        const sql = `SELECT player_name playerName, ready_status readyStatus FROM players WHERE lobby = ?`;

        this.connect();
        this.newDb.all(sql, [lobbyUri], (err, row) => {
            if (err) {
                return console.error(err.message)
            } else {
                callback(row)
            }
        })
        this.close();
    }

    updatePlayer(readyStatus, socket) {
        const sql = `UPDATE players SET ready_status = ? WHERE socket = ?`;

        this.connect();
        this.newDb.all(sql, [readyStatus, socket], (err) => {
            if (err) {
                return console.error(err.message)
            }
        })
        this.close();
    }

    scrapper(currentSockets) {

        const amountOfValues = (currentSockets.length > 1) ? Array(currentSockets.length + 1).join("?, ").slice(0, currentSockets.length * 3 - 2) : "?";
        const sqlPlayers = `DELETE FROM players WHERE socket NOT IN (${amountOfValues})`;
        const sqlLobbies = `DELETE FROM lobbies WHERE lobby_uri NOT IN (${amountOfValues})`;

        this.delete(sqlPlayers, currentSockets, () => {
            console.log('Idle players scrapped');
        });

        this.delete(sqlLobbies, currentSockets, () => {
            console.log('Idle lobbies scrapped');
        });
    }
}

module.exports = new Database();
