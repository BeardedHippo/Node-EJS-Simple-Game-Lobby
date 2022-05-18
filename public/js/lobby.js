const socket = io();

let readyStatus = false;
let playerNameGiven = false;

function newPlayer() {
    const playerName = document.querySelectorAll('.new-player-name')[0].value;

    if (playerName.length === 0) {
        window.alert("Playername cannot be empty");
    } else if (playerName.length >= 10) {
        window.alert("Playername cannot exceed 10 characters");
    } else {
        const playerFormField = document.querySelectorAll('.name-selection')[0]
        playerFormField.remove();
        playerNameGiven = true;
        socket.emit('newPlayer', playerName);
    }
}

function setReadyStatus() {
    const buttonElement = document.querySelectorAll('.readybutton')[0]

    readyStatus = !readyStatus;

    buttonElement.style.backgroundColor = "green";
    socket.emit('readycheck', {event: 'setReadyStatus', content: readyStatus});
}

socket.on('updateLobby', (data) => {
    if (data.event === 'newplayer') {
        socket.emit('readycheck', {event: 'increasePlayers'});
    } else if (data.event === 'idlePlayer') {
        socket.emit('readycheck', {event: 'decreasePlayers'});
    }
    document.querySelectorAll('.menu-list')[0].innerHTML = '';

    Object.keys(data.allPlayers).forEach(index => {
        let newEl = `<li><a>${data.allPlayers[index].playerName}</a><li>`;
        document.querySelectorAll('.menu-list')[0].insertAdjacentHTML('beforeend', newEl);
    })
});

socket.on('preparations', (event) => {
    switch (event) {
        case "readycheck":
            socket.emit('readycheck', {event: 'readycheckResponse', content: readyStatus});
            break;

        case "gameready":
            window.alert("Game started!");
            break;

        default:
            console.log("Something went wrong");
            break;
    }
});

function copyGameToClipboard() {
    const gameUrl = window.location.href;
    const gameUrlInput = document.querySelectorAll('.game-url')[0];
    const copyBtn = document.querySelectorAll('.copy-btn')[0];

    gameUrlInput.value = gameUrl;
    gameUrlInput.select();
    document.execCommand('copy');
    copyBtn.classList.add("copied");

}