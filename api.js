const express = require('express');
const router = express.Router();
const { runQuery, checkUser, addUser } = require('./sql');
const multer = require('multer');
const nodemailer = require("nodemailer");

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

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Oturum sonlandırılamadı');
        }
        res.clearCookie('connect.sid');
        res.status(200).send('Çıkış yapıldı');
    });
});


router.get('/kullanici', (req, res) => {
    if (req.session.userID) {
        res.json({ success: true, userID: req.session.userID });
    } else {
        res.json({ success: false, message: 'Kullanıcı girişi yapılmamış.' });
    }
});

router.get('/kullanicibilgi', async (req, res) => {
    const kullaniciID = req.session.userID;

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

router.get('/kategori/:urunAdi', async (req, res) => {
    const { urunAdi } = req.params;

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
                Urun.UrunAdi = ?;
        `;
        const urun = await runQuery(query, [urunAdi]);
        
        if (urun.length === 0) {
            return res.status(404).json({ message: 'Ürün bulunamadı.' });
        }

        res.json(urun[0]);
    } catch (error) {
        console.error('Veritabanı hatası:', error.message);
        res.status(500).json({ error: 'Ürün bilgisi alınırken bir hata oluştu.' });
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
router.put('/adres/secilen', async (req, res) => {
    const { adresID } = req.body;
    const kullaniciID = req.session.userID;

    if (!adresID) {
        return res.status(400).json({ success: false, message: 'AdresID eksik!' });
    }

    if (!kullaniciID) {
        return res.status(401).json({ success: false, message: 'Kullanıcı oturumu bulunamadı!' });
    }

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
        const result = await runQuery(updateQuery, [adresID, kullaniciID]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Adres bulunamadı veya güncellenemedi!' });
        }

        res.json({ success: true, message: 'Seçilen adres başarıyla güncellendi.' });
    } catch (error) {
        console.error('Seçilen adres güncellenirken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Sunucu hatası.' });
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
          COALESCE(I.IndirimOrani, 0) AS IndirimOrani,
          (SELECT S.SepetFiyat FROM Sepet S WHERE S.SepetID = SU.SepetID) AS SepetFiyat 
        FROM 
          SepetUrunleri SU
        INNER JOIN 
          Urun U ON SU.UrunID = U.UrunID
        LEFT JOIN 
          Indirim I ON U.UrunID = I.UrunID
        WHERE 
          SU.SepetID = (SELECT SepetID FROM Sepet WHERE KullaniciID = ? AND SepetAktif = 1);
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
    let { kullaniciID, urunID, urunFiyat } = req.body;

    try {
        if (!kullaniciID) {
            kullaniciID = req.session.userID;
        }

        if (!kullaniciID) {
            return res.status(401).json({ success: false, message: 'Kullanıcı oturum açmamış.' });
        }

        const findCartQuery = `SELECT SepetID FROM Sepet WHERE KullaniciID = ? AND SepetAktif = 1;`;
        let [sepet] = await runQuery(findCartQuery, [kullaniciID]);

        let sepetID;
        if (!sepet) {
            const createCartQuery = `
                INSERT INTO Sepet (KullaniciID, SepetFiyat, SepetAktif)
                VALUES (?, 0.00, 1);
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
            return res.status(404).json({ success: false, message: 'Ürün bulunamadı.' });
        }

        let orijinalFiyat = parseFloat(urun.UrunFiyat);
        let indirimliFiyat = urun.IndirimOrani > 0
            ? orijinalFiyat * (1 - urun.IndirimOrani / 100)
            : orijinalFiyat;

        const toplamFiyat = (indirimliFiyat * 1).toFixed(2); 

        const checkProductQuery = `
            SELECT UrunSayisi, UrunFiyat 
            FROM SepetUrunleri 
            WHERE SepetID = ? AND UrunID = ?
        `;
        const [existingProduct] = await runQuery(checkProductQuery, [sepetID, urunID]);

        if (existingProduct) {
            const updateProductQuery = `
                UPDATE SepetUrunleri 
                SET UrunSayisi = UrunSayisi + 1, 
                    UrunFiyat = UrunFiyat + ? 
                WHERE SepetID = ? AND UrunID = ?
            `;
            await runQuery(updateProductQuery, [urunFiyat, sepetID, urunID]);
        } else {
            const insertProductQuery = `
                INSERT INTO SepetUrunleri (SepetID, UrunID, UrunSayisi, UrunFiyat) 
                VALUES (?, ?, 1, ?)
            `;
            await runQuery(insertProductQuery, [sepetID, urunID, urunFiyat]);
        }

        const updateCartPriceQuery = `
            UPDATE Sepet
            SET SepetFiyat = (
                SELECT SUM(UrunFiyat)
                FROM SepetUrunleri
                WHERE SepetID = ?
            )
            WHERE SepetID = ? AND SepetAktif = 1;
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
        const sepetQuery = `SELECT SepetID FROM Sepet WHERE KullaniciID = ? AND SepetAktif = 1;`;
        const [sepet] = await runQuery(sepetQuery, [kullaniciID]);

        if (!sepet) {
            return res.status(400).json({ success: false, message: 'Aktif sepet bulunamadı.' });
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
            WHERE SepetID = ? AND SepetAktif = 1;
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
        const sepetQuery = `SELECT SepetID FROM Sepet WHERE KullaniciID = ? AND SepetAktif = 1;`;
        const [sepet] = await runQuery(sepetQuery, [kullaniciID]);

        if (!sepet) {
            return res.status(400).json({ success: false, message: 'Aktif sepet bulunamadı.' });
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
        if (yeniMiktar <= 0) {
            const deleteQuery = `DELETE FROM SepetUrunleri WHERE UrunID = ? AND SepetID = ?;`;
            await runQuery(deleteQuery, [urunID, sepetID]);
        } else {
            const updateQuery = `UPDATE SepetUrunleri SET UrunSayisi = ? WHERE UrunID = ? AND SepetID = ?;`;
            await runQuery(updateQuery, [yeniMiktar, urunID, sepetID]);
        }

        const updateCartPriceQuery = `
            UPDATE Sepet
            SET SepetFiyat = (
                SELECT COALESCE(SUM(UrunFiyat), 0)
                FROM SepetUrunleri
                WHERE SepetID = ?
            )
            WHERE SepetID = ? AND SepetAktif = 1;
        `;
        await runQuery(updateCartPriceQuery, [sepetID, sepetID]);

        res.json({ success: true, message: 'Sepet güncellendi.' });
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

router.post('/yorum-puan', async (req, res) => {
    const kullaniciID = req.session.userID;
    const {siparisID, puan, yorum } = req.body;

    if (!kullaniciID || !siparisID || !puan) {
        return res.status(400).json({ success: false, message: 'Eksik veri gönderildi.' });
    }

    try {
        const query = `
            INSERT INTO yorumpuan (KullaniciID, SiparisID, Puan, Yorum)
            VALUES (?, ?, ?, ?)
        `;
        const result = await runQuery(query, [kullaniciID, siparisID, puan, yorum]);

        if (result.affectedRows > 0) {
            return res.status(200).json({ success: true, message: 'Yorum ve puan başarıyla kaydedildi.' });
        } else {
            return res.status(500).json({ success: false, message: 'Yorum ve puan kaydedilemedi.' });
        }
    } catch (error) {
        console.error('Veritabanı hatası:', error.message);
        return res.status(500).json({ success: false, message: 'Sunucu hatası oluştu.' });
    }
});

router.get('/siparisler-cek', async (req, res) => {
    const kullaniciID = req.session.userID;

    if (!kullaniciID) {
        return res.status(401).json({ success: false, message: 'Giriş yapılmamış.' });
    }

    try {
        const query = `
            SELECT SiparisID, SepetID, ToplamFiyat AS ToplamTutar, Tarih AS SiparisTarihi,
            (SELECT COUNT(*) FROM yorumpuan WHERE SiparisID = siparis.SiparisID) AS Puanlanmis
            FROM siparis
            WHERE SepetID IN (
                SELECT SepetID
                FROM sepet
                WHERE KullaniciID = ?
            )
            ORDER BY Tarih DESC;
        `;
        const siparisler = await runQuery(query, [kullaniciID]);

        siparisler.forEach(siparis => {
            siparis.Puanlanmis = siparis.Puanlanmis > 0;
        });

        if (siparisler.length > 0) {
            res.json({ success: true, siparisler });
        } else {
            res.json({ success: true, siparisler: [] });
        }
    } catch (error) {
        console.error('Siparişler alınırken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Siparişler alınamadı.' });
    }
});

router.get('/siparisler-cek/detay/:siparisID', async (req, res) => {
    const kullaniciID = req.session.userID;
    const siparisID = req.params.siparisID;

    if (!kullaniciID) {
        return res.status(401).json({ success: false, message: 'Giriş yapılmamış.' });
    }

    try {
        const siparisQuery = `
            SELECT SepetID
            FROM siparis
            WHERE SiparisID = ? AND EXISTS (
                SELECT 1 FROM sepet WHERE SepetID = siparis.SepetID AND KullaniciID = ?
            );
        `;
        const siparis = await runQuery(siparisQuery, [siparisID, kullaniciID]);

        if (siparis.length === 0) {
            return res.status(403).json({ success: false, message: 'Bu sipariş size ait değil.' });
        }

        const sepetID = siparis[0].SepetID;

        const urunQuery = `
            SELECT su.UrunID, su.UrunSayisi AS Adet, su.UrunFiyat AS Fiyat, u.UrunAdi, u.Aciklama, u.Gorsel
            FROM sepeturunleri AS su
            JOIN urun AS u ON su.UrunID = u.UrunID
            WHERE su.SepetID = ?;
        `;
        const urunler = await runQuery(urunQuery, [sepetID]);

        if (urunler.length > 0) {
            res.json({ success: true, urunler });
        } else {
            res.json({ success: false, message: 'Siparişe ait ürün bulunamadı.' });
        }
    } catch (error) {
        console.error('Sipariş detayları alınırken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Sipariş detayları alınamadı.' });
    }
});

router.get('/siparis-puanlari', async (req, res) => {
    const kullaniciID = req.session.userID;

    if (!kullaniciID) {
        return res.status(401).json({ success: false, message: 'Giriş yapılmamış.' });
    }

    try {
        const query = `
            SELECT yp.SiparisID, yp.Puan, yp.Yorum, s.Tarih AS SiparisTarihi
            FROM yorumpuan AS yp
            JOIN siparis AS s ON yp.SiparisID = s.SiparisID
            WHERE yp.KullaniciID = ?
            ORDER BY s.Tarih DESC;
        `;
        const puanlar = await runQuery(query, [kullaniciID]);

        if (puanlar.length > 0) {
            res.json({ success: true, puanlar });
        } else {
            res.json({ success: true, puanlar: [] });
        }
    } catch (error) {
        console.error('Puanlar alınırken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Puanlar alınamadı.' });
    }
});


router.post('/siparis-olustur', async (req, res) => {
    const kullaniciId = req.session.userID;

    try {
        const sepetQuery = `
            SELECT SepetID 
            FROM sepet 
            WHERE KullaniciID = ? AND SepetAktif = 1
        `;
        const sepetResult = await runQuery(sepetQuery, [kullaniciId]);

        if (sepetResult.length === 0) {
            return res.status(400).json({ success: false, message: 'Aktif sepet bulunamadı.' });
        }

        const sepetId = sepetResult[0].SepetID;

        const sepetUrunleriQuery = `
            SELECT su.UrunID, su.UrunSayisi, u.Stok, u.UrunAdi 
            FROM sepeturunleri su
            INNER JOIN urun u ON su.UrunID = u.UrunID
            WHERE su.SepetID = ?
        `;
        const sepetUrunleri = await runQuery(sepetUrunleriQuery, [sepetId]);

        const yetersizStok = sepetUrunleri.find(item => item.UrunSayisi > item.Stok);

        if (yetersizStok) {
            return res.status(400).json({
                success: false,
                message: `Stok yetersiz: ${yetersizStok.UrunAdi} (${yetersizStok.UrunSayisi} isteniyor, stok: ${yetersizStok.Stok}).`
            });
        }

        const siparisQuery = `
            INSERT INTO siparis (SepetID, ToplamFiyat, Durum, Tarih, Adres) 
            VALUES (?, (SELECT SepetFiyat FROM sepet WHERE SepetID = ?), 'Hazırlandı', NOW(), 
            (
                SELECT CONCAT(AdresAciklama, ', ', Ilce, '/', Sehir) 
                FROM adres
                INNER JOIN kullanici ON adres.KullaniciID = kullanici.KullaniciID
                WHERE kullanici.KullaniciID = ? AND adres.SecilenAdres = 1
            ))
        `;
        await runQuery(siparisQuery, [sepetId, sepetId, kullaniciId]);

        const stokDusurQuery = `
            UPDATE urun
            SET Stok = Stok - ?
            WHERE UrunID = ?
        `;
        for (const item of sepetUrunleri) {
            await runQuery(stokDusurQuery, [item.UrunSayisi, item.UrunID]);
        }

        const updateSepetQuery = `
            UPDATE sepet 
            SET SepetAktif = 0 
            WHERE SepetID = ?
        `;
        await runQuery(updateSepetQuery, [sepetId]);

        const newSepetQuery = `
            INSERT INTO sepet (KullaniciID, SepetFiyat, SepetAktif)
            VALUES (?, 0.00, true)
        `;
        await runQuery(newSepetQuery, [kullaniciId]);

        return res.json({ success: true, message: 'Sipariş başarıyla oluşturuldu.' });
    } catch (error) {
        console.error('Sipariş oluşturma hatası:', error.message);
        return res.status(500).json({ success: false, message: 'Sipariş oluşturulamadı.' });
    }
});

router.get('/kullanici/siparisler', async (req, res) => {
    const kullaniciId = req.session.userID;

    if (!kullaniciId) {
        return res.status(401).json({ success: false, message: 'Kullanıcı kimliği sağlanamadı.' });
    }

    try {
        const query = `
            SELECT 
                siparis.SiparisID AS id,
                siparis.Tarih AS tarih,
                siparis.Durum AS durum,
                siparis.TeslimatKodu AS teslimatKodu,
                siparis.VarisSuresi AS varis,
                kullanici.Ad AS ad,
                kullanici.Soyad AS soyad,
                kullanici.Mail AS mail,
                siparis.Adres AS adres 
            FROM siparis
            INNER JOIN sepet ON siparis.SepetID = sepet.SepetID
            INNER JOIN kullanici ON sepet.KullaniciID = kullanici.KullaniciID
            WHERE kullanici.KullaniciID = ?;
        `;

        const results = await runQuery(query, [kullaniciId]);

        if (results.length === 0) {
            return res.json({ success: true, data: [] }); 
        }

        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Kullanıcı siparişleri alınırken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Siparişler alınamadı.' });
    }
});

// ------------------ // KURYE KISMI // ------------------ //

router.get('/siparisler', async (req, res) => {
    try {
        const query = `
            SELECT 
                siparis.SiparisID AS id,
                siparis.Tarih AS tarih,
                siparis.Durum AS durum,
                siparis.TeslimatKodu AS teslimatKodu,
                kullanici.Ad AS ad,
                kullanici.Soyad AS soyad,
                kullanici.Mail AS mail,
                siparis.Adres AS adres 
            FROM siparis
            INNER JOIN sepet ON siparis.SepetID = sepet.SepetID
            INNER JOIN kullanici ON sepet.KullaniciID = kullanici.KullaniciID;
        `;

        const results = await runQuery(query);

        if (results.length === 0) {
            return res.json({ success: true, data: [] }); 
        }

        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Siparişler alınırken hata oluştu:', error.message);
        res.status(500).json({ success: false, message: 'Siparişler alınamadı.' });
    }
});


const generateRandomCode = () => Math.floor(10000 + Math.random() * 90000).toString();

async function dogrulamaKoduMail(alicimail, kod) {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL, 
            pass: "eswh vwws arjt tsgk"   
        }
    });

    let mailOptions = {
        from: process.env.MAIL,
        to: alicimail,
        subject: "Market alışverişiniz için teslimat kodu!",
        text: `Kapınıza gelecek olan kuryeye ${kod}'u söyleyerek siparişinizi teslim alabilirsiniz.` 
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log("E-posta gönderildi: %s", info.messageId);
    } catch (error) {
        console.error("E-posta gönderilemedi:", error);
    }
}

async function siparisBilgilendirmeMail(alicimail, konu, mesaj) {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL, 
            pass: "eswh vwws arjt tsgk"   
        }
    });

    let mailOptions = {
        from: process.env.MAIL,
        to: alicimail,
        subject: konu,
        text: mesaj
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log("E-posta gönderildi: %s", info.messageId);
    } catch (error) {
        console.error("E-posta gönderilemedi:", error);
    }
}

