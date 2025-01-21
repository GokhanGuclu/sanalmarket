// Navbar Yükleme
fetch('../navbar/navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar').innerHTML = data;
        updateCartDropdown(); 
    })
    .catch(error => console.error('Navbar yüklenirken hata oluştu:', error));

    const urlPath = window.location.pathname;
    const kategoriAdi = urlPath.split('/')[2];
    
    if (!kategoriAdi) {
        window.location.href = '/404/';
        throw new Error('Kategori adı eksik!');
    }
    
    console.log('Kategori Adı:', kategoriAdi);
    
    let kullaniciID = null;
    
    fetch('/api/kullanici', { credentials: 'include' })
        .then(response => response.json())
        .then(userData => {
            if (userData.success && userData.userID) {
                kullaniciID = userData.userID;
                console.log('Kullanıcı ID:', kullaniciID);
            } else {
                console.warn('Kullanıcı giriş yapmamış.');
            }
            urunleriYukle();
        })
        .catch(error => {
            console.error('Kullanıcı bilgisi alınırken hata oluştu:', error);
            urunleriYukle();
        });
    
    function urunleriYukle() {
        fetch(`/api/urunler/${kategoriAdi}`)
            .then(response => response.json())
            .then(urunListesi => {
                console.log('Ürün Listesi:', urunListesi);
    
                if (!urunListesi || urunListesi.length === 0) {
                    console.warn('Bu kategoride ürün bulunamadı!');
                    window.location.href = '/404/';
                    return;
                }
    
                sepetVeFavorileriYukle(urunListesi);
            })
            .catch(error => {
                console.error('Ürünler yüklenirken hata oluştu:', error);
                window.location.href = '/404/';
            });
    }
    
    function sepetVeFavorileriYukle(urunListesi) {
        const sepetVerisi = kullaniciID
            ? fetch('/api/sepet', { credentials: 'include' })
                .then(response => response.json())
                .then(data => data.success ? data.sepetUrunleri : [])
                .catch(() => [])
            : Promise.resolve([]);
    
            const favoriVerisi = kullaniciID
            ? fetch('/api/favoriler', { credentials: 'include' })
                .then(response => response.json())
                .then(data => {
                    console.log('Favoriler:', data); // Konsola yazdır
                    return data.success ? data.favoriler.map(fav => fav.UrunID) : [];
                })
                .catch(() => [])
            : Promise.resolve([]);
        
    
        Promise.all([sepetVerisi, favoriVerisi]) // Tüm veriler yüklendiğinde
            .then(([sepetUrunleri, favoriUrunler]) => {
                renderProducts(urunListesi, sepetUrunleri, favoriUrunler, kullaniciID); // Ürünleri render et
            })
            .catch(error => {
                console.error('Sepet ve favoriler yüklenirken hata oluştu:', error);
                renderProducts(urunListesi, [], [], null); // Hata durumunda boş verilerle render et
            });
    }
    
    
