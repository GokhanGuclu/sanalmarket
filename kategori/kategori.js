fetch('../navbar/navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar').innerHTML = data;
    })
    .catch(error => console.error('Navbar yüklenirken hata oluştu:', error));

const urlPath = window.location.pathname; 
const kategoriAdi = urlPath.split('/')[2]; 

if (kategoriAdi) {
    fetch(`/api/urunler/${kategoriAdi}`) // API'den kategoriye ait ürünleri al
        .then(response => response.json())
        .then(urunListesi => {
            const urunlerContainer = document.querySelector('.category-container');
            urunlerContainer.innerHTML = ''; // Mevcut içeriği temizle

            urunListesi.forEach(urun => {
                const urunDiv = document.createElement('div');
                urunDiv.className = 'category-item';

                const indirimOrani = urun.IndirimOrani || 0; // İndirim yoksa 0 kabul edilir
                const kampanyaAdi = urun.KampanyaAdi || ''; // Kampanya adı yoksa boş string
                const orijinalFiyat = parseFloat(urun.UrunFiyat);
                const indirimliFiyat = (indirimOrani > 0) 
                    ? (orijinalFiyat * (1 - indirimOrani / 100)).toFixed(2) 
                    : orijinalFiyat.toFixed(2);

                urunDiv.innerHTML = `
                    ${kampanyaAdi ? `<span class="discount">${kampanyaAdi}</span>` : ''}
                    <img src="${urun.Gorsel}" alt="${urun.UrunAdi}">
                    <h3>${urun.UrunAdi}</h3>
                    <p class="price">
                        ${indirimOrani > 0 
                            ? `<del>${orijinalFiyat} TL</del> ${indirimliFiyat} TL`
                            : `${indirimliFiyat} TL`}
                    </p>
                    <button class="add-to-cart" onclick="toggleQuantityControls(this)">Sepete Ekle</button>
                    <div class="quantity-controls-item hidden">
                        <button class="quantity-btn-item" onclick="changeQuantity(this, -1)">−</button>
                        <span class="quantity-display-item">1</span>
                        <button class="quantity-btn-item" onclick="changeQuantity(this, 1)">+</button>
                    </div>
                `;
                urunlerContainer.appendChild(urunDiv);
            });
        })
        .catch(error => {
            console.error('Ürünler yüklenirken hata oluştu:', error);
            window.location.href = '/404/';
        });
} else {
    window.location.href = '/404/'; 
}

function toggleQuantityControls(button) {
    const parent = button.parentElement; // Ürün kartını bul
    const addToCartButton = parent.querySelector('.add-to-cart');
    const quantityControls = parent.querySelector('.quantity-controls-item');

    // Add-to-cart butonunu gizle ve quantity-controls'ü göster
    if (addToCartButton) addToCartButton.style.display = 'none';
    if (quantityControls) {
        quantityControls.classList.remove('hidden');
        const quantityDisplay = quantityControls.querySelector('.quantity-display-item');
        if (quantityDisplay) quantityDisplay.textContent = 1; // Miktarı 1 olarak başlat
    }
}

function changeQuantity(button, delta) {
    const quantityDisplay = button.parentElement.querySelector('.quantity-display-item'); // Miktar göstergesini al
    let currentQuantity = parseInt(quantityDisplay.textContent, 10); // Mevcut miktarı al

    currentQuantity += delta; // Miktarı güncelle

    if (currentQuantity <= 0) {
        // Miktar sıfır veya altına inerse, quantity-controls gizlenir ve "Sepete Ekle" butonu görünür olur
        const parent = button.parentElement.parentElement; // Ürün kartını bul
        const addToCartButton = parent.querySelector('.add-to-cart');
        const quantityControls = button.parentElement;

        if (addToCartButton) addToCartButton.style.display = 'inline-block';
        if (quantityControls) quantityControls.classList.add('hidden');
    } else {
        // Miktar sıfırdan büyükse, göstergeyi güncelle
        quantityDisplay.textContent = currentQuantity;
    }
}
