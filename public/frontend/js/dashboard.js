// Gestione dei crediti e delle figurine
let userCredits = 0;
let userCards = [];
let availableTrades = [];

// Funzione per verificare se l'utente è autenticato
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }

    try {
        const response = await fetch('http://localhost:3000/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return false;
            }
            throw new Error('Errore nel recupero del profilo');
        }

        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Errore nella verifica dell\'autenticazione:', error);
        return false;
    }
}

// Funzione per caricare i dati dell'utente
async function loadUserData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token non trovato');
            window.location.href = 'login.html';
            return;
        }

        console.log('Recupero dati utente...');
        const response = await fetch('http://localhost:3000/api/user/data', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
            userCredits = data.credits;
            userCards = data.cards;
            updateUI();

            console.log('Recupero dati profilo...');
            const profileResponse = await fetch('http://localhost:3000/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!profileResponse.ok) {
                throw new Error(`HTTP error! status: ${profileResponse.status}`);
            }

            const profileData = await profileResponse.json();
            if (profileData.success && profileData.user.profile_image) {
                const userMenuImage = document.getElementById('user-menu-image');
                if (userMenuImage) {
                    userMenuImage.src = profileData.user.profile_image;
                }
            }
        }
    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        showError('Errore nel caricamento dei dati utente: ' + error.message);
    }
}

// Funzione per acquistare crediti
async function buyCredits(amount) {
    try {
        const response = await fetch('http://localhost:3000/api/credits/buy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ amount })
        });
        const data = await response.json();
        if (data.success) {
            userCredits = data.newCredits;
            updateUI();
            alert(`Hai acquistato ${amount} crediti con successo!`);
        }
    } catch (error) {
        alert('Errore nell\'acquisto dei crediti');
    }
}

// Funzione per acquistare un pacchetto di figurine
async function buyCardPack() {
    if (userCredits < 1) {
        alert('Crediti insufficienti!');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/cards/buy-pack', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        if (data.success) {
            userCredits = data.newCredits;
            userCards = [...userCards, ...data.newCards];
            updateUI();
            showNewCards(data.newCards);
        }
    } catch (error) {
        alert('Errore nell\'acquisto del pacchetto');
    }
}

// Funzione per visualizzare i dettagli di un supereroe
async function showHeroDetails(heroId) {
    try {
        const timestamp = new Date().getTime();
        const hash = CryptoJS.MD5(timestamp + PRIVATE_KEY + PUBLIC_KEY).toString();
        const url = `https://gateway.marvel.com/v1/public/characters/${heroId}?ts=${timestamp}&apikey=${PUBLIC_KEY}&hash=${hash}`;
        
        const response = await fetch(url);
        const data = await response.json();
        if (data.data.results.length > 0) {
            const hero = data.data.results[0];
            showHeroModal(hero);
        }
    } catch (error) {
        console.error('Errore nel caricamento dei dettagli:', error);
    }
}

// Funzione per proporre uno scambio
async function proposeTrade(offeredCardId, wantedCardId) {
    try {
        const response = await fetch('http://localhost:3000/api/trades/propose', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                offeredCardId,
                wantedCardId
            })
        });
        const data = await response.json();
        if (data.success) {
            alert('Proposta di scambio creata con successo!');
            loadAvailableTrades();
        }
    } catch (error) {
        alert('Errore nella creazione della proposta di scambio');
    }
}

