// Stato globale dell'applicazione
const AppState = {
    // Dati dell'utente
    user: {
        credits: 50,
        totalPacks: 15,
        totalCards: 75,
        uniqueCards: 63,
        duplicateCards: 12,
        activeTrades: 3
    },

    // Album dell'utente
    album: {
        cards: new Set(), // Set per gestire automaticamente i doppioni
        duplicates: {} // Oggetto per tenere traccia dei doppioni
    },

    // Pacchetti dell'utente
    packs: [],

    // Funzione per aggiornare i crediti
    updateCredits(amount) {
        this.user.credits += amount;
        this.saveState();
        this.notifyUpdate('credits');
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
        this.notifyUpdate('album');
    },

    // Funzione per aggiungere un nuovo pacchetto
    addPack(pack) {
        this.packs.unshift(pack);
        this.user.totalPacks++;
        
        if (pack.opened) {
            this.addCardsToAlbum(pack.cards);
        }

        this.saveState();
        this.notifyUpdate('packs');
    },

    // Funzione per aprire un pacchetto esistente
    openPack(packId) {
        const pack = this.packs.find(p => p.id === packId);
        if (pack && !pack.opened) {
            pack.opened = true;
            pack.openedDate = new Date().toISOString().split('T')[0];
            this.addCardsToAlbum(pack.cards);
            this.saveState();
            this.notifyUpdate('packs');
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

    // Funzione per caricare lo stato dal localStorage
    loadState() {
        const savedState = localStorage.getItem('appState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.user = state.user;
            this.album.cards = new Set(state.album.cards);
            this.album.duplicates = state.album.duplicates;
            this.packs = state.packs;
        }
    },

    // Sistema di notifiche per aggiornamenti
    listeners: {},
    
    // Registra una callback per gli aggiornamenti
    subscribe(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },

    // Notifica tutti i listener di un aggiornamento
    notifyUpdate(event) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback());
        }
    }
};

// Carica lo stato all'avvio
AppState.loadState(); 