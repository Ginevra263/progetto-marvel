import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ginevramaiorana2003:Lampo411@marvel.vtlvt.mongodb.net/?retryWrites=true&w=majority&appName=marvel";
const PUBLIC_KEY= process.env.PUBLIC_KEY || 'https://marvel.com';
const PRIVATE_KEY= process.env.PRIVATE_KEY || 'https://marvel.com';
const JWT_SECRET = process.env.JWT_SECRET || 'f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7';
const MARVEL_PUBLIC_KEY = process.env.MARVEL_PUBLIC_KEY || 'af7b1b70227c7699019dc5b3310f327d';
const MARVEL_PRIVATE_KEY = process.env.MARVEL_PRIVATE_KEY || '1389efde3a9d301441b69d6a53c1ae95e8b63520';

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// Verifica che tutte le credenziali Firebase siano presenti
const requiredFirebaseEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
];

const missingEnvVars = requiredFirebaseEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    console.error('Errore: Mancano le seguenti variabili d\'ambiente Firebase:', missingEnvVars);
    process.exit(1);
}

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);
const auth = getAuth(firebaseApp);

// Verifica la connessione a Firebase Storage
const testStorageConnection = async () => {
    try {
        console.log('Verifica connessione Firebase Storage...');
        const testRef = ref(storage, 'test.txt');
        const testBuffer = Buffer.from('test');
        await uploadBytes(testRef, testBuffer);
        await deleteObject(testRef);
        console.log('Firebase Storage configurato correttamente');
    } catch (error) {
        console.error('Errore nella configurazione di Firebase Storage:', error);
        if (error.code === 'storage/unauthorized') {
            console.error('Verifica le regole di sicurezza del bucket Firebase Storage');
        }
        process.exit(1);
    }
};

testStorageConnection();

app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],  // Permette richieste da entrambi gli origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
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
    superhero: { type: String },  // Campo aggiunto per l'eroe preferito
    credits: { type: Number, default: 0 },
    cards: [{
        id: String,
        name: String,
        thumbnail: String,
        count: { type: Number, default: 1 }
    }],
    profile_image: { 
        type: String, 
        default: `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/marvel%2Fuser%2Fdefault-avatar.png?alt=media` 
    }
});

// Definizione dello schema per gli scambi
const tradeSchema = new mongoose.Schema({
    offeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    offeredCard: {
        id: String,
        name: String,
        thumbnail: String
    },
    wantedCard: {
        id: String,
        name: String,
        thumbnail: String
    },
    status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

// Creazione dei modelli
const User = mongoose.model('users', userSchema);
const Trade = mongoose.model('trades', tradeSchema);

// Connessione a MongoDB
console.log('Tentativo di connessione a MongoDB...');
mongoose.connect(MONGO_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Aumentato a 30 secondi
    heartbeatFrequencyMS: 2000,     // Ridotto il polling
    connectTimeoutMS: 30000,        // Timeout di connessione
    socketTimeoutMS: 45000,         // Timeout del socket
    family: 4                       // Forza IPv4
})
.then(() => {
    console.log('Connesso con successo al database MongoDB');
})
.catch(err => {
    console.error('Errore di connessione al database:', err);
    console.error('MongoDB URI:', MONGO_URI.replace(/:[^:@]*@/, ':****@')); // Nascondi la password nei log
    process.exit(1);
});

// Gestione eventi di connessione MongoDB
mongoose.connection.on('connected', () => {
    console.log('Mongoose connesso al database');
});

mongoose.connection.on('error', (err) => {
    console.error('Errore di connessione Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnesso dal database');
});

// Middleware di autenticazione
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log('Token non fornito');
        return res.status(401).json({ success: false, message: 'Token non fornito' });
    }

    try {
        // Usa la stessa chiave segreta usata per la generazione
        const decoded = jwt.verify(token, process.env.JWT_SECRET || JWT_SECRET);
        console.log('Token decodificato:', decoded);

        // Cerca l'utente nel database usando userId invece di id
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log('Utente non trovato nel database');
            return res.status(401).json({ success: false, message: 'Utente non trovato' });
        }

        // Aggiungi l'utente alla richiesta
        req.user = user;
        next();
    } catch (error) {
        console.error('Errore nell\'autenticazione:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token scaduto' });
        }
        return res.status(403).json({ success: false, message: 'Token non valido' });
    }
};

// Configurazione di Multer per l'upload delle immagini
const multerStorage = multer.memoryStorage(); // Cambiamo in memoryStorage per caricare su Firebase

const upload = multer({
    storage: multerStorage,
    fileFilter: (req, file, cb) => {
        // Accetta solo immagini
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Il file deve essere un\'immagine'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
        files: 1 // Solo un file alla volta
    }
});

