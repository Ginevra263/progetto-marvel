function registerUser(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('register-password').value;
    const email = document.getElementById('email').value;
    const superhero = document.getElementById('superhero').value;

    const data = { username, email, password, superhero };

    fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.success ? 'Registrazione avvenuta con successo!' : 'Errore nella registrazione: ' + data.message);
    })
    .catch(error => {
        alert('Errore di rete: ' + error.message);
    });
}

function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const data = { email, password };

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        alert(data.success ? 'Login effettuato con successo!' : 'Credenziali non valide: ' + data.message);
    })
    .catch(error => {
        alert('Errore di rete: ' + error.message);
    });
}
