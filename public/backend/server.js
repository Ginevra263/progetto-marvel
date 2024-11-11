const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();     //per caricare le variabili d'ambiente

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI="mongodb+srv://ginevramaiorana:lampo411@cluster0.9ky8i.mongodb.net/mydatabase";

// Middleware
app.use(express.json());

// Connessione a MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true,
useUnifiedTopology: true })
    .then(() => console.log('Connesso al database MongoDB'))
    .catch(err => {
        console.error('Errore di connessione al database:', err);
        process.exit(1);
    });

app.post('/register', (req, res) => {
    const { username, email, password, superhero } = req.body;
    
    // Verifica se i dati sono validi
    if (!username || !email || !password || !superhero) {
        return res.status(400).json({ message: 'Tutti i campi sono obbligatori' });
    }
});

// Definizione di un semplice schema
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
});

const User = mongoose.model('User', userSchema);

// Endpoint di esempio
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
});
