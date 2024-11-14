require('dotenv').config(); // Per caricare le variabili d'ambiente
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ginevramaiorana2003:Lampo411@marvel.vtlvt.mongodb.net/marvel?retryWrites=true&w=majority&appName=marvel";

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
}));

// Definizione dello schema utente
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    superhero: { type: String }  // Campo aggiunto per l'eroe preferito
});

// Creazione del modello utente
const User = mongoose.model('users', userSchema);

// Connessione a MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connesso al database MongoDB'))
    .catch(err => {
        console.error('Errore di connessione al database:', err);
        process.exit(1);
    });

// Registrazione
app.post('/register', async (req, res) => {
    const { username, email, password, superhero } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Tutti i campi sono obbligatori' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Utente già registrato' });
        }

        const newUser = new User({ username, email, password, superhero });
        await newUser.save();
        res.status(201).json({ success: true, message: 'Registrazione avvenuta con successo' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Errore del server' });
    }
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e password sono obbligatori' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Utente non trovato' });
        }

        if (user.password !== password) {
            return res.status(400).json({ success: false, message: 'Password errata' });
        }

        res.status(200).json({ success: true, message: 'Login effettuato con successo' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Errore del server' });
    }
});

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
});
