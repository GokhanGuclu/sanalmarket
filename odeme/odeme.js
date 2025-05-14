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

function fetchAddress() {
    fetch('/api/adresler', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            console.log('Adres API Yanıtı:', data);
            if (data.success && data.adresler.length > 0) {
                const adres = data.adresler[0]; 

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

function fetchCards() {
    fetch('/api/kartlar', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            console.log('Kart API Yanıtı:', data);

            const cardSelect = document.getElementById('saved-cards');
            cardSelect.innerHTML = '';

            if (data.success && data.kartlar.length > 0) {
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

function maskCardNumber(numara) {
    return '**** **** **** ' + numara.slice(-4); 
}

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
                fetchCards();
            } else {
                alert('Kart eklenirken bir hata oluştu!');
            }
        })
        .catch(error => console.error('Kart eklenirken hata oluştu:', error));
}

function sepetOzetiniGuncelle() {
    fetch('/api/sepet', { credentials: 'include' })
        .then(response => response.json())  
        .then(data => {
            const toplamTutarSpan = document.getElementById('toplam-tutar');
            const teslimatTutariSpan = document.getElementById('teslimat-tutari');
            const odenecekTutarSpan = document.getElementById('odenecek-tutar');
            
            if (data.success && data.sepetUrunleri && data.sepetUrunleri.length > 0) {
                const sepetUrunleri = data.sepetUrunleri;
                
                const sepetFiyat = sepetUrunleri.reduce((total, urun) => total + urun.SepetFiyat, 0);
                
                const teslimatTutari = 34.99;
                
                const odenecekTutar = sepetFiyat + teslimatTutari;

                toplamTutarSpan.innerText = sepetFiyat.toFixed(2);
                teslimatTutariSpan.innerText = teslimatTutari.toFixed(2);
                odenecekTutarSpan.innerText = odenecekTutar.toFixed(2);
            } else {
                toplamTutarSpan.innerText = '0.00';
                teslimatTutariSpan.innerText = '34.99';
                odenecekTutarSpan.innerText = '34.99'; 
            }
        })
        .catch(error => {
            console.error('Sepet bilgileri alınırken hata oluştu:', error);
        });
}


function siparisOlustur() {

    fetch('/api/siparis-olustur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            siparisBilgiMail();
            window.location.href = "/anasayfa"; 
        } else {
            window.location.href = "/anasayfa"; 

            alert("Siparişiniz oluşturulmuştur.");
        }
    })
    .catch(error => {
        console.error('Sipariş oluşturma hatası:', error);
        alert("Sipariş oluşturulamadı. Lütfen tekrar deneyin.");
    });
}

document.addEventListener("DOMContentLoaded", () => {
    fetchAddress();
    fetchCards();   
    sepetOzetiniGuncelle();

    const checkoutBtn = document.querySelector('.checkout-btn');
    checkoutBtn.addEventListener('click', () => {
        const odemeYontemi = document.querySelector('input[name="payment"]:checked').value;
        if (odemeYontemi) {
            siparisOlustur();
        } else {
            alert("Lütfen bir ödeme yöntemi seçin.");
        }
    });
});
