# 🛒 Sanal Market E-Ticaret Platformu

Modern ve kullanıcı dostu bir e-ticaret deneyimi sunan sanal market uygulaması. Kullanıcılar ürünleri listeleyebilir, sepetlerine ekleyebilir, güvenli ödeme yapabilir ve siparişlerini takip edebilirler.

## 🌟 Öne Çıkan Özellikler

### 👤 Kullanıcı Yönetimi
- 🔐 Güvenli kayıt ve giriş sistemi
- 👤 Profil yönetimi ve bilgi güncelleme
- 📍 Çoklu adres kaydetme (maksimum 5 adres)
- ⭐ Favori ürünleri kaydetme
- 📝 Sipariş geçmişi görüntüleme
- ⭐ Ürün değerlendirme ve yorum yapma

### 🛍️ Alışveriş Deneyimi
- 🔍 Gelişmiş ürün arama ve filtreleme
- 🏷️ Kategorilere göre ürün listeleme
- 💰 İndirimli ürünler ve kampanyalar
- 🛒 Dinamik alışveriş sepeti
- 💳 Güvenli ödeme sistemi
- 📦 Kurye takip sistemi

### 👨‍💼 Satıcı Paneli
- 📦 Ürün ekleme ve yönetme
- 📊 Stok takibi ve yönetimi
- 🏷️ Kampanya ve indirim oluşturma
- 📦 Sipariş yönetimi
- ⭐ Müşteri yorumları ve puanları
- 📈 Satış raporları

### 🚚 Kurye Sistemi
- 📦 Aktif siparişleri görüntüleme
- 📍 Teslimat adresi takibi
- 🔄 Sipariş durumu güncelleme
- 📱 Teslimat kodu doğrulama

## 🛠️ Teknik Altyapı

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla JS)
- Responsive Tasarım

### Backend
- Node.js
- Express.js
- MySQL/MSSQL Veritabanı

### Güvenlik ve Performans
- Express Session ile oturum yönetimi
- Güvenli şifre hashleme
- API endpoint güvenliği
- Dosya yükleme güvenliği (Multer)
- E-posta bildirimleri (Nodemailer)

## 📡 API Endpoints

### Kullanıcı İşlemleri
- `POST /api/register` - Yeni kullanıcı kaydı
- `POST /api/login` - Kullanıcı girişi
- `GET /api/check-login` - Oturum kontrolü
- `POST /api/logout` - Çıkış yapma

### Ürün İşlemleri
- `GET /api/urunler/:kategori` - Kategori bazlı ürün listesi
- `GET /api/urunler/detay/:urunID` - Ürün detayları
- `GET /api/ara/urun` - Ürün arama
- `POST /api/favoriler` - Favori ürün ekleme

### Sepet İşlemleri
- `GET /api/sepet` - Sepet içeriği
- `POST /api/sepet` - Sepete ürün ekleme/güncelleme
- `POST /api/sepet/ekle/:urunID` - Sepete yeni ürün ekleme

### Sipariş İşlemleri
- `GET /api/siparisler-cek` - Sipariş listesi
- `GET /api/siparisler-cek/detay/:siparisID` - Sipariş detayları
- `POST /api/yorum-puan` - Sipariş değerlendirme

### Satıcı İşlemleri
- `POST /api/urun` - Yeni ürün ekleme
- `GET /api/urun` - Tüm ürünleri listeleme
- `POST /api/kampanya-ekle` - Kampanya oluşturma
- `GET /api/siparis` - Sipariş yönetimi
- `GET /api/musteripuanlari` - Müşteri değerlendirmeleri

### Kurye İşlemleri
- `GET /api/siparisler` - Aktif siparişleri listeleme
- `POST /api/siparis-durum-guncelle` - Sipariş durumu güncelleme

## 🚀 Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/GokhanGuclu/sanalmarket.git
   ```

2. Proje dizinine gidin:
   ```bash
   cd sanalmarket
   ```

3. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

4. Veritabanı yapılandırması:
   - `.env` dosyasını oluşturun
   - Veritabanı bağlantı bilgilerini ekleyin:
     ```
     DB_HOST=localhost
     DB_USER=your_username
     DB_PASSWORD=your_password
     DB_NAME=sanalmarket
     MAIL=your_email@gmail.com
     ```

5. Uygulamayı başlatın:
   ```bash
   npm start
   ```
   
   Geliştirme modunda çalıştırmak için:
   ```bash
   npm run dev
   ```

## 📁 Proje Yapısı

```
sanalmarket/
├── anasayfa/          # Ana sayfa bileşenleri
├── giriskayit/        # Giriş ve kayıt sayfaları
├── hesabım/           # Kullanıcı hesap yönetimi
├── kategoriler/       # Kategori listeleme
├── kategori/          # Kategori detay sayfaları
├── kurye/            # Kurye takip sistemi
├── navbar/           # Navigasyon bileşeni
├── odeme/            # Ödeme işlemleri
├── resimler/         # Statik görseller
├── satıcı/           # Satıcı paneli
├── sepet/            # Alışveriş sepeti
├── api.js            # API endpoint'leri
├── server.js         # Ana sunucu dosyası
├── sql.js            # Veritabanı işlemleri
└── package.json      # Proje bağımlılıkları
```

## 🔒 Güvenlik Önlemleri

- Oturum yönetimi için Express Session kullanımı
- Şifrelerin güvenli hash'lenmesi
- API endpoint'leri için güvenlik kontrolleri
- Dosya yükleme güvenliği (boyut ve tip kontrolü)
- SQL injection koruması
- XSS koruması

## 📝 Lisans

Bu proje ISC lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakınız.

## 👨‍💻 Geliştiriciler

- **Gökhan Güçlü**
  - GitHub: [@GokhanGuclu](https://github.com/GokhanGuclu)

- **Veli Yılmaz**
  - GitHub: [@VeliYılmaz](https://github.com/vlylmz)

- **Şükrü Yurdabak**
  - GitHub: [@ŞükrüYurdabak](https://github.com/wildclazz)

## 🤝 Katkıda Bulunma

1. Bu depoyu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/yeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik: Açıklama'`)
4. Branch'inizi push edin (`git push origin feature/yeniOzellik`)
5. Pull Request oluşturun

## 📞 İletişim ve Destek

- GitHub Issues üzerinden hata bildirimi
- Pull Request ile katkıda bulunma
- E-posta ile iletişim

## 🔄 Güncellemeler

- v1.0.5: Kurye takip sistemi eklendi
- v1.0.4: Ürün değerlendirme sistemi eklendi
- v1.0.3: Çoklu adres desteği eklendi
- v1.0.2: Kampanya sistemi eklendi
- v1.0.1: Favori ürünler özelliği eklendi
- v1.0.0: İlk sürüm yayınlandı