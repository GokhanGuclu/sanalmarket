let sqlUrunler = []; // SQL'den gelen tüm ürün bilgileri
let sepet = {}; // Global sepet nesnesi

// Sepeti sunucudan yükleme
function loadCartFromServer() {
    return fetch('/api/sepet')
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                sqlUrunler = data.sepetUrunleri; // SQL'den gelen ürün bilgilerini sakla
                sepet = {}; // Sepeti temizle ve yeniden doldur
                data.sepetUrunleri.forEach((urun) => {
                    sepet[urun.UrunID] = urun.UrunSayisi; // Sepetteki ürün miktarlarını güncelle
                });
            } else {
                console.error('Sepet verileri alınamadı:', data.message);
            }
        })
        .catch((err) => console.error('Sepet yüklenirken hata oluştu:', err));
}

// Sepeti sunucuya kaydetme
function saveCartToServer() {
    fetch('/api/sepet', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sepet), // Tüm sepeti gönder
    }).catch(err => console.error('Sepet sunucuya kaydedilirken hata oluştu:', err));
}

// Sunucudan bir ürünü kaldırma
function deleteFromCartServer(urunID) {
    fetch(`/api/sepet/${encodeURIComponent(urunID)}`, {
        method: 'DELETE',
    }).catch(err => console.error(`Ürün sunucudan silinirken hata oluştu: ${err}`));
}

function updateCart(urunID, miktarDegisimi) {
    const urun = sqlUrunler.find(u => u.UrunID === parseInt(urunID));
    if (!urun) {
        console.error('Ürün bulunamadı!');
        return;
    }

    // İndirimli fiyatı hesapla
    const orijinalFiyat = parseFloat(urun.orijinalFiyat);
    const indirimliFiyat = urun.IndirimOrani > 0
        ? (orijinalFiyat * (1 - urun.IndirimOrani / 100)).toFixed(2)
        : orijinalFiyat.toFixed(2);

    const toplamFiyat = (indirimliFiyat * miktarDegisimi).toFixed(2);

    // Sunucuya güncelleme isteği gönder
    fetch(`/api/sepet/${urunID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            delta: miktarDegisimi,
            kullaniciID: 1000,
            urunFiyat: toplamFiyat, // Sunucuya güncel fiyatı gönder
        }),
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log('Sepet güncellendi.');
                updateUI(); // UI'yi güncelle
            } else {
                console.error('Sepet güncellenemedi:', data.message);
            }
        })
        .catch(err => console.error('Sepet güncellenirken hata oluştu:', err));
}


function updateUI() {
    const cartDropdown = document.getElementById('cartDropdown');
    const cartTotalElem = document.querySelector('.cart-total1'); // Üstteki toplam fiyat
    let toplamFiyat = 0;

    if (cartDropdown) {
        cartDropdown.innerHTML = '';

        if (Object.keys(sepet).length === 0) {
            cartDropdown.innerHTML = `
                <p style="text-align: center; margin: 10px 0; color: #555; font-size: 14px;">
                    Sepetiniz Boş
                </p>
            `;
        } else {
            Object.entries(sepet).forEach(([urunID, miktar]) => {
                const urun = sqlUrunler.find(u => u.UrunID === parseInt(urunID));

                if (urun) {
                    const orijinalFiyat = parseFloat(urun.orijinalFiyat);
                    const indirimliFiyat = urun.IndirimOrani > 0
                        ? (orijinalFiyat * (1 - urun.IndirimOrani / 100)).toFixed(2)
                        : orijinalFiyat.toFixed(2);

                    const toplamUrunFiyati = (indirimliFiyat * miktar).toFixed(2);
                    toplamFiyat += parseFloat(toplamUrunFiyati);

                    const cartItem = `
                        <div class="cart-item" style="display: flex; align-items: center; gap: 10px; justify-content: space-between;">
                            <img src="${urun.Gorsel}" alt="${urun.UrunAdi}" style="width: 50px; height: 50px; object-fit: cover;">
                            <div class="cart-item-info">
                                <p>
                                    <strong>${urun.UrunAdi}</strong>
                                    ${urun.IndirimOrani > 0 ? `<span style="color: red; font-weight: bold;"> (İndirimde!)</span>` : ''}
                                </p>
                                <p>
                                    ${urun.IndirimOrani > 0
                                        ? `<span style="text-decoration: line-through; color: gray;">${(orijinalFiyat * miktar).toFixed(2)} TL</span> `
                                        : ''
                                    }
                                    ${toplamUrunFiyati} TL
                                </p>
                            </div>
                            <div class="quantity-controls">
                                <button onclick="updateCart('${urunID}', -1)">−</button>
                                <span>${miktar}</span>
                                <button onclick="updateCart('${urunID}', 1)">+</button>
                            </div>
                        </div>
                    `;
                    cartDropdown.innerHTML += cartItem;
                }
            });

            const toplamFiyatElem = document.createElement('div');
            toplamFiyatElem.classList.add('cart-total');
            toplamFiyatElem.textContent = `Toplam: ${toplamFiyat.toFixed(2)} TL`;
            cartDropdown.appendChild(toplamFiyatElem);
        }
    }

    // Üstteki toplam fiyatı güncelle
    if (cartTotalElem) {
        cartTotalElem.textContent = `${toplamFiyat.toFixed(2)} TL`;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    loadCartFromServer().then(updateUI); // Sepeti yükleyip arayüzü güncelle
});
