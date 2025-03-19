

const PUBLIC_KEY="af7b1b70227c7699019dc5b3310f327d";
const PRIVATE_KEY="1389efde3a9d301441b69d6a53c1ae95e8b63520"; 
const timestamp = new Date().getTime();
const hash = CryptoJS.MD5(timestamp + PRIVATE_KEY + PUBLIC_KEY).toString();
const url = `https://gateway.marvel.com/v1/public/characters?ts=${timestamp}&apikey=${PUBLIC_KEY}&hash=${hash}&limit=100&orderBy=name`;
let allHeroes = [];

// Array per le carte doppie e mancanti
let duplicateCards = [];
let missingCards = [];
let userCards = [];

// DOM Elements
const offeredCardSelect = document.getElementById('offered-card');
const wantedCardSelect = document.getElementById('wanted-card');
const newTradeForm = document.getElementById('new-trade-form');
const tradesContainer = document.getElementById('trades-container');

// Carica i dati dell'utente e gli eroi Marvel
async function loadUserData() {
    try {
        // Verifica se l'utente è autenticato
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token non trovato');
            window.location.href = 'login.html';
            return;
        }

        // Carica le carte dell'utente dal localStorage o dal server
        const savedCards = localStorage.getItem('userCards');
        if (savedCards) {
            console.log('Carte trovate in localStorage');
            userCards = JSON.parse(savedCards);
        } else {
            console.log('Recupero dati utente dal server...');
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
                userCards = data.cards;
                // Aggiorna le carte in localStorage
                localStorage.setItem('userCards', JSON.stringify(userCards));
            }
        }

        // Carica gli eroi Marvel dal localStorage o dal server
        const savedHeroes = localStorage.getItem('marvelHeroes');
        if (savedHeroes) {
            console.log('Eroi Marvel trovati in localStorage');
            allHeroes = JSON.parse(savedHeroes);
            // Aggiorna le carte
            updateCardArrays();
            // Aggiorna i dropdown
            updateDropdowns();
        } else {
            // Carica gli eroi Marvel dal server
            await loadMarvelHeroes();
        }
    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        showError('Errore nel caricamento dei dati: ' + error.message);
    }
}

// Funzione per caricare gli eroi Marvel
async function loadMarvelHeroes() {
    try {
        console.log('Caricamento eroi Marvel dal server...');
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3000/api/marvel/characters', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success && data.data && data.data.results) {
            allHeroes = data.data.results;
            console.log('Eroi Marvel caricati:', allHeroes.length);
            
            // Salva gli eroi in localStorage per accesso rapido
            localStorage.setItem('marvelHeroes', JSON.stringify(allHeroes));
            
            // Aggiorna le carte
            updateCardArrays();
            // Aggiorna i dropdown
            updateDropdowns();
        } else {
            // Fallback alla chiamata API diretta
            const response = await fetch(url);
            if (!response.ok) throw new Error('Errore nella risposta del server');
            const data = await response.json();
            
            allHeroes = data.data.results.map(hero => ({
                id: hero.id,
                name: hero.name,
                thumbnail: `${hero.thumbnail.path}.${hero.thumbnail.extension}`
            }));
            console.log("Eroi Marvel caricati dalla chiamata diretta:", allHeroes.length);
            
            // Salva gli eroi in localStorage
            localStorage.setItem('marvelHeroes', JSON.stringify(allHeroes));
            
            // Aggiorna le carte
            updateCardArrays();
            // Aggiorna i dropdown
            updateDropdowns();
        }
    } catch (error) {
        console.error('Errore nel caricamento degli eroi Marvel:', error);
        showError('Errore nel caricamento degli eroi: ' + error.message);
    }
}

