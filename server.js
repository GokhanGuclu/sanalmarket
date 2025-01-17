const express = require('express');
const path = require('path');
const session = require('express-session'); 
const { runQuery } = require('./sql'); 
const apiRoutes = require('./api'); 
const app = express();

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000
    }
}));


app.use(express.static(path.join(__dirname)));

app.use(express.json());

app.use('/api', apiRoutes);

// ----------------- SEPET API ----------------- //

app.get('/api/sepet', (req, res) => {
    const sepet = req.session.sepet || {}; 
    res.json(sepet); 
});

app.post('/api/sepet', (req, res) => {
    const { urunAdi, miktar } = req.body; 
    if (!req.session.sepet) {
        req.session.sepet = {};
    }
    if (miktar > 0) {
        req.session.sepet[urunAdi] = miktar; 
    } else {
        delete req.session.sepet[urunAdi]; 
    }
    res.json(req.session.sepet); 
});

// ----------------- KULLANICI API ----------------- //

app.get('/api/kullanicilar', async (req, res) => {
    try {
        const query = 'SELECT * FROM Kullanici';
        const kullanicilar = await runQuery(query);
        res.json(kullanicilar);
    } catch (error) {
        console.error('Hata Detayı:', error.message); 
        res.status(500).json({ error: 'Veritabanı hatası: Kullanıcı verileri alınamadı.' });
    }
});

// ----------------- GİRİŞ/ÇIKIŞ API ----------------- //

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        req.session.user = { name: user.name, email: user.email }; 
        res.json({ success: true, user: req.session.user });
    } else {
        res.status(401).json({ success: false, message: 'Geçersiz e-posta veya şifre.' });
    }
});

app.get('/api/check-login', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(); 
    res.json({ success: true });
});

// ----------------- SAYFA YÖNLENDİRMELERİ ----------------- //

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'anasayfa', 'index.html'));
});

app.get('/kategori/:kategoriAdi', (req, res) => {
    res.sendFile(path.join(__dirname, 'kategori', 'index.html')); 
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404', 'index.html'));
});

// ----------------- SUNUCU BAŞLATMA ----------------- //
const PORT = 8080;
app.listen(PORT, () => console.log(`Sunucu http://localhost:${PORT} üzerinde çalışıyor`));

