// Array delle carte disponibili
const allHeroes = [
    "Spider-Man", "Iron Man", "Thor", "Black Widow", "Hulk",
    "Doctor Strange", "Black Panther", "Captain America", "Wolverine", "Deadpool"
];

// Array per le carte doppie e mancanti
let doppioni = [];
let mancanti = [];

// DOM Elements
const offeredCardSelect = document.getElementById('offered-card');
const wantedCardSelect = document.getElementById('wanted-card');
const newTradeForm = document.getElementById('new-trade-form');

// Initialize the trading interface
function initializeTradingInterface() {
    console.log("Initializing trading interface...");
    
    // Inizializza AppState se non è già stato fatto
    if (typeof AppState === 'undefined') {
        window.AppState = {
            album: {
                cards: new Set(),
                duplicates: {}
            }
        };
    }

    // Aggiungi alcune carte di test
    AppState.album.cards.add("Spider-Man");
    AppState.album.cards.add("Iron Man");
    AppState.album.cards.add("Thor");
    
    // Aggiungi alcuni doppioni
    AppState.album.duplicates["Spider-Man"] = 2; // 2 doppioni di Spider-Man
    AppState.album.duplicates["Iron Man"] = 1;   // 1 doppione di Iron Man

    // Debug: stampa lo stato dell'album
    console.log("Album cards:", AppState.album.cards);
    console.log("Album duplicates:", AppState.album.duplicates);
    
    // Carica le carte doppie e mancanti
    loadCards();
    
    // Popola i dropdown
    updateDropdowns();
    
    // Set up event listeners
    setupEventListeners();
}

// Funzione per caricare le carte doppie e mancanti
function loadCards() {
    console.log("Loading cards...");
    
    // Resetta gli array
    doppioni = [];
    mancanti = [];
    
    // Carica i doppioni
    for (const hero of allHeroes) {
        const count = AppState.album.duplicates[hero] || 0;
        if (count > 0) {
            doppioni.push({
                name: hero,
                count: count
            });
        }
    }
    
    // Carica le carte mancanti
    mancanti = allHeroes.filter(hero => !AppState.album.cards.has(hero));
    
    console.log("Doppioni caricati:", doppioni);
    console.log("Carte mancanti caricate:", mancanti);
}

// Funzione per aggiornare i dropdown
function updateDropdowns() {
    console.log("Updating dropdowns...");
    
    if (!offeredCardSelect || !wantedCardSelect) {
        console.error("Dropdown elements not found!");
        return;
    }
    
    // Pulisci i dropdown
    offeredCardSelect.innerHTML = '<option value="">Seleziona una carta doppia</option>';
    wantedCardSelect.innerHTML = '<option value="">Seleziona una carta mancante</option>';
    
    // Aggiungi le carte doppie al primo dropdown
    doppioni.forEach(card => {
        const option = document.createElement('option');
        option.value = card.name;
        option.textContent = `${card.name} (${card.count} ${card.count === 1 ? 'doppia' : 'doppie'})`;
        offeredCardSelect.appendChild(option);
        console.log("Aggiunta carta doppia al dropdown:", card.name);
    });
    
    // Aggiungi le carte mancanti al secondo dropdown
    mancanti.forEach(card => {
        const option = document.createElement('option');
        option.value = card;
        option.textContent = card;
        wantedCardSelect.appendChild(option);
        console.log("Aggiunta carta mancante al dropdown:", card);
    });
}

// Set up event listeners
function setupEventListeners() {
    if (!newTradeForm) {
        console.error("Trade form not found!");
        return;
    }

    // New trade form submission
    newTradeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const offeredCard = offeredCardSelect.value;
        const wantedCard = wantedCardSelect.value;
        const message = document.getElementById('trade-message')?.value || '';
        
        if (!offeredCard || !wantedCard) {
            alert('Seleziona le carte da scambiare');
            return;
        }
        
        console.log("Scambio proposto:", { offeredCard, wantedCard, message });
        alert('Scambio proposto con successo! (modalità test)');
        newTradeForm.reset();
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, initializing...");
    initializeTradingInterface();
}); 