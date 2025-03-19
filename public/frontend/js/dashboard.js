// Gestione dei crediti e delle figurine
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

        // Verifica se ci sono carte salvate in localStorage
        const savedCards = localStorage.getItem('userCards');
        if (savedCards) {
            console.log('Carte trovate in localStorage');
            userCards = JSON.parse(savedCards);
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
            // Aggiorna i crediti nell'AppState
            AppState.updateCredits(data.credits);
            userCards = data.cards;
            // Aggiorna le carte in localStorage
            localStorage.setItem('userCards', JSON.stringify(userCards));
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
            // Aggiorna i crediti nell'AppState
            AppState.updateCredits(data.newCredits);
            // Registra la transazione
            AppState.addCreditTransaction(amount, `Acquisto ${amount} crediti`);
            
            alert(`Hai acquistato ${amount} crediti con successo!`);
        }
    } catch (error) {
        alert('Errore nell\'acquisto dei crediti');
    }
}

// Funzione per acquistare un pacchetto di figurine
async function buyCardPack() {
    if (AppState.user.credits < 1) {
        alert('Crediti insufficienti!');
        return;
    }

    // Mostra il dialog di conferma
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
    confirmDialog.innerHTML = `
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div class="mt-3 text-center">
                <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white">Conferma Apertura Pacchetto</h3>
                <div class="mt-2 px-7 py-3">
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Il pacchetto costa <span class="text-primary-600 dark:text-primary-400 font-bold">1 credito</span>
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Crediti disponibili: <span class="text-primary-600 dark:text-primary-400 font-bold">${AppState.user.credits}</span>
                    </p>
                </div>
                <div class="flex justify-center space-x-4 mt-6">
                    <button id="confirm-pack-btn" class="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500">
                        Apri Pacchetto
                    </button>
                    <button id="cancel-pack-btn" class="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500">
                        Annulla
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(confirmDialog);

    // Gestisci la conferma
    const confirmBtn = document.getElementById('confirm-pack-btn');
    const cancelBtn = document.getElementById('cancel-pack-btn');

    confirmBtn.addEventListener('click', async () => {
        confirmDialog.remove();
        try {
            const response = await fetch('http://localhost:3000/api/cards/buy-pack', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (data.success) {
                // Usa AppState per gestire i crediti e registrare l'apertura del pacchetto
                AppState.recordPackOpening(data.newCards);
                
                // Aggiorna le carte dell'utente
                userCards = [...userCards, ...data.newCards];
                localStorage.setItem('userCards', JSON.stringify(userCards));
                
                // Aggiorna l'UI
                updateUI();
                updateDashboardStats();
                
                // Mostra le nuove carte
                showNewCards(data.newCards);
            }
        } catch (error) {
            alert('Errore nell\'acquisto del pacchetto');
        }
    });

    cancelBtn.addEventListener('click', () => {
        confirmDialog.remove();
    });

    // Chiudi il dialog se si clicca fuori
    confirmDialog.addEventListener('click', (e) => {
        if (e.target === confirmDialog) {
            confirmDialog.remove();
        }
    });
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
        const response = await fetch(`/api/trades/accept/${tradeId}`, {
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
    const creditsElements = document.querySelectorAll('[id="user-credits"]');
    const albumContainer = document.getElementById('albumContainer');
    
    // Aggiorna tutti gli elementi che mostrano i crediti
    creditsElements.forEach(element => {
        element.textContent = AppState.user.credits;
    });
    
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

// Funzione per aggiornare le statistiche della dashboard
function updateDashboardStats() {
    // Ottieni i dati delle carte dell'utente
    const userCardsData = JSON.parse(localStorage.getItem('userCards') || '[]');
    
    // Calcola il numero di carte uniche
    const uniqueCards = new Set(userCardsData.map(card => card.id)).size;
    
    // Calcola il numero di carte doppie
    const duplicateCards = userCardsData.reduce((total, card) => total + (card.count > 1 ? card.count - 1 : 0), 0);
    
    // Calcola il numero totale di carte
    const totalCards = userCardsData.reduce((total, card) => total + card.count, 0);
    
    // Ottieni il numero totale di eroi disponibili
    // Prova a ottenere il numero di eroi dall'API Marvel
    let totalHeroes = 0;
    const marvelHeroes = localStorage.getItem('marvelHeroes');
    if (marvelHeroes) {
        try {
            totalHeroes = JSON.parse(marvelHeroes).length;
        } catch (e) {
            console.error('Errore nel parsing degli eroi Marvel:', e);
            totalHeroes = 50; // Fallback a 50 se c'è un errore
        }
    } else {
        totalHeroes = 50; // Fallback a 50 se non ci sono dati
    }
    
    // Aggiorna i contatori base
    const creditsElements = document.querySelectorAll('[id="user-credits"]');
    creditsElements.forEach(element => {
        element.textContent = AppState.user.credits;
    });
    
    document.getElementById('total-packs').textContent = AppState.user.totalPacks;
    document.getElementById('total-cards').textContent = totalCards;
    document.getElementById('duplicate-cards').textContent = duplicateCards;
    document.getElementById('active-trades').textContent = AppState.user.activeTrades;

    // Aggiorna il progresso dell'album
    const progressPercentage = Math.round((uniqueCards / totalHeroes) * 100);
    
    // Aggiorna la barra di progresso
    document.getElementById('progress-percentage').textContent = `${progressPercentage}%`;
    document.getElementById('progress-bar').style.width = `${progressPercentage}%`;
    
    // Calcola e aggiorna le figurine mancanti
    const missingCards = totalHeroes - uniqueCards;
    document.getElementById('missing-cards').textContent = missingCards;
    
    // Aggiorna il totale delle figurine doppie
    document.getElementById('duplicate-total').textContent = duplicateCards;

    // Aggiorna l'ultima attività di apertura pacchetto
    const lastPackOpening = AppState.lastPackOpening;
    if (lastPackOpening) {
        const lastPackElement = document.getElementById('last-pack-opening');
        const noActivityElement = document.getElementById('no-activity');
        const lastPackTimeElement = document.getElementById('last-pack-time');
        const lastPackCardsElement = document.getElementById('last-pack-cards');
        
        if (lastPackElement && noActivityElement && lastPackTimeElement && lastPackCardsElement) {
            lastPackElement.classList.remove('hidden');
            noActivityElement.classList.add('hidden');
            lastPackTimeElement.textContent = timeAgo(lastPackOpening.timestamp);
            lastPackCardsElement.textContent = `Trovati ${lastPackOpening.cards.length} nuovi super eroi`;
            
            // Aggiungi il tipo di pacchetto se disponibile
            if (lastPackOpening.packType) {
                lastPackCardsElement.textContent += ` (${lastPackOpening.packType})`;
            }
        }
    } else {
        const lastPackElement = document.getElementById('last-pack-opening');
        const noActivityElement = document.getElementById('no-activity');
        if (lastPackElement && noActivityElement) {
            lastPackElement.classList.add('hidden');
            noActivityElement.classList.remove('hidden');
        }
    }
}

// Funzione per gestire il modal dei crediti
function setupCreditsModal() {
    const creditsButton = document.getElementById('credits-button');
    const creditsModal = document.getElementById('credits-modal');
    const closeCreditsModal = document.getElementById('close-credits-modal');
    const buyCreditsBtn = document.getElementById('buy-credits-btn');
    const modalCredits = document.getElementById('modal-credits');
    const creditsHistory = document.getElementById('credits-history');

    // Apri il modal quando si clicca sui crediti
    creditsButton.addEventListener('click', () => {
        creditsModal.classList.remove('hidden');
        updateCreditsModal();
    });

    // Chiudi il modal quando si clicca sul pulsante chiudi
    closeCreditsModal.addEventListener('click', () => {
        creditsModal.classList.add('hidden');
    });

    // Chiudi il modal quando si clicca fuori
    creditsModal.addEventListener('click', (e) => {
        if (e.target === creditsModal) {
            creditsModal.classList.add('hidden');
        }
    });

    // Gestisci l'acquisto di crediti
    buyCreditsBtn.addEventListener('click', () => {
        // Implementiamo l'acquisto di crediti con opzioni
        const amount = 5; // Default amount
        buyCredits(amount);
        creditsModal.classList.add('hidden');
    });

    // Funzione per aggiornare il contenuto del modal
    function updateCreditsModal() {
        // Aggiorna il numero di crediti nel modal
        modalCredits.textContent = AppState.user.credits;

        // Recupera lo storico delle transazioni
        const transactions = AppState.user.creditTransactions || [];
        
        // Aggiorna lo storico nel modal
        creditsHistory.innerHTML = transactions.length > 0 
            ? transactions.map(transaction => `
                <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <p class="text-sm text-gray-900 dark:text-white">${transaction.description}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">${new Date(transaction.date).toLocaleDateString('it-IT')}</p>
                    </div>
                    <span class="text-sm ${transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                        ${transaction.amount > 0 ? '+' : ''}${transaction.amount}
                    </span>
                </div>
            `).join('')
            : '<p class="text-sm text-gray-500 dark:text-gray-400">Nessuna transazione trovata</p>';
    }
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

    // Inizializza il modal dei crediti
    setupCreditsModal();
}); 