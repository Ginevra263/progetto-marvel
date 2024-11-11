// Dichiarazione globale per apiBaseUrl
let apiBaseUrl = "http://localhost:3000/api";

// Funzione per inizializzare la configurazione
async function initializeConfig() {
    await getConfig();
}

// Funzione per ottenere la configurazione
async function getConfig() {
    try {
        // Effettua una richiesta per ottenere la configurazione
        const response = await fetch(`${apiBaseUrl}/config`);
        if (!response.ok) {
            throw new Error('Errore nel caricamento della configurazione');
        }
        // Estraggo l'url base dell'API dalla risposta
        const { apiBase } = await response.json();
        apiBaseUrl = apiBase; // Configura apiBaseUrl in base alla configurazione
    } catch (error) {
        console.error("Errore durante l'inizializzazione della configurazione:", error);
    }
}

// Funzione per validare l'email
function validateEmail(email) {
    // Regex per validare l'email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Funzione per validare la password
function validatePassword(password) {
    // Regex per validare la password (almeno 8 caratteri, 1 maiuscolo, 1 numero)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

// Funzione per gestire la registrazione
async function registerUser() {
    // Raccolgo i valori dai campi del form
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('register-password').value;
    const superhero = document.getElementById('superhero').value;

    // Validazione dei campi
    if (!username || !email || !password || !superhero) {
        alert('Tutti i campi sono obbligatori!');
        return;
    }
    if (!validateEmail(email)) {
        alert('Email non valida');
        return;
    }
    if (!validatePassword(password)) {
        alert('La password deve avere almeno 8 caratteri, una lettera maiuscola e un numero');
        return;
    }

    // Preparo il corpo della richiesta
    const requestBody = { username, email, password, superhero };

    try {
        // Effettuo la richiesta POST per registrare l'utente
        const response = await fetch(`${apiBaseUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        // Controllo la risposta
        if (response.ok) {
            const data = await response.json();
            alert(data.message); // Mostro il messaggio di successo
            window.location.href = '/accedi.html'; // Reindirizzo alla pagina di accesso
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Errore sconosciuto durante la registrazione.');
        }
    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        alert('Si è verificato un errore durante la registrazione. Riprova.');
    }
}

// Funzione per gestire il login
async function loginUser() {
    // Raccolgo i valori dai campi del form di login
    const usernameOrEmail = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // Validazione dei campi
    if (!usernameOrEmail || !password) {
        alert('Tutti i campi sono obbligatori!');
        return;
    }

    // Preparo il corpo della richiesta
    const requestBody = { usernameOrEmail, password };

    try {
        // Effettuo la richiesta POST per il login
        const response = await fetch(`${apiBaseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        // Controllo la risposta
        if (response.ok) {
            const data = await response.json();
            alert(data.message); // Mostro il messaggio di successo
            window.location.href = '/album.html'; // Reindirizzo alla pagina principale
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Errore sconosciuto durante il login.');
        }
    } catch (error) {
        console.error('Errore durante il login:', error);
        alert('Si è verificato un errore durante il login. Riprova.');
    }
}

// Aggiungi l'event listener per il form di registrazione e login
document.addEventListener("DOMContentLoaded", function() {
    const registrazioneForm = document.getElementById('registrazione-form');
    const loginForm = document.getElementById('login-form');

    // Aggiungi l'event listener per il form di registrazione
    if (registrazioneForm) {
        registrazioneForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Impedisce il submit predefinito del form
            registerUser(); // Chiama la funzione di registrazione
        });
    }

    // Aggiungi l'event listener per il form di login
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Impedisce il submit predefinito del form
            loginUser(); // Chiama la funzione di login
        });
    }
});

// Inizializza la configurazione all'avvio della pagina
initializeConfig();
