// Variabili globali
let allCards = []; // Tutte le carte disponibili (Harry Potter)
let userCards = []; // Carte dell'utente
let currentPage = 1;
const cardsPerPage = 12;
let currentTab = 'collected';

// Arrays per carte possedute, doppie e mancanti
let collectedCards = [];
let duplicateCards = [];
let missingCards = [];

// Elementi DOM
const loadingIndicator = document.getElementById('loading-indicator');
const collectedCardsContainer = document.getElementById('collected-cards');
const duplicatesCardsContainer = document.getElementById('duplicates-cards');
const missingCardsContainer = document.getElementById('missing-cards');
const progressBar = document.getElementById('progress-bar');
const completionPercentage = document.getElementById('completion-percentage');
const uniqueCardsCount = document.getElementById('unique-cards');
const totalAvailableCards = document.getElementById('total-available-cards');
const duplicateCardsCount = document.getElementById('duplicate-cards');

// Funzione per verificare l'autenticazione
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Funzione per mostrare il loader
function showLoader() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
}

// Funzione per nascondere il loader
function hideLoader() {
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

// Funzione per caricare i dati dell'utente e le carte
async function loadUserData() {
    showLoader();
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token non trovato');
            window.location.href = 'login.html';
            return;
        }

        // Recupera i dati dell'utente e le carte
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
            console.log('Dati ricevuti:', data);
            userCards = data.cards;
            // Aggiorna l'interfaccia utente
            document.getElementById('user-credits').textContent = data.credits;
            
            // Carica le carte di Harry Potter e aggiorna la visualizzazione
            await loadHarryPotterCards();
            updateAlbumProgress();
            updateAlbumView();
        }
    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        showError('Errore nel caricamento dei dati utente: ' + error.message);
    } finally {
        hideLoader();
    }
}

// Funzione per caricare le carte di Harry Potter
async function loadHarryPotterCards() {
    try {
        console.log('Iniziando il caricamento delle carte di Harry Potter...');
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('Token non trovato nel localStorage');
            throw new Error('Token non trovato');
        }
        
        const response = await fetch('http://localhost:3000/api/harrypotter/cards', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Risposta ricevuta dall\'API');
        console.log('- Status:', response.status);
        
        if (!response.ok) {
            console.error('Errore nella risposta:', response.status, response.statusText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Dati ricevuti:', data);
        
        if (!data.success || !data.cards) {
            console.error('Dati non validi ricevuti:', data);
            throw new Error('Dati non validi ricevuti dall\'API');
        }
        
        console.log('Elaborazione dei dati delle carte...');
        allCards = data.cards;
        console.log(`${allCards.length} carte caricate con successo`);
        
        return allCards;
    } catch (error) {
        console.error('Errore nel caricamento delle carte di Harry Potter:', error);
        throw error;
    }
}

// Funzione per aggiornare il progresso dell'album
function updateAlbumProgress() {
    updateCardArrays();
    
    const uniqueCards = collectedCards.length;
    const totalCards = allCards.length || 50;
    const percentage = Math.round((uniqueCards / totalCards) * 100);
    const duplicateCount = duplicateCards.length;
    
    progressBar.style.width = `${percentage}%`;
    completionPercentage.textContent = percentage;
    uniqueCardsCount.textContent = uniqueCards;
    totalAvailableCards.textContent = totalCards;
    duplicateCardsCount.textContent = duplicateCount;
}

// Funzione per aggiornare gli array delle carte
function updateCardArrays() {
    // Raggruppa le carte per cardId invece che per id del documento
    const cardGroups = {};
    userCards.forEach(card => {
        const cardId = card.cardId || card.id; // Supporta sia cardId che id per retrocompatibilità
        if (!cardGroups[cardId]) {
            cardGroups[cardId] = {
                id: cardId,
                name: card.name,
                thumbnail: card.thumbnail || card.image, // Supporta sia thumbnail che image
                count: 0,
                cards: [] // Array per tenere traccia di tutte le istanze della carta
            };
        }
        cardGroups[cardId].count++;
        cardGroups[cardId].cards.push(card);
    });

    // Aggiorna gli array
    collectedCards = Object.values(cardGroups).filter(card => card.count === 1);
    duplicateCards = Object.values(cardGroups).filter(card => card.count > 1);
    
    // Aggiorna le carte mancanti
    const userCardIds = new Set(Object.keys(cardGroups));
    missingCards = allCards
        .filter(card => !userCardIds.has(card.id.toString()))
        .map(card => ({
            id: card.id.toString(),
            name: card.name,
            thumbnail: card.image || card.thumbnail, // Supporta entrambi i formati
            count: 0
        }));

    // Log per debug
    console.log('Gruppi di carte:', cardGroups);
    console.log('Carte uniche:', collectedCards.length);
    console.log('Carte doppie:', duplicateCards.length);
    console.log('Carte mancanti:', missingCards.length);
}

// Funzione per aggiornare la visualizzazione dell'album
function updateAlbumView() {
    // Mostra la tab corrente
    showTab(currentTab);
}

// Funzione per mostrare una tab specifica
function showTab(tabName) {
    currentTab = tabName;
    
    // Nascondi tutte le tab
    document.getElementById('collected-cards').style.display = 'none';
    document.getElementById('duplicates-cards').style.display = 'none';
    document.getElementById('missing-cards').style.display = 'none';
    
    // Mostra la tab selezionata
    const selectedContainer = document.getElementById(`${tabName}-cards`);
    selectedContainer.style.display = 'grid';
    
    // Aggiorna lo stile dei pulsanti
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => {
        const isSelected = button.textContent.toLowerCase().includes(tabName);
        button.classList.toggle('border-primary-600', isSelected);
        button.classList.toggle('text-primary-600', isSelected);
        button.classList.toggle('dark:text-primary-400', isSelected);
        button.classList.toggle('border-transparent', !isSelected);
        button.classList.toggle('text-gray-500', !isSelected);
        button.classList.toggle('dark:text-gray-400', !isSelected);
    });
    
    // Aggiorna il contenuto della tab
    updateTabContent(tabName);
}

