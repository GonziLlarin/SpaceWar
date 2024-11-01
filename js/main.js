let nave, body, laser, explosion, live, times, scoreDisplay, usernameInput, loginContainer;

let lives, score, second;

let enemySpawnTimer, timerInterval;

const API_URL = 'http://localhost:3000/scores'; // a tener en cuenta: use npm install -g json-server y 
//                                                                   ejecute json-server --watch db.json

document.addEventListener('DOMContentLoaded', () => {
    // Inicialización de elementos del DOM
    nave = document.querySelector('.nave');
    body = document.querySelector('body');
    laser = document.getElementById('laser');
    explosion = document.getElementById('explosion');
    live = document.querySelector('#lives i');
    times = document.getElementById('times');
    scoreDisplay = document.getElementById('score');
    usernameInput = document.getElementById('username');
    loginContainer = document.getElementById('login-container');


    document.getElementById('start-game').addEventListener('click', startGame);
    document.getElementById('restart-game').addEventListener('click', restartGame);
    loadScores(); // Cargar puntuaciones al inicio
});

function startGame() {
    let username = usernameInput.value.trim();
    if (username) {
        lives = 5;
        score = 0;
        second = 60;

        loginContainer.style.display = 'none';
        updateDisplay();
        gameLoop();
        spawnEnemies();
        startTimer();
    } else {
        showToast("Por favor, ingresa tu nombre.", "red");
    }
}

function endGame() {
    clearInterval(enemySpawnTimer);
    clearInterval(timerInterval);
    document.getElementById('final-score').textContent = `Puntaje Final: ${score}`;

    let username = usernameInput.value.trim();
    if (username) {
        updateScoreInDatabase(username, score);
    }

    document.getElementById('game-over-container').style.display = 'block';
}

function updateScoreInDatabase(username, newScore) {
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            let existingUser = data.find(user => user.name === username);
            if (existingUser) {
                if (newScore > existingUser.score) {
                    existingUser.score = newScore;
                    fetch(`${API_URL}/${existingUser.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(existingUser),
                    });
                }
            } else {
                const scoreData = { name: username, score: newScore };
                fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(scoreData),
                });
            }
        })
        .then(loadScores)
        .catch(error => console.error('Error al actualizar la puntuación', error));
}

function loadScores() {
    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            data.sort((a, b) => b.score - a.score);
            const topScores = data.slice(0, 5);

            let scoresList = document.getElementById('scores-list');

            scoresList.innerHTML = '';
            topScores.forEach(e => {
                let li = document.createElement('li');
                li.innerHTML = `${e.name}: <b>${e.score}</b>`;
                scoresList.appendChild(li);
            });
        })
        .catch(error => console.error('Error al cargar las puntuaciones', error));
}

function updateDisplay() {
    live.textContent = lives;
    times.textContent = second;
    scoreDisplay.textContent = `Puntaje: ${score}`;
}

function showToast(message, bgColor) {
    Toastify({
        text: message,
        gravity: "bottom",
        style: {
            background: bgColor,
            color: "white",
        },
        duration: 2000
    }).showToast();
}

function gameLoop() {
    const loop = setInterval(() => {
        moveBullets();
        checkCollisions();
        updateDisplay();
        if (lives <= 0) {
            clearInterval(loop);
            endGame();
        }
    }, 100);
}

document.addEventListener('mousemove', (e) => {
    nave.style.left = (e.clientX - 40) + 'px';
});

document.addEventListener('click', () => {
    let bala = document.createElement('div');
    bala.classList.add('bala');
    bala.style.bottom = 70 + 'px';
    bala.style.left = (nave.getBoundingClientRect().left + 40) + 'px';
    body.append(bala);
    laser.play();
});

function moveBullets() {
    let balas = document.querySelectorAll('.bala');
    balas.forEach(bala => {
        bala.style.top = (bala.getBoundingClientRect().top - 20) + 'px';
        if (bala.getBoundingClientRect().top <= 0) {
            bala.remove();
        }
    });
}

function checkCollisions() {
    let balas = document.querySelectorAll('.bala');
    let enemigos = document.querySelectorAll('.enemigo');

    balas.forEach(bala => {
        enemigos.forEach(enemigo => {
            if (isColliding(bala, enemigo)) {
                enemigo.style.backgroundImage = 'url("img/explosion.png")';
                explosion.play();
                setTimeout(() => {
                    enemigo.remove();
                    updateScore();
                }, 100);
                bala.remove();
            }
        });
    });
}

function isColliding(bala, enemigo) {
    return bala.getBoundingClientRect().top <= enemigo.getBoundingClientRect().top + 50 &&
        bala.getBoundingClientRect().left >= enemigo.getBoundingClientRect().left &&
        bala.getBoundingClientRect().left <= enemigo.getBoundingClientRect().left + 80;
}

function spawnEnemies() {
    let aparecer = 0;
    enemySpawnTimer = setInterval(() => {
        aparecer++;
        if (aparecer % 5 === 0) {
            let enemigo = document.createElement('div');
            enemigo.classList.add('enemigo');
            body.append(enemigo);
            enemigo.style.left = (Math.random() * (window.innerWidth - 100)) + 'px';
        }
        moveEnemies();
    }, 100);
}

function moveEnemies() {
    let enemigos = document.querySelectorAll('.enemigo');
    enemigos.forEach(element => {
        element.style.top = (element.getBoundingClientRect().top + 20) + 'px'; // Aumentamos la velocidad
        if (element.getBoundingClientRect().top > nave.getBoundingClientRect().top) {
            lives--;
            live.textContent = lives;
            element.remove();
            if (lives <= 0) {
                showToast('Perdiste burrazo', 'red')
                endGame();
                element.remove();
            }
        }
    });
}

function updateScore() {
    score++;
    scoreDisplay.textContent = 'Puntaje: ' + score;
}

function startTimer() {
    timerInterval = setInterval(() => {
        second--;
        times.textContent = second;
        if (second <= 0) {
            clearInterval(timerInterval);
            showToast('Felicitaciones, completaste el juego!', 'green')
            endGame();
        }
    }, 1000);
}


function restartGame() {
    document.getElementById('game-over-container').style.display = 'none';
    startGame(); // Reinicia el juego
}