router.post('/siparis/guncelle', async (req, res) => {
    const { siparisId, teslimatKodu, action, varisSuresi } = req.body;

    try {
        if (action === 'teslimAl') {
            if (!varisSuresi) {
                return res.status(400).json({ success: false, message: 'Varış süresi girilmelidir.' });
            }

            const randomCode = generateRandomCode();

            const updateQuery = `
                UPDATE siparis 
                SET Durum = 'Yolda', TeslimatKodu = ?, varissuresi = ? 
                WHERE SiparisID = ?
            `;

            const getmailQuery = `
                SELECT kullanici.Mail 
                FROM kullanici
                INNER JOIN sepet ON kullanici.KullaniciID = sepet.KullaniciID
                INNER JOIN siparis ON sepet.SepetID = siparis.SepetID
                WHERE siparis.SiparisID = ?
            `;
            const mailResult = await runQuery(getmailQuery, [siparisId]);

            if (mailResult.length > 0) {
                const alicimail = mailResult[0].Mail;
                await dogrulamaKoduMail(alicimail, randomCode);
            } else {
                console.error('Kullanıcı e-postası bulunamadı.');
            }

            await runQuery(updateQuery, [randomCode, varisSuresi, siparisId]);

            return res.json({
                success: true,
                message: 'Sipariş "Yolda" olarak güncellendi ve teslimat kodu gönderildi.',
                teslimatKodu: randomCode,
            });

        } else if (action === 'teslimEt') {
            if (!teslimatKodu) {
                return res.status(400).json({ success: false, message: 'Teslimat kodu girilmelidir.' });
            }

            const selectQuery = `
                SELECT TeslimatKodu 
                FROM siparis 
                WHERE SiparisID = ?
            `;
            const result = await runQuery(selectQuery, [siparisId]);

            if (!result.length || result[0].TeslimatKodu !== teslimatKodu) {
                return res.status(400).json({ success: false, message: 'Geçersiz teslimat kodu.' });
            }

            const teslimTarihi = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const updateQuery = `
                UPDATE siparis 
                SET Durum = 'Teslim Edildi', TeslimatKodu = NULL, Tarih = ? 
                WHERE SiparisID = ?
            `;

            const getmailQuery = `
                SELECT kullanici.Mail 
                FROM kullanici
                INNER JOIN sepet ON kullanici.KullaniciID = sepet.KullaniciID
                INNER JOIN siparis ON sepet.SepetID = siparis.SepetID
                WHERE siparis.SiparisID = ?
            `;
            
            const mailResult = await runQuery(getmailQuery, [siparisId]);

            if (mailResult.length > 0) {
                const alicimail = mailResult[0].Mail;
                await siparisBilgilendirmeMail(alicimail, "Siparişiniz Teslim Edildi!", "Siparişiniz başarıyla teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz!");
            } else {
                console.error('Kullanıcı e-postası bulunamadı.');
            }
            await runQuery(updateQuery, [teslimTarihi, siparisId]);

            return res.json({
                success: true,
                message: 'Sipariş başarıyla teslim edildi.',
                teslimTarihi: teslimTarihi,
            });
        }

        return res.status(400).json({ success: false, message: 'Geçersiz işlem.' });
    } catch (error) {
        console.error('Sipariş güncelleme hatası:', error.message);
        res.status(500).json({ success: false, message: 'Sipariş güncellenemedi.' });
    }
});

