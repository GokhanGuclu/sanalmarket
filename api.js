const express = require('express');
const router = express.Router();
const {runQuery, checkUser, addUser } = require('./sql');

// Giriş Yapma Endpoint'i
router.post('/login', async (req, res) => {
    const { mail, password } = req.body;
    try {
        const user = await checkUser(mail, password);
        if (user.length > 0) {
            res.json({ success: true, user: user[0] });
        } else {
            res.json({ success: false, message: 'Kullanıcı adı veya şifre hatalı!' });
        }
    } catch (err) {
        console.error('Giriş hatası:', err.message);
        res.status(500).send({ success: false, message: 'Sunucu hatası, giriş başarısız.' });
    }
});

router.post('/register', async (req, res) => {
    const { ad, soyad, mail, telefon, password } = req.body;

    // Tüm alanların geldiğinden emin ol
    if (!ad || !soyad || !mail || !telefon || !password) {
        return res.status(400).json({ success: false, message: 'Tüm alanlar zorunludur.' });
    }

    try {
        await addUser(ad, soyad, mail, telefon, password);
        res.json({ success: true, message: 'Kayıt başarılı!' });
    } catch (err) {
        console.error('Kayıt hatası:', err.message);
        res.status(500).json({ success: false, message: 'Sunucu hatası. Kayıt başarısız.' });
    }
});


router.get('/urunler/:kategori', async (req, res) => {
    const kategori = req.params.kategori;

    try {
        const query = `
            SELECT 
                Urun.*,
                Indirim.IndirimOrani,
                Indirim.KampanyaAdi
            FROM 
                Urun
            LEFT JOIN 
                Indirim ON Urun.UrunID = Indirim.UrunID
            WHERE 
                Urun.Kategori = ?;
        `;
        const urunler = await runQuery(query, [kategori]); // Kategoriye göre ürünleri çek
        res.json(urunler); // Ürünleri JSON formatında gönder
    } catch (error) {
        console.error('Veritabanı hatası:', error.message);
        res.status(500).json({ error: 'Ürünler alınırken bir hata oluştu.' });
    }
});

router.get('/sepet', async (req, res) => {
    try {
        const kullaniciID = 1000; // Varsayılan kullanıcı ID'si (örnek olarak 1000)
        const query = `
            SELECT 
                SU.UrunID, 
                SU.UrunSayisi, 
                SU.UrunFiyat AS toplamFiyat, 
                U.UrunAdi, 
                U.Gorsel, 
                U.UrunFiyat AS orijinalFiyat,
                I.IndirimOrani
            FROM 
                SepetUrunleri SU
            INNER JOIN 
                Urun U ON SU.UrunID = U.UrunID
            LEFT JOIN 
                Indirim I ON U.UrunID = I.UrunID
            WHERE 
                SU.SepetID = (SELECT SepetID FROM Sepet WHERE KullaniciID = ?)
        `;
        const sepetUrunleri = await runQuery(query, [kullaniciID]);

        if (sepetUrunleri.length > 0) {
            res.json({ success: true, sepetUrunleri });
        } else {
            res.json({ success: false, message: 'Sepet boş.' });
        }
    } catch (error) {
        console.error('Sepet verileri alınırken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Sepet verileri alınamadı.' });
    }
});

