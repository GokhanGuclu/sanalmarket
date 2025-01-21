fetch('../navbar/navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar').innerHTML = data;
        updateCartDropdown(); 
    })
    .catch(error => console.error('Navbar yüklenirken hata oluştu:', error));
    
function updatePrice(button, unitPrice, change) {
    const quantityDisplay = button.parentElement.querySelector(".quantity-display");
    let quantity = parseInt(quantityDisplay.textContent);

    quantity += change;
    if (quantity < 1) quantity = 1; 

    quantityDisplay.textContent = quantity;

    const priceElement = button.closest(".cart-item-controls").querySelector(".product-price");
    const newPrice = (unitPrice * quantity).toFixed(2);
    priceElement.textContent = `${newPrice} TL`;

    const cartItem = button.closest(".cart-item-box");
    const urunID = cartItem.dataset.urunId; 

    changeCartQuantity(urunID, change);
}

function changeCartQuantity(urunID, delta) {
    const kullaniciID = 1000;

    if (delta === 0) {
        console.warn('Delta sıfır olamaz.');
        return;
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
    const cartContainer = document.querySelector('.cart-items'); 
    const totalPriceElem = document.getElementById('total-price'); 
    const payablePriceElem = document.getElementById('payable-price');
    let toplamFiyat = 0;

    if (!cartContainer) {
        console.error('Sepet alanı bulunamadı!');
        return;
    }

    cartContainer.innerHTML = ''; 

    if (!sqlUrunler || sqlUrunler.length === 0) {
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

            const toplamUrunFiyati = (indirimliFiyat * urun.UrunSayisi).toFixed(2);
            const orijinalToplamFiyat = (urun.orijinalFiyat * urun.UrunSayisi).toFixed(2);
            toplamFiyat += parseFloat(toplamUrunFiyati);

            const cartItemHTML = `
                <div class="cart-item-box" data-urun-id="${urun.UrunID}">
                    <img src="${urun.Gorsel}" alt="${urun.UrunAdi}" class="product-image">
                    <div class="cart-item-details">
                        <p class="product-name">
                            ${urun.UrunAdi}
                            ${urun.IndirimOrani > 0 ? `<span style="color: red; font-weight: bold;"> (İndirimde!)</span>` : ''}
                        </p>
                        <p class="product-unit-price">
                            ${urun.IndirimOrani > 0 
                                ? `<span style="text-decoration: line-through; color: gray;">${orijinalToplamFiyat} TL</span> `
                                : ''
                            }
                            ${toplamUrunFiyati} TL
                        </p>
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

    if (totalPriceElem && payablePriceElem) {
        totalPriceElem.textContent = `${toplamFiyat.toFixed(2)} TL`;
        payablePriceElem.textContent = `${toplamFiyat.toFixed(2)} TL`;
    }
}

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