function renderProducts(urunListesi, sepetUrunleri, favoriUrunler, kullaniciID) {
    const urunlerContainer = document.querySelector('.category-container');
    urunlerContainer.innerHTML = '';

    urunListesi.forEach(urun => {
        const indirimOrani = urun.IndirimOrani || 0;
        const kampanyaAdi = urun.KampanyaAdi || '';
        const orijinalFiyat = parseFloat(urun.UrunFiyat);
        const indirimliFiyat = indirimOrani > 0
            ? (orijinalFiyat * (1 - indirimOrani / 100)).toFixed(2)
            : orijinalFiyat.toFixed(2);

        const sepetUrunu = sepetUrunleri.find(item => item.UrunID === urun.UrunID);
        const mevcutMiktar = sepetUrunu ? sepetUrunu.UrunSayisi : 0;

        const isFavori = favoriUrunler.includes(urun.UrunID);

        const urunDiv = document.createElement('div');
        urunDiv.className = 'category-item';
        urunDiv.dataset.urunId = urun.UrunID;
        urunDiv.dataset.orijinalFiyat = orijinalFiyat;
        urunDiv.dataset.indirimOrani = indirimOrani;

        urunDiv.innerHTML = `
            <div class="star-btn ${isFavori ? 'favori' : ''}" onclick="toggleFavorite(${urun.UrunID}, this, ${kullaniciID})">★</div>
            ${kampanyaAdi ? `<span class="discount">${kampanyaAdi}</span>` : ''}
            <img src="${urun.Gorsel}" alt="${urun.UrunAdi}">
            <h3>${urun.UrunAdi}</h3>
            <p class="price">
                ${indirimOrani > 0 
                    ? `<del>${orijinalFiyat} TL</del> ${indirimliFiyat} TL`
                    : `${indirimliFiyat} TL`}
            </p>
            ${kullaniciID !== null && mevcutMiktar > 0 ? `
                <div class="quantity-controls-item">
                    <button class="quantity-btn-item" onclick="changeQuantity(this, -1)">−</button>
                    <span class="quantity-display-item">${mevcutMiktar}</span>
                    <button class="quantity-btn-item" onclick="changeQuantity(this, 1)">+</button>
                </div>
            ` : `
                <button class="add-to-cart" onclick="toggleQuantityControls(this)">Sepete Ekle</button>
            `}
        `;

        urunlerContainer.appendChild(urunDiv);
    });
}

function toggleFavorite(urunID, element, kullaniciID) {
    if (kullaniciID == null) {
        alert('Favorilere eklemek için giriş yapmalısınız!');
        return;
    }

    const isFavori = element.classList.contains('favori');
    const method = isFavori ? 'DELETE' : 'POST';

    fetch(`/api/favoriler`, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kullaniciID, urunID }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                element.classList.toggle('favori');
                element.classList.toggle('active');
            } else {
                alert('Favori durumu güncellenemedi.');
            }
        })
        .catch(error => console.error('Favori güncelleme hatası:', error));
}


async function toggleQuantityControls(button) {
    const parent = button.parentElement;
    const urunID = parseInt(parent.dataset.urunId);
    const orijinalFiyat = parseFloat(parent.dataset.orijinalFiyat);
    const indirimOrani = parseFloat(parent.dataset.indirimOrani) || 0;

    // Kullanıcı oturum kontrolü (gerekirse)
    if (kullaniciID === null) { 
        showBox();
        return;
    }

    if (isNaN(urunID) || isNaN(orijinalFiyat)) {
        alert('Ürün bilgileri eksik. Sayfayı yenileyin.');
        return;
    }

    const indirimliFiyat = indirimOrani > 0
        ? (orijinalFiyat * (1 - indirimOrani / 100)).toFixed(2)
        : orijinalFiyat.toFixed(2);

    showLoadingSpinner();

    try {
        const response = await fetch('/api/sepet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                kullaniciID: kullaniciID,
                urunID: urunID,
                urunFiyat: indirimliFiyat
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            location.reload(); 
        } else {
            alert('Ürün eklenirken hata oluştu: ' + data.message);
        }
    } catch (error) {
        console.error('Sepet isteği hatası:', error);
        alert('Ürün eklenirken hata oluştu: ' + error.message);
    } finally {
        hideLoadingSpinner();
    }
}

function showBox() {
    document.getElementById('loginWarningBox').style.display = 'flex';
};

function hideBox() {
    document.getElementById('loginWarningBox').style.display = 'none';
};

document.getElementById('cancelButton').addEventListener('click', () => {
    hideBox();
});

document.getElementById('loginButton').addEventListener('click', () => {
    window.location.href = '/giriskayit';
});


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

    if (currentQuantity <= 0) {
        showLoadingSpinner();
        fetch(`/api/sepet/${urunID}`, { method: 'DELETE' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();
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
                    location.reload(); 
                    updateCartDropdown(); 
                } else {
                    alert('Güncelleme sırasında hata oluştu.');
                }
            })
            .finally(() => hideLoadingSpinner());
    }
}

function showLoadingSpinner() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoadingSpinner() {
    document.getElementById('loading-overlay').classList.add('hidden');
}