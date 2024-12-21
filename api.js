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
        const kullaniciID = 1000; // Varsayılan kullanıcı ID'si
        const query = `
            SELECT 
                SU.UrunID, 
                SU.UrunSayisi, 
                SU.UrunFiyat AS toplamFiyat, 
                U.UrunAdi, 
                U.Gorsel, 
                U.UrunFiyat AS orijinalFiyat,
                COALESCE(I.IndirimOrani, 0) AS IndirimOrani
            FROM 
                SepetUrunleri SU
            INNER JOIN 
                Urun U ON SU.UrunID = U.UrunID
            LEFT JOIN 
                Indirim I ON U.UrunID = I.UrunID
            WHERE 
                SU.SepetID = (SELECT SepetID FROM Sepet WHERE KullaniciID = ?);
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

        // 1. Mevcut sepeti kontrol et
        const findCartQuery = `SELECT SepetID FROM Sepet WHERE KullaniciID = ?;`;
        let [sepet] = await runQuery(findCartQuery, [kullaniciID]);

        let sepetID;
        if (!sepet) {
            const createCartQuery = `
                INSERT INTO Sepet (KullaniciID, SepetFiyat)
                VALUES (?, 0.00);
            `;
            const result = await runQuery(createCartQuery, [kullaniciID]);
            sepetID = result.insertId;
        } else {
            sepetID = sepet.SepetID;
        }

        // 2. Ürün fiyatını ve indirim oranını al
        const getProductQuery = `
            SELECT 
                U.UrunFiyat,
                COALESCE(I.IndirimOrani, 0) AS IndirimOrani
            FROM 
                Urun U
            LEFT JOIN 
                Indirim I ON U.UrunID = I.UrunID
            WHERE 
                U.UrunID = ?;
        `;
        const [urun] = await runQuery(getProductQuery, [urunID]);

        if (!urun) {
            return res.status(400).json({ success: false, message: 'Geçersiz ürün ID.' });
        }

        // 3. İndirim kontrolü ve fiyat hesaplama
        let orijinalFiyat = parseFloat(urun.UrunFiyat);
        let indirimliFiyat = urun.IndirimOrani > 0
            ? (orijinalFiyat * (1 - urun.IndirimOrani / 100)).toFixed(2)
            : orijinalFiyat.toFixed(2);

        const toplamFiyat = (indirimliFiyat * urunSayisi).toFixed(2);

        // 4. Sepete ekleme veya güncelleme
        const addOrUpdateProductQuery = `
            INSERT INTO SepetUrunleri (SepetID, UrunID, UrunSayisi, UrunFiyat)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            UrunSayisi = UrunSayisi + VALUES(UrunSayisi),
            UrunFiyat = VALUES(UrunFiyat);
        `;
        await runQuery(addOrUpdateProductQuery, [sepetID, urunID, urunSayisi, toplamFiyat]);

        // 5. Toplam sepet fiyatını güncelle
        const updateCartPriceQuery = `
            UPDATE Sepet
            SET SepetFiyat = (
                SELECT COALESCE(SUM(UrunFiyat), 0)
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

router.delete('/sepet/:urunID', async (req, res) => {
    const urunID = parseInt(req.params.urunID);
    const kullaniciID = 1000; // Sabit kullanıcı ID'si

    try {
        // 1. Sepet ID'sini al
        const sepetQuery = `SELECT SepetID FROM Sepet WHERE KullaniciID = ?;`;
        const [sepet] = await runQuery(sepetQuery, [kullaniciID]);

        if (!sepet) {
            return res.status(400).json({ success: false, message: 'Sepet bulunamadı.' });
        }

        const sepetID = sepet.SepetID;

        // 2. Ürünü sil
        const deleteQuery = `DELETE FROM SepetUrunleri WHERE UrunID = ? AND SepetID = ?;`;
        await runQuery(deleteQuery, [urunID, sepetID]);

        // 3. Toplam sepet fiyatını güncelle
        const updateCartPriceQuery = `
            UPDATE Sepet
            SET SepetFiyat = (
                SELECT COALESCE(SUM(UrunFiyat), 0)
                FROM SepetUrunleri
                WHERE SepetID = ?
            )
            WHERE SepetID = ?;
        `;
        await runQuery(updateCartPriceQuery, [sepetID, sepetID]);

        res.json({ success: true });
    } catch (error) {
        console.error('Ürün sepetten silinirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Ürün silinemedi.' });
    }
});

