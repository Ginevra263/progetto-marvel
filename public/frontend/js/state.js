// AppState - Gestione centralizzata dello stato dell'applicazione
const AppState = {
    // Stato iniziale
    user: {
        credits: 10, // Inizia con 10 crediti
        totalPacks: 0,
        totalCards: 0,
        duplicateCards: 0,
        activeTrades: 0,
        creditTransactions: [] // Storico delle transazioni
    },

    // Album dell'utente
    album: {
        cards: new Set(), // Set per gestire automaticamente i doppioni
        duplicates: {} // Oggetto per tenere traccia dei doppioni
    },

    // Pacchetti dell'utente
    packs: [],

    lastPackOpening: null,

    // Subscribers per eventi specifici
    _subscribers: {
        credits: [],
        packs: [],
        album: [],
        lastPackOpening: []
    },

    // Metodo per aggiornare i crediti
    updateCredits(newCredits) {
        this.user.credits = newCredits;
        // Salva nel localStorage per persistenza tra pagine
        localStorage.setItem('userCredits', newCredits);
        // Notifica i subscribers
        this._notifySubscribers('credits');
    },

    // Metodo per aggiungere una transazione
    addCreditTransaction(amount, description) {
        const transaction = {
            date: new Date().toISOString(),
            amount: amount,
            description: description
        };
        
        // Aggiungi la transazione all'inizio dell'array
        this.user.creditTransactions.unshift(transaction);
        
        // Limita lo storico a 20 transazioni
        if (this.user.creditTransactions.length > 20) {
            this.user.creditTransactions = this.user.creditTransactions.slice(0, 20);
        }
        
        // Salva nel localStorage
        localStorage.setItem('creditTransactions', JSON.stringify(this.user.creditTransactions));
        
        // Notifica i subscribers
        this._notifySubscribers('credits');
    },

    // Metodo per registrare un'apertura di pacchetto
    recordPackOpening(cards, packType = 'Standard') {
        // Aggiorna i crediti (sottrae un credito)
        this.updateCredits(this.user.credits - 1);
        
        // Registra la transazione
        this.addCreditTransaction(-1, 'Apertura pacchetto figurine');
        
        // Aggiorna il contatore dei pacchetti
        this.user.totalPacks++;
        localStorage.setItem('totalPacks', this.user.totalPacks);
        
        // Registra l'apertura del pacchetto
        this.lastPackOpening = {
            timestamp: new Date().toISOString(),
            cards: cards,
            packType: packType
        };
        
        // Salva nel localStorage
        localStorage.setItem('lastPackOpening', JSON.stringify(this.lastPackOpening));
        
        // Notifica i subscribers
        this._notifySubscribers('packs');
        this._notifySubscribers('lastPackOpening');
    },

    // Funzione per aggiungere carte all'album
    addCardsToAlbum(cards) {
        cards.forEach(card => {
            if (this.album.cards.has(card)) {
                // Se la carta esiste già, incrementa il contatore dei doppioni
                this.album.duplicates[card] = (this.album.duplicates[card] || 0) + 1;
            } else {
                // Altrimenti aggiungila all'album
                this.album.cards.add(card);
            }
        });

        // Aggiorna le statistiche
        this.user.uniqueCards = this.album.cards.size;
        this.user.duplicateCards = Object.values(this.album.duplicates).reduce((a, b) => a + b, 0);
        this.user.totalCards = this.user.uniqueCards + this.user.duplicateCards;

        this.saveState();
        this._notifySubscribers('album');
    },

    // Funzione per aggiungere un nuovo pacchetto
    addPack(pack) {
        this.packs.unshift(pack);
        this.user.totalPacks++;
        
        if (pack.opened) {
            this.addCardsToAlbum(pack.cards);
        }

        this.saveState();
        this._notifySubscribers('packs');
    },

    // Funzione per aprire un pacchetto esistente
    openPack(packId) {
        const pack = this.packs.find(p => p.id === packId);
        if (pack && !pack.opened) {
            pack.opened = true;
            pack.openedDate = new Date().toISOString().split('T')[0];
            this.addCardsToAlbum(pack.cards);
            this.saveState();
            this._notifySubscribers('packs');
        }
    },

    // Funzione per salvare lo stato nel localStorage
    saveState() {
        const state = {
            user: this.user,
            album: {
                cards: Array.from(this.album.cards),
                duplicates: this.album.duplicates
            },
            packs: this.packs
        };
        localStorage.setItem('appState', JSON.stringify(state));
    },

    // Metodo per sottoscriversi a un evento
    subscribe(event, callback) {
        if (this._subscribers[event]) {
            this._subscribers[event].push(callback);
        }
    },

    // Metodo per annullare la sottoscrizione
    unsubscribe(event, callback) {
        if (this._subscribers[event]) {
            this._subscribers[event] = this._subscribers[event].filter(cb => cb !== callback);
        }
    },

    // Metodo privato per notificare i subscribers
    _notifySubscribers(event) {
        if (this._subscribers[event]) {
            this._subscribers[event].forEach(callback => callback());
        }
    },

    // Metodo per inizializzare lo stato dal localStorage
    init() {
        // Carica i crediti dal localStorage
        const savedCredits = localStorage.getItem('userCredits');
        if (savedCredits !== null) {
            this.user.credits = parseInt(savedCredits, 10);
        }
        
        // Carica le transazioni dal localStorage
        const savedTransactions = localStorage.getItem('creditTransactions');
        if (savedTransactions) {
            this.user.creditTransactions = JSON.parse(savedTransactions);
        }
        
        // Carica il contatore dei pacchetti
        const savedTotalPacks = localStorage.getItem('totalPacks');
        if (savedTotalPacks !== null) {
            this.user.totalPacks = parseInt(savedTotalPacks, 10);
        }
        
        // Carica l'ultimo pacchetto aperto
        const savedLastPackOpening = localStorage.getItem('lastPackOpening');
        if (savedLastPackOpening) {
            this.lastPackOpening = JSON.parse(savedLastPackOpening);
        }
    }
};

// Inizializza lo stato
document.addEventListener('DOMContentLoaded', () => {
    AppState.init();
    
    // Aggiorna tutti gli elementi UI che mostrano i crediti
    const creditElements = document.querySelectorAll('[id="user-credits"]');
    creditElements.forEach(el => {
        el.textContent = AppState.user.credits;
    });
    
    // Sottoscrizione all'evento credits per aggiornare automaticamente tutti gli elementi
    AppState.subscribe('credits', () => {
        const creditElements = document.querySelectorAll('[id="user-credits"]');
        creditElements.forEach(el => {
            el.textContent = AppState.user.credits;
        });
    });
});

// Esporta AppState
window.AppState = AppState; 