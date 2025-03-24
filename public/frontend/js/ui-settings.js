// Oggetto per gestire le impostazioni dell'interfaccia
if (typeof UISettings === 'undefined') {
    const UISettings = {
        // Chiavi per il localStorage
        keys: {
            theme: 'ui_theme',
            creditsBgColor: 'ui_credits_bg_color',
            profileSettings: 'ui_profile_settings'
        },

        // Impostazioni di default
        defaults: {
            theme: 'light',
            creditsBgColor: 'bg-primary-100 dark:bg-primary-900',
            profileSettings: {
                avatarSize: 'h-32 w-32'
            }
        },

        // Salva un'impostazione
        save: function(key, value) {
            if (this.keys[key]) {
                localStorage.setItem(this.keys[key], JSON.stringify(value));
            }
        },

        // Recupera un'impostazione
        get: function(key) {
            if (this.keys[key]) {
                const value = localStorage.getItem(this.keys[key]);
                return value ? JSON.parse(value) : this.defaults[key];
            }
            return null;
        },

        // Inizializza le impostazioni
        init: function() {
            // Inizializza il tema
            const theme = this.get('theme');
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            // Inizializza il colore dei crediti
            const creditsBgColor = this.get('creditsBgColor');
            const creditsElements = document.querySelectorAll('#credits-button');
            creditsElements.forEach(element => {
                // Rimuovi tutte le classi bg esistenti
                element.className = element.className.replace(/bg-\S+/g, '');
                // Aggiungi la classe bg salvata
                element.classList.add(...creditsBgColor.split(' '));
            });

            // Inizializza le impostazioni del profilo
            const profileSettings = this.get('profileSettings');
            if (profileSettings) {
                const avatarPreview = document.getElementById('profile-image-preview');
                if (avatarPreview) {
                    avatarPreview.className = avatarPreview.className.replace(/[hw]-\d+/g, '');
                    avatarPreview.classList.add(...profileSettings.avatarSize.split(' '));
                }
            }
        }
    };

    // Esegui l'inizializzazione quando il DOM è caricato
    document.addEventListener('DOMContentLoaded', () => UISettings.init());

    // Funzione per cambiare il tema
    function toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            document.documentElement.classList.remove('dark');
            UISettings.save('theme', 'light');
        } else {
            document.documentElement.classList.add('dark');
            UISettings.save('theme', 'dark');
        }
    }
} 