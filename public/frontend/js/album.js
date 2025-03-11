// Definizione di tutti gli eroi disponibili con le loro immagini
const allHeroes = [
    {
        name: "Spider-Man",
        image: "https://via.placeholder.com/400x300.png?text=Spider-Man",
        description: "L'Uomo Ragno, il supereroe di quartiere"
    },
    {
        name: "Iron Man",
        image: "https://via.placeholder.com/400x300.png?text=Iron+Man",
        description: "Il geniale miliardario in armatura"
    },
    {
        name: "Thor",
        image: "https://via.placeholder.com/400x300.png?text=Thor",
        description: "Il potente dio del tuono"
    },
    {
        name: "Black Widow",
        image: "https://via.placeholder.com/400x300.png?text=Black+Widow",
        description: "La letale spia degli Avengers"
    },
    {
        name: "Hulk",
        image: "https://via.placeholder.com/400x300.png?text=Hulk",
        description: "Il gigante verde dalla forza incredibile"
    },
    {
        name: "Doctor Strange",
        image: "https://via.placeholder.com/400x300.png?text=Doctor+Strange",
        description: "Il Maestro delle Arti Mistiche"
    },
    {
        name: "Black Panther",
        image: "https://via.placeholder.com/400x300.png?text=Black+Panther",
        description: "Il protettore del Wakanda"
    },
    {
        name: "Captain America",
        image: "https://via.placeholder.com/400x300.png?text=Captain+America",
        description: "Il primo Vendicatore"
    },
    {
        name: "Wolverine",
        image: "https://via.placeholder.com/400x300.png?text=Wolverine",
        description: "Il mutante dagli artigli di adamantio"
    },
    {
        name: "Deadpool",
        image: "https://via.placeholder.com/400x300.png?text=Deadpool",
        description: "Il mercenario chiacchierone"
    }
];

// Funzione per creare una card per un eroe
function createHeroCard(hero, isDuplicate = false, duplicateCount = 0) {
    return `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-transform hover:scale-105">
            <img src="${hero.image}" alt="${hero.name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">${hero.name}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">${hero.description}</p>
                ${isDuplicate ? `
                    <div class="flex items-center justify-between">
                        <span class="text-sm font-medium text-primary-600 dark:text-primary-400">
                            Doppioni: ${duplicateCount}
                        </span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Funzione per mostrare le carte possedute o mancanti
function showTab(tab) {
    const collectedTab = document.getElementById('collected-cards');
    const missingTab = document.getElementById('missing-cards');
    const buttons = document.querySelectorAll('.tab-button');

    // Aggiorna lo stile dei pulsanti
    buttons.forEach(button => {
        if (button.textContent.toLowerCase().includes(tab === 'collected' ? 'possedute' : 'mancanti')) {
            button.classList.add('border-primary-600', 'text-primary-600', 'dark:text-primary-400');
            button.classList.remove('border-transparent', 'text-gray-500');
        } else {
            button.classList.remove('border-primary-600', 'text-primary-600', 'dark:text-primary-400');
            button.classList.add('border-transparent', 'text-gray-500');
        }
    });

    // Mostra/nascondi le sezioni appropriate
    if (tab === 'collected') {
        collectedTab.classList.remove('hidden');
        missingTab.classList.add('hidden');
        displayCollectedCards();
    } else {
        collectedTab.classList.add('hidden');
        missingTab.classList.remove('hidden');
        displayMissingCards();
    }
}

// Funzione per mostrare le carte possedute
function displayCollectedCards() {
    const container = document.getElementById('collected-cards');
    const collectedCards = allHeroes.filter(hero => AppState.album.cards.has(hero.name));
    
    container.innerHTML = collectedCards.map(hero => 
        createHeroCard(hero, true, AppState.album.duplicates[hero.name] || 0)
    ).join('');
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