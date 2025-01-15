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

document.addEventListener("DOMContentLoaded", () => {
    fetchAddress(); // Adresi çek
    fetchCards();   // Kartları çek
});

// Adres Bilgilerini Çekme
function fetchAddress() {
    fetch('/adresler', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            console.log('Adres API Yanıtı:', data); // Konsolda kontrol et

            if (data.success && data.adresler.length > 0) {
                const adres = data.adresler[0]; // En üstteki seçili adres

                const addressInfo = document.getElementById('address-detail');
                addressInfo.innerHTML = `
                    <strong>${adres.AdresBaslik}</strong><br>
                    ${adres.AdresAciklama}, ${adres.Ilce}/${adres.Sehir}
                `;
            } else {
                console.warn('Adres bulunamadı!');
                document.getElementById('address-detail').innerText = 'Adres bulunamadı!';
            }
        })
        .catch(error => console.error('Adres yüklenirken hata oluştu:', error));
}

// Kart Bilgilerini Çekme
function fetchCards() {
    fetch('/kartlar', { credentials: 'include' })
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

    fetch('/kartlar', {
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
