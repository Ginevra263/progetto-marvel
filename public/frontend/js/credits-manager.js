// Funzione per aggiornare il display dei crediti e del portafoglio
function updateCreditsDisplay() {
    // Assicuriamoci che AppState sia definito
    if (typeof AppState !== 'undefined') {
        const credits = AppState.getCredits();
        const virtualMoney = AppState.getVirtualMoney();
        
        // Aggiorna gli elementi UI solo se esistono
        const userCreditsElement = document.getElementById('user-credits');
        const modalCreditsElement = document.getElementById('modal-credits');
        const virtualMoneyElement = document.getElementById('virtual-money');
        const purchaseVirtualMoneyElement = document.getElementById('purchase-virtual-money');
        
        if (userCreditsElement) userCreditsElement.textContent = credits;
        if (modalCreditsElement) modalCreditsElement.textContent = credits;
        if (virtualMoneyElement) virtualMoneyElement.textContent = `€${virtualMoney}`;
        if (purchaseVirtualMoneyElement) purchaseVirtualMoneyElement.textContent = virtualMoney;
    } else {
        console.error('AppState non è definito. Verifica che state.js sia caricato prima di credits-manager.js');
    }
}

// Funzione per l'acquisto dei crediti
function buyCredits(amount, cost) {
    if (typeof AppState !== 'undefined' && AppState.buyCredits(amount, cost)) {
        updateCreditsDisplay();
        updateTransactionHistory();
        showNotification('Acquisto completato', `Hai acquistato ${amount} crediti per €${cost}`);
        closePurchaseModal();
        return true;
    } else {
        showNotification('Acquisto fallito', 'Non hai abbastanza soldi nel portafoglio o AppState non è definito', 'error');
        return false;
    }
}