// SATICI   





// **📌 Multer Konfigürasyonu (Resim Yükleme)**
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.join(__dirname, 'resimler')),
        filename: (req, file, cb) => cb(null, file.originalname)
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // Maksimum 5MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);
        if (extname && mimeType) cb(null, true);
        else cb(new Error('Sadece resim dosyaları yüklenebilir!'));
    }
});

// **📌 Ürün Ekleme**
router.post('/urun', upload.single('Gorsel'), async (req, res) => {
    try {
        const { UrunAdi, UrunFiyat, Aciklama, Kategori, Stok } = req.body;
        const Gorsel = req.file ? req.file.originalname : null;
        if (!Gorsel) return res.status(400).json({ message: 'Görsel yüklenemedi.' });

        await runQuery(`INSERT INTO urun (UrunAdi, UrunFiyat, Aciklama, Kategori, Stok, Gorsel) 
                        VALUES (?, ?, ?, ?, ?, ?)`,
            [UrunAdi, UrunFiyat, Aciklama, Kategori, Stok, Gorsel]);

        res.status(201).json({ message: 'Ürün başarıyla eklendi!' });
    } catch (error) {
        res.status(500).json({ message: 'Ürün eklenemedi.', error: error.message });
    }
});

// **📌 Tüm Ürünleri Listeleme**
router.get('/urun', async (req, res) => {
    try {
        const urunler = await runQuery(`SELECT * FROM urun;`);
        res.json({ success: true, urunler });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ürünler alınamadı.', error: error.message });
    }
});

