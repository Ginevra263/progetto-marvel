// Variabili globali
let allHeroes = []; // Tutti gli eroi disponibili dall'API Marvel
let userCards = []; // Carte dell'utente
let currentPage = 1;
const cardsPerPage = 12;
let currentTab = 'collected';

// Funzione per verificare l'autenticazione
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
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
            userCards = data.cards;
            // Aggiorna le carte in localStorage
            localStorage.setItem('userCards', JSON.stringify(userCards));
            
            // Aggiorna l'interfaccia utente
            document.getElementById('user-credits').textContent = data.credits;
            updateAlbumProgress();
            
            // Carica gli eroi Marvel
            await loadMarvelHeroes();
        }
    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        showError('Errore nel caricamento dei dati utente: ' + error.message);
    }
}

// Funzione per caricare gli eroi Marvel
async function loadMarvelHeroes() {
    try {
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
            
            // Aggiorna la visualizzazione dell'album
            updateAlbumView();
            
            // Aggiorna il progresso dell'album con il numero corretto di eroi
            updateAlbumProgress();
        } else {
            throw new Error('Formato dati non valido');
        }
    } catch (error) {
        console.error('Errore nel caricamento degli eroi Marvel:', error);
        showError('Errore nel caricamento degli eroi: ' + error.message);
    }
}

// Funzione per aggiornare il progresso dell'album
function updateAlbumProgress() {
    const uniqueCards = new Set(userCards.map(card => card.id)).size;
    const totalCards = allHeroes.length || 50; // Utilizzo il numero effettivo di eroi o 50 come fallback
    const completionPercentage = Math.round((uniqueCards / totalCards) * 100);
    
    // Calcola il numero di carte doppie
    const duplicateCount = userCards.reduce((total, card) => total + (card.count > 1 ? card.count - 1 : 0), 0);
    
    // Aggiorna l'interfaccia
    document.getElementById('completion-percentage').textContent = completionPercentage;
    document.getElementById('progress-bar').style.width = `${completionPercentage}%`;
    document.getElementById('unique-cards').textContent = uniqueCards;
    document.getElementById('duplicate-cards').textContent = duplicateCount;
    
    // Aggiorna anche il totale delle carte disponibili
    const totalCardsElement = document.getElementById('total-available-cards');
    if (totalCardsElement) {
        totalCardsElement.textContent = totalCards;
    }
}

// Funzione per aggiornare la visualizzazione dell'album
function updateAlbumView() {
    // Resetta la paginazione
    currentPage = 1;
    
    // Mostra la tab corrente
    showTab(currentTab);
}

// Funzione per mostrare una tab specifica
function showTab(tabName) {
    currentTab = tabName;
    
    // Nascondi tutte le tab
    document.getElementById('collected-cards').classList.add('hidden');
    document.getElementById('duplicates-cards').classList.add('hidden');
    document.getElementById('missing-cards').classList.add('hidden');
    
    // Mostra la tab selezionata
    document.getElementById(`${tabName}-cards`).classList.remove('hidden');
    
    // Aggiorna lo stile dei pulsanti
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('border-primary-600', 'text-primary-600', 'dark:text-primary-400');
        button.classList.add('border-transparent', 'text-gray-500', 'dark:text-gray-400');
    });
    
    // Evidenzia il pulsante selezionato
    const selectedButton = document.querySelector(`button[onclick="showTab('${tabName}')"]`);
    if (selectedButton) {
        selectedButton.classList.remove('border-transparent', 'text-gray-500', 'dark:text-gray-400');
        selectedButton.classList.add('border-primary-600', 'text-primary-600', 'dark:text-primary-400');
    }
    
    // Aggiorna il contenuto della tab
    updateTabContent(tabName);
}

