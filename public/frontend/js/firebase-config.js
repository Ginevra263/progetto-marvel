// Importa le funzioni necessarie da Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Configurazione Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDxXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqX",
    authDomain: "marvel-1c0c1.firebaseapp.com",
    projectId: "marvel-1c0c1",
    storageBucket: "marvel-1c0c1.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);

// Funzione per testare la connessione a Firebase Storage
async function testStorage() {
    try {
        console.log('Verifica connessione Firebase Storage...');
        
        // Crea un riferimento con un timestamp per evitare problemi di cache
        const timestamp = new Date().getTime();
        const testRef = ref(storage, `test/test_${timestamp}.txt`);
        
        // Crea un blob con metadati personalizzati
        const testBlob = new Blob(['test'], { type: 'text/plain' });
        const metadata = {
            contentType: 'text/plain',
            customMetadata: {
                'origin': window.location.origin
            }
        };

        console.log('Tentativo di upload...');
        await uploadBytes(testRef, testBlob, metadata);
        console.log('Upload completato');

        // Prova a ottenere l'URL del file
        const downloadURL = await getDownloadURL(testRef);
        console.log('URL di download ottenuto:', downloadURL);

        // Elimina il file di test
        await deleteObject(testRef);
        console.log('File di test eliminato');
        
        console.log('Firebase Storage configurato correttamente');
        return true;
    } catch (error) {
        console.error('Errore nella configurazione di Firebase Storage:', error);
        
        if (error.code === 'storage/unauthorized') {
            console.error('Errore di autorizzazione. Verifica le regole di sicurezza del bucket Firebase Storage');
            console.error('Origin corrente:', window.location.origin);
        } else if (error.code === 'storage/cors-error') {
            console.error('Errore CORS. Verifica la configurazione CORS di Firebase Storage');
        } else if (error.code === 'storage/quota-exceeded') {
            console.error('Quota di storage superata');
        } else if (error.code === 'storage/invalid-argument') {
            console.error('Argomento non valido:', error.message);
        }
        
        return false;
    }
}

// Esegui il test e gestisci il risultato
testStorage().then(success => {
    if (!success) {
        console.log('Si prega di verificare la configurazione di Firebase nel pannello di controllo');
    }
}).catch(error => {
    console.error('Errore imprevisto durante il test:', error);
});

// Esporta le istanze di Firebase
export { app, storage, auth }; 