// **📌 Ürün Silme**
router.delete('/urun/:urunID', async (req, res) => {
    try {
        const { urunID } = req.params;
        await runQuery(`DELETE FROM urun WHERE UrunID = ?`, [urunID]);
        res.json({ success: true, message: 'Ürün başarıyla silindi.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ürün silinemedi.', error: error.message });
    }
});

// **📌 Ürüne Kampanya Ekleme**
router.post('/kampanya-ekle', async (req, res) => {
    try {
        const { urunID, indirimOrani, kampanyaAdi } = req.body;
        if (!urunID || !indirimOrani || !kampanyaAdi) {
            return res.status(400).json({ success: false, message: "Ürün ID, kampanya adı ve indirim oranı zorunludur!" });
        }

        await runQuery(`INSERT INTO indirim (UrunID, IndirimOrani, KampanyaAdi) VALUES (?, ?, ?)`, 
                       [urunID, indirimOrani, kampanyaAdi]);

        res.status(201).json({ success: true, message: "Kampanya başarıyla eklendi!" });
    } catch (error) {
        console.error("Kampanya ekleme hatası:", error.message);
        res.status(500).json({ success: false, message: "Kampanya eklenemedi.", error: error.message });
    }
});

router.get('/kampanya-urun', async (req, res) => {
    try {
        const query = `SELECT UrunID, UrunAdi FROM urun WHERE Stok > 0 ORDER BY UrunAdi ASC;`;
        const urunler = await runQuery(query);

        if (urunler.length === 0) {
            return res.json({ success: false, message: "Hiç ürün bulunamadı.", urunler: [] });
        }

        res.json({ success: true, urunler });
    } catch (error) {
        console.error("Kampanya ürünleri çekilirken hata:", error.message);
        res.status(500).json({ success: false, message: "Ürünler alınırken bir hata oluştu." });
    }
});