// Funzione per aggiornare gli array delle carte
function updateCardArrays() {
    console.log("Aggiornamento arrays delle carte...");
    
    // Crea un dizionario con le carte dell'utente per un accesso più veloce
    const userCardsMap = {};
    userCards.forEach(card => {
        userCardsMap[card.id] = card;
    });
    
    // Crea un Set con gli ID delle carte dell'utente per verificare facilmente il possesso
    const userCardIds = new Set(userCards.map(card => card.id));
    
    // Carte doppie - più di una copia
    duplicateCards = userCards.filter(card => card.count > 1);
    
    // Carte mancanti - non presenti nella collezione dell'utente
    missingCards = [];
    if (allHeroes.length > 0) {
        missingCards = allHeroes
            .filter(hero => !userCardIds.has(hero.id.toString()))
            .map(hero => ({
                id: hero.id.toString(),
                name: hero.name,
                thumbnail: `${hero.thumbnail.path}.${hero.thumbnail.extension}`,
                count: 0
            }));
    }
    
    console.log(`Carte doppie: ${duplicateCards.length}`);
    console.log(`Carte mancanti: ${missingCards.length}`);
}

// Funzione per aggiornare i dropdown
function updateDropdowns() {
    console.log("Aggiornamento dropdown...");
    
    if (!offeredCardSelect || !wantedCardSelect) {
        console.error("Dropdown elements not found!");
        return;
    }
    
    // Pulisci i dropdown
    offeredCardSelect.innerHTML = '<option value="">Seleziona una carta doppia</option>';
    wantedCardSelect.innerHTML = '<option value="">Seleziona una carta mancante</option>';
    
    // Aggiungi le carte doppie al primo dropdown
    duplicateCards.forEach(card => {
        const option = document.createElement('option');
        option.value = card.id;
        option.textContent = `${card.name} (${card.count - 1} ${card.count - 1 === 1 ? 'doppia' : 'doppie'})`;
        offeredCardSelect.appendChild(option);
    });
    
    // Aggiungi le carte mancanti al secondo dropdown
    missingCards.forEach(card => {
        const option = document.createElement('option');
        option.value = card.id;
        option.textContent = card.name;
        wantedCardSelect.appendChild(option);
    });
    
    // Se non ci sono carte doppie o mancanti, mostra un messaggio
    if (duplicateCards.length === 0) {
        const option = document.createElement('option');
        option.disabled = true;
        option.textContent = 'Non hai carte doppie da scambiare';
        offeredCardSelect.appendChild(option);
    }
    
    if (missingCards.length === 0) {
        const option = document.createElement('option');
        option.disabled = true;
        option.textContent = 'Non hai carte mancanti da ottenere';
        wantedCardSelect.appendChild(option);
    }
}

// Funzione per gestire lo scambio
function setupEventListeners() {
    if (!newTradeForm) {
        console.error("Trade form not found!");
        return;
    }

    // Gestione invio form nuovo scambio
    newTradeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const offeredCardId = offeredCardSelect.value;
        const wantedCardId = wantedCardSelect.value;
        const message = tradeMessageInput.value;
        
        if (!offeredCardId || !wantedCardId) {
            alert('Seleziona entrambe le carte per lo scambio');
            return;
        }
        
        // Ottieni i dettagli delle carte
        const offeredCard = duplicateCards.find(card => card.id === offeredCardId);
        const wantedCard = missingCards.find(card => card.id === wantedCardId);
        
        if (!offeredCard || !wantedCard) {
            alert('Carte non trovate');
            return;
        }
        
        // Crea oggetto scambio
        const trade = {
            id: Date.now(),
            offeredCard: {
                id: offeredCard.id,
                name: offeredCard.name,
                thumbnail: offeredCard.thumbnail
            },
            wantedCard: {
                id: wantedCard.id,
                name: wantedCard.name,
                thumbnail: wantedCard.thumbnail
            },
            message,
            status: 'pending',
            date: new Date().toISOString()
        };
        
        try {
            // In un'implementazione reale, invieresti questo al server
            console.log("Scambio proposto:", trade);
            
            // Simulazione di risposta positiva dal server
            const tradeHistory = JSON.parse(localStorage.getItem('tradeHistory') || '[]');
            tradeHistory.push(trade);
            localStorage.setItem('tradeHistory', JSON.stringify(tradeHistory));
            
            // Aggiorna la UI
            alert('Scambio proposto con successo!');
            newTradeForm.reset();
            
            // Aggiorna la lista degli scambi attivi
            updateTradesList();
        } catch (error) {
            console.error('Errore nella proposta di scambio:', error);
            alert('Errore nella proposta di scambio: ' + error.message);
        }
    });
    
    // Gestione parametri URL
    const params = new URLSearchParams(window.location.search);
    const cardId = params.get('card');
    if (cardId && offeredCardSelect) {
        // Se c'è un ID carta nei parametri, selezionala nel dropdown
        for (let i = 0; i < offeredCardSelect.options.length; i++) {
            if (offeredCardSelect.options[i].value === cardId) {
                offeredCardSelect.selectedIndex = i;
                break;
            }
        }
    }
}

