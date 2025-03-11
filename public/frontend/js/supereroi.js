const PUBLIC_KEY="af7b1b70227c7699019dc5b3310f327d";
const PRIVATE_KEY="1389efde3a9d301441b69d6a53c1ae95e8b63520"; 
const timestamp = new Date().getTime();
const hash = CryptoJS.MD5(timestamp + PRIVATE_KEY + PUBLIC_KEY).toString();
const url = `https://gateway.marvel.com/v1/public/characters?ts=${timestamp}&apikey=${PUBLIC_KEY}&hash=${hash}&limit=100&orderBy=name`;

let allHeroes = [];

// Dizionario delle descrizioni in italiano
const italianDescriptions = {
    "Spider-Man": "Peter Parker, morso da un ragno radioattivo, acquisisce incredibili abilità aracnide. Con grandi poteri derivano grandi responsabilità.",
    "Iron Man": "Tony Stark, genio miliardario, costruisce un'armatura high-tech per combattere il crimine e proteggere il mondo.",
    "Captain America": "Steve Rogers, trasformato dal siero del super soldato, diventa il primo Vendicatore e simbolo di giustizia e libertà.",
    "Thor": "Il potente dio del tuono di Asgard, che protegge i Nove Regni con il suo martello magico Mjolnir.",
    "Hulk": "Il Dr. Bruce Banner, esposto a raggi gamma, si trasforma in una creatura verde incredibilmente forte quando è arrabbiato.",
    "Black Widow": "Natasha Romanoff, ex spia russa diventata agente dello S.H.I.E.L.D. e membro chiave degli Avengers.",
    "Doctor Strange": "Il Dr. Stephen Strange, un ex neurochirurgo, diventa il più potente Stregone Supremo e protettore della Terra.",
    "Black Panther": "T'Challa, re del Wakanda e protettore del suo popolo, usa tecnologia avanzata e abilità sovrumane.",
    "Wolverine": "Logan, mutante con fattore rigenerante e artigli di adamantio, membro storico degli X-Men.",
    "Deadpool": "Wade Wilson, mercenario con poteri rigeneranti e umorismo dissacrante, rompe la quarta parete."
};

// Funzione per ottenere una descrizione in italiano
function getItalianDescription(hero) {
    // Se esiste una descrizione personalizzata in italiano, usala
    if (italianDescriptions[hero.name]) {
        return italianDescriptions[hero.name];
    }
    
    // Altrimenti, usa una descrizione generica se non c'è quella originale
    if (!hero.description) {
        return `Supereroe dell'universo Marvel con poteri straordinari. Appare in ${hero.comics.available} fumetti e ${hero.series.available} serie.`;
    }
    
    return hero.description;
}