router.get('/kampanya', async (req, res) => {
    try {
        const kampanyalar = await runQuery(`
            SELECT i.IndirimID, i.IndirimOrani, i.KampanyaAdi, u.UrunAdi, u.UrunFiyat
            FROM indirim i 
            LEFT JOIN urun u ON i.UrunID = u.UrunID
        `);
        
        res.json({ success: true, kampanyalar });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Kampanyalar alınamadı.', error: error.message });
    }
});



// **📌 Kampanya Silme**
router.delete('/kampanya/:indirimID', async (req, res) => {
    try {
        const { indirimID } = req.params;

        // **Önce kampanyanın gerçekten olup olmadığını kontrol et**
        const checkQuery = `SELECT * FROM indirim WHERE IndirimID = ?`;
        const kampanya = await runQuery(checkQuery, [indirimID]);

        if (kampanya.length === 0) {
            return res.status(404).json({ success: false, message: "Kampanya bulunamadı." });
        }

        // **Kampanyayı sil**
        const deleteQuery = `DELETE FROM indirim WHERE IndirimID = ?`;
        const result = await runQuery(deleteQuery, [indirimID]);

        if (result.affectedRows === 0) {
            return res.status(500).json({ success: false, message: "Kampanya silinemedi. Lütfen tekrar deneyin." });
        }

        res.json({ success: true, message: "Kampanya başarıyla silindi!" });
    } catch (error) {
        console.error('Kampanya silme hatası:', error.message);
        res.status(500).json({ success: false, message: "Kampanya silinemedi.", error: error.message });
    }
});

