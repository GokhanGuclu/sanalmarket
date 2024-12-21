let kullaniciID = 1000; // Varsayılan olarak giriş yapmış kullanıcı ID'si (Giriş kontrolü buradan yapılacak)

// Navbar yükleme
fetch('../navbar/navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar').innerHTML = data;
        updateCartDropdown(); // Navbar yüklendikten sonra sepeti güncelle
    })
    .catch(error => console.error('Navbar yüklenirken hata oluştu:', error));

// URL'den kategori adını al
const urlPath = window.location.pathname;
const kategoriAdi = urlPath.split('/')[2];

// Ürünleri API'den çek
if (kategoriAdi) {
    fetch(`/api/urunler/${kategoriAdi}`)
        .then(response => response.json())
        .then(urunListesi => {
            fetch('/api/sepet') // Sepetteki ürünleri çek
                .then(response => response.json())
                .then(sepetData => {
                    const sepetUrunleri = sepetData.success ? sepetData.sepetUrunleri : [];
                    const urunlerContainer = document.querySelector('.category-container');
                    urunlerContainer.innerHTML = '';

                    urunListesi.forEach(urun => {
                        const indirimOrani = urun.IndirimOrani || 0;
                        const kampanyaAdi = urun.KampanyaAdi || '';
                        const orijinalFiyat = parseFloat(urun.UrunFiyat);
                        const indirimliFiyat = indirimOrani > 0
                            ? (orijinalFiyat * (1 - indirimOrani / 100)).toFixed(2)
                            : orijinalFiyat.toFixed(2);

                        // Sepette bu ürün var mı kontrol et
                        const sepetUrunu = sepetUrunleri.find(item => item.UrunID === urun.UrunID);
                        const mevcutMiktar = sepetUrunu ? sepetUrunu.UrunSayisi : 0;

                        // Ürün kartını oluştur
                        const urunDiv = document.createElement('div');
                        urunDiv.className = 'category-item';
                        urunDiv.dataset.urunId = urun.UrunID;
                        urunDiv.dataset.orijinalFiyat = orijinalFiyat;
                        urunDiv.dataset.indirimOrani = indirimOrani;

                        // Giriş yapıldıysa
                        if (kullaniciID === 1000 && mevcutMiktar > 0) {
                            urunDiv.innerHTML = `
                                ${kampanyaAdi ? `<span class="discount">${kampanyaAdi}</span>` : ''}
                                <img src="${urun.Gorsel}" alt="${urun.UrunAdi}">
                                <h3>${urun.UrunAdi}</h3>
                                <p class="price">
                                    ${indirimOrani > 0 
                                        ? `<del>${orijinalFiyat} TL</del> ${indirimliFiyat} TL`
                                        : `${indirimliFiyat} TL`}
                                </p>
                                <div class="quantity-controls-item">
                                    <button class="quantity-btn-item" onclick="changeQuantity(this, -1)">−</button>
                                    <span class="quantity-display-item">${mevcutMiktar}</span>
                                    <button class="quantity-btn-item" onclick="changeQuantity(this, 1)">+</button>
                                </div>
                            `;
                        } else {
                            // Giriş yapılmamışsa
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
                            `;
                        }
                        urunlerContainer.appendChild(urunDiv);
                    });
                });
        })
        .catch(error => {
            console.error('Ürünler yüklenirken hata oluştu:', error);
            window.location.href = '/404/';
        });
} else {
    window.location.href = '/404/';
}

// Sepete ekleme kontrolü
function toggleQuantityControls(button) {
    const parent = button.parentElement;
    const addToCartButton = parent.querySelector('.add-to-cart');

    const urunID = parseInt(parent.dataset.urunId);
    const orijinalFiyat = parseFloat(parent.dataset.orijinalFiyat);
    const indirimOrani = parseFloat(parent.dataset.indirimOrani) || 0;

    if (isNaN(urunID) || isNaN(orijinalFiyat)) {
        alert('Ürün bilgileri eksik. Sayfayı yenileyin.');
        return;
    }

    const indirimliFiyat = indirimOrani > 0
        ? (orijinalFiyat * (1 - indirimOrani / 100)).toFixed(2)
        : orijinalFiyat.toFixed(2);

    showLoadingSpinner();

    fetch('/api/sepet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            kullaniciID: 1000,
            urunID: urunID,
            urunSayisi: 1,
            urunFiyat: indirimliFiyat
        }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload(); // Sayfayı yenile
            } else {
                alert('Ürün eklenirken hata oluştu.');
            }
        })
        .finally(() => hideLoadingSpinner());
}

function changeQuantity(button, delta) {
    const quantityDisplay = button.parentElement.querySelector('.quantity-display-item');
    let currentQuantity = parseInt(quantityDisplay.textContent, 10);

    const parent = button.parentElement.parentElement;
    const urunID = parseInt(parent.dataset.urunId);
    const orijinalFiyat = parseFloat(parent.dataset.orijinalFiyat);
    const indirimOrani = parseFloat(parent.dataset.indirimOrani) || 0;

    const indirimliFiyat = indirimOrani > 0
        ? (orijinalFiyat * (1 - indirimOrani / 100)).toFixed(2)
        : orijinalFiyat.toFixed(2);

    currentQuantity += delta;

    // Eğer miktar 0'dan küçük olursa işlemi durdur
    if (currentQuantity <= 0) {
        showLoadingSpinner();
        fetch(`/api/sepet/${urunID}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload(); // Sayfayı yenile
                } else {
                    alert('Ürün silinirken hata oluştu.');
                }
            })
            .finally(() => hideLoadingSpinner());
    } else {
        showLoadingSpinner();
        fetch(`/api/sepet/${urunID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                delta: delta,
                kullaniciID: 1000,
                urunFiyat: (indirimliFiyat * currentQuantity).toFixed(2)
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    quantityDisplay.textContent = currentQuantity;
                    location.reload(); // Sayfayı yenile
                    updateCartDropdown(); // Navbar'ı güncelle
                } else {
                    alert('Güncelleme sırasında hata oluştu.');
                }
            })
            .finally(() => hideLoadingSpinner());
    }
}



// Spinner işlemleri
function showLoadingSpinner() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoadingSpinner() {
    document.getElementById('loading-overlay').classList.add('hidden');
}
