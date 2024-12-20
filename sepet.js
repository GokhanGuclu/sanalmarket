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
    if (!sepet[urunID]) {
        console.error(`Ürün ID'si bulunamadı: ${urunID}`);
        return;
    }

    // Ürün miktarını güncelle
    sepet[urunID] += miktarDegisimi;

    // Eğer miktar 0 veya altına düşerse ürünü sepetten çıkar
    if (sepet[urunID] <= 0) {
        delete sepet[urunID];
    }

    // Sunucuya sepeti güncelleme isteği gönder
    fetch('/api/update-cart', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            urunID: urunID,
            miktar: sepet[urunID] || 0, // Ürün sepetten çıkarılmışsa 0 gönder
        }),
    })
        .then(res => {
            if (!res.ok) {
                throw new Error('Sepet güncellenirken bir hata oluştu.');
            }
            return res.json();
        })
        .then(data => {
            if (data.success) {
                console.log('Sepet başarıyla güncellendi.');
                // Sepeti tekrar render et
                updateCartDropdown();
            } else {
                console.error('Sepet güncellenemedi:', data.message);
            }
        })
        .catch(err => {
            console.error('Sepet güncellenirken hata oluştu:', err);
        });
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
                    const indirimliFiyat = urun.indirimOrani > 0
                        ? (orijinalFiyat * (1 - urun.indirimOrani / 100)).toFixed(2)
                        : orijinalFiyat.toFixed(2);

                    const toplamUrunFiyati = (indirimliFiyat * miktar).toFixed(2);
                    toplamFiyat += parseFloat(toplamUrunFiyati);

                    const cartItem = `
                        <div class="cart-item" style="display: flex; align-items: center; gap: 10px; justify-content: space-between;">
                            <img src="${urun.Gorsel}" alt="${urun.UrunAdi}" style="width: 50px; height: 50px; object-fit: cover;">
                            <div class="cart-item-info">
                                <p><strong>${urun.UrunAdi}</strong></p>
                                <p>${indirimliFiyat} TL x ${miktar}</p>
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