// Stok Güncelleme
router.put('/urun/stok-guncelle', async (req, res) => {
    const { UrunAdi, yeniStok } = req.body;
    try {
        if (yeniStok < 0 || !UrunAdi.trim()) return res.status(400).json({ message: 'Geçerli bir ürün adı ve stok giriniz.' });
        const result = await runQuery(`UPDATE urun SET Stok = ? WHERE UrunAdi = ?`, [yeniStok, UrunAdi]);
        result.affectedRows ? res.json({ message: 'Stok güncellendi.' }) : res.status(404).json({ message: 'Ürün bulunamadı.' });
    } catch (error) {
        res.status(500).json({ message: 'Stok güncelleme başarısız oldu.' });
    }
});

// Siparişleri Listeleme
router.get('/siparis', async (req, res) => {
    try {
        const siparisler = await runQuery(`
            SELECT 
                sp.SiparisID,
                sp.ToplamFiyat,
                sp.Durum,
                COALESCE(DATE_FORMAT(sp.Tarih, '%Y-%m-%d %H:%i:%s'), 'Tarih bilgisi yok') AS SiparisTarihi,
                COALESCE(k.Ad, 'Bilinmiyor') AS MusteriAdi,
                COALESCE(k.Soyad, '') AS MusteriSoyad,
                COALESCE(GROUP_CONCAT(DISTINCT u.UrunAdi SEPARATOR ', '), 'Ürün bilgisi mevcut değil') AS Urunler
            FROM siparis sp
            JOIN sepet s ON sp.SepetID = s.SepetID
            LEFT JOIN kullanici k ON s.KullaniciID = k.KullaniciID
            LEFT JOIN sepeturunleri su ON s.SepetID = su.SepetID
            LEFT JOIN urun u ON su.UrunID = u.UrunID
            GROUP BY sp.SiparisID, sp.ToplamFiyat, sp.Durum, sp.Tarih, k.Ad, k.Soyad;
        `);

        res.json({ success: true, siparisler });
    } catch (error) {
        console.error("Siparişler çekilirken hata:", error.message);
        res.status(500).json({ success: false, message: "Siparişler alınamadı.", error: error.message });
    }
});

