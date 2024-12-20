const mysql = require('mysql2');

// MySQL bağlantı havuzunu oluşturma
const pool = mysql.createPool({
    host: 'localhost',       // Veritabanı sunucu adresi
    user: 'root',            // MySQL kullanıcı adı
    password: 'Gokhan626353', // MySQL şifreniz
    database: 'Sanalmarket',  // Veritabanı adı
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Sorguları çalıştırmak için bir "promise" wrapper
const promisePool = pool.promise();

// Kullanıcı doğrulama fonksiyonu
async function checkUser(mail, password) {
    const query = 'SELECT * FROM Kullanici WHERE mail = ? AND sifre = ?';
    const rows = await runQuery(query, [mail, password]);
    return rows;
}
async function addUser(ad, soyad, mail, telefon, password) {
    const query = 'INSERT INTO Kullanici (ad, soyad, mail, telefon, sifre) VALUES (?, ?, ?, ?, ?)';
    await runQuery(query, [ad, soyad, mail, telefon, password]);
}

// Genel sorgu çalıştırma fonksiyonu
async function runQuery(query, values = []) {
    try {
        const [rows] = await promisePool.query(query, values);
        return rows;
    } catch (err) {
        console.error('Veritabanı Hatası:', err.message);
        throw err;
    }
}

module.exports = {runQuery, checkUser, addUser };

