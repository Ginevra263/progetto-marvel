// Gestione delle carte dell'utente
// Rimuovo la dichiarazione di userCards che causa il conflitto con dashboard.js
// Useremo la variabile userCards dichiarata in dashboard.js

// Funzione per caricare le carte dell'utente
function loadUserCards() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('Token non trovato, impossibile caricare le carte');
        return;
    }
    
    // Verifica se ci sono carte salvate in localStorage
    const savedCards = localStorage.getItem('userCards');
    if (savedCards) {
        console.log('Carte trovate in localStorage');
        userCards = JSON.parse(savedCards);
        updateCardsUI();
    }
    
    console.log('Caricamento carte utente dal server...');
    fetch('http://localhost:3000/api/user/data', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('Carte utente caricate:', data.cards);
            userCards = data.cards;
            // Salva le carte in localStorage per accesso rapido
            localStorage.setItem('userCards', JSON.stringify(userCards));
            updateCardsUI();
        } else {
            console.error('Errore nel caricamento delle carte:', data.message);
        }
    })
    .catch(error => {
        console.error('Errore nel caricamento delle carte:', error);
    });
}

// Funzione per aggiornare l'interfaccia utente con le carte
function updateCardsUI() {
    // Aggiorna il contatore delle carte
    const cardsCountElement = document.getElementById('cards-count');
    if (cardsCountElement) {
        cardsCountElement.textContent = userCards.length;
    }

    // Aggiorna la visualizzazione delle carte
    const cardsContainer = document.getElementById('user-cards-container');
    if (cardsContainer) {
        if (userCards.length === 0) {
            cardsContainer.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-4">Non hai ancora nessuna carta. Acquista un pacchetto per iniziare la tua collezione!</p>';
        } else {
            // Mostra solo le prime 8 carte nella dashboard
            const cardsToShow = userCards.slice(0, 8);
            
            cardsContainer.innerHTML = cardsToShow.map(card => `
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                    <img src="${card.thumbnail || 'images/card-placeholder.jpg'}" alt="${card.name}" class="w-full h-40 object-cover">
                    <div class="p-4">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${card.name}</h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Quantità: ${card.count || 1}</p>
                        ${card.count > 1 ? `
                            <button onclick="showTradeOptions('${card.id}')" class="mt-2 px-3 py-1 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 transition-colors">
                                Scambia
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
            
            // Se ci sono più di 8 carte, mostra un pulsante "Vedi tutte"
            if (userCards.length > 8) {
                const viewAllButton = document.createElement('div');
                viewAllButton.className = 'col-span-full flex justify-center mt-4';
                viewAllButton.innerHTML = `
                    <a href="album.html" class="px-4 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 transition-colors">
                        Vedi tutte le carte (${userCards.length})
                    </a>
                `;
                cardsContainer.appendChild(viewAllButton);
            }
        }
    }
}

// Funzione per mostrare le opzioni di scambio per una carta
function showTradeOptions(cardId) {
    const card = userCards.find(c => c.id === cardId);
    if (!card) return;
    
    if (card.count <= 1) {
        alert('Hai solo una copia di questa carta. Non puoi scambiarla.');
        return;
    }
    
    // Reindirizza alla pagina degli scambi
    window.location.href = `scambi.html?card=${cardId}`;
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Carica le carte dell'utente
    loadUserCards();
}); 