// Funzione per aggiornare il contenuto di una tab
function updateTabContent(tabName) {
    const container = document.getElementById(`${tabName}-cards`);
    if (!container) return;
    
    // Svuota il contenitore
    container.innerHTML = '';
    
    // Prepara i dati in base alla tab
    let cardsToShow = [];
    
    if (tabName === 'collected') {
        // Carte possedute (uniche)
        cardsToShow = userCards.filter(card => card.count > 0);
    } else if (tabName === 'duplicates') {
        // Carte doppie
        cardsToShow = userCards.filter(card => card.count > 1);
    } else if (tabName === 'missing') {
        // Carte mancanti
        const userCardIds = new Set(userCards.map(card => card.id));
        cardsToShow = allHeroes
            .filter(hero => !userCardIds.has(hero.id.toString()))
            .map(hero => ({
                id: hero.id.toString(),
                name: hero.name,
                thumbnail: `${hero.thumbnail.path}.${hero.thumbnail.extension}`,
                count: 0
            }));
    }
    
    // Calcola il numero totale di pagine
    const totalPages = Math.ceil(cardsToShow.length / cardsPerPage);
    
    // Limita la pagina corrente
    if (currentPage > totalPages) {
        currentPage = totalPages || 1;
    }
    
    // Calcola l'indice di inizio e fine per la pagina corrente
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = Math.min(startIndex + cardsPerPage, cardsToShow.length);
    
    // Ottieni le carte per la pagina corrente
    const cardsForCurrentPage = cardsToShow.slice(startIndex, endIndex);
    
    // Se non ci sono carte da mostrare
    if (cardsForCurrentPage.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-gray-500 dark:text-gray-400">Nessuna carta da mostrare in questa sezione.</p>
            </div>
        `;
        return;
    }
    
    // Crea le card per ogni carta
    cardsForCurrentPage.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105';
        
        // Contenuto della card
        cardElement.innerHTML = `
            <img src="${card.thumbnail || 'images/card-placeholder.jpg'}" alt="${card.name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${card.name}</h3>
                ${card.count > 1 ? `<p class="text-sm text-gray-600 dark:text-gray-400">Quantità: ${card.count}</p>` : ''}
                ${tabName === 'duplicates' ? `
                    <button onclick="offerForTrade('${card.id}')" class="mt-2 px-3 py-1 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 transition-colors">
                        Scambia
                    </button>
                ` : ''}
            </div>
        `;
        
        container.appendChild(cardElement);
    });
    
    // Aggiungi la paginazione
    if (totalPages > 1) {
        const paginationElement = document.createElement('div');
        paginationElement.className = 'col-span-full flex justify-center mt-6 space-x-2';
        
        // Pulsante pagina precedente
        if (currentPage > 1) {
            const prevButton = document.createElement('button');
            prevButton.className = 'px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors';
            prevButton.textContent = 'Precedente';
            prevButton.onclick = () => {
                currentPage--;
                updateTabContent(tabName);
            };
            paginationElement.appendChild(prevButton);
        }
        
        // Numeri di pagina
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 || // Prima pagina
                i === totalPages || // Ultima pagina
                (i >= currentPage - 1 && i <= currentPage + 1) // Pagine intorno a quella corrente
            ) {
                const pageButton = document.createElement('button');
                pageButton.className = `px-3 py-1 rounded-md text-sm transition-colors ${
                    i === currentPage 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`;
                pageButton.textContent = i;
                pageButton.onclick = () => {
                    currentPage = i;
                    updateTabContent(tabName);
                };
                paginationElement.appendChild(pageButton);
            } else if (
                (i === 2 && currentPage > 3) || 
                (i === totalPages - 1 && currentPage < totalPages - 2)
            ) {
                // Aggiungi puntini di sospensione
                const ellipsis = document.createElement('span');
                ellipsis.className = 'px-3 py-1 text-gray-500 dark:text-gray-400';
                ellipsis.textContent = '...';
                paginationElement.appendChild(ellipsis);
            }
        }
        
        // Pulsante pagina successiva
        if (currentPage < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.className = 'px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors';
            nextButton.textContent = 'Successiva';
            nextButton.onclick = () => {
                currentPage++;
                updateTabContent(tabName);
            };
            paginationElement.appendChild(nextButton);
        }
        
        container.appendChild(paginationElement);
    }
}

// Funzione per offrire una carta per lo scambio
function offerForTrade(cardId) {
    window.location.href = `scambi.html?card=${cardId}`;
}

// Funzione per mostrare errori
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;
    
    // Carica i dati dell'utente
    await loadUserData();
    
    // Imposta gli event listener per i pulsanti delle tab
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabName = e.target.getAttribute('data-tab');
            if (tabName) {
                showTab(tabName);
            }
        });
    });
    
    // Mostra la tab "collected" di default
    showTab('collected');
}); 