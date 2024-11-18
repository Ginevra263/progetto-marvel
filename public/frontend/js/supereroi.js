const PUBLIC_KEY= process.env.PUBLIC_KEY || 'https://marvel.com';
const PRIVATE_KEY= process.env.PRIVATE_KEY || 'https://marvel.com';
const timestamp = new Date().getTime();     //serve all'API KEY per generare hash di sicurezza
const hash = CryptoJS.MD5(timestamp + PRIVATE_KEY + PUBLIC_KEY).toString();
const url = `https://gateway.marvel.com/v1/public/characters?ts=${timestamp}&apikey=${PUBLIC_KEY}&hash=${hash}`;    //creazione url per chiamata API

console.log(process.env)
fetch(url)
.then(response => response.json())
.then(data => {
    console.log(data);  // Visualizza i dati nella console
    document.getElementById('output').innerHTML = JSON.stringify(data.data.results, null, 2);
})
.catch(error => console.error('Errore:', error));
