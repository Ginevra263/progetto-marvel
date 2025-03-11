function registerUser(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('register-password').value;
    const email = document.getElementById('email').value;
    const superhero = document.getElementById('superhero').value;

    // Validazione lato client
    if (!username || !email || !password) {
        alert('Tutti i campi sono obbligatori');
        return;
    }

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
        if (data.success) {
            alert('Registrazione avvenuta con successo!');
            window.location.href = 'login.html';
        } else {
            alert('Errore nella registrazione: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Errore di rete:', error);
        alert('Errore di rete: ' + error.message);
    });
}

function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log('Tentativo di login con:', { email, password });

    // Validazione lato client
    if (!email || !password) {
        alert('Email e password sono obbligatori');
        return;
    }

    const data = { email, password };
    console.log('Dati inviati al server:', data);

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        return response.json().catch(e => {
            console.error('Errore nel parsing JSON:', e);
            throw e;
        });
    })
    .then(data => {
        console.log('Risposta server:', data);
        if (data.success) {
            // Salva il token
            localStorage.setItem('token', data.token);
            console.log('Token salvato:', data.token);
            
            // Verifica che il token sia stato salvato correttamente
            const savedToken = localStorage.getItem('token');
            if (!savedToken) {
                throw new Error('Token non salvato correttamente');
            }
            
            // Reindirizza alla dashboard
            console.log('Reindirizzamento alla dashboard...');
            window.location.replace('dashboard.html');
        } else {
            alert('Errore nel login: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Errore di rete:', error);
        alert('Errore di rete: ' + error.message);
    });
}

// Funzione per verificare se l'utente è autenticato
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token non trovato, reindirizzamento al login');
        window.location.replace('login.html');
        return false;
    }
    console.log('Token trovato:', token);
    return true;
}

//funzione fetch per api key
function loadMarvelHeroes() {
    if (!checkAuth()) return;

    fetch('http://localhost:3000/api/marvel', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data && data.data && data.data.results) {
            console.log('Dati ricevuti:', data);
            const output = document.getElementById('output');
            if (output) {
                output.innerHTML = JSON.stringify(data.data.results, null, 2);
            }
        } else {
            console.error('Formato dati non valido:', data);
            throw new Error('Formato dati non valido');
        }
    })
    .catch(error => {
        console.error('Errore nella chiamata API:', error);
        const output = document.getElementById('output');
        if (output) {
            output.innerHTML = `Errore nel caricamento dei dati: ${error.message}`;
        }
    });
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('dashboard.html')) {
        if (!checkAuth()) return;
        loadMarvelHeroes();
    }
});

