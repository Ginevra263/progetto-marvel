const PUBLIC_KEY="af7b1b70227c7699019dc5b3310f327d";
const PRIVATE_KEY="1389efde3a9d301441b69d6a53c1ae95e8b63520"; 
const timestamp = new Date().getTime();
const hash = CryptoJS.MD5(timestamp + PRIVATE_KEY + PUBLIC_KEY).toString();
const url = `https://gateway.marvel.com/v1/public/characters?ts=${timestamp}&apikey=${PUBLIC_KEY}&hash=${hash}&limit=100&orderBy=name`;
let allHeroes = []; 
// Simulazione del database dei pacchetti
let userPacks = [
    {
        id: 1,
        type: "Standard",
        cards: ["Spider-Man", "Iron Man", "Thor", "Black Widow", "Hulk"],
        opened: false,
        purchaseDate: "2024-03-15",
        cost: 1
    },
    {
        id: 2,
        type: "Premium",
        cards: ["Doctor Strange", "Black Panther", "Captain America", "Wolverine", "Deadpool"],
        opened: true,
        purchaseDate: "2024-03-14",
        cost: 2
    }
];

fetch(url)
    .then(response => {
        if (!response.ok) throw new Error('Errore nella risposta del server');
        return response.json();
    })
.then(data => {
        allHeroes = data.data.results.map(hero => ({
            id: hero.id,
            name: hero.name,
            thumbnail: `${hero.thumbnail.path}.${hero.thumbnail.extension}`
        }));
        console.log("allhero",allHeroes);
    })
    .catch(error => {
        console.error('Errore nel caricamento dei dati:', error);
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

// Funzione per visualizzare tutti i pacchetti
function displayPacks(packs) {
    const container = document.getElementById('packs-container');
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

// Funzione per visualizzare le carte di un pacchetto
function viewPack(packId) {
    const pack = AppState.packs.find(p => p.id === packId);
    if (!pack || !pack.opened) return;

    const modal = document.getElementById('pack-opening-modal');
    const cardsContainer = document.getElementById('cards-container');
    
    cardsContainer.innerHTML = pack.cards.map(cardName => {
        // Trova l'eroe corrispondente per ottenere l'immagine
        const hero = allHeroes.find(h => h.name === cardName);
        const heroImage = hero ? hero.thumbnail : '';
        
        return `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
            ${heroImage ? `<img src="${heroImage}" alt="${cardName}" class="w-full h-48 object-cover mb-3 rounded">` : ''}
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${cardName}</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">
                ${AppState.album.duplicates[cardName] ? `Doppioni: ${AppState.album.duplicates[cardName]}` : 'Nuova!'}
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
        const hero = allHeroes.find(h => h.name === cardName);
        if (hero) {
            cardsToSave.push({
                id: hero.id.toString(),
                name: cardName,
                thumbnail: hero.thumbnail
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
    fetch('/api/cards/save', {
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
            // Trova l'eroe corrispondente per ottenere l'immagine
            const hero = allHeroes.find(h => h.name === cardName);
            const heroImage = hero ? hero.thumbnail : '';
            
            return `
            <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
                ${heroImage ? `<img src="${heroImage}" alt="${cardName}" class="w-full h-48 object-cover mb-3 rounded">` : ''}
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

// Funzione per generare carte casuali
function generateRandomCards(count) {
    const cards = [];
    for (let i = 0; i < count; i++) {
        const randomHero = allHeroes[Math.floor(Math.random() * allHeroes.length)];
        cards.push({
            name: randomHero.name,
            isNew: !AppState.album.cards.has(randomHero.name)
        });
        
        // Aggiorna l'album
        AppState.album.cards.add(randomHero.name);
        if (!AppState.album.duplicates[randomHero.name]) {
            AppState.album.duplicates[randomHero.name] = 0;
        }
        if (!cards[cards.length - 1].isNew) {
            AppState.album.duplicates[randomHero.name]++;
        }
    }
    AppState.notify('album');
    return cards;
}

// Funzione per mostrare il modal con le carte
function showPackOpeningModal(cards) {
    const modal = document.getElementById('pack-opening-modal');
    const cardsContainer = document.getElementById('cards-container');
    
    cardsContainer.innerHTML = cards.map(card => {
        // Trova l'eroe corrispondente per ottenere l'immagine
        const hero = allHeroes.find(h => h.name === card.name);
        const heroImage = hero ? hero.thumbnail : '';
        
        return `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
            ${heroImage ? `<img src="${heroImage}" alt="${card.name}" class="w-full h-48 object-cover mb-3 rounded">` : ''}
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${card.name}</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">
                ${card.isNew ? 'Nuova!' : `Doppione (${AppState.album.duplicates[card.name]})`}
            </p>
        </div>
        `;
    }).join('');

    modal.classList.remove('hidden');
}

// Funzione per aprire un nuovo pacchetto
function openNewPack() {
    // Verifica se l'utente ha abbastanza crediti
    if (AppState.user.credits < 1) {
        alert('Non hai abbastanza crediti per aprire un pacchetto!');
        return;
    }

    // Ottieni il token di autenticazione
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token di autenticazione non trovato');
        alert('Devi effettuare il login per aprire un pacchetto');
        return;
    }

    // Mostra un indicatore di caricamento
    const container = document.getElementById('packs-container');
    container.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Apertura pacchetto in corso...</p></div>';

    // Invia la richiesta al server per acquistare un pacchetto
    fetch('http://localhost:3000/api/cards/buy-pack', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Errore durante l\'acquisto del pacchetto');
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(data.message || 'Errore durante l\'acquisto del pacchetto');
        }

        // Aggiorna i crediti dell'utente
        AppState.user.credits = data.newCredits;

        // Aggiorna le statistiche
        AppState.user.totalPacks = (AppState.user.totalPacks || 0) + 1;
        AppState.user.totalCards = data.totalCards;

        // Crea un nuovo pacchetto con le carte ricevute dal server
        const newPack = {
            id: Date.now(),
            type: "Standard",
            cards: data.newCards.map(card => card.name),
            opened: true,
            purchaseDate: new Date().toISOString().split('T')[0],
            openedDate: new Date().toISOString().split('T')[0],
            cost: 1
        };

        // Aggiungi il pacchetto alla lista
        if (!AppState.packs) {
            AppState.packs = [];
        }
        AppState.packs.unshift(newPack);

        // Aggiorna l'album con le nuove carte
        data.newCards.forEach(card => {
            AppState.album.cards.add(card.name);
        });

        // Salva il timestamp dell'apertura del pacchetto
        AppState.lastPackOpening = {
            timestamp: new Date().toISOString(),
            cards: data.newCards.map(card => card.name)
        };

        // Aggiorna l'interfaccia
        updateAllStats();
        displayPacks(AppState.packs);

        // Prepara le carte per il modal
        const cards = data.newCards.map(card => ({
            name: card.name,
            isNew: true, // Assumiamo che siano tutte nuove, il server gestisce i doppioni
            thumbnail: card.thumbnail
        }));

        // Mostra le carte nel modal
        showPackOpeningModal(cards);

        // Notifica che le carte dell'utente sono state aggiornate
        AppState.notify('user');
        AppState.notify('album');
        
        console.log("Pacchetto aperto con successo:", data);
    })
    .catch(error => {
        console.error('Errore durante l\'apertura del pacchetto:', error);
        alert('Errore durante l\'apertura del pacchetto: ' + error.message);
        
        // Ripristina l'interfaccia
        displayPacks(AppState.packs);
    });
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
    if (completionElement) {
        const totalUniqueHeroes = 10; // Il numero totale di eroi disponibili
        const completionPercentage = Math.round((AppState.album.cards.size / totalUniqueHeroes) * 100);
        completionElement.textContent = `${completionPercentage}%`;
    }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    // Inizializza l'AppState se necessario
    if (!AppState.album) {
        AppState.album = {
            cards: new Set(),
            duplicates: {}
        };
    }
    if (!AppState.user) {
        AppState.user = {
            credits: 50,
            totalPacks: 0,
            totalCards: 0,
            duplicateCards: 0,
            cards: [] // Inizializza l'array delle carte dell'utente
        };
    }
    
    // Assicurati che l'attributo cards esista
    if (!AppState.user.cards) {
        AppState.user.cards = [];
    }

    // Aggiorna i contatori
    document.getElementById('user-credits').textContent = AppState.user.credits;
    document.getElementById('total-packs').textContent = AppState.user.totalPacks;
    document.getElementById('total-cards').textContent = AppState.user.totalCards;
    document.getElementById('duplicate-cards').textContent = AppState.user.duplicateCards;

    // Calcola e aggiorna la percentuale di completamento
    const totalHeroes = allHeroes.length;
    const collectedHeroes = AppState.album.cards.size;
    const progressPercentage = Math.round((collectedHeroes / totalHeroes) * 100);
    document.getElementById('completion-percentage').textContent = `${progressPercentage}%`;

    // Mostra i pacchetti iniziali
    displayPacks(AppState.packs);

    // Aggiorna tutte le statistiche
    updateAllStats();

    // Sottoscrivi agli aggiornamenti
    AppState.subscribe('packs', () => {
        displayPacks(AppState.packs);
        updateAllStats();
    });
    AppState.subscribe('credits', updateAllStats);
    AppState.subscribe('album', updateAllStats);
});

// Chiudi il modal quando si clicca fuori
document.getElementById('pack-opening-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        closePackModal();
    }
}); 