// Routes
// Registrazione utente
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, superhero } = req.body;
        
        // Validazione
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username, email e password sono obbligatori' 
            });
        }

        // Verifica se l'utente esiste già
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email già registrata' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Crea un nuovo utente con l'immagine di profilo predefinita
        const defaultProfileImage = `https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/marvel%2Fuser%2Fdefault-avatar.png?alt=media`;
        
        const user = new User({
            username,
            email,
            password: hashedPassword,
            superhero,
            credits: 10, // Crediti iniziali gratuiti
            profile_image: defaultProfileImage
        });
        
        await user.save();
        res.json({ success: true, message: 'Registrazione completata con successo' });
    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        res.status(400).json({ 
            success: false, 
            message: 'Errore durante la registrazione: ' + error.message 
        });
    }
});

// Login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Tentativo di login per email:', email);
        console.log('Password ricevuta:', password ? 'Presente' : 'Mancante');
        
        // Verifica che email e password siano stati forniti
        if (!email || !password) {
            console.log('Email o password mancanti');
            return res.status(400).json({ 
                success: false, 
                message: 'Email e password sono obbligatori' 
            });
        }

        // Cerca l'utente nel database
        console.log('Ricerca utente nel database...');
        const user = await User.findOne({ email });
        console.log('Utente trovato:', user ? {
            id: user._id,
            email: user.email,
            username: user.username
        } : 'No');

        if (!user) {
            console.log('Utente non trovato nel database');
            return res.status(401).json({ 
                success: false, 
                message: 'Credenziali non valide' 
            });
        }

        // Verifica la password
        console.log('Verifica password...');
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valida:', isPasswordValid ? 'Sì' : 'No');

        if (!isPasswordValid) {
            console.log('Password non valida');
            return res.status(401).json({ 
                success: false, 
                message: 'Credenziali non valide' 
            });
        }

        // Genera il token JWT
        console.log('Generazione token JWT...');
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET || JWT_SECRET,
            { expiresIn: '24h' }
        );
        console.log('Token generato con successo');

        // Invia la risposta
        res.json({ 
            success: true, 
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Errore durante il login:', error);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Errore durante il login: ' + error.message 
        });
    }
});

