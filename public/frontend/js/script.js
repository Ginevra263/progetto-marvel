document.getElementById('Registrati').addEventListener('submit', function(event) {
    console.log("Registrati");
    event.preventDefault(); // Evita che il modulo venga inviato normalmente

    const username = document.getElementById('username').value;
    const password = document.getElementById('register-password').value;
    const email = document.getElementById('email').value;

    // Crea l'oggetto dei dati da inviare
    const data = { username, email, password };

    // Esegui la richiesta POST per registrare l'utente
    fetch('http://localhost:3000/register', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Registrazione avvenuta con successo!');
        } else {
            alert('Errore nella registrazione: ' + data.message);
        }
    })
    .catch(error => {
        alert('Errore di rete: ' + error.message);
    });
});

//// Esegui la richiesta POST per loggare l'utente
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Evita che il modulo venga inviato normalmente

    const email = document.getElementById('login-email').value;
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    // Crea l'oggetto dei dati da inviare
    const data = { email, password };

    // Esegui la richiesta POST per il login
    fetch('http://localhost:3000/login', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Login effettuato con successo!');
        } else {
            alert('Credenziali non valide: ' + data.message);
        }
    })
    .catch(error => {
        alert('Errore di rete: ' + error.message);
    });
});