router.post('/sepet', async (req, res) => {
    let { kullaniciID, urunID, urunSayisi } = req.body;

    try {
        if (!kullaniciID) {
            kullaniciID = 1000; // Varsayılan kullanıcı ID'si
        }

        // 1. Kullanıcı için mevcut bir sepet var mı kontrol et
        const findCartQuery = `SELECT SepetID FROM Sepet WHERE KullaniciID = ?;`;
        let [sepet] = await runQuery(findCartQuery, [kullaniciID]);

        let sepetID;
        if (!sepet) {
            // 2. Eğer sepet yoksa yeni bir sepet oluştur
            const createCartQuery = `
                INSERT INTO Sepet (KullaniciID, SepetFiyat)
                VALUES (?, 0.00);
            `;
            const result = await runQuery(createCartQuery, [kullaniciID]);
            sepetID = result.insertId;
        } else {
            // Mevcut sepetin ID'sini al
            sepetID = sepet.SepetID;
        }

        // 3. Ürünün fiyatını `Urun` tablosundan al
        const getProductPriceQuery = `SELECT UrunFiyat FROM Urun WHERE UrunID = ?;`;
        const [urun] = await runQuery(getProductPriceQuery, [urunID]);

        if (!urun) {
            return res.status(400).json({ success: false, message: 'Geçersiz ürün ID.' });
        }

        const urunFiyat = urun.UrunFiyat;
        const toplamFiyat = urunFiyat * urunSayisi;

        // 4. Sepete ürünü ekle veya miktarını güncelle
        const addOrUpdateProductQuery = `
            INSERT INTO SepetUrunleri (SepetID, UrunID, UrunSayisi, UrunFiyat)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            UrunSayisi = CASE 
                WHEN VALUES(UrunSayisi) = -1 AND UrunSayisi > 1 THEN UrunSayisi - 1
                WHEN VALUES(UrunSayisi) = -1 AND UrunSayisi = 1 THEN UrunSayisi -- 0'da sabit kal
                ELSE UrunSayisi + VALUES(UrunSayisi)
            END,
            UrunFiyat = UrunSayisi * ?;
        `;
        await runQuery(addOrUpdateProductQuery, [sepetID, urunID, urunSayisi, toplamFiyat, urunFiyat]);

        // 5. Sepet tablosundaki toplam fiyatı güncelle
        const updateCartPriceQuery = `
            UPDATE Sepet
            SET SepetFiyat = (
                SELECT SUM(UrunFiyat)
                FROM SepetUrunleri
                WHERE SepetID = ?
            )
            WHERE SepetID = ?;
        `;
        await runQuery(updateCartPriceQuery, [sepetID, sepetID]);

        res.json({ success: true, message: 'Ürün sepete güncellendi.', sepetID });
    } catch (error) {
        console.error('Sepet güncellenirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Sepete ekleme veya güncelleme başarısız.' });
    }
});

// Sepetten Ürün Silme (DELETE)
router.delete('/sepet/:urunAdi', async (req, res) => {
    const { urunAdi } = req.params;
    const kullaniciID = 1000; // Sabit kullanıcı ID'si

    try {
        const query = `
            DELETE FROM Sepet 
            WHERE KullaniciID = ? 
            AND UrunID = (SELECT UrunID FROM Urun WHERE UrunAdi = ?);
        `;
        await runQuery(query, [kullaniciID, urunAdi]);

        res.json({ success: true });
    } catch (error) {
        console.error('Ürün sepetten silinirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Ürün silinemedi.' });
    }
});

router.put('/sepet/:urunID', async (req, res) => {
    const urunID = parseInt(req.params.urunID);
    const { delta, kullaniciID } = req.body;

    // Geçersiz verileri kontrol et
    if (isNaN(urunID) || isNaN(delta)) {
        return res.status(400).json({ success: false, message: "Geçersiz urunID veya delta değeri." });
    }

    try {
        // Sepet tablosundaki UrunSayisi'nı güncelle
        const updateQuery = `
            UPDATE SepetUrunleri 
            SET UrunSayisi = UrunSayisi + ?, 
                UrunFiyat = UrunFiyat + (SELECT UrunFiyat FROM Urun WHERE UrunID = ?) * ? 
            WHERE UrunID = ? AND SepetID = (SELECT SepetID FROM Sepet WHERE KullaniciID = ?);
        `;
        await runQuery(updateQuery, [delta, urunID, delta, urunID, kullaniciID]);

        // Eğer ürün miktarı sıfıra düşerse ürünü sepetten kaldır
        const deleteQuery = `
            DELETE FROM SepetUrunleri 
            WHERE UrunSayisi <= 0 AND UrunID = ? AND SepetID = (SELECT SepetID FROM Sepet WHERE KullaniciID = ?);
        `;
        await runQuery(deleteQuery, [urunID, kullaniciID]);

        res.json({ success: true, message: 'Ürün miktarı güncellendi.' });
    } catch (error) {
        console.error('Sepet güncellenirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Sepet güncellenemedi.' });
    }
});


module.exports = router;
