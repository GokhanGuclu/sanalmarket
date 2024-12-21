// Adres dropdown menüsünü doldur
document.addEventListener('DOMContentLoaded', () => {
    const addressDropdown = document.getElementById('addressDropdown');

    if (addressDropdown) {
        addresses.forEach(address => {
            const dropdownItem = document.createElement('div');
            dropdownItem.classList.add('dropdown-item');
            dropdownItem.addEventListener('click', () => selectAddress(address.name));

            const nameElem = document.createElement('p');
            nameElem.classList.add('address-name');
            nameElem.textContent = address.name;

            const detailsElem = document.createElement('p');
            detailsElem.classList.add('address-details');
            detailsElem.textContent = address.details;

            dropdownItem.appendChild(nameElem);
            dropdownItem.appendChild(detailsElem);

            addressDropdown.appendChild(dropdownItem);
        });
    }

    // Navbar login durumunu kontrol et
    updateNavbarLogin();

    // Sepeti yükle ve göster
    loadCartFromServer().then(updateCartDropdown);
});

function updateCartDropdown() {
    const cartDropdown = document.getElementById('cartDropdown');
    const cartTotalElem = document.querySelector('.cart-total1'); // Üstteki toplam fiyat
    let toplamFiyat = 0;

    if (cartDropdown) {
        cartDropdown.innerHTML = ''; // Dropdown içeriğini temizle

        // Sepet boşsa mesaj göster
        if (Object.keys(sepet).length === 0) {
            cartDropdown.innerHTML = `
                <p style="text-align: center; margin: 10px 0; color: #555; font-size: 14px;">
                    Sepetiniz Boş
                </p>
            `;
        } else {
            // Sepetteki ürünleri listele
            Object.entries(sepet).forEach(([urunID, miktar]) => {
                const urun = sqlUrunler.find(u => u.UrunID === parseInt(urunID)); // Ürünü bul

                if (urun) {
                    // Fiyat bilgilerini hesapla
                    const orijinalFiyat = parseFloat(urun.orijinalFiyat);
                    const indirimliFiyat = urun.IndirimOrani > 0
                        ? (orijinalFiyat * (1 - urun.IndirimOrani / 100)).toFixed(2)
                        : orijinalFiyat.toFixed(2);

                    const toplamOrijinalFiyat = (orijinalFiyat * miktar).toFixed(2); // Toplam orijinal fiyat
                    const toplamIndirimliFiyat = (indirimliFiyat * miktar).toFixed(2); // Toplam indirimli fiyat

                    toplamFiyat += parseFloat(toplamIndirimliFiyat); // Toplam fiyatı artır

                    // Ürün satırını oluştur
                    const cartItem = `
                    <div class="cart-item" style="display: flex; align-items: center; gap: 10px; justify-content: space-between;">
                        <img src="${urun.Gorsel}" alt="${urun.UrunAdi}" style="width: 50px; height: 50px; object-fit: cover;">
                        <div class="cart-item-info">
                            <p>
                                <strong>${urun.UrunAdi}</strong>
                                ${urun.IndirimOrani > 0 
                                    ? `<span style="color: red; font-weight: bold;"> (İndirimde!)</span>` 
                                    : ''}
                            </p>
                            <p>
                                ${urun.IndirimOrani > 0 
                                    ? `<span style="text-decoration: line-through; color: gray;">${toplamOrijinalFiyat} TL</span> `
                                    : ''
                                }
                                <strong>${toplamIndirimliFiyat} TL</strong>
                            </p>
                        </div>
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="changeCartQuantity(${urunID}, -1)">−</button>
                            <span class="quantity-display">${miktar}</span>
                            <button class="quantity-btn" onclick="changeCartQuantity(${urunID}, 1)">+</button>
                        </div>
                    </div>
                    `;
                    // Dropdown'a ürün ekle
                    cartDropdown.innerHTML += cartItem;
                }
            });

            // Toplam fiyat ve sepete git butonu ekle
            const cartFooter = `
            <div style="padding-top: 10px; text-align: center; margin-top: 10px;">
                <p class="cart-total" style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">
                    Toplam: ${toplamFiyat.toFixed(2)} TL
                </p>
                <button class="go-to-cart-btn" style="background-color: #ffc107; padding: 10px 20px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;" onclick="window.location.href='/sepets/'">
                    Sepete Git
                </button>
            </div>
            `;
            cartDropdown.innerHTML += cartFooter;
        }
    }

    // Üstteki toplam fiyatı güncelle
    if (cartTotalElem) {
        cartTotalElem.textContent = `${toplamFiyat.toFixed(2)} TL`;
    }

    // Sepet simgesindeki ürün sayısını güncelle
    const badgeElement = document.querySelector('.badge1');
    if (badgeElement) {
        const farkliUrunSayisi = Object.keys(sepet).length;
        badgeElement.textContent = farkliUrunSayisi;
        badgeElement.style.display = farkliUrunSayisi > 0 ? 'inline-block' : 'none';
    }
}

function changeCartQuantity(urunID, delta) {
    const kullaniciID = 1000; // Varsayılan kullanıcı ID'si

    if (delta === 0) {
        console.warn('Delta sıfır olamaz.');
        return;
    }

    // Yerel sepeti güncelle
    if (!sepet[urunID]) {
        sepet[urunID] = 0;
    }
    sepet[urunID] += delta;

    if (sepet[urunID] <= 0) {
        delete sepet[urunID]; // Miktar 0 veya daha azsa ürünü kaldır
    }

    // SQL Veritabanını güncelle
    fetch(`/api/sepet/${urunID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ delta, kullaniciID }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Ürün miktarı başarıyla güncellendi:', data);

                // API başarılıysa UI'yi güncelle
                updateCartDropdown();
            } else {
                console.error('Ürün miktarı güncellenirken hata:', data.message);
                alert('Sepet güncelleme sırasında bir hata oluştu.');
            }
        })
        .catch(error => {
            console.error('API isteği başarısız oldu:', error);
            alert('Sunucuya bağlanırken bir hata oluştu.');
        });
}



function selectAddress(address) {
    const selectedAddress = document.getElementById('selected-address');
    if (selectedAddress) {
        selectedAddress.innerHTML = `Teslimat Adresi: <strong>${address}</strong>`;
    }
}

function updateNavbarLogin() {
    fetch('/api/check-login')
        .then(res => res.json())
        .then(data => {
            if (data.loggedIn) {
                const loginButton = document.querySelector('.nav-item1 a span');
                if (loginButton) {
                    loginButton.textContent = data.user.name;
                }
            }
        })
        .catch(err => console.error('Giriş durumu kontrol edilirken hata oluştu:', err));
}

// Sepet dropdown menüsünü aç/kapa
function navbartoggleCartDropdown() {
    const dropdown = document.getElementById('cartDropdown');
    const cartBtn = document.querySelector('.cart-btn');

    if (cartBtn && dropdown) {
        const rect = cartBtn.getBoundingClientRect();
        dropdown.style.top = `${rect.bottom}px`;
        dropdown.style.right = `${window.innerWidth - rect.right}px`;
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Adres dropdown menüsünü aç/kapa
function toggleAddressDropdown() {
    const dropdown = document.getElementById('addressDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}