// Funzione per accettare uno scambio
async function acceptTrade(tradeId) {
    try {
        const response = await fetch(`http://localhost:3000/api/trades/accept/${tradeId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        if (data.success) {
            alert('Scambio completato con successo!');
            loadUserData();
            loadAvailableTrades();
        }
    } catch (error) {
        alert('Errore nell\'accettazione dello scambio');
    }
}

// Funzione per caricare gli scambi disponibili
async function loadAvailableTrades() {
    try {
        const response = await fetch('http://localhost:3000/api/trades/available', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await response.json();
        if (data.success) {
            availableTrades = data.trades;
            updateTradesUI();
        }
    } catch (error) {
        console.error('Errore nel caricamento degli scambi:', error);
    }
}

// Funzione per mostrare una modale con i dettagli del supereroe
function showHeroModal(hero) {
    const modalContent = `
        <h2>${hero.name}</h2>
        <img src="${hero.thumbnail.path}.${hero.thumbnail.extension}" alt="${hero.name}" style="max-width: 300px;">
        <p>${hero.description || 'Nessuna descrizione disponibile'}</p>
        <h3>Series:</h3>
        <ul>${hero.series.items.map(s => `<li>${s.name}</li>`).join('')}</ul>
        <h3>Events:</h3>
        <ul>${hero.events.items.map(e => `<li>${e.name}</li>`).join('')}</ul>
        <h3>Comics:</h3>
        <ul>${hero.comics.items.map(c => `<li>${c.name}</li>`).join('')}</ul>
    `;
    
    document.getElementById('heroDetailsModal').innerHTML = modalContent;
    // Mostra la modale (assumendo che tu stia usando Bootstrap o una libreria simile)
    $('#heroDetailsModal').modal('show');
}

// Funzione per mostrare le nuove carte ottenute
function showNewCards(newCards) {
    const cardsHtml = newCards.map(card => `
        <div class="card">
            <img src="${card.thumbnail}" alt="${card.name}">
            <h3>${card.name}</h3>
        </div>
    `).join('');
    
    document.getElementById('newCardsModal').innerHTML = `
        <h2>Nuove figurine ottenute!</h2>
        <div class="cards-container">
            ${cardsHtml}
        </div>
    `;
    $('#newCardsModal').modal('show');
}

// Funzione per aggiornare l'interfaccia utente
function updateUI() {
    const creditsElement = document.getElementById('userCredits');
    const albumContainer = document.getElementById('albumContainer');
    
    if (creditsElement) {
        creditsElement.textContent = userCredits;
    }
    
    if (albumContainer) {
        albumContainer.innerHTML = userCards.map(card => `
            <div class="card ${card.count > 1 ? 'duplicate' : ''}">
                <img src="${card.thumbnail}" alt="${card.name}" class="w-full h-48 object-cover rounded-t-lg">
                <div class="p-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${card.name}</h3>
                    ${card.count > 1 ? `<span class="badge bg-primary-600 text-white px-2 py-1 rounded-full text-sm">${card.count}x</span>` : ''}
                    ${card.count > 1 ? `<button onclick="showTradeOptions('${card.id}')" class="mt-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">Scambia</button>` : ''}
                </div>
            </div>
        `).join('');
    }
}

// Funzione per aggiornare l'interfaccia degli scambi
function updateTradesUI() {
    const tradesContainer = document.getElementById('tradesContainer');
    if (tradesContainer) {
        tradesContainer.innerHTML = availableTrades.map(trade => `
            <div class="trade-card bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div class="offered-card mb-4">
                    <img src="${trade.offeredCard.thumbnail}" alt="${trade.offeredCard.name}" class="w-full h-48 object-cover rounded-lg">
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-white mt-2">${trade.offeredCard.name}</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Offerta da: ${trade.offeredBy}</p>
                </div>
                <div class="wanted-card mb-4">
                    <img src="${trade.wantedCard.thumbnail}" alt="${trade.wantedCard.name}" class="w-full h-48 object-cover rounded-lg">
                    <h4 class="text-lg font-semibold text-gray-900 dark:text-white mt-2">${trade.wantedCard.name}</h4>
                </div>
                <button onclick="acceptTrade('${trade.id}')" class="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                    Accetta scambio
                </button>
            </div>
        `).join('');
    }
}

// Funzione per mostrare le opzioni di scambio
function showTradeOptions(cardId) {
    // Implementa la logica per mostrare una modale con le figurine che possono essere richieste in cambio
    // Questa funzione dovrebbe mostrare una lista di figurine che l'utente non possiede
    // e permettere di selezionare quale vuole ricevere in cambio
}

// Funzione per mostrare errori
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Verifica autenticazione...');
    const isAuthenticated = await checkAuthStatus();
    if (!isAuthenticated) {
        return;
    }

    // Inizializza gli elementi UI
    const buyCreditsBtn = document.getElementById('buyCreditsBtn');
    const buyPackBtn = document.getElementById('buyPackBtn');
    const userMenuButton = document.getElementById('user-menu-button');
    const userMenu = document.getElementById('user-menu');
    const logoutButton = document.getElementById('logout-button');

    // Event listeners per i pulsanti
    if (buyCreditsBtn) {
        buyCreditsBtn.addEventListener('click', () => buyCredits(5));
    }
    
    if (buyPackBtn) {
        buyPackBtn.addEventListener('click', buyCardPack);
    }

    // Gestione del menu utente
    if (userMenuButton && userMenu) {
        userMenuButton.addEventListener('click', () => {
            const isExpanded = userMenuButton.getAttribute('aria-expanded') === 'true';
            userMenuButton.setAttribute('aria-expanded', !isExpanded);
            userMenu.classList.toggle('hidden');
        });

        // Chiudi il menu quando si clicca fuori
        document.addEventListener('click', (event) => {
            if (!userMenuButton.contains(event.target) && !userMenu.contains(event.target)) {
                userMenuButton.setAttribute('aria-expanded', 'false');
                userMenu.classList.add('hidden');
            }
        });
    }

    // Gestione del logout
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    }

    console.log('Caricamento dati utente...');
    await loadUserData();
    await loadAvailableTrades();
}); 