// Ottenere i dati dell'utente
app.get('/api/user/data', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({
            success: true,
            credits: user.credits,
            cards: user.cards
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Acquisto crediti
app.post('/api/credits/buy', authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;
        const user = await User.findById(req.user.id);
        user.credits += amount;
        await user.save();
        
        res.json({
            success: true,
            newCredits: user.credits
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Acquisto pacchetto di figurine
app.post('/api/cards/buy-pack', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user.credits < 1) {
            return res.status(400).json({ success: false, message: 'Crediti insufficienti' });
        }
        
        // Genera timestamp e hash per Marvel API
        const ts = new Date().getTime();
        const hash = crypto.createHash('md5').update(ts + MARVEL_PRIVATE_KEY + MARVEL_PUBLIC_KEY).digest('hex');
        
        // Ottieni 5 eroi casuali dalla Marvel API
        const response = await axios.get(`https://gateway.marvel.com/v1/public/characters`, {
            params: {
                ts,
                apikey: MARVEL_PUBLIC_KEY,
                hash,
                limit: 100
            }
        });
        
        const allHeroes = response.data.data.results;
        const newCards = [];
        
        // Seleziona 5 eroi casuali
        for (let i = 0; i < 5; i++) {
            const randomHero = allHeroes[Math.floor(Math.random() * allHeroes.length)];
            const card = {
                id: randomHero.id.toString(),
                name: randomHero.name,
                thumbnail: `${randomHero.thumbnail.path}.${randomHero.thumbnail.extension}`
            };
            
            // Aggiungi o aggiorna la carta nell'album dell'utente
            const existingCard = user.cards.find(c => c.id === card.id);
            if (existingCard) {
                existingCard.count++;
            } else {
                user.cards.push({ ...card, count: 1 });
            }
            
            newCards.push(card);
        }
        
        user.credits--;
        await user.save();
        
        res.json({
            success: true,
            newCards,
            newCredits: user.credits
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Proporre uno scambio
app.post('/api/trades/propose', authenticateToken, async (req, res) => {
    try {
        const { offeredCardId, wantedCardId } = req.body;
        const user = await User.findById(req.user.id);
        
        // Verifica che l'utente possieda la carta offerta
        const offeredCard = user.cards.find(c => c.id === offeredCardId && c.count > 1);
        if (!offeredCard) {
            return res.status(400).json({ success: false, message: 'Non puoi scambiare questa carta' });
        }
        
        const trade = new Trade({
            offeredBy: user._id,
            offeredCard: {
                id: offeredCard.id,
                name: offeredCard.name,
                thumbnail: offeredCard.thumbnail
            },
            wantedCard: {
                id: wantedCardId
                // Gli altri dettagli verranno aggiunti quando qualcuno accetterà lo scambio
            }
        });
        
        await trade.save();
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Ottenere gli scambi disponibili
app.get('/api/trades/available', authenticateToken, async (req, res) => {
    try {
        const trades = await Trade.find({ status: 'pending' })
            .populate('offeredBy', 'username');
        
        res.json({
            success: true,
            trades: trades.map(t => ({
                id: t._id,
                offeredCard: t.offeredCard,
                wantedCard: t.wantedCard,
                offeredBy: t.offeredBy.username
            }))
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Accettare uno scambio
app.post('/api/trades/accept/:tradeId', authenticateToken, async (req, res) => {
    try {
        const trade = await Trade.findById(req.params.tradeId);
        if (!trade || trade.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Scambio non disponibile' });
        }
        
        const offerer = await User.findById(trade.offeredBy);
        const accepter = await User.findById(req.user.id);
        
        // Verifica che l'accettante abbia la carta richiesta
        const accepterCard = accepter.cards.find(c => c.id === trade.wantedCard.id && c.count > 0);
        if (!accepterCard) {
            return res.status(400).json({ success: false, message: 'Non hai la carta richiesta' });
        }
        
        // Verifica che l'offerente abbia ancora la carta offerta
        const offererCard = offerer.cards.find(c => c.id === trade.offeredCard.id && c.count > 1);
        if (!offererCard) {
            return res.status(400).json({ success: false, message: 'La carta offerta non è più disponibile' });
        }
        
        // Esegui lo scambio
        offererCard.count--;
        accepterCard.count--;
        
        // Aggiungi le carte scambiate
        const offererWantedCard = offerer.cards.find(c => c.id === trade.wantedCard.id);
        if (offererWantedCard) {
            offererWantedCard.count++;
        } else {
            offerer.cards.push({
                id: trade.wantedCard.id,
                name: trade.wantedCard.name,
                thumbnail: trade.wantedCard.thumbnail,
                count: 1
            });
        }
        
        const accepterOfferedCard = accepter.cards.find(c => c.id === trade.offeredCard.id);
        if (accepterOfferedCard) {
            accepterOfferedCard.count++;
        } else {
            accepter.cards.push({
                id: trade.offeredCard.id,
                name: trade.offeredCard.name,
                thumbnail: trade.offeredCard.thumbnail,
                count: 1
            });
        }
        
        trade.status = 'completed';
        await Promise.all([trade.save(), offerer.save(), accepter.save()]);
        
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Marvel API endpoint
app.get('/api/marvel', async (req, res) => {
    try {
        const ts = new Date().getTime();
        const hash = crypto.createHash('md5').update(ts + MARVEL_PRIVATE_KEY + MARVEL_PUBLIC_KEY).digest('hex');
        
        const response = await axios.get('https://gateway.marvel.com/v1/public/characters', {
            params: {
                ts,
                apikey: MARVEL_PUBLIC_KEY,
                hash,
                limit: 100
            }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error('Errore nella chiamata all\'API Marvel:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Errore nella chiamata all\'API Marvel' 
        });
    }
});

// Ottenere i dati del profilo utente
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        console.log('Richiesta profilo per utente:', req.user._id);
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            console.log('Utente non trovato nel database');
            return res.status(404).json({ success: false, message: 'Utente non trovato' });
        }
        console.log('Profilo utente recuperato con successo');
        res.json({ success: true, user });
    } catch (error) {
        console.error('Errore nel recupero del profilo:', error);
        res.status(500).json({ success: false, message: 'Errore nel recupero del profilo' });
    }
});

// Aggiornare i dati del profilo
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { username, email, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Utente non trovato' });
        }

        // Verifica se l'email è già in uso da un altro utente
        if (email !== user.email) {
            const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
            if (emailExists) {
                return res.status(400).json({ success: false, message: 'Email già in uso' });
            }
        }

        // Aggiorna username e email
        user.username = username;
        user.email = email;

        // Se è stata fornita una nuova password, verificala e aggiornala
        if (newPassword) {
            // Verifica la password corrente
            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return res.status(400).json({ success: false, message: 'Password attuale non corretta' });
            }

            // Hash della nuova password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
        }

        await user.save();

        // Rimuovi la password dalla risposta
        const userResponse = user.toObject();
        delete userResponse.password;

        res.json({ success: true, user: userResponse, message: 'Profilo aggiornato con successo' });
    } catch (error) {
        console.error('Errore nell\'aggiornamento del profilo:', error);
        res.status(500).json({ success: false, message: 'Errore nell\'aggiornamento del profilo' });
    }
});

// Aggiornare l'immagine del profilo
app.post('/api/user/profile/image', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        console.log('Richiesta aggiornamento immagine per utente:', req.user._id);
        
        if (!req.file) {
            console.log('Nessun file caricato');
            return res.status(400).json({ success: false, message: 'Nessuna immagine caricata' });
        }

        // Verifica il tipo di file
        if (!req.file.mimetype.startsWith('image/')) {
            console.log('Tipo di file non valido:', req.file.mimetype);
            return res.status(400).json({ success: false, message: 'Il file deve essere un\'immagine' });
        }

        // Verifica la dimensione del file (max 5MB)
        if (req.file.size > 5 * 1024 * 1024) {
            console.log('File troppo grande:', req.file.size);
            return res.status(400).json({ success: false, message: 'L\'immagine non può superare i 5MB' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            console.log('Utente non trovato nel database');
            return res.status(404).json({ success: false, message: 'Utente non trovato' });
        }

        // Carica l'immagine su Firebase Storage
        const file = req.file;
        const storageRef = ref(storage, `profile_images/${user._id}/${Date.now()}_${file.originalname}`);
        const metadata = {
            contentType: file.mimetype
        };

        console.log('Caricamento immagine su Firebase Storage...');
        const snapshot = await uploadBytes(storageRef, file.buffer, metadata);
        const imageUrl = await getDownloadURL(snapshot.ref);
        console.log('Immagine caricata con successo:', imageUrl);

        // Se esiste un'immagine precedente, eliminala
        if (user.profile_image && user.profile_image !== 'default-avatar.png') {
            try {
                const oldImageRef = ref(storage, user.profile_image);
                await deleteObject(oldImageRef);
                console.log('Immagine precedente eliminata con successo');
            } catch (error) {
                console.error('Errore nell\'eliminazione dell\'immagine precedente:', error);
            }
        }

        // Aggiorna l'URL dell'immagine nel database
        user.profile_image = imageUrl;
        await user.save();
        console.log('URL immagine aggiornato nel database');

        res.json({ 
            success: true, 
            message: 'Immagine del profilo aggiornata con successo',
            profile_image: imageUrl
        });
    } catch (error) {
        console.error('Errore nell\'aggiornamento dell\'immagine:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Errore nell\'aggiornamento dell\'immagine del profilo',
            error: error.message
        });
    }
});

// Aggiorna la funzione initializeDefaultAvatar
const initializeDefaultAvatar = async () => {
    try {
        console.log('Inizializzazione avatar predefinito...');
        
        // Verifica che il file locale esista
        const localImagePath = path.join(__dirname, '../frontend/images/default-avatar.png');
        if (!fs.existsSync(localImagePath)) {
            throw new Error(`File locale non trovato in: ${localImagePath}`);
        }

        const defaultAvatarPath = 'marvel/user/default-avatar.png';
        const defaultAvatarRef = ref(storage, defaultAvatarPath);
        
        try {
            // Prova a ottenere l'URL dell'immagine predefinita
            await getDownloadURL(defaultAvatarRef);
            console.log('Immagine predefinita già presente in Firebase Storage');
        } catch (error) {
            if (error.code === 'storage/object-not-found') {
                console.log('Caricamento immagine predefinita su Firebase Storage...');
                
                // Leggi il file come Buffer
                const fileBuffer = fs.readFileSync(localImagePath);
                
                try {
                    const metadata = {
                        contentType: 'image/png',
                        cacheControl: 'public, max-age=31536000'
                    };
                    
                    const snapshot = await uploadBytes(defaultAvatarRef, fileBuffer, metadata);
                    const downloadURL = await getDownloadURL(snapshot.ref);
                    console.log('Immagine predefinita caricata con successo. URL:', downloadURL);
                } catch (uploadError) {
                    console.error('Errore nel caricamento:', uploadError);
                    throw uploadError;
                }
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Errore nell\'inizializzazione dell\'immagine predefinita:', error);
        console.error('Stack trace:', error.stack);
    }
};

// Chiama la funzione di inizializzazione
initializeDefaultAvatar();

// Middleware per gestire gli errori di Multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'Il file è troppo grande. Dimensione massima: 5MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: 'Errore nel caricamento del file'
        });
    }
    next(error);
});

// Avvio del server
const startServer = async (initialPort) => {
    const server = app.listen(initialPort)
        .on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`La porta ${initialPort} è già in uso, provo con la porta ${initialPort + 1}`);
                startServer(initialPort + 1);
            } else {
                console.error('Errore nell\'avvio del server:', err);
                process.exit(1);
            }
        })
        .on('listening', () => {
            const address = server.address();
            console.log(`Server in esecuzione su http://localhost:${address.port}`);
        });
};

// Avvia il server sulla porta iniziale
startServer(PORT);