// Funzione per mostrare una notifica
function showNotification(title, message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white max-w-sm z-50`;
    notification.innerHTML = `
        <h4 class="font-bold">${title}</h4>
        <p class="text-sm">${message}</p>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Funzione per aggiornare lo storico delle transazioni
function updateTransactionHistory() {
    const historyContainer = document.getElementById('credits-history');
    if (!historyContainer) return;
    
    if (typeof AppState === 'undefined') {
        console.error('AppState non è definito. Verifica che state.js sia caricato prima di credits-manager.js');
        return;
    }
    
    const transactions = AppState.creditTransactions || [];
    
    historyContainer.innerHTML = transactions.length ? '' : '<p class="text-gray-500 dark:text-gray-400 text-sm">Nessuna transazione</p>';
    
    transactions.forEach(transaction => {
        const date = new Date(transaction.timestamp);
        const formattedDate = date.toLocaleDateString('it-IT', { 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const transactionEl = document.createElement('div');
        transactionEl.className = 'p-2 border-b border-gray-200 dark:border-gray-700 last:border-0';
        transactionEl.innerHTML = `
            <div class="flex justify-between items-center">
                <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                        ${transaction.type === 'purchase' ? 'Acquisto' : 'Utilizzo'} crediti
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${formattedDate}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm font-medium ${transaction.type === 'purchase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                        ${transaction.type === 'purchase' ? '+' : '-'}${transaction.amount} crediti
                    </p>
                    ${transaction.cost ? `<p class="text-xs text-gray-500 dark:text-gray-400">€${transaction.cost}</p>` : ''}
                </div>
            </div>
        `;
        historyContainer.appendChild(transactionEl);
    });
}

// Funzione per aprire il modal di acquisto crediti
function openPurchaseModal() {
    const purchaseModal = document.getElementById('purchase-modal');
    const creditsModal = document.getElementById('credits-modal');
    
    if (creditsModal) creditsModal.classList.add('hidden');
    if (purchaseModal) purchaseModal.classList.remove('hidden');
    
    // Aggiorna il saldo del portafoglio
    updateCreditsDisplay();
    
    // Resetta la selezione
    selectedAmount = 0;
    selectedCost = 0;
    updateSelection();
    
    // Disabilita il pulsante di conferma
    const confirmButton = document.getElementById('confirm-purchase');
    if (confirmButton) confirmButton.disabled = true;
    
    // Rimuovi la selezione da tutte le opzioni
    const options = document.querySelectorAll('.purchase-option');
    options.forEach(option => {
        option.classList.remove('border-primary-500', 'dark:border-primary-500', 'border-2');
    });
}

// Funzione per chiudere il modal di acquisto crediti
function closePurchaseModal() {
    const purchaseModal = document.getElementById('purchase-modal');
    if (purchaseModal) purchaseModal.classList.add('hidden');
}

// Variabili globali per tenere traccia della selezione
let selectedAmount = 0;
let selectedCost = 0;

// Funzione per aggiornare la visualizzazione della selezione
function updateSelection() {
    const amountElement = document.getElementById('selected-amount');
    const costElement = document.getElementById('selected-cost');
    const confirmButton = document.getElementById('confirm-purchase');
    
    if (amountElement) amountElement.textContent = selectedAmount;
    if (costElement) costElement.textContent = selectedCost;
    
    // Abilita o disabilita il pulsante di conferma in base alla selezione
    if (confirmButton) {
        if (selectedAmount > 0 && typeof AppState !== 'undefined' && AppState.getVirtualMoney() >= selectedCost) {
            confirmButton.disabled = false;
        } else {
            confirmButton.disabled = true;
        }
    }
}

// Inizializza quando il documento è caricato
document.addEventListener('DOMContentLoaded', () => {
    // Verifica che AppState sia definito
    if (typeof AppState !== 'undefined') {
        // Inizializza il display dei crediti e il portafoglio
        updateCreditsDisplay();
        updateTransactionHistory();
        
        // Aggiorna il display quando lo stato cambia
        AppState.subscribe(() => {
            updateCreditsDisplay();
            updateTransactionHistory();
        });
        
        // Gestione del pulsante per aprire il modal di acquisto crediti
        const openPurchaseBtn = document.getElementById('open-purchase-btn');
        if (openPurchaseBtn) {
            openPurchaseBtn.addEventListener('click', openPurchaseModal);
        }
        
        // Gestione dei pulsanti per chiudere il modal di acquisto crediti
        const closePurchaseBtn = document.getElementById('close-purchase-modal');
        const cancelPurchaseBtn = document.getElementById('cancel-purchase');
        
        if (closePurchaseBtn) {
            closePurchaseBtn.addEventListener('click', closePurchaseModal);
        }
        
        if (cancelPurchaseBtn) {
            cancelPurchaseBtn.addEventListener('click', closePurchaseModal);
        }
        
        // Gestione delle opzioni di acquisto
        const purchaseOptions = document.querySelectorAll('.purchase-option');
        purchaseOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Rimuovi la selezione da tutte le opzioni
                purchaseOptions.forEach(opt => {
                    opt.classList.remove('border-primary-500', 'dark:border-primary-500', 'border-2');
                });
                
                // Aggiungi la selezione all'opzione cliccata
                option.classList.add('border-primary-500', 'dark:border-primary-500', 'border-2');
                
                // Aggiorna i valori selezionati
                selectedAmount = parseInt(option.dataset.amount, 10);
                selectedCost = parseInt(option.dataset.cost, 10);
                
                // Aggiorna la visualizzazione
                updateSelection();
            });
        });
        
        // Gestione del pulsante di conferma acquisto
        const confirmPurchaseBtn = document.getElementById('confirm-purchase');
        if (confirmPurchaseBtn) {
            confirmPurchaseBtn.addEventListener('click', () => {
                if (selectedAmount > 0 && selectedCost > 0) {
                    buyCredits(selectedAmount, selectedCost);
                }
            });
        }
    } else {
        console.error('AppState non è definito. Verifica che state.js sia caricato prima di credits-manager.js');
    }
    
    // Gestione della chiusura del modal dei crediti
    const creditsModal = document.getElementById('credits-modal');
    const closeCreditsModalButton = document.getElementById('close-credits-modal');
    
    if (closeCreditsModalButton && creditsModal) {
        closeCreditsModalButton.addEventListener('click', () => {
            creditsModal.classList.add('hidden');
        });
    }
    
    // Gestione dell'apertura del modal dei crediti
    const creditsButton = document.getElementById('credits-button');
    if (creditsButton && creditsModal) {
        creditsButton.addEventListener('click', () => {
            creditsModal.classList.remove('hidden');
            updateCreditsDisplay();
            updateTransactionHistory();
        });
    }
});