// Yorumları Listeleme
router.get('/musteripuanlari', async (req, res) => {
    try {
        const yorumlar = await runQuery(
            `SELECT yp.YorumID, yp.Puan, yp.Yorum,
       k.Ad AS MusteriAdi, k.Soyad AS MusteriSoyad,
       sp.Tarih AS YorumTarihi,
       GROUP_CONCAT(u.UrunAdi SEPARATOR ', ') AS Urunler
FROM yorumpuan yp
JOIN siparis sp ON yp.SiparisID = sp.SiparisID
JOIN sepet s ON sp.SepetID = s.SepetID
JOIN kullanici k ON s.KullaniciID = k.KullaniciID
JOIN sepeturunleri su ON s.SepetID = su.SepetID
JOIN urun u ON su.UrunID = u.UrunID
WHERE yp.Yorum IS NOT NULL
GROUP BY yp.YorumID, k.Ad, k.Soyad, sp.Tarih, yp.Puan, yp.Yorum;

`);

        res.json({ yorumlar });
    } catch (error) {
        res.status(500).json({ error: 'Müşteri puanları alınamadı.' });
    }
});
router.get('/ara/urun', async (req, res) => {
    const { arama } = req.query;

    if (!arama) {
        return res.status(400).json({ success: false, message: 'Arama terimi belirtilmedi.' });
    }

    try {
        const query = `
            SELECT UrunID, UrunAdi, Aciklama, UrunFiyat, Stok, Gorsel
            FROM urun
            WHERE UrunAdi = ?
            LIMIT 1;
        `;

        const urunler = await runQuery(query, [arama]);

        if (urunler.length === 0) {
            return res.json({ success: false, urunler: [] });
        }

        res.json({ success: true, urunler });
    } catch (error) {
        console.error('Ürün arama hatası:', error.message);
        res.status(500).json({ success: false, message: 'Ürün aranırken bir hata oluştu.' });
    }
});

// Ürün Güncelleme (Görsel Dahil)
const fs = require("fs");

// Ürün Güncelleme (Görsel Dahil)
router.put('/urun/:urunID', upload.single('Gorsel'), async (req, res) => {
    const { urunID } = req.params;
    const { Aciklama, UrunFiyat, Stok } = req.body;
    const yeniGorsel = req.file ? req.file.filename : null;

    if (!Aciklama || !UrunFiyat || Stok < 0) {
        return res.status(400).json({ success: false, message: "Eksik veya hatalı veri!" });
    }

    try {
        let eskiGorsel = await runQuery(`SELECT Gorsel FROM urun WHERE UrunID = ?`, [urunID]);

        if (eskiGorsel.length > 0 && yeniGorsel) {
            let eskiDosyaYolu = path.join(__dirname, "resimler", eskiGorsel[0].Gorsel);
            if (fs.existsSync(eskiDosyaYolu)) {
                fs.unlinkSync(eskiDosyaYolu); // Eski görseli sil
            }
        }

        let query;
        let params;

        if (yeniGorsel) {
            query = `UPDATE urun SET Aciklama = ?, UrunFiyat = ?, Stok = ?, Gorsel = ? WHERE UrunID = ?`;
            params = [Aciklama, UrunFiyat, Stok, yeniGorsel, urunID];
        } else {
            query = `UPDATE urun SET Aciklama = ?, UrunFiyat = ?, Stok = ? WHERE UrunID = ?`;
            params = [Aciklama, UrunFiyat, Stok, urunID];
        }

        const result = await runQuery(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Ürün bulunamadı." });
        }

        res.json({ success: true, message: "Ürün başarıyla güncellendi!" });
    } catch (error) {
        console.error("Ürün güncellenirken hata:", error.message);
        res.status(500).json({ success: false, message: "Ürün güncellenemedi." });
    }
});
// anasayfada yeni sipairşler için
router.get('/yeni-siparisler', async (req, res) => {
    try {
        const siparisler = await runQuery(`
            SELECT 
                sp.SiparisID,
                sp.ToplamFiyat,
                sp.Durum,
                COALESCE(DATE_FORMAT(sp.Tarih, '%Y-%m-%d %H:%i:%s'), 'Tarih bilgisi yok') AS SiparisTarihi,
                COALESCE(k.Ad, 'Bilinmiyor') AS MusteriAdi,
                COALESCE(k.Soyad, '') AS MusteriSoyad,
                COALESCE(GROUP_CONCAT(DISTINCT u.UrunAdi SEPARATOR ', '), 'Ürün bilgisi mevcut değil') AS Urunler
            FROM siparis sp
            JOIN sepet s ON sp.SepetID = s.SepetID
            LEFT JOIN kullanici k ON s.KullaniciID = k.KullaniciID
            LEFT JOIN sepeturunleri su ON s.SepetID = su.SepetID
            LEFT JOIN urun u ON su.UrunID = u.UrunID
            WHERE sp.Durum = 'Hazırlanıyor'
            GROUP BY sp.SiparisID, sp.ToplamFiyat, sp.Durum, sp.Tarih, k.Ad, k.Soyad;
        `);

        res.json({ success: true, siparisler });
    } catch (error) {
        console.error("Yeni siparişler çekilirken hata:", error.message);
        res.status(500).json({ success: false, message: "Yeni siparişler alınamadı.", error: error.message });
    }
});


