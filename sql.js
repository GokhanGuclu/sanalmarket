require('dotenv').config(); 

const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

async function checkUser(mail, password) {
    const query = 'SELECT * FROM Kullanici WHERE mail = ? AND sifre = ?';
    const rows = await runQuery(query, [mail, password]);
    return rows;
}
async function addUser(ad, soyad, mail, telefon, password) {
    const query = 'INSERT INTO Kullanici (ad, soyad, mail, telefon, sifre) VALUES (?, ?, ?, ?, ?)';
    await runQuery(query, [ad, soyad, mail, telefon, password]);
}

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

