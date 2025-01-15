const express = require('express');
const router = express.Router();
const {runQuery, checkUser, addUser } = require('./sql');

// ------------------ // GİRİŞ KAYIT APİSİ // ------------------ //
router.post('/login', async (req, res) => {
    const { mail, password } = req.body;
    try {
        const user = await checkUser(mail, password);
        if (user.length > 0) {
            req.session.userID = user[0].KullaniciID;
            res.json({ success: true, user: user[0] });
        } else {
            res.json({ success: false, message: 'Kullanıcı adı veya şifre hatalı!' });
        }
    } catch (err) {
        console.error('Giriş hatası:', err.message);
        res.status(500).send({ success: false, message: 'Sunucu hatası, giriş başarısız.' });
    }
});

router.get('/kullanici', (req, res) => {
    if (req.session.userID) {
        res.json({ success: true, userID: req.session.userID });
    } else {
        res.json({ success: false, message: 'Kullanıcı girişi yapılmamış.' });
    }
});

router.get('/kullanicibilgi', async (req, res) => {
    const kullaniciID = req.session.userID; // Oturumdaki kullanıcı ID

    if (!kullaniciID) {
        return res.status(401).json({ success: false, message: 'Giriş yapılmamış.' });
    }

    try {
        const query = `
            SELECT Ad, Soyad, Mail
            FROM kullanici
            WHERE KullaniciID = ?;
        `;
        const [kullanici] = await runQuery(query, [kullaniciID]);

        if (!kullanici) {
            return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        res.json({ success: true, kullanici });
    } catch (error) {
        console.error('Kullanıcı bilgileri alınırken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Sunucu hatası.' });
    }
});