// azalan stoklar 
router.get('/azalan-stoklar', async (req, res) => {
    try {
        const azalanStoklar = await runQuery(`
            SELECT UrunID, UrunAdi, Stok 
            FROM urun 
            WHERE Stok < 50
            ORDER BY Stok ASC;
        `);

        res.json({ success: true, urunler: azalanStoklar });
    } catch (error) {
        console.error("Azalan stoklar çekilirken hata:", error.message);
        res.status(500).json({ success: false, message: "Azalan stoklar alınamadı.", error: error.message });
    }
});

router.put('/siparis/guncelle/:siparisID', async (req, res) => {
    try {
        const { siparisID } = req.params;

        // Siparişin mevcut durumunu kontrol et
        const siparis = await runQuery(`SELECT Durum, SepetID FROM siparis WHERE SiparisID = ?`, [siparisID]);

        if (siparis.length === 0) {
            return res.status(404).json({ success: false, message: "Sipariş bulunamadı." });
        }

        const sepetID = siparis[0].SepetID;
        let yeniDurum = "Hazırlanıyor"; // Varsayılan durum değişimi

        if (siparis[0].Durum === "Hazırlanıyor") {
            yeniDurum = "Hazırlandı";

            // **Sipariş "Hazırlanıyor" → "Hazırlandı" geçişindeyse stoktan düşelim**
            const sepetUrunleri = await runQuery(`SELECT UrunID, UrunSayisi FROM sepeturunleri WHERE SepetID = ?`, [sepetID]);

            for (const urun of sepetUrunleri) {
                // Ürünün mevcut stok miktarını al
                const stokBilgisi = await runQuery(`SELECT Stok FROM urun WHERE UrunID = ?`, [urun.UrunID]);

                if (stokBilgisi.length === 0) {
                    return res.status(400).json({ success: false, message: `Ürün (ID: ${urun.UrunID}) stokta bulunmuyor!` });
                }

                const mevcutStok = stokBilgisi[0].Stok;
                if (mevcutStok < urun.UrunSayisi) {
                    return res.status(400).json({ success: false, message: `Ürün (ID: ${urun.UrunID}) için yeterli stok yok!` });
                }

                // Stoktan düşme işlemi
                await runQuery(`UPDATE urun SET Stok = Stok - ? WHERE UrunID = ?`, [urun.UrunSayisi, urun.UrunID]);
            }
        } else if (siparis[0].Durum === "Hazırlandı") {
            return res.status(400).json({ success: false, message: "Sipariş zaten hazırlandı." });
        }

        // Sipariş durumunu güncelle
        await runQuery(`UPDATE siparis SET Durum = ? WHERE SiparisID = ?`, [yeniDurum, siparisID]);

        res.json({ success: true, message: `Sipariş durumu "${yeniDurum}" olarak güncellendi!`, yeniDurum });
    } catch (error) {
        console.error("Sipariş güncelleme hatası:", error.message);
        res.status(500).json({ success: false, message: "Sipariş durumu güncellenemedi.", error: error.message });
    }
});




module.exports = router;