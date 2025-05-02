const url = "https://hp-api.onrender.com/api/characters"; 
let allCharacters = []; 
// Simulazione del database dei pacchetti
let userPacks = [
    {
        id: 1,
        type: "Standard",
        cards: ["Harry Potter", "Hermione Granger", "Ron Weasley", "Albus Dumbledore", "Severus Snape"],
        opened: false,
        purchaseDate: "2024-03-15",
        cost: 1
    },
    {
        id: 2,
        type: "Premium",
        cards: ["Draco Malfoy", "Voldemort", "Sirius Black", "Luna Lovegood", "Rubeus Hagrid"],
        opened: true,
        purchaseDate: "2024-03-14",
        cost: 2
    }
];

// Modifica la fetch con un controllo più robusto
// Inizializza AppState se non esiste
if (!window.AppState) {
    window.AppState = {
        packs: userPacks,
        album: {
            cards: new Set(),
            duplicates: {}
        },
        user: {
            credits: 50,
            totalPacks: userPacks.length,
            totalCards: 0,
            duplicateCards: 0
        },
        subscribers: {},
        subscribe: function(event, callback) {
            if (!this.subscribers[event]) {
                this.subscribers[event] = [];
            }
            this.subscribers[event].push(callback);
        },
        notify: function(event) {
            if (this.subscribers && this.subscribers[event]) {
                this.subscribers[event].forEach(callback => callback());
            }
        }
    };
}

// Carica i personaggi di Harry Potter
fetch(url)
    .then(response => {
        if (!response.ok) throw new Error('Errore nella risposta del server');
        return response.json();
    })
    .then(data => {
        console.log("HP API data:", data);
        // Verifica che data sia un array
        if (Array.isArray(data)) {
            allCharacters = data.map(character => ({
                id: character.id || character.name.replace(/\s+/g, '').toLowerCase(),
                name: character.name,
                thumbnail: character.image || 'images/default-card.png'
            }));
            console.log("Personaggi Harry Potter caricati:", allCharacters);
            
            // Aggiorna le statistiche dopo il caricamento dei personaggi
            updateAllStats();
            
            // Mostra i pacchetti iniziali
            displayPacks(AppState.packs);
        } else {
            console.error("Formato dati API non valido:", data);
        }
    })
    .catch(error => {
        console.error('Errore nel caricamento dei dati:', error);
        // In caso di errore, carica alcuni personaggi predefiniti
        allCharacters = [
            { id: "harrypotter", name: "Harry Potter", thumbnail: "images/default-card.png" },
            { id: "hermionegranger", name: "Hermione Granger", thumbnail: "images/default-card.png" },
            { id: "ronweasley", name: "Ron Weasley", thumbnail: "images/default-card.png" },
            { id: "albusdumbledore", name: "Albus Dumbledore", thumbnail: "images/default-card.png" },
            { id: "severussnape", name: "Severus Snape", thumbnail: "images/default-card.png" },
            { id: "dracomalfoy", name: "Draco Malfoy", thumbnail: "images/default-card.png" },
            { id: "voldemort", name: "Voldemort", thumbnail: "images/default-card.png" },
            { id: "siriusblack", name: "Sirius Black", thumbnail: "images/default-card.png" },
            { id: "lunalovegood", name: "Luna Lovegood", thumbnail: "images/default-card.png" },
            { id: "rubeushagrid", name: "Rubeus Hagrid", thumbnail: "images/default-card.png" }
        ];
        
        // Aggiorna le statistiche con i personaggi predefiniti
        updateAllStats();
        
        // Mostra i pacchetti iniziali
        displayPacks(AppState.packs);
    });

