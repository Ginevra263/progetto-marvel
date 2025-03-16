// Definizione di tutti gli eroi disponibili con le loro immagini
const allHeroes = [
    {
        name: "Spider-Man",
        image: "images/heroes/spiderman.jpg",
        description: "L'Uomo Ragno, il supereroe di quartiere"
    },
    {
        name: "Iron Man",
        image: "images/heroes/ironman.jpg",
        description: "Il geniale miliardario in armatura"
    },
    {
        name: "Thor",
        image: "images/heroes/thor.jpg",
        description: "Il potente dio del tuono"
    },
    {
        name: "Black Widow",
        image: "images/heroes/blackwidow.jpg",
        description: "La letale spia degli Avengers"
    },
    {
        name: "Hulk",
        image: "images/heroes/hulk.jpg",
        description: "Il gigante verde dalla forza incredibile"
    },
    {
        name: "Doctor Strange",
        image: "images/heroes/drstrange.jpg",
        description: "Il Maestro delle Arti Mistiche"
    },
    {
        name: "Black Panther",
        image: "images/heroes/blackpanther.jpg",
        description: "Il protettore del Wakanda"
    },
    {
        name: "Captain America",
        image: "images/heroes/captainamerica.jpg",
        description: "Il primo Vendicatore"
    },
    {
        name: "Wolverine",
        image: "images/heroes/wolverine.jpg",
        description: "Il mutante dagli artigli di adamantio"
    },
    {
        name: "Deadpool",
        image: "images/heroes/deadpool.jpg",
        description: "Il mercenario chiacchierone"
    }
];

// Funzione per creare una card per un eroe
function createHeroCard(hero, isDuplicate = false, duplicateCount = 0) {
    return `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-transform hover:scale-105">
            <div class="relative aspect-[2/3]">
                <img src="${hero.image}" alt="${hero.name}" class="w-full h-full object-cover">
                ${isDuplicate ? `
                    <div class="absolute top-2 right-2 bg-primary-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                        ${duplicateCount} doppioni
                    </div>
                ` : ''}
            </div>
            <div class="p-4">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">${hero.name}</h3>
                <p class="text-xs text-gray-600 dark:text-gray-400 text-center">${hero.description}</p>
            </div>
        </div>
    `;
}

// Funzione per mostrare le carte possedute o mancanti
function showTab(tab) {
    const collectedTab = document.getElementById('collected-cards');
    const duplicatesTab = document.getElementById('duplicates-cards');
    const missingTab = document.getElementById('missing-cards');
    const buttons = document.querySelectorAll('.tab-button');

    // Nascondi tutte le sezioni
    collectedTab.classList.add('hidden');
    duplicatesTab.classList.add('hidden');
    missingTab.classList.add('hidden');

    // Aggiorna lo stile dei pulsanti
    buttons.forEach(button => {
        const buttonText = button.textContent.toLowerCase().trim();
        const isActive = (
            (tab === 'collected' && buttonText.includes('possedute')) ||
            (tab === 'duplicates' && buttonText.includes('doppie')) ||
            (tab === 'missing' && buttonText.includes('mancanti'))
        );

        if (isActive) {
            button.classList.add('border-primary-600', 'text-primary-600', 'dark:text-primary-400');
            button.classList.remove('border-transparent', 'text-gray-500');
        } else {
            button.classList.remove('border-primary-600', 'text-primary-600', 'dark:text-primary-400');
            button.classList.add('border-transparent', 'text-gray-500');
        }
    });

    // Mostra la sezione appropriata
    switch(tab) {
        case 'collected':
            collectedTab.classList.remove('hidden');
            displayCollectedCards();
            break;
        case 'duplicates':
            duplicatesTab.classList.remove('hidden');
            displayDuplicateCards();
            break;
        case 'missing':
            missingTab.classList.remove('hidden');
            displayMissingCards();
            break;
    }
}

// Funzione per mostrare le carte possedute
function displayCollectedCards() {
    const container = document.getElementById('collected-cards');
    const collectedCards = allHeroes.filter(hero => AppState.album.cards.has(hero.name));
    
    container.innerHTML = collectedCards.map(hero => 
        createHeroCard(hero)
    ).join('');
}

// Funzione per mostrare le carte doppie
function displayDuplicateCards() {
    const container = document.getElementById('duplicates-cards');
    const duplicateCards = allHeroes.filter(hero => 
        AppState.album.cards.has(hero.name) && 
        AppState.album.duplicates[hero.name] > 0
    );
    
    container.innerHTML = duplicateCards.map(hero => 
        createHeroCard(hero, true, AppState.album.duplicates[hero.name])
    ).join('');

    // Mostra un messaggio se non ci sono doppioni
    if (duplicateCards.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-gray-500 dark:text-gray-400">Non hai ancora carte doppie.</p>
            </div>
        `;
    }
}

// Funzione per mostrare le carte mancanti
function displayMissingCards() {
    const container = document.getElementById('missing-cards');
    const missingCards = allHeroes.filter(hero => !AppState.album.cards.has(hero.name));
    
    container.innerHTML = missingCards.map(hero => 
        createHeroCard(hero)
    ).join('');
}

// Funzione per aggiornare le statistiche dell'album
function updateAlbumStats() {
    const uniqueCards = AppState.album.cards.size;
    const totalCards = allHeroes.length;
    const completionPercentage = Math.round((uniqueCards / totalCards) * 100);

    // Aggiorna il conteggio delle carte uniche
    document.getElementById('unique-cards').textContent = uniqueCards;
    
    // Aggiorna il conteggio delle carte doppie
    const duplicateCount = Object.values(AppState.album.duplicates)
        .reduce((sum, count) => sum + count, 0);
    document.getElementById('duplicate-cards').textContent = duplicateCount;
    
    // Aggiorna la percentuale di completamento
    document.getElementById('completion-percentage').textContent = completionPercentage;
    document.getElementById('progress-bar').style.width = `${completionPercentage}%`;

    // Aggiorna i crediti
    const creditsElement = document.getElementById('user-credits');
    if (creditsElement) {
        creditsElement.textContent = AppState.user.credits;
    }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    // Modifica il layout della griglia per tutte le sezioni di carte
    const cardGrids = ['collected-cards', 'duplicates-cards', 'missing-cards'];
    cardGrids.forEach(gridId => {
        const grid = document.getElementById(gridId);
        // Mantieni grid-cols-3 ma aggiungi gap più piccolo
        grid.className = grid.className.replace('gap-6', 'gap-4');
    });

    // Mostra le carte possedute inizialmente
    showTab('collected');
    
    // Aggiorna le statistiche
    updateAlbumStats();

    // Sottoscrivi agli aggiornamenti dell'album
    AppState.subscribe('album', () => {
        updateAlbumStats();
        showTab('collected'); // Aggiorna la vista corrente
    });
}); 