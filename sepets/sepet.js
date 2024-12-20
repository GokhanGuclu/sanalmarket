function updatePrice(button, unitPrice, change) {
    const quantityDisplay = button.parentElement.querySelector(".quantity-display");
    let quantity = parseInt(quantityDisplay.textContent);

    // Miktarı artır veya azalt
    quantity += change;
    if (quantity < 1) quantity = 1; // Minimum 1 ürün

    // Arayüzü güncelle
    quantityDisplay.textContent = quantity;

    // Ürün fiyatını güncelle
    const priceElement = button.closest(".cart-item-controls").querySelector(".product-price");
    const newPrice = (unitPrice * quantity).toFixed(2);
    priceElement.textContent = `${newPrice} TL`;

    // Ürün ID'sini al
    const cartItem = button.closest(".cart-item-box");
    const urunID = cartItem.dataset.urunId; // HTML'de `data-urun-id` attribute'u olmalı

    // `changeCartQuantity` ile veritabanını ve diğer işlemleri güncelle
    changeCartQuantity(urunID, change);
}

function changeCartQuantity(urunID, delta) {
    const kullaniciID = 1000; // Varsayılan kullanıcı ID'si

    if (delta === 0) {
        console.warn('Delta sıfır olamaz.');
        return;
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

                // Toplam fiyatı güncelle
                updateTotalPrice();
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

function updateTotalPrice() {
    const priceElements = document.querySelectorAll(".product-price");
    let totalPrice = 0;

    priceElements.forEach((priceElement) => {
        totalPrice += parseFloat(priceElement.textContent.replace(" TL", ""));
    });

    document.getElementById("total-price").textContent = `${totalPrice.toFixed(2)} TL`;
    document.getElementById("payable-price").textContent = `${totalPrice.toFixed(2)} TL`;
}

function updateCartPage() {
    const cartContainer = document.querySelector('.cart-items'); // Sepet öğelerinin bulunduğu alan
    const totalPriceElem = document.getElementById('total-price'); // Toplam fiyat gösterim alanı
    const payablePriceElem = document.getElementById('payable-price'); // Ödenecek fiyat alanı
    let toplamFiyat = 0;

    if (!cartContainer) {
        console.error('Sepet alanı bulunamadı!');
        return;
    }

    cartContainer.innerHTML = ''; // Mevcut içeriği temizle

    if (!sqlUrunler || sqlUrunler.length === 0) {
        // Eğer ürün yoksa
        cartContainer.innerHTML = `
            <p style="text-align: center; margin: 20px 0; color: #555; font-size: 16px;">
                Sepetiniz Boş
            </p>
        `;
    } else {
        sqlUrunler.forEach((urun) => {
            const indirimliFiyat = urun.IndirimOrani > 0
                ? (urun.orijinalFiyat * (1 - urun.IndirimOrani / 100)).toFixed(2)
                : parseFloat(urun.orijinalFiyat).toFixed(2);

            const toplamUrunFiyati = parseFloat(urun.toplamFiyat).toFixed(2);
            toplamFiyat += parseFloat(toplamUrunFiyati);

            const cartItemHTML = `
                <div class="cart-item-box" data-urun-id="${urun.UrunID}">
                    <img src="${urun.Gorsel}" alt="${urun.UrunAdi}" class="product-image">
                    <div class="cart-item-details">
                        <p class="product-name">${urun.UrunAdi}</p>
                        <p class="product-unit-price">Birim Fiyat: ${indirimliFiyat} TL</p>
                    </div>
                    <div class="cart-item-controls">
                        <p class="product-price">${toplamUrunFiyati} TL</p>
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updatePrice(this, ${indirimliFiyat}, -1)">−</button>
                            <span class="quantity-display">${urun.UrunSayisi}</span>
                            <button class="quantity-btn" onclick="updatePrice(this, ${indirimliFiyat}, 1)">+</button>
                        </div>
                    </div>
                </div>
            `;
            cartContainer.innerHTML += cartItemHTML;
        });
    }

    // Toplam fiyatı güncelle
    if (totalPriceElem && payablePriceElem) {
        totalPriceElem.textContent = `${toplamFiyat.toFixed(2)} TL`;
        payablePriceElem.textContent = `${toplamFiyat.toFixed(2)} TL`;
    }
}

// Backend'den sepet verilerini yükle ve sayfayı güncelle
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/sepet')
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                sqlUrunler = data.sepetUrunleri;
                updateCartPage();
            } else {
                console.error('Sepet verisi alınamadı:', data.message);
            }
        })
        .catch((error) => {
            console.error('Sepet verileri yüklenirken hata oluştu:', error);
        });
});


function updateTotalPrice() {
    const priceElements = document.querySelectorAll(".product-price");
    let totalPrice = 0;

    priceElements.forEach((priceElement) => {
        totalPrice += parseFloat(priceElement.textContent.replace(" TL", ""));
    });

    document.getElementById("total-price").textContent = `${totalPrice.toFixed(2)} TL`;
    document.getElementById("payable-price").textContent = `${totalPrice.toFixed(2)} TL`;
}