// Aggiorna la lista degli scambi proposti
function updateTradesList() {
    if (!tradesContainer) return;
    
    const tradeHistory = JSON.parse(localStorage.getItem('tradeHistory') || '[]');
    
    if (tradeHistory.length === 0) {
        tradesContainer.innerHTML = `
            <div class="text-center p-6">
                <p class="text-gray-500 dark:text-gray-400">Non hai ancora proposto scambi.</p>
            </div>
        `;
        return;
    }
    
    tradesContainer.innerHTML = '';
    
    tradeHistory.forEach(trade => {
        const tradeEl = document.createElement('div');
        tradeEl.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-4';
        
        let statusClass = '';
        let statusText = '';
        
        switch (trade.status) {
            case 'pending':
                statusClass = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                statusText = 'In attesa';
                break;
            case 'accepted':
                statusClass = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                statusText = 'Accettato';
                break;
            case 'rejected':
                statusClass = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                statusText = 'Rifiutato';
                break;
        }
        
        tradeEl.innerHTML = `
            <div class="p-4">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Scambio del ${new Date(trade.date).toLocaleDateString('it-IT')}</h3>
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                        ${statusText}
                    </span>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Offri:</p>
                        <div class="mt-2 flex items-center">
                            <img src="${trade.offeredCard.thumbnail}" alt="${trade.offeredCard.name}" class="w-10 h-10 rounded-full object-cover mr-2">
                            <span class="text-gray-800 dark:text-gray-200">${trade.offeredCard.name}</span>
                        </div>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Ricevi:</p>
                        <div class="mt-2 flex items-center">
                            <img src="${trade.wantedCard.thumbnail}" alt="${trade.wantedCard.name}" class="w-10 h-10 rounded-full object-cover mr-2">
                            <span class="text-gray-800 dark:text-gray-200">${trade.wantedCard.name}</span>
                        </div>
                    </div>
                </div>
                ${trade.message ? `
                <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Messaggio:</p>
                    <p class="mt-1 text-gray-800 dark:text-gray-200">${trade.message}</p>
                </div>
                ` : ''}
                ${trade.status === 'pending' ? `
                <div class="mt-4 flex justify-end space-x-2">
                    <button onclick="cancelTrade(${trade.id})" class="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors">
                        Annulla
                    </button>
                </div>
                ` : ''}
            </div>
        `;
        
        tradesContainer.appendChild(tradeEl);
    });
}

// Funzione per annullare uno scambio
function cancelTrade(tradeId) {
    const tradeHistory = JSON.parse(localStorage.getItem('tradeHistory') || '[]');
    const updatedHistory = tradeHistory.filter(trade => trade.id !== tradeId);
    localStorage.setItem('tradeHistory', JSON.stringify(updatedHistory));
    
    // Aggiorna la lista degli scambi
    updateTradesList();
    
    alert('Scambio annullato con successo!');
}

// Funzione per mostrare errori
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Inizializzazione quando il DOM è caricato
document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM caricato, inizializzazione...");
    
    // Carica i dati e gli eroi Marvel
    await loadUserData();
    
    // Imposta gli event listeners
    setupEventListeners();
    
    // Aggiorna la lista degli scambi
    updateTradesList();
    
    // Seleziona automaticamente carte se specificate nell'URL
    const params = new URLSearchParams(window.location.search);
    const cardId = params.get('card');
    if (cardId && offeredCardSelect) {
        for (let i = 0; i < offeredCardSelect.options.length; i++) {
            if (offeredCardSelect.options[i].value === cardId) {
                offeredCardSelect.selectedIndex = i;
                break;
            }
        }
    }
}); 