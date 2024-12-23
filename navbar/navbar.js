let kullaniciID = null;

fetch('/api/kullanici')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            kullaniciID = data.kullaniciID; 
        } else {
            console.log('Kullanıcı girişi yapılmamış.');
        }
    })
    .catch(error => console.error('Kullanıcı bilgisi alınırken hata oluştu:', error));


document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/adresler')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateAddressDropdown(data.adresler);
            } else {
                console.error('Adresler alınamadı:', data.message);
            }
        })
        .catch(err => console.error('Adres verileri çekilirken hata:', err));
    loadCartFromServer().then(updateCartDropdown);
});


function updateAddressDropdown(adresler) {
    const addressDropdown = document.getElementById('addressDropdown');
    const selectedAddress = document.getElementById('selected-address');

    let dropdownHTML = '';

    if (adresler.length === 0) {
        dropdownHTML = `
            <p style="text-align: center; margin: 10px 0; color: #555; font-size: 14px;">
                Adres bulunamadı.
            </p>
        `;
    } else {
        const varsayilanAdres = adresler[0]; 

        adresler.forEach(adres => {

            dropdownHTML += `
                <div class="dropdown-item" onclick="selectAddress(${JSON.stringify(adres).replace(/"/g, '&quot;')})">
                    <p class="address-name">${adres.AdresBaslik}</p>
                    <p class="address-details">${adres.AdresAciklama}, ${adres.Ilce}, ${adres.Sehir}</p>
                </div>
            `;
        });

        if (selectedAddress) {
            const kisaVarsayilan = varsayilanAdres.AdresBaslik.length > 8
                ? varsayilanAdres.AdresBaslik.slice(0, 6) + '...' 
                : varsayilanAdres.AdresBaslik;

            selectedAddress.innerHTML = `
                Teslimat Adresi: <strong>${kisaVarsayilan}</strong>
            `;
        }
    }

    if (addressDropdown) {
        addressDropdown.innerHTML = dropdownHTML;
    }
}

function selectAddress(adres) {
    const selectedAddress = document.getElementById('selected-address');

    const kisaBaslik = adres.AdresBaslik.length > 8 
        ? adres.AdresBaslik.slice(0, 6) + '...' 
        : adres.AdresBaslik;

    if (selectedAddress) {
        selectedAddress.innerHTML = `
            Teslimat Adresi: <strong>${kisaBaslik}</strong>
        `;
    }

    fetch('/api/adresler/secilen', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adresID: adres.AdresID, kullaniciID: 1000 }), 
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Adres güncellenemedi:', data.message);
            alert('Adres güncellenemedi!');
        }
    })
    .catch(err => {
        console.error('Adres güncelleme hatası:', err);
        alert('Sunucu hatası! Lütfen tekrar deneyin.');
    });
}

function updateCartDropdown() {
    const cartDropdown = document.getElementById('cartDropdown');
    const cartTotalElem = document.querySelector('.cart-total1'); 
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

                    const toplamOrijinalFiyat = (orijinalFiyat * miktar).toFixed(2); 
                    const toplamIndirimliFiyat = (indirimliFiyat * miktar).toFixed(2); 

                    toplamFiyat += parseFloat(toplamIndirimliFiyat); 

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
                                    : ''}
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
                    cartDropdown.innerHTML += cartItem;
                }
            });

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

    if (cartTotalElem) {
        cartTotalElem.textContent = `${toplamFiyat.toFixed(2)} TL`;
    }

    const badgeElement = document.querySelector('.badge1');
    if (badgeElement) {
        const farkliUrunSayisi = Object.keys(sepet).length;
        badgeElement.textContent = farkliUrunSayisi;
        badgeElement.style.display = farkliUrunSayisi > 0 ? 'inline-block' : 'none';
    }
}

function changeCartQuantity(urunID, delta) {

    if (delta === 0) {
        console.warn('Delta sıfır olamaz.');
        return;
    }

    showLoadingSpinner();

    if (!sepet[urunID]) {
        sepet[urunID] = 0;
    }
    sepet[urunID] += delta;

    if (sepet[urunID] <= 0) {
        delete sepet[urunID]; 
    }

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

                updateCartDropdown();
                setTimeout(() => {
                    location.reload(); 
                }, 500);
            } else {
                console.error('Ürün miktarı güncellenirken hata:', data.message);
                alert('Sepet güncelleme sırasında bir hata oluştu.');
            }
        })
        .catch(error => {
            console.error('API isteği başarısız oldu:', error);
            alert('Sunucuya bağlanırken bir hata oluştu.');
        })
        .finally(() => {
            setTimeout(() => {
                hideLoadingSpinner();
                location.reload();
            }, 500); 
            
        });
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

function showLoadingSpinner() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoadingSpinner() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

function toggleAddressDropdown() {
    navbarshowBox();
    
    if (kullaniciID === null) {
        navbarshowBox();
        return;
    }
    const dropdown = document.getElementById('addressDropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function navbarshowBox() {
    document.getElementById('loginWarningBoxnavbar').style.display = 'flex';
};

function navbarhideBox() {
    document.getElementById('loginWarningBoxnavbar').style.display = 'none';
};

document.getElementById('cancelButtonnavbar').addEventListener('click', () => {
    navbarhideBox();
});

document.getElementById('loginButtonnavbar').addEventListener('click', () => {
    window.location.href = '/giriskayit';
});