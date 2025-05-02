const HP_API_URL = "https://hp-api.onrender.com/api/characters";

let allCharacters = [];

// Dizionario delle descrizioni in italiano
const italianDescriptions = {
    "Harry Potter": "Il famoso ragazzo che è sopravvissuto a Lord Voldemort, destinato a sconfiggere il signore oscuro.",
    "Hermione Granger": "La brillante strega nata da genitori babbani, migliore amica di Harry e Ron.",
    "Ron Weasley": "Migliore amico di Harry e Hermione, proveniente dalla numerosa famiglia di maghi Weasley.",
    "Draco Malfoy": "Rivale di Harry a Hogwarts, appartenente alla casa Serpeverde e discendente di una famiglia di maghi purosangue.",
    "Minerva McGonagall": "Severa ma giusta professoressa di Trasfigurazione e vice-preside di Hogwarts.",
    "Severus Snape": "Insegnante di Pozioni a Hogwarts con un passato complicato e un ruolo cruciale nella lotta contro Voldemort.",
    "Rubeus Hagrid": "Il mezzo gigante custode delle chiavi e dei terreni di Hogwarts, grande amico di Harry.",
    "Albus Dumbledore": "Il saggio e potente preside di Hogwarts, mentore di Harry Potter.",
    "Sirius Black": "Il padrino di Harry, ingiustamente accusato di tradimento e imprigionato ad Azkaban.",
    "Neville Longbottom": "Compagno di Harry a Grifondoro, inizialmente timido ma destinato a diventare un eroe coraggioso."
};

// Funzione per ottenere una descrizione in italiano
function getItalianDescription(character) {
    // Se esiste una descrizione personalizzata in italiano, usala
    if (italianDescriptions[character.name]) {
        return italianDescriptions[character.name];
    }
    
    // Altrimenti, usa una descrizione generica
    return `Personaggio del mondo magico di Harry Potter. ${character.wizard ? 'Mago/strega' : 'Non-mago'} di specie ${character.species}, ${character.hogwartsStudent ? 'studente a Hogwarts' : (character.hogwartsStaff ? 'membro dello staff di Hogwarts' : '')}.`;
}

// Funzione per creare la card di un personaggio
function createCharacterCard(character) {
    // Controlla se l'immagine esiste
    const hasImage = character.image && character.image.trim() !== "";

    // Usa un'immagine placeholder se l'immagine non è disponibile
    const imageUrl = hasImage
        ? character.image
        : 'https://cdn.pixabay.com/photo/2016/03/31/19/58/avatar-1295429_960_720.png';

    // Determina il colore di sfondo in base alla casa
    let houseColor = "bg-gray-700";
    let houseTextColor = "text-white";
    
    switch(character.house) {
        case "Gryffindor":
            houseColor = "bg-red-700";
            break;
        case "Slytherin":
            houseColor = "bg-green-700";
            break;
        case "Ravenclaw":
            houseColor = "bg-blue-700";
            break;
        case "Hufflepuff":
            houseColor = "bg-yellow-500";
            houseTextColor = "text-black";
            break;
    }

    return `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-transform hover:scale-105">
            <div class="relative group">
                <img src="${imageUrl}" alt="${character.name}" 
                     class="w-full h-64 object-cover transform transition-transform duration-300 group-hover:scale-110"
                     onerror="this.src='https://cdn.pixabay.com/photo/2016/03/31/19/58/avatar-1295429_960_720.png'">
                <div class="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onclick="showCharacterDetails('${character.id}')" 
                            class="px-4 py-2 bg-primary-600 text-white rounded-full transform -translate-y-2 group-hover:translate-y-0 transition-all">
                        Vedi Dettagli
                    </button>
                </div>
                ${character.house ? `<div class="absolute top-0 right-0 ${houseColor} ${houseTextColor} px-2 py-1 text-xs font-bold">${character.house}</div>` : ''}
            </div>
            <div class="p-4">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">${character.name}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-3">
                    ${getItalianDescription(character)}
                </p>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-primary-600 dark:text-primary-400 font-medium">
                        ${character.wizard ? 'Mago/Strega' : 'Non-mago'}
                    </span>
                    <span class="text-gray-500 dark:text-gray-400">
                        ${character.ancestry ? character.ancestry : 'Ancestry sconosciuto'}
                    </span>
                </div>
            </div>
        </div>
    `;
}

// Funzione per mostrare/nascondere il loading
function toggleLoading(show) {
    const loadingElement = document.getElementById('loading');
    const outputElement = document.getElementById('output');
    
    if (show) {
        loadingElement.classList.remove('hidden');
        outputElement.classList.add('hidden');
    } else {
        loadingElement.classList.add('hidden');
        outputElement.classList.remove('hidden');
    }
}

// Funzione per filtrare i personaggi
function filterCharacters(searchTerm) {
    displayCharacters(searchTerm);
}

