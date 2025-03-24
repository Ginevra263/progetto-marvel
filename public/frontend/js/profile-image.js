// Gestione centralizzata dell'immagine del profilo di default 
const ProfileImage = {
    defaultImage: 'https://firebasestorage.googleapis.com/v0/b/marvel-album.appspot.com/o/marvel%2Fuser%2Fdefault-avatar.png?alt=media',

    // Aggiorna l'immagine del profilo in tutte le pagine
    updateProfileImage: function(imageUrl) {
        const userMenuImages = document.querySelectorAll('#user-menu-image');
        const profileImagePreviews = document.querySelectorAll('#profile-image-preview');
        const imageToUse = imageUrl || this.defaultImage;

        // Aggiorna tutte le istanze dell'immagine del profilo nel menu utente
        userMenuImages.forEach(img => {
            img.src = imageToUse;
        });

        // Aggiorna tutte le istanze dell'immagine del profilo nelle anteprime
        profileImagePreviews.forEach(img => {
            img.src = imageToUse;
        });

        // Salva l'URL dell'immagine in localStorage per persistenza
        localStorage.setItem('userProfileImage', imageToUse);
    },

    // Carica l'immagine del profilo dal server
    loadProfileImage: async function() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                this.updateProfileImage(this.defaultImage);
                return;
            }

            const response = await fetch('http://localhost:3000/api/user/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success && data.user.profile_image) {
                this.updateProfileImage(data.user.profile_image);
            } else {
                this.updateProfileImage(this.defaultImage);
            }
        } catch (error) {
            console.error('Errore nel caricamento dell\'immagine del profilo:', error);
            this.updateProfileImage(this.defaultImage);
        }
    },

    // Inizializza il modulo
    init: function() {
        // Carica l'immagine salvata in localStorage o usa quella predefinita
        const savedImage = localStorage.getItem('userProfileImage');
        if (savedImage) {
            this.updateProfileImage(savedImage);
        } else {
            this.loadProfileImage();
        }

        // Aggiorna l'immagine quando la pagina viene caricata
        document.addEventListener('DOMContentLoaded', () => {
            this.loadProfileImage();
        });
    }
};

// Inizializza il modulo
ProfileImage.init(); 