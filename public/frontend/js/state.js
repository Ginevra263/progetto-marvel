// AppState - Gestione centralizzata dello stato dell'applicazione
class AppStateManager {
    constructor() {
        this.credits = 0;
        this.virtualMoney = 100; // Portafoglio virtuale iniziale
        this.creditTransactions = [];
        this.user = {
            totalPacks: 0,
            totalCards: 0,
            duplicateCards: 0,
            activeTrades: 0,
            credits: 0
        };
        
        // Album dell'utente
        this.album = {
            cards: new Set(), // Set per gestire automaticamente i doppioni
            duplicates: {} // Oggetto per tenere traccia dei doppioni
        };

        // Pacchetti dell'utente
        this.packs = [];
        this.lastPackOpening = null;
        
        // Subscribers per eventi specifici
        this._subscribers = {
            credits: [],
            packs: [],
            album: [],
            lastPackOpening: []
        };
        
        // Subscribers generici
        this.subscribers = [];
        
        this.loadState();
    }

    // Metodo per aggiornare i crediti
    updateCredits(newCredits) {
        this.credits = newCredits;
        this.user.credits = newCredits; // Aggiorna anche credits nell'oggetto user
        // Salva nel localStorage per persistenza tra pagine
        localStorage.setItem('userCredits', newCredits);
        // Notifica i subscribers
        this._notifySubscribers('credits');
    }

    // Metodo per ottenere i crediti
    getCredits() {
        return this.credits;
    }

    // Metodo per ottenere il portafoglio virtuale
    getVirtualMoney() {
        return this.virtualMoney;
    }

    // Metodo per aggiungere una transazione
    addCreditTransaction(amount, description) {
        const transaction = {
            date: new Date().toISOString(),
            amount: amount,
            description: description,
            type: amount > 0 ? 'purchase' : 'usage',
            timestamp: new Date().toISOString()
        };
        
        // Aggiungi la transazione all'inizio dell'array
        this.creditTransactions.unshift(transaction);
        
        // Limita lo storico a 20 transazioni
        if (this.creditTransactions.length > 20) {
            this.creditTransactions = this.creditTransactions.slice(0, 20);
        }
        
        // Salva nel localStorage
        localStorage.setItem('creditTransactions', JSON.stringify(this.creditTransactions));
        
        // Notifica i subscribers
        this._notifySubscribers('credits');
    }

    // Metodo per registrare un'apertura di pacchetto
    recordPackOpening(cards, packType = 'Standard') {
        // Aggiorna i crediti (sottrae un credito)
        this.updateCredits(this.credits - 1);
        
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
    }

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
    }

    // Metodo per acquistare crediti
    buyCredits(amount, cost) {
        if (this.virtualMoney >= cost) {
            this.virtualMoney -= cost;
            this.credits += amount;
            this.user.credits = this.credits; // Aggiorna anche credits nell'oggetto user
            
            // Aggiungi la transazione
            const transaction = {
                type: 'purchase',
                amount: amount,
                cost: cost,
                timestamp: new Date().toISOString()
            };
            this.creditTransactions.unshift(transaction);
            
            this.saveState();
            this.notifySubscribers();
            return true;
        }
        return false;
    }

    // Metodo per sottoscriversi a un evento specifico
    subscribeToEvent(event, callback) {
        if (this._subscribers[event]) {
            this._subscribers[event].push(callback);
        }
    }

    // Metodo generico per sottoscriversi a tutti gli eventi
    subscribe(callback) {
        this.subscribers.push(callback);
    }

    // Metodo per annullare la sottoscrizione
    unsubscribeFromEvent(event, callback) {
        if (this._subscribers[event]) {
            this._subscribers[event] = this._subscribers[event].filter(cb => cb !== callback);
        }
    }

    // Metodo per notificare i subscribers generici
    notifySubscribers() {
        if (this.subscribers) {
            this.subscribers.forEach(callback => callback());
        }
    }

    // Metodo privato per notificare i subscribers per evento specifico
    _notifySubscribers(event) {
        if (this._subscribers[event]) {
            this._subscribers[event].forEach(callback => callback());
        }
    }

    // Funzione per salvare lo stato nel localStorage
    saveState() {
        const state = {
            credits: this.credits,
            virtualMoney: this.virtualMoney,
            creditTransactions: this.creditTransactions,
            user: this.user,
            album: {
                cards: Array.from(this.album.cards),
                duplicates: this.album.duplicates
            },
            packs: this.packs,
            lastPackOpening: this.lastPackOpening
        };
        localStorage.setItem('appState', JSON.stringify(state));
    }

    // Metodo per caricare lo stato dal localStorage
    loadState() {
        const savedState = localStorage.getItem('appState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                this.credits = state.credits || 0;
                this.virtualMoney = state.virtualMoney !== undefined ? state.virtualMoney : 100;
                this.creditTransactions = state.creditTransactions || [];
                
                if (state.user) {
                    this.user = state.user;
                }
                
                if (state.album) {
                    this.album.cards = new Set(state.album.cards || []);
                    this.album.duplicates = state.album.duplicates || {};
                }
                
                if (state.packs) {
                    this.packs = state.packs;
                }
                
                if (state.lastPackOpening) {
                    this.lastPackOpening = state.lastPackOpening;
                }
            } catch (e) {
                console.error('Errore nel parsing dello stato:', e);
            }
        }
        
        // Carica anche i crediti dal localStorage (retrocompatibilità)
        const savedCredits = localStorage.getItem('userCredits');
        if (savedCredits !== null) {
            try {
                const parsedCredits = parseInt(savedCredits, 10);
                this.credits = parsedCredits;
                this.user.credits = parsedCredits; // Aggiorna anche credits nell'oggetto user
            } catch (e) {
                console.error('Errore nel parsing dei crediti:', e);
            }
        }
    }
}

// Crea l'istanza globale di AppState
const AppState = new AppStateManager();

// Rendi disponibile globalmente
window.AppState = AppState;

// Verifica che i metodi siano disponibili
console.log('AppState inizializzato:');
console.log('getCredits è definito:', typeof AppState.getCredits === 'function');
console.log('getVirtualMoney è definito:', typeof AppState.getVirtualMoney === 'function');
console.log('updateCredits è definito:', typeof AppState.updateCredits === 'function'); 