// Funzione per visualizzare i personaggi
async function displayCharacters(searchTerm = '') {
    toggleLoading(true);

    // Simuliamo un ritardo di caricamento di 1 secondo
    await new Promise(resolve => setTimeout(resolve, 1000));

    const output = document.getElementById('output');
    let filteredCharacters = allCharacters;
    
    if (searchTerm) {
        filteredCharacters = allCharacters.filter(character => 
            character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getItalianDescription(character).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (character.house && character.house.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (character.ancestry && character.ancestry.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }

    if (filteredCharacters.length === 0) {
        output.innerHTML = `
            <div class="col-span-full text-center p-8">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Nessun risultato trovato</h3>
                <p class="text-gray-500 dark:text-gray-400">
                    Non abbiamo trovato nessun personaggio che corrisponda alla tua ricerca "${searchTerm}"
                </p>
            </div>
        `;
    } else {
        output.innerHTML = filteredCharacters.map(character => createCharacterCard(character)).join('');
    }

    toggleLoading(false);
}

// Funzione per mostrare i dettagli di un personaggio
function showCharacterDetails(characterId) {
    const character = allCharacters.find(c => c.id === characterId);
    if (!character) return;

    // Controlla se l'immagine esiste
    const hasImage = character.image && character.image.trim() !== "";

    // Usa un'immagine placeholder se l'immagine non è disponibile
    const imageUrl = hasImage
        ? character.image
        : 'https://cdn.pixabay.com/photo/2016/03/31/19/58/avatar-1295429_960_720.png';

    // Colore della casa
    let houseColorClass = "";
    switch(character.house) {
        case "Gryffindor":
            houseColorClass = "border-red-700";
            break;
        case "Slytherin":
            houseColorClass = "border-green-700";
            break;
        case "Ravenclaw":
            houseColorClass = "border-blue-700";
            break;
        case "Hufflepuff":
            houseColorClass = "border-yellow-500";
            break;
    }

    const wandInfo = character.wand && (character.wand.wood || character.wand.core || character.wand.length) 
        ? `
            <div class="mt-4">
                <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Bacchetta magica</h4>
                <ul class="list-disc list-inside text-gray-600 dark:text-gray-300">
                    ${character.wand.wood ? `<li>Legno: ${character.wand.wood}</li>` : ''}
                    ${character.wand.core ? `<li>Nucleo: ${character.wand.core}</li>` : ''}
                    ${character.wand.length ? `<li>Lunghezza: ${character.wand.length} pollici</li>` : ''}
                </ul>
            </div>
        `
        : '';

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 relative ${houseColorClass} ${character.house ? 'border-l-4' : ''}">
            <button onclick="this.closest('.fixed').remove()" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div class="flex flex-col md:flex-row gap-6">
                <img src="${imageUrl}" 
                     alt="${character.name}" 
                     class="w-full md:w-1/3 h-auto rounded-lg object-cover"
                     onerror="this.src='https://cdn.pixabay.com/photo/2016/03/31/19/58/avatar-1295429_960_720.png'">
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">${character.name}</h2>
                    ${character.alternate_names && character.alternate_names.length > 0 ? 
                        `<p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Anche conosciuto come: ${character.alternate_names.join(', ')}</p>` : ''}
                    
                    <p class="text-gray-600 dark:text-gray-300 mb-4">${getItalianDescription(character)}</p>
                    
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Casa</h3>
                            <p class="text-lg font-bold text-primary-600 dark:text-primary-400">${character.house || 'Sconosciuta'}</p>
                        </div>
                        <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Specie</h3>
                            <p class="text-lg font-bold text-primary-600 dark:text-primary-400">${character.species}</p>
                        </div>
                        <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Discendenza</h3>
                            <p class="text-lg font-bold text-primary-600 dark:text-primary-400">${character.ancestry || 'Sconosciuta'}</p>
                        </div>
                        <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Patronus</h3>
                            <p class="text-lg font-bold text-primary-600 dark:text-primary-400">${character.patronus || 'Sconosciuto'}</p>
                        </div>
                    </div>

                    ${wandInfo}
                    
                    <div class="mt-4 flex flex-wrap gap-2">
                        ${character.hogwartsStudent ? '<span class="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs">Studente di Hogwarts</span>' : ''}
                        ${character.hogwartsStaff ? '<span class="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full text-xs">Staff di Hogwarts</span>' : ''}
                        ${!character.alive ? '<span class="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full text-xs">Deceduto</span>' : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Caricamento iniziale
fetch(HP_API_URL)
    .then(response => {
        if (!response.ok) throw new Error('Errore nella risposta del server');
        return response.json();
    })
    .then(data => {
        allCharacters = data;
        displayCharacters();

        // Aggiungi funzionalità di ricerca
        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.trim();
                filterCharacters(searchTerm);
            });
        }
    })
    .catch(error => {
        console.error('Errore:', error);
        document.getElementById('output').innerHTML = `
            <div class="col-span-full text-center p-4">
                <p class="text-red-600 dark:text-red-400">Errore nel caricamento dei personaggi: ${error.message}</p>
            </div>
        `;
    }); 