router.post('/register', async (req, res) => {
    const { ad, soyad, mail, telefon, password } = req.body;

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

// ------------------ // ÖZEL ÜRÜN ÇEKME APİSİ // ------------------ //
router.get('/urunler/detay/:urunID', async (req, res) => {
    const { urunID } = req.params; 

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
                Urun.UrunID = ?;
        `;
        const urun = await runQuery(query, [urunID]); 
        res.json(urun[0]); 
    } catch (error) {
        console.error('Veritabanı hatası:', error.message);
        res.status(500).json({ error: 'Ürün bilgisi alınırken bir hata oluştu.' });
    }
});

// ------------------ // ARAMA YAPARAK ÜRÜN ÇEKME APİSİ // ------------------ //
router.get('/ara/urun', async (req, res) => {
    const { arama } = req.query;

    if (!arama) {
        return res.status(400).json({ success: false, message: 'Arama terimi belirtilmedi.' });
    }

    try {
        const query = `
            SELECT 
                UrunID,
                Kategori,
                UrunFiyat,
                Gorsel,
                UrunAdi,
                Stok,
                Aciklama
            FROM 
                Urun
            WHERE 
                UrunAdi LIKE ? OR Aciklama LIKE ?;
        `;

        const aramaTerimi = `%${arama}%`;
        const urunler = await runQuery(query, [aramaTerimi, aramaTerimi]);

        res.json({ success: true, urunler });
    } catch (error) {
        console.error('Arama sırasında hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Ürünler aranırken bir hata oluştu.' });
    }
});

// ------------------ // ADRES ÇEKME APİSİ // ------------------ //
router.get('/adresler', async (req, res) => {
    const kullaniciID = req.session.userID;

    try {
        const query = `
            SELECT 
                AdresID, 
                AdresBaslik, 
                AdresAciklama, 
                Sehir, 
                Ilce, 
                SecilenAdres
            FROM 
                Adres
            WHERE 
                KullaniciID = ?
            ORDER BY 
                SecilenAdres DESC; 
        `;

        const adresler = await runQuery(query, [kullaniciID]);

        if (adresler.length > 0) {
            res.json({ success: true, adresler });
        } else {
            res.json({ success: false, message: 'Adres bulunamadı.' });
        }
    } catch (error) {
        console.error('Adresler çekilirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Adres verileri alınamadı.' });
    }
});

// ------------------ // ADRES EKLEME APİSİ // ------------------ //
router.post('/adresler', async (req, res) => {
    const { adresBaslik, adresAciklama, sehir, ilce } = req.body;
    const kullaniciID = req.session.userID;

    if (!adresBaslik || !adresAciklama || !sehir || !ilce) {
        return res.status(400).json({ success: false, message: 'Tüm alanlar zorunludur.' });
    }

    try {
        const countQuery = `
            SELECT COUNT(*) AS adresSayisi
            FROM Adres
            WHERE KullaniciID = ?;
        `;
        const result = await runQuery(countQuery, [kullaniciID]);
        const adresSayisi = result[0].adresSayisi;

        if (adresSayisi >= 5) {
            return res.status(400).json({ success: false, message: 'En fazla 5 adres ekleyebilirsiniz.' });
        }

        const resetQuery = `
            UPDATE Adres
            SET SecilenAdres = false
            WHERE KullaniciID = ?;
        `;
        await runQuery(resetQuery, [kullaniciID]);

        const insertQuery = `
            INSERT INTO Adres (KullaniciID, AdresBaslik, AdresAciklama, Sehir, Ilce, SecilenAdres)
            VALUES (?, ?, ?, ?, ?, true);
        `;
        await runQuery(insertQuery, [kullaniciID, adresBaslik, adresAciklama, sehir, ilce]);

        res.json({ success: true, message: 'Adres başarıyla eklendi.' });
    } catch (error) {
        console.error('Adres eklerken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Adres eklenemedi.' });
    }
});


// ------------------ // ADRES GÜNCELLEME APİSİ // ------------------ //
router.put('/adresler/:adresID', async (req, res) => {
    const adresID = req.params.adresID;
    const { adresBaslik, adresAciklama, sehir, ilce } = req.body;

    if (!adresBaslik || !adresAciklama || !sehir || !ilce) {
        return res.status(400).json({ success: false, message: 'Tüm alanlar zorunludur.' });
    }

    try {
        const query = `
            UPDATE Adres
            SET AdresBaslik = ?, AdresAciklama = ?, Sehir = ?, Ilce = ?
            WHERE AdresID = ?;
        `;
        await runQuery(query, [adresBaslik, adresAciklama, sehir, ilce, adresID]);

        res.json({ success: true, message: 'Adres başarıyla güncellendi.' });
    } catch (error) {
        console.error('Adres güncellenirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Adres güncellenemedi.' });
    }
});

// ------------------ // ADRES SİLME APİSİ // ------------------ //
router.delete('/adresler/:adresID', async (req, res) => {
    const adresID = req.params.adresID; 

    try {
        const query = `
            DELETE FROM Adres
            WHERE AdresID = ?;
        `;
        const result = await runQuery(query, [adresID]);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Adres başarıyla silindi.' });
        } else {
            res.status(404).json({ success: false, message: 'Adres bulunamadı.' });
        }
    } catch (error) {
        console.error('Adres silinirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Adres silinemedi.' });
    }
});


// ------------------ // SEÇİLEN ADRES ÇEKME APİSİ // ------------------ //
router.put('/adresler/secilen', async (req, res) => {
    const { adresID } = req.body;
    const kullaniciID = req.session.userID; 

    try {
        const resetQuery = `
            UPDATE Adres
            SET SecilenAdres = false
            WHERE KullaniciID = ?;
        `;
        await runQuery(resetQuery, [kullaniciID]);

        const updateQuery = `
            UPDATE Adres
            SET SecilenAdres = true
            WHERE AdresID = ? AND KullaniciID = ?;
        `;
        await runQuery(updateQuery, [adresID, kullaniciID]);

        res.json({ success: true, message: 'Seçilen adres başarıyla güncellendi.' });
    } catch (error) {
        console.error('Seçilen adres güncellenirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Seçilen adres güncellenemedi.' });
    }
});

// ------------------ // ÜRÜN ÇEKME APİSİ // ------------------ //
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
        const urunler = await runQuery(query, [kategori]); 
        res.json(urunler); 
    } catch (error) {
        console.error('Veritabanı hatası:', error.message);
        res.status(500).json({ error: 'Ürünler alınırken bir hata oluştu.' });
    }
});

// ------------------ // SEPET ÇEKME APİSİ // ------------------ //
router.get('/sepet', async (req, res) => {
    try {
        const kullaniciID = req.session.userID; 
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

// ------------------ // SEPETE VERİ GÖNDERME APİSİ // ------------------ //
router.post('/sepet', async (req, res) => {
    let { kullaniciID, urunID, urunSayisi } = req.body;

    try {
        if (!kullaniciID) {
            kullaniciID = req.session.userID; 
        }

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

        let orijinalFiyat = parseFloat(urun.UrunFiyat);
        let indirimliFiyat = urun.IndirimOrani > 0
            ? orijinalFiyat * (1 - urun.IndirimOrani / 100)
            : orijinalFiyat;

        const toplamFiyat = (indirimliFiyat * urunSayisi).toFixed(2);

        const addOrUpdateProductQuery = `
            INSERT INTO SepetUrunleri (SepetID, UrunID, UrunSayisi, UrunFiyat)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            UrunSayisi = UrunSayisi + VALUES(UrunSayisi),
            UrunFiyat = UrunFiyat + VALUES(UrunFiyat);
        `;
        await runQuery(addOrUpdateProductQuery, [sepetID, urunID, urunSayisi, toplamFiyat]);

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


// ------------------ // SEPETTEKİ ÜRÜNÜ SİLME APİSİ // ------------------ //
router.delete('/sepet/:urunID', async (req, res) => {
    const urunID = parseInt(req.params.urunID);
    const kullaniciID = req.session.userID; 
    try {
        const sepetQuery = `SELECT SepetID FROM Sepet WHERE KullaniciID = ?;`;
        const [sepet] = await runQuery(sepetQuery, [kullaniciID]);

        if (!sepet) {
            return res.status(400).json({ success: false, message: 'Sepet bulunamadı.' });
        }

        const sepetID = sepet.SepetID;

        const deleteQuery = `DELETE FROM SepetUrunleri WHERE UrunID = ? AND SepetID = ?;`;
        const deleted = await runQuery(deleteQuery, [urunID, sepetID]);

        if (deleted.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Ürün bulunamadı.' });
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

        res.json({ success: true });
    } catch (error) {
        console.error('Ürün sepetten silinirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Ürün silinemedi.' });
    }
});

// ------------------ // SEPETTE ÜRÜN GÜNCELLEME APİSİ // ------------------ //
router.put('/sepet/:urunID', async (req, res) => {
    const urunID = parseInt(req.params.urunID);
    const { delta } = req.body;
    const kullaniciID = req.session.userID;

    try {
        const sepetQuery = `SELECT SepetID FROM Sepet WHERE KullaniciID = ?;`;
        const [sepet] = await runQuery(sepetQuery, [kullaniciID]);

        if (!sepet) {
            return res.status(400).json({ success: false, message: 'Sepet bulunamadı.' });
        }

        const sepetID = sepet.SepetID;

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
        if (yeniMiktar < 1) {
            return res.status(400).json({ success: false, message: 'Miktar geçersiz.' });
        }

        const orijinalFiyat = parseFloat(urun.UrunFiyat);
        let indirimliFiyat = urun.IndirimOrani > 0
            ? orijinalFiyat * (1 - urun.IndirimOrani / 100)
            : orijinalFiyat;

        const toplamFiyat = (indirimliFiyat * yeniMiktar).toFixed(2);

        const updateQuery = `
            UPDATE SepetUrunleri
            SET UrunSayisi = ?, UrunFiyat = ?
            WHERE UrunID = ? AND SepetID = ?;
        `;
        await runQuery(updateQuery, [yeniMiktar, toplamFiyat, urunID, sepetID]);

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

// ------------------ // SEPETE ÜRÜN EKLEME APİSİ // ------------------ //
router.post('/sepet/ekle/:urunID', async (req, res) => {
    const urunID = parseInt(req.params.urunID);
    const { kullaniciID, urunSayisi } = req.body;

    try {
        const sepetQuery = `SELECT SepetID FROM Sepet WHERE KullaniciID = ?;`;
        let [sepet] = await runQuery(sepetQuery, [kullaniciID]);

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

        const orijinalFiyat = parseFloat(urun.UrunFiyat);
        const indirimliFiyat = urun.IndirimOrani > 0
            ? (orijinalFiyat * (1 - urun.IndirimOrani / 100))
            : orijinalFiyat;

        const toplamFiyat = (indirimliFiyat * urunSayisi).toFixed(2);

        const addOrUpdateProductQuery = `
            INSERT INTO SepetUrunleri (SepetID, UrunID, UrunSayisi, UrunFiyat)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            UrunSayisi = UrunSayisi + VALUES(UrunSayisi),
            UrunFiyat = VALUES(UrunFiyat);
        `;
        await runQuery(addOrUpdateProductQuery, [sepetID, urunID, urunSayisi, toplamFiyat]);

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

// ------------------ // FAVORİLER ÇEKME APİSİ // ------------------ //
router.get('/favoriler', async (req, res) => {
    const kullaniciID = req.session.userID;

    if (!kullaniciID) {
        return res.status(401).json({ success: false, message: 'Giriş yapılmamış.' });
    }

    try {
        const query = `
            SELECT UrunID, MIN(EklenmeTarihi) AS EklenmeTarihi
            FROM favoriler
            WHERE KullaniciID = ?
            GROUP BY UrunID;
        `;
        const favoriler = await runQuery(query, [kullaniciID]);
        res.json({ success: true, favoriler });
    } catch (error) {
        console.error('Favoriler alınırken hata:', error.message);
        res.status(500).json({ success: false, message: 'Favoriler alınamadı.' });
    }
});

// ------------------ // FAVORİ KAYITLAMA APİSİ // ------------------ //
router.post('/favoriler', async (req, res) => {
    const kullaniciID = req.session.userID;
    const { urunID } = req.body;

    if (!kullaniciID) {
        return res.status(401).json({ success: false, message: 'Giriş yapılmamış.' });
    }

    try {
        const query = `
            INSERT INTO favoriler (KullaniciID, UrunID, EklenmeTarihi)
            VALUES (?, ?, NOW());
        `;
        await runQuery(query, [kullaniciID, urunID]);
        res.json({ success: true });
    } catch (error) {
        console.error('Favori eklenirken hata:', error.message);
        res.status(500).json({ success: false, message: 'Favori eklenemedi.' });
    }
});

// ------------------ // FAVORİ SİLME APİSİ // ------------------ //
router.delete('/favoriler', async (req, res) => {
    const kullaniciID = req.session.userID;
    const { urunID } = req.body;

    if (!kullaniciID) {
        return res.status(401).json({ success: false, message: 'Giriş yapılmamış.' });
    }

    try {
        const query = `
            DELETE FROM favoriler
            WHERE KullaniciID = ? AND UrunID = ?;
        `;
        await runQuery(query, [kullaniciID, urunID]);
        res.json({ success: true });
    } catch (error) {
        console.error('Favori silinirken hata:', error.message);
        res.status(500).json({ success: false, message: 'Favori silinemedi.' });
    }
});

// ------------------ // KART ÇEKME APİSİ // ------------------ //
router.get('/kartlar', async (req, res) => {
    const kullaniciID = req.session.userID; 

    if (!kullaniciID) {
        return res.status(401).json({ success: false, message: 'Giriş yapılmamış.' });
    }

    try {
        const query = `
            SELECT KartID, KartIsim, KartNumara, SonKullanmaTarih, CVV
            FROM kartlar
            WHERE KullaniciID = ?;
        `;
        const kartlar = await runQuery(query, [kullaniciID]);

        if (kartlar.length > 0) {
            res.json({ success: true, kartlar });
        } else {
            res.json({ success: true, kartlar: [] });
        }
    } catch (error) {
        console.error('Kartlar çekilirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Kartlar alınamadı.' });
    }
});

// ------------------ // KART EKLEME APİSİ // ------------------ //
router.post('/kartlar', async (req, res) => {
    const kullaniciID = req.session.userID;
    const { KartIsim, KartNumara, SonKullanmaTarih, CVV } = req.body;

    if (!kullaniciID) {
        return res.status(401).json({ success: false, message: 'Giriş yapılmamış.' });
    }

    if (!KartIsim || !KartNumara || !SonKullanmaTarih || !CVV) {
        return res.status(400).json({ success: false, message: 'Eksik bilgi!' });
    }

    try {
        const query = `
            INSERT INTO kartlar (KullaniciID, KartIsim, KartNumara, SonKullanmaTarih, CVV)
            VALUES (?, ?, ?, ?, ?);
        `;
        await runQuery(query, [kullaniciID, KartIsim, KartNumara, SonKullanmaTarih, CVV]);

        res.json({ success: true, message: 'Kart başarıyla eklendi!' });
    } catch (error) {
        console.error('Kart eklenirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Kart eklenemedi.' });
    }
});

// ------------------ // KART GÜNCELLEME APİSİ // ------------------ //
router.put('/kartlar/:kartID', async (req, res) => {
    const kullaniciID = req.session.userID;
    const kartID = req.params.kartID; 
    const { KartIsim, KartNumara, SonKullanmaTarih, CVV } = req.body;

    if (!kullaniciID) {
        return res.status(401).json({ success: false, message: 'Giriş yapılmamış.' });
    }

    try {
        const query = `
            UPDATE kartlar
            SET KartIsim = ?, KartNumara = ?, SonKullanmaTarih = ?, CVV = ?
            WHERE KartID = ? AND KullaniciID = ?;
        `;
        const result = await runQuery(query, [KartIsim, KartNumara, SonKullanmaTarih, CVV, kartID, kullaniciID]);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Kart başarıyla güncellendi!' });
        } else {
            res.status(404).json({ success: false, message: 'Kart bulunamadı.' });
        }
    } catch (error) {
        console.error('Kart güncellenirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Kart güncellenemedi.' });
    }
});

// ------------------ // KART SİLME APİSİ // ------------------ //
router.delete('/kartlar/:kartID', async (req, res) => {
    const kullaniciID = req.session.userID;
    const kartID = req.params.kartID;

    if (!kullaniciID) {
        return res.status(401).json({ success: false, message: 'Giriş yapılmamış.' });
    }

    try {
        const query = `
            DELETE FROM kartlar
            WHERE KartID = ? AND KullaniciID = ?;
        `;
        const result = await runQuery(query, [kartID, kullaniciID]);

        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Kart başarıyla silindi!' });
        } else {
            res.status(404).json({ success: false, message: 'Kart bulunamadı.' });
        }
    } catch (error) {
        console.error('Kart silinirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Kart silinemedi.' });
    }
});

module.exports = router;