// Funzione per creare la card di un pacchetto
function createPackCard(pack) {
    const openedClass = pack.opened ? 'opacity-50' : '';
    const openedText = pack.opened ? 'Aperto' : 'Non Aperto';
    const openedDate = pack.opened ? `<p class="text-sm text-gray-500 dark:text-gray-400">Aperto il ${pack.openedDate || pack.purchaseDate}</p>` : '';

    return `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden ${openedClass}">
            <div class="p-4">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Pacchetto ${pack.type}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Acquistato il ${pack.purchaseDate}</p>
                        ${openedDate}
                    </div>
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${pack.opened ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'}">
                        ${openedText}
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
                        ${pack.cards.length} carte
                    </span>
                    <button onclick="${pack.opened ? `viewPack(${pack.id})` : `openPack(${pack.id})`}" 
                            class="px-3 py-1 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-full transition-colors">
                        ${pack.opened ? 'Vedi Carte' : 'Apri Pacchetto'}
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Funzione per visualizzare tutti i pacchetti - versione migliorata
function displayPacks(packs) {
    const container = document.getElementById('packs-container');
    if (!container) {
        console.error('Container pacchetti non trovato');
        return;
    }
    
    if (!packs || !Array.isArray(packs) || packs.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-8"><p class="text-gray-500 dark:text-gray-400">Non hai ancora pacchetti.</p></div>';
        return;
    }
    
    container.innerHTML = packs.map(pack => createPackCard(pack)).join('');
}

// Funzione per filtrare i pacchetti
function filterPacks(filter) {
    let filteredPacks;
    switch(filter) {
        case 'unopened':
            filteredPacks = AppState.packs.filter(pack => !pack.opened);
            break;
        case 'opened':
            filteredPacks = AppState.packs.filter(pack => pack.opened);
            break;
        default:
            filteredPacks = AppState.packs;
    }
    displayPacks(filteredPacks);
}

// Funzione per visualizzare le carte di un pacchetto - versione migliorata
function viewPack(packId) {
    if (!AppState.packs) {
        console.error('AppState.packs non è definito');
        showError('Errore nel caricamento dei pacchetti');
        return;
    }
    
    const pack = AppState.packs.find(p => p.id === packId);
    if (!pack || !pack.opened) {
        showError('Pacchetto non trovato o non ancora aperto');
        return;
    }

    const modal = document.getElementById('pack-opening-modal');
    const cardsContainer = document.getElementById('cards-container');
    
    if (!modal || !cardsContainer) {
        console.error('Modal o cardsContainer non trovati');
        showError('Errore nell\'interfaccia utente');
        return;
    }
    
    cardsContainer.innerHTML = pack.cards.map(cardName => {
        // Trova il personaggio corrispondente per ottenere l'immagine
        const character = allCharacters.find(c => c.name === cardName);
        const characterImage = character ? character.thumbnail : 'images/default-card.png';
        
        const isNew = AppState.album && AppState.album.duplicates ? 
            !AppState.album.duplicates[cardName] || AppState.album.duplicates[cardName] === 0 : true;
        
        return `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
            <img src="${characterImage}" alt="${cardName}" class="w-full h-48 object-cover mb-3 rounded">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${cardName}</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">
                ${isNew ? 'Nuova!' : `Doppioni: ${AppState.album.duplicates[cardName]}`}
            </p>
        </div>
        `;
    }).join('');

    modal.classList.remove('hidden');
}

// Funzione per aprire un pacchetto esistente
function openPack(packId) {
    const pack = AppState.packs.find(p => p.id === packId);
    if (!pack || pack.opened) return;
    
    // Ottieni il token di autenticazione
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token di autenticazione non trovato');
        alert('Devi effettuare il login per aprire un pacchetto');
        return;
    }
    
    // Segna il pacchetto come aperto
    pack.opened = true;
    pack.openedDate = new Date().toISOString().split('T')[0];
    
    // Prepara le carte da salvare nel database
    const cardsToSave = [];
    
    pack.cards.forEach(cardName => {
        const character = allCharacters.find(c => c.name === cardName);
        if (character) {
            cardsToSave.push({
                id: character.id.toString(),
                name: cardName,
                thumbnail: character.thumbnail
            });
        }
        
        // Aggiorna l'album locale
        AppState.album.cards.add(cardName);
        if (!AppState.album.duplicates[cardName]) {
            AppState.album.duplicates[cardName] = 0;
        }
    });
    
    // Mostra un indicatore di caricamento
    const modal = document.getElementById('pack-opening-modal');
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Apertura pacchetto in corso...</p></div>';
    modal.classList.remove('hidden');
    
    // Salva le carte nel database MongoDB
    fetch('http://localhost:3000/api/cards/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cards: cardsToSave })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Errore durante il salvataggio delle carte nel database');
        }
        return response.json();
    })
    .then(data => {
        console.log('Carte salvate nel database con successo:', data);
        
        // Aggiorna le statistiche dell'utente
        AppState.user.totalCards = data.totalCards;
        
        // Notifica che le carte dell'utente sono state aggiornate
        AppState.notify('user');
        AppState.notify('album');
        AppState.notify('packs');
        
        // Mostra le carte nel modal
        cardsContainer.innerHTML = pack.cards.map(cardName => {
            // Trova il personaggio corrispondente per ottenere l'immagine
            const character = allCharacters.find(c => c.name === cardName);
            const characterImage = character ? character.thumbnail : 'images/default-card.png';
            
            return `
            <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
                <img src="${characterImage}" alt="${cardName}" class="w-full h-48 object-cover mb-3 rounded">
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${cardName}</h4>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    ${AppState.album.duplicates[cardName] ? `Doppioni: ${AppState.album.duplicates[cardName]}` : 'Nuova!'}
                </p>
            </div>
            `;
        }).join('');
    })
    .catch(error => {
        console.error('Errore durante l\'apertura del pacchetto:', error);
        alert('Errore durante l\'apertura del pacchetto: ' + error.message);
        
        // Ripristina lo stato del pacchetto
        pack.opened = false;
        pack.openedDate = null;
        
        // Chiudi il modal
        modal.classList.add('hidden');
    });
}

// Funzione per generare carte casuali - versione migliorata
function generateRandomCards(count) {
    if (!allCharacters || allCharacters.length === 0) {
        console.error('Nessun personaggio disponibile');
        showError('Errore nel caricamento dei personaggi');
        return [];
    }
    
    if (!AppState.album) {
        AppState.album = {
            cards: new Set(),
            duplicates: {}
        };
    }
    
    const cards = [];
    for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * allCharacters.length);
        if (randomIndex >= 0 && randomIndex < allCharacters.length) {
            const randomCharacter = allCharacters[randomIndex];
            const isNew = !AppState.album.cards.has(randomCharacter.name);
            
            cards.push({
                name: randomCharacter.name,
                isNew: isNew,
                thumbnail: randomCharacter.thumbnail
            });
            
            // Aggiorna l'album
            AppState.album.cards.add(randomCharacter.name);
            if (!AppState.album.duplicates[randomCharacter.name]) {
                AppState.album.duplicates[randomCharacter.name] = 0;
            }
            if (!isNew) {
                AppState.album.duplicates[randomCharacter.name]++;
            }
        }
    }
    
    if (AppState.notify) {
        AppState.notify('album');
    }
    
    return cards;
}

// Funzione per mostrare il modal con le carte
function showPackOpeningModal(cards) {
    const modal = document.getElementById('pack-opening-modal');
    const cardsContainer = document.getElementById('cards-container');
    
    if (!modal || !cardsContainer) {
        console.error('Modal o container delle carte non trovato');
        return;
    }
    
    cardsContainer.innerHTML = cards.map(card => {
        // Assicurati che card.name esista
        if (!card || !card.name) {
            return '<div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">Carta non valida</div>';
        }
        
        // Trova il personaggio corrispondente per ottenere l'immagine
        const characterImage = card.thumbnail || 'images/default-card.png';
        
        return `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
            <img src="${characterImage}" alt="${card.name}" class="w-full h-48 object-cover mb-3 rounded">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${card.name}</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">
                ${card.isNew ? 'Nuova!' : `Doppione (${AppState.album.duplicates[card.name] || 1})`}
            </p>
        </div>
        `;
    }).join('');

    modal.classList.remove('hidden');
}

// Funzione per aprire un nuovo pacchetto - versione migliorata
async function openNewPack() {
    try {
        // Mostra un indicatore di caricamento
        showSuccessMessage('Preparazione apertura pacchetto...');
        
        // Genera 5 carte casuali
        const generatedCards = generateRandomCards(5);
        
        if (generatedCards.length === 0) {
            throw new Error('Impossibile generare carte casuali');
        }
        
        // Crea un nuovo pacchetto
        const newPack = {
            id: Date.now(),
            type: "Standard",
            cards: generatedCards.map(card => card.name),
            opened: true,
            purchaseDate: new Date().toISOString().split('T')[0],
            openedDate: new Date().toISOString().split('T')[0],
            cost: 1
        };
        
        // Aggiorna l'AppState
        if (!AppState.packs) {
            AppState.packs = [];
        }
        AppState.packs.unshift(newPack);
        
        // Aggiorna le statistiche dell'utente
        if (!AppState.user) {
            AppState.user = { credits: 50, totalPacks: 0, totalCards: 0, duplicateCards: 0 };
        }
        AppState.user.credits = Math.max(0, AppState.user.credits - 1);
        AppState.user.totalCards = (AppState.user.totalCards || 0) + generatedCards.length;
        AppState.user.totalPacks = (AppState.user.totalPacks || 0) + 1;
        
        // Aggiorna duplicati
        AppState.user.duplicateCards = (AppState.user.duplicateCards || 0) + 
            generatedCards.filter(card => !card.isNew).length;
        
        // Notifica gli aggiornamenti
        if (AppState.notify) {
            AppState.notify('user');
            AppState.notify('album');
            AppState.notify('packs');
        }
        
        // Aggiorna i crediti visualizzati
        const creditsElement = document.getElementById('user-credits');
        if (creditsElement) {
            creditsElement.textContent = AppState.user.credits;
        }
        
        // Mostra le carte nel modal
        showPackOpeningModal(generatedCards);
        
    } catch (error) {
        console.error('Errore:', error);
        showError('Si è verificato un errore durante l\'apertura del pacchetto: ' + error.message);
    }
}

// Funzione per mostrare il modal dei crediti insufficienti
function showInsufficientCreditsModal() {
    // Crea il modal se non esiste
    let modal = document.getElementById('insufficient-credits-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'insufficient-credits-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <div class="text-center">
                    <svg class="mx-auto h-12 w-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 class="mt-4 text-xl font-bold text-gray-900 dark:text-white">Crediti Insufficienti</h3>
                    <p class="mt-2 text-gray-500 dark:text-gray-400">Non hai abbastanza crediti per aprire un pacchetto.</p>
                    <div class="mt-6 flex flex-col space-y-3">
                        <button onclick="getMoreCredits()" class="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                            Ottieni 5 Crediti Gratis
                        </button>
                        <button onclick="closeInsufficientCreditsModal()" class="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                            Chiudi
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        modal.classList.remove('hidden');
    }
}

// Funzione per chiudere il modal dei crediti insufficienti
function closeInsufficientCreditsModal() {
    const modal = document.getElementById('insufficient-credits-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Funzione per ottenere più crediti
async function getMoreCredits() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Devi effettuare il login per ottenere crediti');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/user/add-credits', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ amount: 5 })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Errore nell\'aggiunta dei crediti');
        }

        if (data.success) {
            // Aggiorna il contatore dei crediti nell'interfaccia
            const creditsElement = document.getElementById('user-credits');
            if (creditsElement) {
                creditsElement.textContent = data.credits;
            }
            
            // Chiudi il modal
            closeInsufficientCreditsModal();
            
            // Mostra un messaggio di successo
            showSuccessMessage('Hai ricevuto 5 crediti!');

            // Aggiorna AppState se necessario
            if (window.AppState) {
                AppState.user.credits = data.credits;
                if (AppState.notify) {
                    AppState.notify('user');
                }
            }
        } else {
            throw new Error(data.message || 'Errore nell\'aggiunta dei crediti');
        }
    } catch (error) {
        console.error('Errore:', error);
        alert('Si è verificato un errore durante l\'aggiunta dei crediti: ' + error.message);
    }
}

// Funzione per mostrare un messaggio di successo
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

// Funzione per chiudere il modal
function closePackModal() {
    const modal = document.getElementById('pack-opening-modal');
    modal.classList.add('hidden');
}

// Funzione per aggiornare tutte le statistiche
function updateAllStats() {
    // Aggiorna i crediti
    const creditsElement = document.getElementById('user-credits');
    if (creditsElement) {
        creditsElement.textContent = AppState.user.credits;
    }

    // Aggiorna il totale dei pacchetti
    const totalPacksElement = document.getElementById('total-packs');
    if (totalPacksElement) {
        totalPacksElement.textContent = AppState.user.totalPacks;
    }

    // Aggiorna le statistiche delle carte
    const totalCardsElement = document.getElementById('total-cards');
    const duplicateCardsElement = document.getElementById('duplicate-cards');
    if (totalCardsElement) {
        totalCardsElement.textContent = AppState.user.totalCards;
    }
    if (duplicateCardsElement) {
        duplicateCardsElement.textContent = AppState.user.duplicateCards;
    }

    // Calcola e aggiorna la percentuale di completamento
    const completionElement = document.getElementById('completion-percentage');
    if (completionElement && allCharacters.length > 0) {
        const totalUniqueCharacters = allCharacters.length; // Il numero totale di personaggi disponibili
        const completionPercentage = Math.round((AppState.album.cards.size / totalUniqueCharacters) * 100);
        completionElement.textContent = `${completionPercentage}%`;
    }
}

// Funzione per mostrare un messaggio di errore
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Inizializzazione - versione migliorata
document.addEventListener('DOMContentLoaded', () => {
    // Inizializza l'UI con i dati già caricati (se presenti)
    if (allCharacters && allCharacters.length > 0) {
        updateAllStats();
        displayPacks(AppState.packs);
    }
    
    // Aggiungi event listener per il modal
    const modal = document.getElementById('pack-opening-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePackModal();
            }
        });
    }
    
    // Inizializza i filtri dei pacchetti
    const filterButtons = document.querySelectorAll('button[onclick^="filterPacks"]');
    filterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const filter = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
            filterPacks(filter);
        });
    });
}); 