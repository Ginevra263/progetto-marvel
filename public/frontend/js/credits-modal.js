 // Funzione per acquistare crediti
async function buyCredits(amount) {
    try {
        const response = await fetch('/api/credits/buy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ amount })
        });
        const data = await response.json();
        if (data.success) {
            // Aggiorna i crediti nell'AppState
            AppState.updateCredits(data.newCredits);
            // Registra la transazione
            AppState.addCreditTransaction(amount, `Acquisto ${amount} crediti`);
            
            alert(`Hai acquistato ${amount} crediti con successo!`);
        }
    } catch (error) {
        alert('Errore nell\'acquisto dei crediti');
    }
}

// Funzione per gestire il modal dei crediti
function setupCreditsModal() {
    const creditsButton = document.getElementById('credits-button');
    const creditsModal = document.getElementById('credits-modal');
    const closeCreditsModal = document.getElementById('close-credits-modal');
    const buyCreditsBtn = document.getElementById('buy-credits-btn');
    const modalCredits = document.getElementById('modal-credits');
    const creditsHistory = document.getElementById('credits-history');

    if (!creditsButton || !creditsModal) return;

    // Apri il modal quando si clicca sui crediti
    creditsButton.addEventListener('click', () => {
        creditsModal.classList.remove('hidden');
        updateCreditsModal();
    });

    // Chiudi il modal quando si clicca sul pulsante chiudi
    if (closeCreditsModal) {
        closeCreditsModal.addEventListener('click', () => {
            creditsModal.classList.add('hidden');
        });
    }

    // Chiudi il modal quando si clicca fuori
    creditsModal.addEventListener('click', (e) => {
        if (e.target === creditsModal) {
            creditsModal.classList.add('hidden');
        }
    });

    // Gestisci l'acquisto di crediti
    if (buyCreditsBtn) {
        buyCreditsBtn.addEventListener('click', () => {
            const amount = 5; // Default amount
            buyCredits(amount);
            creditsModal.classList.add('hidden');
        });
    }

    // Funzione per aggiornare il contenuto del modal
    function updateCreditsModal() {
        // Aggiorna il numero di crediti nel modal
        if (modalCredits) {
            modalCredits.textContent = AppState.user.credits;
        }

        // Recupera lo storico delle transazioni
        const transactions = AppState.user.creditTransactions || [];
        
        // Aggiorna lo storico nel modal
        if (creditsHistory) {
            creditsHistory.innerHTML = transactions.length > 0 
                ? transactions.map(transaction => `
                    <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <p class="text-sm text-gray-900 dark:text-white">${transaction.description}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">${new Date(transaction.date).toLocaleDateString('it-IT')}</p>
                        </div>
                        <span class="text-sm ${transaction.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                            ${transaction.amount > 0 ? '+' : ''}${transaction.amount}
                        </span>
                    </div>
                `).join('')
                : '<p class="text-sm text-gray-500 dark:text-gray-400">Nessuna transazione trovata</p>';
        }
    }
}

// Inizializza il modal dei crediti quando il documento è pronto
document.addEventListener('DOMContentLoaded', () => {
    setupCreditsModal();
});