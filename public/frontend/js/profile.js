document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profile-form');
    const profileImage = document.getElementById('profile-image');
    const profileImagePreview = document.getElementById('profile-image-preview');
    
    // Carica i dati dell'utente
    loadUserProfile();

    // Gestione dell'upload dell'immagine
    profileImage.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validazione del file
            if (!file.type.startsWith('image/')) {
                showError('Per favore seleziona un\'immagine valida');
                profileImage.value = '';
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showError('L\'immagine non può superare i 5MB');
                profileImage.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                profileImagePreview.src = e.target.result;
            };
            reader.onerror = () => {
                showError('Errore nella lettura del file');
                profileImage.value = '';
            };
            reader.readAsDataURL(file);
        }
    });

    // Gestione del form
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validazione dei campi
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // Controlli di validazione
        if (!username) {
            showError('Il nome utente è obbligatorio');
            return;
        }
        if (!email) {
            showError('L\'email è obbligatoria');
            return;
        }
        if (!email.includes('@')) {
            showError('Inserisci un\'email valida');
            return;
        }

        // Controllo password
        if (newPassword || confirmPassword) {
            if (!currentPassword) {
                showError('Inserisci la password attuale per cambiarla');
                return;
            }
            if (newPassword !== confirmPassword) {
                showError('Le password non coincidono');
                return;
            }
            if (newPassword.length < 6) {
                showError('La nuova password deve essere di almeno 6 caratteri');
                return;
            }
        }

        try {
            // Mostra indicatore di caricamento
            showLoading();

            // Prepara i dati da inviare
            const userData = {
                username,
                email
            };

            // Aggiungi le password se necessario
            if (newPassword) {
                userData.currentPassword = currentPassword;
                userData.newPassword = newPassword;
            }

            // Prima salva i dati del profilo
            const profileResponse = await fetch('http://localhost:3000/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(userData)
            });

            const profileData = await profileResponse.json();
            if (!profileData.success) {
                throw new Error(profileData.message || 'Errore durante l\'aggiornamento del profilo');
            }

            // Se c'è un'immagine da caricare, fallo separatamente
            if (profileImage.files[0]) {
                const formData = new FormData();
                formData.append('profile_image', profileImage.files[0]);

                const imageResponse = await fetch('http://localhost:3000/api/user/profile/image', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: formData
                });

                const imageData = await imageResponse.json();
                if (!imageData.success) {
                    throw new Error(imageData.message || 'Errore durante il caricamento dell\'immagine');
                }

                // Aggiorna l'anteprima dell'immagine con l'URL restituito
                profileImagePreview.src = imageData.profile_image;
                
                // Aggiorna l'immagine nel menu utente se presente
                const userMenuImage = document.querySelector('#user-menu-button img');
                if (userMenuImage) {
                    userMenuImage.src = imageData.profile_image;
                }
            }

            // Nascondi indicatore di caricamento e mostra successo
            hideLoading();
            showSuccess('Profilo aggiornato con successo');
            
            // Pulisci i campi password
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        } catch (error) {
            console.error('Errore:', error);
            hideLoading();
            showError(error.message || 'Errore di connessione al server');
        }
    });
});

// Funzione per caricare i dati del profilo
async function loadUserProfile() {
    try {
        showLoading();
        const response = await fetch('http://localhost:3000/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        const data = await response.json();
        hideLoading();

        if (data.success) {
            document.getElementById('username').value = data.user.username;
            document.getElementById('email').value = data.user.email;
            if (data.user.profile_image) {
                document.getElementById('profile-image-preview').src = data.user.profile_image;
            }
        } else {
            throw new Error(data.message || 'Errore nel caricamento del profilo');
        }
    } catch (error) {
        hideLoading();
        showError('Errore nel caricamento del profilo');
    }
}

// Funzione per mostrare errori
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Funzione per mostrare successo
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

// Funzione per mostrare l'indicatore di caricamento
function showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-indicator';
    loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loadingDiv.innerHTML = `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center space-x-3">
            <div class="animate-spin rounded-full h-6 w-6 border-4 border-primary-600 border-t-transparent"></div>
            <span class="text-gray-700 dark:text-gray-300">Caricamento in corso...</span>
        </div>
    `;
    document.body.appendChild(loadingDiv);
}

// Funzione per nascondere l'indicatore di caricamento
function hideLoading() {
    const loadingDiv = document.getElementById('loading-indicator');
    if (loadingDiv) {
        loadingDiv.remove();
    }
} 