// Funzione per creare la card di un supereroe
function createHeroCard(hero) {
    // Controlla se l'immagine è quella di "image not found" di Marvel
    const isImageNotFound = hero.thumbnail.path.includes('image_not_available') || 
                          hero.thumbnail.path.includes('4c002e0305708');

    // Usa un'immagine placeholder del logo Marvel se l'immagine non è disponibile
    const imageUrl = isImageNotFound
        ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAALVBMVEXz9Pa5vsq2u8j29/jN0dno6u7V2N++ws3w8fTf4efi5OnFydPY2+HJztbR1txPmUB/AAAC0klEQVR4nO3b55aqMBiFYUoioXn/l3ukKSVBJGH4ctb7/JxRVrYbCDVJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArPLQ7g60YnSjwmoqc3eouarOwmsrOT026TXKu4NNyosCioloissSFndn6+VlNgwn6EY4LrKUsCnm7TCaNuiudFqoiIT9Spo9Ak+Hj77GWsKUMSasAi+2lJMwIeE5JPxLtoRGa8+xiU5YqX5urBuf4UlO+Eyn+br2OHaWm9DU2eeoK2tOL1Vuwucs4Is+u1SxCctlwLQ4O0SpCfN6fXpw9thZakK9qjDN1MmlSk24Xkm/jdG9sxWaMG82CXc3ROXe2UpN+PgpYbffbRwtCk3421qqug+7WpSa0Pywp5lmTnuLUhNaZgvHt4yafgx7i1ITbq4sOoeoZm3bWhSbcDHyF8d0YNRiVba0KDdhMj/yTl2Twep3sLQoOOGrnmn4hePEf9mg/acQnDDJK1V013Trh3HMdesGbS1KTpj0FzG0cQ3O0qClReEJd9ka3LYYb0LzdARcRYw3oavB9YoabUJ3g6sWY0241+CyxUgSmtWFqP0GFy3GkVCnhZ7vPdqvAT8txpAw10WazYf4vcFZizEk1P3fPy0eabD7xnC+JT9h12D/j3o8djvWYH83ufu4/IT6PeKhxYMNdqdSUSScGny3eLTBaBLqxaAL/W0ejC3hvMEh4uF8kSTU+xmiT7hp8L9L6NVgBAk9G4wgoWeD4hN6Nyg+oXeD0hPmxw9dYk24vX9IQhLem21AQhKS8H6hE8q+TtPdVvM1hJKaMBwS/iUSnpILSji+FaTCvgk83oer707XmR70uuTdNSXh3bX384hXvH8Yeus+x2ye1gtGxjukSVJdllBGhUn3QKL/wdpWJmQd7em2CLoV9ltiq0XsZia6fITVCCoQAAAAAAAAAAAAAAAAAAAAAAAAAAAAuMU/B0kslFd7c1EAAAAASUVORK5CYII='
        : `${hero.thumbnail.path}/standard_fantastic.${hero.thumbnail.extension}`.replace('http://', 'https://');

    return `
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-transform hover:scale-105">
            <div class="relative group">
                <img src="${imageUrl}" alt="${hero.name}" 
                     class="w-full h-64 object-contain bg-black transform transition-transform duration-300 group-hover:scale-110"
                     onerror="this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAALVBMVEXz9Pa5vsq2u8j29/jN0dno6u7V2N++ws3w8fTf4efi5OnFydPY2+HJztbR1txPmUB/AAAC0klEQVR4nO3b55aqMBiFYUoioXn/l3ukKSVBJGH4ctb7/JxRVrYbCDVJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArPLQ7g60YnSjwmoqc3eouarOwmsrOT026TXKu4NNyosCioloissSFndn6+VlNgwn6EY4LrKUsCnm7TCaNuiudFqoiIT9Spo9Ak+Hj77GWsKUMSasAi+2lJMwIeE5JPxLtoRGa8+xiU5YqX5urBuf4UlO+Eyn+br2OHaWm9DU2eeoK2tOL1Vuwucs4Is+u1SxCctlwLQ4O0SpCfN6fXpw9thZakK9qjDN1MmlSk24Xkm/jdG9sxWaMG82CXc3ROXe2UpN+PgpYbffbRwtCk3421qqug+7WpSa0Pywp5lmTnuLUhNaZgvHt4yafgx7i1ITbq4sOoeoZm3bWhSbcDHyF8d0YNRiVba0KDdhMj/yTl2Twep3sLQoOOGrnmn4hePEf9mg/acQnDDJK1V013Trh3HMdesGbS1KTpj0FzG0cQ3O0qClReEJd9ka3LYYb0LzdARcRYw3oavB9YoabUJ3g6sWY0241+CyxUgSmtWFqP0GFy3GkVCnhZ7vPdqvAT8txpAw10WazYf4vcFZizEk1P3fPy0eabD7xnC+JT9h12D/j3o8djvWYH83ufu4/IT6PeKhxYMNdqdSUSScGny3eLTBaBLqxaAL/W0ejC3hvMEh4uF8kSTU+xmiT7hp8L9L6NVgBAk9G4wgoWeD4hN6Nyg+oXeD0hPmxw9dYk24vX9IQhLem21AQhKS8H6hE8q+TtPdVvM1hJKaMBwS/iUSnpILSji+FaTCvgk83oer707XmR70uuTdNSXh3bX384hXvH8Yeus+x2ye1gtGxjukSVJdllBGhUn3QKL/wdpWJmQd7em2CLoV9ltiq0XsZia6fITVCCoQAAAAAAAAAAAAAAAAAAAAAAAAAAAAuMU/B0kslFd7c1EAAAAASUVORK5CYII='">
                <div class="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onclick="showHeroDetails('${hero.id}')" 
                            class="px-4 py-2 bg-primary-600 text-white rounded-full transform -translate-y-2 group-hover:translate-y-0 transition-all">
                        Vedi Dettagli
                    </button>
                </div>
            </div>
            <div class="p-4">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">${hero.name}</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-3">
                    ${getItalianDescription(hero)}
                </p>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-primary-600 dark:text-primary-400 font-medium">
                        ${hero.comics.available} fumetti
                    </span>
                    <span class="text-gray-500 dark:text-gray-400">
                        ${hero.series.available} serie
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

// Funzione per filtrare i supereroi
function filterHeroes(searchTerm) {
    displayHeroes(searchTerm);
}

// Funzione per visualizzare i supereroi
async function displayHeroes(searchTerm = '') {
    toggleLoading(true);

    // Simuliamo un ritardo di caricamento di 1 secondo
    await new Promise(resolve => setTimeout(resolve, 1000));

    const output = document.getElementById('output');
    let filteredHeroes = allHeroes;
    
    if (searchTerm) {
        filteredHeroes = allHeroes.filter(hero => 
            hero.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getItalianDescription(hero).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    if (filteredHeroes.length === 0) {
        output.innerHTML = `
            <div class="col-span-full text-center p-8">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Nessun risultato trovato</h3>
                <p class="text-gray-500 dark:text-gray-400">
                    Non abbiamo trovato nessun supereroe che corrisponda alla tua ricerca "${searchTerm}"
                </p>
            </div>
        `;
    } else {
        output.innerHTML = filteredHeroes.map(hero => createHeroCard(hero)).join('');
    }

    toggleLoading(false);
}

// Funzione per mostrare i dettagli di un supereroe
function showHeroDetails(heroId) {
    const hero = allHeroes.find(h => h.id === parseInt(heroId));
    if (!hero) return;

    // Controlla se l'immagine è quella di "image not found" di Marvel
    const isImageNotFound = hero.thumbnail.path.includes('image_not_available') || 
                          hero.thumbnail.path.includes('4c002e0305708');

    // Usa un'immagine placeholder del logo Marvel se l'immagine non è disponibile
    const imageUrl = isImageNotFound
        ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAALVBMVEXz9Pa5vsq2u8j29/jN0dno6u7V2N++ws3w8fTf4efi5OnFydPY2+HJztbR1txPmUB/AAAC0klEQVR4nO3b55aqMBiFYUoioXn/l3ukKSVBJGH4ctb7/JxRVrYbCDVJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArPLQ7g60YnSjwmoqc3eouarOwmsrOT026TXKu4NNyosCioloissSFndn6+VlNgwn6EY4LrKUsCnm7TCaNuiudFqoiIT9Spo9Ak+Hj77GWsKUMSasAi+2lJMwIeE5JPxLtoRGa8+xiU5YqX5urBuf4UlO+Eyn+br2OHaWm9DU2eeoK2tOL1Vuwucs4Is+u1SxCctlwLQ4O0SpCfN6fXpw9thZakK9qjDN1MmlSk24Xkm/jdG9sxWaMG82CXc3ROXe2UpN+PgpYbffbRwtCk3421qqug+7WpSa0Pywp5lmTnuLUhNaZgvHt4yafgx7i1ITbq4sOoeoZm3bWhSbcDHyF8d0YNRiVba0KDdhMj/yTl2Twep3sLQoOOGrnmn4hePEf9mg/acQnDDJK1V013Trh3HMdesGbS1KTpj0FzG0cQ3O0qClReEJd9ka3LYYb0LzdARcRYw3oavB9YoabUJ3g6sWY0241+CyxUgSmtWFqP0GFy3GkVCnhZ7vPdqvAT8txpAw10WazYf4vcFZizEk1P3fPy0eabD7xnC+JT9h12D/j3o8djvWYH83ufu4/IT6PeKhxYMNdqdSUSScGny3eLTBaBLqxaAL/W0ejC3hvMEh4uF8kSTU+xmiT7hp8L9L6NVgBAk9G4wgoWeD4hN6Nyg+oXeD0hPmxw9dYk24vX9IQhLem21AQhKS8H6hE8q+TtPdVvM1hJKaMBwS/iUSnpILSji+FaTCvgk83oer707XmR70uuTdNSXh3bX384hXvH8Yeus+x2ye1gtGxjukSVJdllBGhUn3QKL/wdpWJmQd7em2CLoV9ltiq0XsZia6fITVCCoQAAAAAAAAAAAAAAAAAAAAAAAAAAAAuMU/B0kslFd7c1EAAAAASUVORK5CYII='
        : `${hero.thumbnail.path}/portrait_uncanny.${hero.thumbnail.extension}`.replace('http://', 'https://');

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 relative">
            <button onclick="this.closest('.fixed').remove()" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div class="flex flex-col md:flex-row gap-6">
                <img src="${imageUrl}" 
                     alt="${hero.name}" 
                     class="w-full md:w-1/3 h-auto rounded-lg object-contain bg-black"
                     onerror="this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAALVBMVEXz9Pa5vsq2u8j29/jN0dno6u7V2N++ws3w8fTf4efi5OnFydPY2+HJztbR1txPmUB/AAAC0klEQVR4nO3b55aqMBiFYUoioXn/l3ukKSVBJGH4ctb7/JxRVrYbCDVJAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAArPLQ7g60YnSjwmoqc3eouarOwmsrOT026TXKu4NNyosCioloissSFndn6+VlNgwn6EY4LrKUsCnm7TCaNuiudFqoiIT9Spo9Ak+Hj77GWsKUMSasAi+2lJMwIeE5JPxLtoRGa8+xiU5YqX5urBuf4UlO+Eyn+br2OHaWm9DU2eeoK2tOL1Vuwucs4Is+u1SxCctlwLQ4O0SpCfN6fXpw9thZakK9qjDN1MmlSk24Xkm/jdG9sxWaMG82CXc3ROXe2UpN+PgpYbffbRwtCk3421qqug+7WpSa0Pywp5lmTnuLUhNaZgvHt4yafgx7i1ITbq4sOoeoZm3bWhSbcDHyF8d0YNRiVba0KDdhMj/yTl2Twep3sLQoOOGrnmn4hePEf9mg/acQnDDJK1V013Trh3HMdesGbS1KTpj0FzG0cQ3O0qClReEJd9ka3LYYb0LzdARcRYw3oavB9YoabUJ3g6sWY0241+CyxUgSmtWFqP0GFy3GkVCnhZ7vPdqvAT8txpAw10WazYf4vcFZizEk1P3fPy0eabD7xnC+JT9h12D/j3o8djvWYH83ufu4/IT6PeKhxYMNdqdSUSScGny3eLTBaBLqxaAL/W0ejC3hvMEh4uF8kSTU+xmiT7hp8L9L6NVgBAk9G4wgoWeD4hN6Nyg+oXeD0hPmxw9dYk24vX9IQhLem21AQhKS8H6hE8q+TtPdVvM1hJKaMBwS/iUSnpILSji+FaTCvgk83oer707XmR70uuTdNSXh3bX384hXvH8Yeus+x2ye1gtGxjukSVJdllBGhUn3QKL/wdpWJmQd7em2CLoV9ltiq0XsZia6fITVCCoQAAAAAAAAAAAAAAAAAAAAAAAAAAAAuMU/B0kslFd7c1EAAAAASUVORK5CYII='">
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">${hero.name}</h2>
                    <p class="text-gray-600 dark:text-gray-300 mb-4">${getItalianDescription(hero)}</p>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Fumetti</h3>
                            <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">${hero.comics.available}</p>
                        </div>
                        <div class="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Serie</h3>
                            <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">${hero.series.available}</p>
                        </div>
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
fetch(url)
    .then(response => {
        if (!response.ok) throw new Error('Errore nella risposta del server');
        return response.json();
    })
.then(data => {
        allHeroes = data.data.results;
        displayHeroes();

        // Aggiungi funzionalità di ricerca
        const searchInput = document.getElementById('search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.trim();
                filterHeroes(searchTerm);
            });
        }
    })
    .catch(error => {
        console.error('Errore:', error);
        document.getElementById('output').innerHTML = `
            <div class="col-span-full text-center p-4">
                <p class="text-red-600 dark:text-red-400">Errore nel caricamento dei supereroi: ${error.message}</p>
            </div>
        `;
    });