router.put('/sepet/:urunID', async (req, res) => {
    const urunID = parseInt(req.params.urunID);
    const { delta, kullaniciID } = req.body;

    try {
        // 1. Sepet ID'sini al
        const sepetQuery = `SELECT SepetID FROM Sepet WHERE KullaniciID = ?;`;
        const [sepet] = await runQuery(sepetQuery, [kullaniciID]);

        if (!sepet) {
            return res.status(400).json({ success: false, message: 'Sepet bulunamadı.' });
        }

        const sepetID = sepet.SepetID;

        // 2. Ürün kontrolü
        const getProductQuery = `
            SELECT SU.UrunSayisi, U.UrunFiyat, COALESCE(I.IndirimOrani, 0) AS IndirimOrani
            FROM SepetUrunleri SU
            INNER JOIN Urun U ON SU.UrunID = U.UrunID
            LEFT JOIN Indirim I ON U.UrunID = I.UrunID
            WHERE SU.UrunID = ? AND SU.SepetID = ?;
        `;
        const [urun] = await runQuery(getProductQuery, [urunID, sepetID]);

        if (!urun) {
            return res.status(400).json({ success: false, message: 'Ürün sepette bulunamadı.' });
        }

        let yeniMiktar = urun.UrunSayisi + delta;

        // Fiyat hesapla
        const orijinalFiyat = parseFloat(urun.UrunFiyat);
        let indirimliFiyat = urun.IndirimOrani > 0
            ? (orijinalFiyat * (1 - urun.IndirimOrani / 100))
            : orijinalFiyat;

        const toplamFiyat = (indirimliFiyat * yeniMiktar).toFixed(2);

        if (yeniMiktar <= 0) {
            const deleteQuery = `DELETE FROM SepetUrunleri WHERE UrunID = ? AND SepetID = ?;`;
            await runQuery(deleteQuery, [urunID, sepetID]);
        } else {
            const updateQuery = `
                UPDATE SepetUrunleri
                SET UrunSayisi = ?, UrunFiyat = ?
                WHERE UrunID = ? AND SepetID = ?;
            `;
            await runQuery(updateQuery, [yeniMiktar, toplamFiyat, urunID, sepetID]);
        }

        const updateCartPriceQuery = `
            UPDATE Sepet
            SET SepetFiyat = (
                SELECT COALESCE(SUM(UrunFiyat), 0)
                FROM SepetUrunleri
                WHERE SepetID = ?
            )
            WHERE SepetID = ?;
        `;
        await runQuery(updateCartPriceQuery, [sepetID, sepetID]);

        res.json({ success: true, message: 'Ürün güncellendi.' });
    } catch (error) {
        console.error('Sepet güncellenirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Sepet güncellenemedi.' });
    }
});

router.post('/sepet/ekle/:urunID', async (req, res) => {
    const urunID = parseInt(req.params.urunID);
    const { kullaniciID, urunSayisi } = req.body;

    try {
        // 1. Sepet ID'sini al veya oluştur
        const sepetQuery = `SELECT SepetID FROM Sepet WHERE KullaniciID = ?;`;
        let [sepet] = await runQuery(sepetQuery, [kullaniciID]);

        let sepetID;
        if (!sepet) {
            const createCartQuery = `
                INSERT INTO Sepet (KullaniciID, SepetFiyat)
                VALUES (?, 0.00);
            `;
            const result = await runQuery(createCartQuery, [kullaniciID]);
            sepetID = result.insertId; // Yeni oluşturulan sepet ID'si
        } else {
            sepetID = sepet.SepetID; // Mevcut sepet ID'si
        }

        // 2. Ürün bilgilerini al
        const getProductQuery = `
            SELECT U.UrunFiyat, COALESCE(I.IndirimOrani, 0) AS IndirimOrani
            FROM Urun U
            LEFT JOIN Indirim I ON U.UrunID = I.UrunID
            WHERE U.UrunID = ?;
        `;
        const [urun] = await runQuery(getProductQuery, [urunID]);

        if (!urun) {
            return res.status(400).json({ success: false, message: 'Geçersiz ürün ID.' });
        }

        // 3. İndirim kontrolü ve fiyat hesaplama
        const orijinalFiyat = parseFloat(urun.UrunFiyat);
        const indirimliFiyat = urun.IndirimOrani > 0
            ? (orijinalFiyat * (1 - urun.IndirimOrani / 100))
            : orijinalFiyat;

        const toplamFiyat = (indirimliFiyat * urunSayisi).toFixed(2);

        // 4. Sepete ürünü ekle veya güncelle
        const addOrUpdateProductQuery = `
            INSERT INTO SepetUrunleri (SepetID, UrunID, UrunSayisi, UrunFiyat)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            UrunSayisi = UrunSayisi + VALUES(UrunSayisi),
            UrunFiyat = VALUES(UrunFiyat);
        `;
        await runQuery(addOrUpdateProductQuery, [sepetID, urunID, urunSayisi, toplamFiyat]);

        // 5. Sepet toplam fiyatını güncelle
        const updateCartPriceQuery = `
            UPDATE Sepet
            SET SepetFiyat = (
                SELECT COALESCE(SUM(UrunFiyat), 0)
                FROM SepetUrunleri
                WHERE SepetID = ?
            )
            WHERE SepetID = ?;
        `;
        await runQuery(updateCartPriceQuery, [sepetID, sepetID]);

        res.json({ success: true, message: 'Ürün sepete eklendi.', sepetID });
    } catch (error) {
        console.error('Ürün eklenirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Ürün eklenemedi.' });
    }
});


module.exports = router;
