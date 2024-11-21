const PUBLIC_KEY="af7b1b70227c7699019dc5b3310f327d";
const PRIVATE_KEY="1389efde3a9d301441b69d6a53c1ae95e8b63520"; 
const timestamp = new Date().getTime();     //serve all'API KEY per generare hash di sicurezza
const hash = CryptoJS.MD5(timestamp + PRIVATE_KEY + PUBLIC_KEY).toString();
const url = `https://gateway.marvel.com/v1/public/characters?ts=${timestamp}&apikey=${PUBLIC_KEY}&hash=${hash}`;    //creazione url per chiamata API

console.log(PRIVATE_KEY); 
fetch(url)
.then(response => response.json())
.then(data => {
    console.log(data);  // Visualizza i dati nella console
    document.getElementById('output').innerHTML = JSON.stringify(data.data.results, null, 2);
})
.catch(error => console.error('Errore:', error));
