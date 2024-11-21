import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
/*const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');*/
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ginevramaiorana2003:Lampo411@marvel.vtlvt.mongodb.net/marvel?retryWrites=true&w=majority&appName=marvel";
const PUBLIC_KEY= process.env.PUBLIC_KEY || 'https://marvel.com';
const PRIVATE_KEY= process.env.PRIVATE_KEY || 'https://marvel.com';
import dotenv from 'dotenv';
dotenv.config();

app.use(cors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
}));


// Middleware
app.use(express.json());


// Obtain the current directory name (__dirname equivalent in ES6)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend files
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, 'public')));



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

//funzione per gettare i supereroi con le api key
app.get('/api/marvel', async (req, res) => {
    const timestamp = new Date().getTime();
    const hash = require('crypto').createHash('md5').update(timestamp + PRIVATE_KEY + PUBLIC_KEY).digest('hex');
    const url = `https://gateway.marvel.com/v1/public/characters?ts=${timestamp}&apikey=${PUBLIC_KEY}&hash=${hash}`;
    
    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Errore durante la chiamata all\'API');
    }
});

//app.listen(3000, () => console.log('Server in ascolto sulla porta 3000'));

// Avvio del server
app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
});
