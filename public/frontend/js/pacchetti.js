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
    
    cardsContainer.innerHTML = pack.cards.map(card => `
        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">${card}</h4>
            <p class="text-sm text-gray-500 dark:text-gray-400">
                ${AppState.album.duplicates[card] ? `Doppioni: ${AppState.album.duplicates[card]}` : 'Nuova!'}
            </p>
        </div>
    `).join('');

    modal.classList.remove('hidden');
}

// Funzione per aprire un pacchetto esistente
function openPack(packId) {
    AppState.openPack(packId);
    viewPack(packId);
}

// Funzione per aprire un nuovo pacchetto
function openNewPack() {
    // Verifica se l'utente ha abbastanza crediti
    if (AppState.user.credits < 1) {
        alert('Crediti insufficienti per aprire un nuovo pacchetto!');
        return;
    }

    // Crea un nuovo pacchetto con carte casuali
    const allHeroes = [
        "Spider-Man", "Iron Man", "Thor", "Black Widow", "Hulk",
        "Doctor Strange", "Black Panther", "Captain America", "Wolverine", "Deadpool"
    ];
    
    const newPack = {
        id: Date.now(), // Usa il timestamp come ID univoco
        type: "Standard",
        cards: Array.from({ length: 5 }, () => allHeroes[Math.floor(Math.random() * allHeroes.length)]),
        opened: true,
        purchaseDate: new Date().toISOString().split('T')[0],
        openedDate: new Date().toISOString().split('T')[0],
        cost: 1
    };

    // Aggiorna lo stato
    AppState.updateCredits(-1); // Sottrai un credito
    AppState.addPack(newPack);
    viewPack(newPack.id);
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