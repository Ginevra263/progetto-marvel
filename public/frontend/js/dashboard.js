// Gestione dei crediti e delle figurine
let userCards = [];
let availableTrades = [];

// Funzione per formattare le timestamp in formato "tempo fa"
function timeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    
    // Converti in secondi
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) return 'Pochi secondi fa';
    
    // Converti in minuti
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minuto' : 'minuti'} fa`;
    
    // Converti in ore
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'ora' : 'ore'} fa`;
    
    // Converti in giorni
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'giorno' : 'giorni'} fa`;
    
    // Converti in settimane
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? 'settimana' : 'settimane'} fa`;
    
    // Se è più vecchio di 4 settimane, mostra la data
    return past.toLocaleDateString();
}

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
            // Verifica che AppState sia definito e che updateCredits sia una funzione
            if (typeof AppState !== 'undefined' && typeof AppState.updateCredits === 'function') {
                // Aggiorna i crediti nell'AppState
                AppState.updateCredits(data.credits);
            } else {
                console.error('AppState non è definito correttamente');
            }
            
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
    // Verifica che AppState sia definito e che ci siano abbastanza crediti
    if (typeof AppState === 'undefined' || !AppState.user || typeof AppState.getCredits !== 'function' || AppState.getCredits() < 1) {
        alert('Crediti insufficienti o stato non inizializzato correttamente!');
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
                        Crediti disponibili: <span class="text-primary-600 dark:text-primary-400 font-bold">${AppState.getCredits()}</span>
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
                // Verifica che AppState sia definito e recordPackOpening sia una funzione
                if (typeof AppState !== 'undefined' && typeof AppState.recordPackOpening === 'function') {
                    // Usa AppState per gestire i crediti e registrare l'apertura del pacchetto
                    AppState.recordPackOpening(data.newCards);
                } else {
                    console.error('AppState.recordPackOpening non è definito correttamente');
                }
                
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
        if (typeof AppState !== 'undefined' && typeof AppState.getCredits === 'function') {
            element.textContent = AppState.getCredits();
        } else if (typeof AppState !== 'undefined' && AppState.user && AppState.user.credits) {
            element.textContent = AppState.user.credits;
        } else {
            console.error('AppState non è definito correttamente');
        }
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
    
    // Aggiorna i contatori base con controlli di sicurezza
    if (typeof AppState !== 'undefined') {
        // Aggiorna i crediti
        const creditsElements = document.querySelectorAll('[id="user-credits"]');
        creditsElements.forEach(element => {
            if (element) {
                if (typeof AppState.getCredits === 'function') {
                    element.textContent = AppState.getCredits();
                } else if (AppState.user && AppState.user.credits !== undefined) {
                    element.textContent = AppState.user.credits;
                }
            }
        });
        
        // Aggiorna il numero totale di pacchetti
        const totalPacksElement = document.getElementById('total-packs');
        if (totalPacksElement && AppState.user) {
            totalPacksElement.textContent = AppState.user.totalPacks || 0;
        }
        
        // Aggiorna il numero di scambi attivi
        const activeTradesElement = document.getElementById('active-trades');
        if (activeTradesElement && AppState.user) {
            activeTradesElement.textContent = AppState.user.activeTrades || 0;
        }
    }
    
    // Aggiorniamo gli altri contatori che non dipendono da AppState
    const totalCardsElement = document.getElementById('total-cards');
    if (totalCardsElement) {
        totalCardsElement.textContent = totalCards;
    }
    
    const duplicateCardsElement = document.getElementById('duplicate-cards');
    if (duplicateCardsElement) {
        duplicateCardsElement.textContent = duplicateCards;
    }

    // Aggiorna il progresso dell'album
    const progressPercentage = Math.round((uniqueCards / totalHeroes) * 100);
    
    // Aggiorna la barra di progresso
    const progressPercentageElement = document.getElementById('progress-percentage');
    const progressBarElement = document.getElementById('progress-bar');
    
    if (progressPercentageElement) {
        progressPercentageElement.textContent = `${progressPercentage}%`;
    }
    
    if (progressBarElement) {
        progressBarElement.style.width = `${progressPercentage}%`;
    }
    
    // Calcola e aggiorna le figurine mancanti
    const missingCards = totalHeroes - uniqueCards;
    const missingCardsElement = document.getElementById('missing-cards');
    if (missingCardsElement) {
        missingCardsElement.textContent = missingCards;
    }
    
    // Aggiorna il totale delle figurine doppie
    const duplicateTotalElement = document.getElementById('duplicate-total');
    if (duplicateTotalElement) {
        duplicateTotalElement.textContent = duplicateCards;
    }

    // Aggiorna l'ultima attività di apertura pacchetto
    if (typeof AppState !== 'undefined' && AppState.lastPackOpening) {
        const lastPackElement = document.getElementById('last-pack-opening');
        const noActivityElement = document.getElementById('no-activity');
        const lastPackTimeElement = document.getElementById('last-pack-time');
        const lastPackCardsElement = document.getElementById('last-pack-cards');
        
        if (lastPackElement && noActivityElement && lastPackTimeElement && lastPackCardsElement) {
            lastPackElement.classList.remove('hidden');
            noActivityElement.classList.add('hidden');
            
            // Verifica se la funzione timeAgo esiste prima di usarla
            if (typeof timeAgo === 'function') {
                lastPackTimeElement.textContent = timeAgo(AppState.lastPackOpening.timestamp);
            } else {
                // Fallback: mostra la data formattata
                const date = new Date(AppState.lastPackOpening.timestamp);
                lastPackTimeElement.textContent = date.toLocaleString();
            }
            
            lastPackCardsElement.textContent = `Trovati ${AppState.lastPackOpening.cards.length} nuovi super eroi`;
            
            // Aggiungi il tipo di pacchetto se disponibile
            if (AppState.lastPackOpening.packType) {
                lastPackCardsElement.textContent += ` (${AppState.lastPackOpening.packType})`;
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

// Funzione per configurare il modal dei crediti
function setupCreditsModal() {
    const creditsButton = document.getElementById('credits-button');
    const creditsModal = document.getElementById('credits-modal');
    const closeCreditsModalButton = document.getElementById('close-credits-modal');
    
    // Verifica che gli elementi esistano prima di aggiungere event listener
    if (creditsButton && creditsModal) {
        creditsButton.addEventListener('click', () => {
            creditsModal.classList.remove('hidden');
            // Aggiorna il contenuto del modal
            updateCreditsModal();
        });
    }
    
    if (closeCreditsModalButton && creditsModal) {
        closeCreditsModalButton.addEventListener('click', () => {
            creditsModal.classList.add('hidden');
        });
    }
    
    // Chiudi il modal quando si fa clic all'esterno
    if (creditsModal) {
        creditsModal.addEventListener('click', (e) => {
            if (e.target === creditsModal) {
                creditsModal.classList.add('hidden');
            }
        });
    }
    
    function updateCreditsModal() {
        if (typeof AppState !== 'undefined') {
            const modalCredits = document.getElementById('modal-credits');
            const virtualMoney = document.getElementById('virtual-money');
            
            if (modalCredits) {
                modalCredits.textContent = AppState.getCredits();
            }
            
            if (virtualMoney) {
                virtualMoney.textContent = `€${AppState.getVirtualMoney()}`;
            }
            
            // Aggiorna lo storico delle transazioni
            updateTransactionHistory();
        }
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