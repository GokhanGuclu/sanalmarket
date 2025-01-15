function toggleCardDetails(show) {
    const cardDetails = document.getElementById('credit-card-details');
    if (show) {
        cardDetails.classList.remove('hidden');
    } else {
        cardDetails.classList.add('hidden');
    }
}

function toggleNewCardForm() {
    const newCardForm = document.getElementById('new-card-form');
    newCardForm.classList.toggle('hidden');
}
// Adres Bilgilerini Çekme
function fetchAddress() {
    fetch('/api/adresler', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            console.log('Adres API Yanıtı:', data); // Konsolda kontrol et

            if (data.success && data.adresler.length > 0) {
                const adres = data.adresler[0]; // En üstteki seçili adres

                const addressInfo = document.querySelector('.address-info');
                addressInfo.innerHTML = `
                    <strong>${adres.AdresBaslik}</strong><br>
                    ${adres.AdresAciklama}, ${adres.Ilce}/${adres.Sehir}
                `;
            } else {
                console.warn('Adres bulunamadı!');
                document.getElementById('.address-info').innerText = 'Adres bulunamadı!';
            }
        })
        .catch(error => console.error('Adres yüklenirken hata oluştu:', error));
}

// Kart Bilgilerini Çekme
function fetchCards() {
    fetch('/api/kartlar', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            console.log('Kart API Yanıtı:', data); // Konsolda kontrol et

            const cardSelect = document.getElementById('saved-cards');
            cardSelect.innerHTML = ''; // Önce dropdown temizlenir

            if (data.success && data.kartlar.length > 0) {
                // Kartları dropdown içine ekle
                data.kartlar.forEach(kart => {
                    const option = document.createElement('option');
                    option.value = kart.KartID;

                    const maskedNumber = maskCardNumber(kart.KartNumara);
                    option.textContent = `${kart.KartIsim} - ${maskedNumber}`;
                    cardSelect.appendChild(option);
                });
            } else {
                const option = document.createElement('option');
                option.textContent = 'Kayıtlı kart bulunmamaktadır.';
                cardSelect.appendChild(option);
            }
        })
        .catch(error => console.error('Kartlar yüklenirken hata oluştu:', error));
}

// Kart Numarasını Maskeleme
function maskCardNumber(numara) {
    return '**** **** **** ' + numara.slice(-4); // Son 4 haneyi gösterir
}

// Yeni Kart Ekleme
function addNewCard() {
    const name = document.querySelector('#new-card-form input[placeholder="Kart Üzerindeki İsim"]').value;
    const number = document.querySelector('#new-card-form input[placeholder="Kart Numarası"]').value;
    const expMonth = document.querySelector('#new-card-form input[placeholder="Ay"]').value;
    const expYear = document.querySelector('#new-card-form input[placeholder="Yıl"]').value;
    const cvv = document.querySelector('#new-card-form input[placeholder="CVV"]').value;

    const expDate = `${expMonth}/${expYear}`;

    fetch('/api/kartlar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            KartIsim: name,
            KartNumara: number,
            SonKullanmaTarih: expDate,
            CVV: cvv
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Kart başarıyla eklendi!');
                fetchCards(); // Kartları yeniden yükle
            } else {
                alert('Kart eklenirken bir hata oluştu!');
            }
        })
        .catch(error => console.error('Kart eklenirken hata oluştu:', error));
}

function sepetOzetiniGuncelle() {
    // Sepet bilgilerini API'den al
    fetch('/api/sepet', { credentials: 'include' })
        .then(response => response.json())  // Yanıtı JSON formatında al
        .then(data => {
            // Sepet özetini gösterecek olan span'ları seç
            const toplamTutarSpan = document.getElementById('toplam-tutar');
            const teslimatTutariSpan = document.getElementById('teslimat-tutari');
            const odenecekTutarSpan = document.getElementById('odenecek-tutar');
            
            // Sepet boş mu kontrol et
            if (data.success && data.sepetUrunleri && data.sepetUrunleri.length > 0) {
                const sepetUrunleri = data.sepetUrunleri;
                
                // Sepet fiyatlarını hesapla
                const sepetFiyat = sepetUrunleri.reduce((total, urun) => total + urun.SepetFiyat, 0);
                
                // Teslimat tutarı, burada sabit bir değer kullanıyoruz
                const teslimatTutari = 34.99;
                
                // Ödenecek toplam tutarı hesapla
                const odenecekTutar = sepetFiyat + teslimatTutari;

                // Sepet özetini HTML olarak güncelle
                toplamTutarSpan.innerText = sepetFiyat.toFixed(2);  // Toplam tutarı güncelle
                teslimatTutariSpan.innerText = teslimatTutari.toFixed(2);  // Teslimat tutarını güncelle
                odenecekTutarSpan.innerText = odenecekTutar.toFixed(2);  // Ödenecek tutarı güncelle
            } else {
                // Sepet boşsa, boş sepet mesajı göster
                toplamTutarSpan.innerText = '0.00';
                teslimatTutariSpan.innerText = '34.99';  // Sabit teslimat tutarı
                odenecekTutarSpan.innerText = '34.99';  // Sabit ödenecek tutar
            }
        })
        .catch(error => {
            // Eğer bir hata oluşursa konsola yazdır
            console.error('Sepet bilgileri alınırken hata oluştu:', error);
        });
}

document.addEventListener("DOMContentLoaded", () => {
    fetchAddress(); // Adresi çek
    fetchCards();   // Kartları çek
    sepetOzetiniGuncelle();
});