// Funzione per aggiornare il contenuto di una tab
function updateTabContent(tabName) {
    const container = document.getElementById(`${tabName}-cards`);
    if (!container) return;
    
    // Rimuovi il loader se presente
    const existingLoader = container.querySelector('#loading-indicator');
    if (existingLoader) {
        existingLoader.remove();
    }
    
    // Determina quali carte mostrare
    let cardsToShow = [];
    switch (tabName) {
        case 'collected':
            cardsToShow = collectedCards;
            break;
        case 'duplicates':
            cardsToShow = duplicateCards;
            break;
        case 'missing':
            cardsToShow = missingCards;
            break;
    }
    
    // Se non ci sono carte da mostrare
    if (cardsToShow.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-gray-500 dark:text-gray-400">
                    ${tabName === 'collected' ? 'Non hai ancora carte uniche nella tua collezione.' :
                      tabName === 'duplicates' ? 'Non hai ancora carte doppie.' :
                      'Complimenti! Hai completato la collezione!'}
                </p>
                ${tabName !== 'duplicates' ? `
                    <a href="pacchetti.html" class="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                        Apri un Nuovo Pacchetto
                    </a>
                ` : ''}
            </div>
        `;
        return;
    }
    
    // Renderizza le carte
    container.innerHTML = '';
    cardsToShow.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'bg-white dark:bg-gray-700 rounded-lg shadow overflow-hidden';
        cardElement.innerHTML = `
            <img src="${card.thumbnail}" alt="${card.name}" class="w-full h-48 object-cover">
            <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">${card.name}</h3>
                ${card.count > 1 ? `
                    <p class="text-sm text-primary-600 dark:text-primary-400 mt-1">
                        ${card.count}x copie
                    </p>
                ` : ''}
                ${tabName === 'duplicates' ? `
                    <div class="mt-2 flex flex-wrap gap-2">
                        ${card.cards.slice(1).map((duplicate, index) => `
                            <button onclick="offerForTrade('${duplicate.id}')" class="px-3 py-1 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 transition-colors">
                                Scambia copia ${index + 1}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        container.appendChild(cardElement);
    });

    // Log per debug
    console.log(`Tab ${tabName}:`, cardsToShow.length, 'carte mostrate');
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
    if (checkAuth()) {
        await loadUserData();
    }
}); 