// -------------------- //
// SAYFA YÜKLEME VE MENÜ //
// -------------------- //

function loadPage(page) {
    const content = document.getElementById('content');
    fetch(`${page}/${page}.html`) 
        .then(response => response.text())
        .then(html => {
            content.innerHTML = html;

            if (page === 'favoriler') {
                favorileriYukle();
            } else if (page === 'adresler') {
                adresleriYukle();
            }
        })
        .catch(error => console.error(`${page}.html yüklenirken hata oluştu:`, error));
}

document.querySelectorAll('.menu li').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.getAttribute('data-page');
        loadPage(page);
        setActiveMenu(item);
    });
});

function setActiveMenu(activeItem) {
    document.querySelectorAll('.menu li').forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');
}

window.addEventListener('DOMContentLoaded', () => {
    loadPage('adresler');
});

// -------------------- //
// FAVORİLER KODLARI    //
// -------------------- //

function favorileriYukle() {
    const favoriListesi = document.getElementById('favori-listesi');
    let kullaniciID = 1000;

    fetch(`/api/favoriler/${kullaniciID}`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                favoriListesi.innerHTML = '';
                
                const promises = data.map(item => 
                    fetch(`/api/urunler/detay/${item.UrunID}`)
                        .then(res => res.json())
                        .then(urun => {
                            favoriListesi.innerHTML += `
                                <div class="favori-item">
                                    <img src="${urun.Gorsel || 'resimyok.png'}" alt="${urun.UrunAdi}">
                                    <div class="favori-details">
                                        <h3>${urun.UrunAdi || 'Ürün Adı Yok'}</h3>
                                        <p class="price">
                                            ${urun.IndirimOrani > 0 
                                                ? `<del>${urun.UrunFiyat} TL</del> ${(urun.UrunFiyat * (1 - urun.IndirimOrani / 100)).toFixed(2)} TL`
                                                : `${urun.UrunFiyat || 0} TL`}
                                        </p>
                                        ${urun.KampanyaAdi 
                                            ? `<p class="kampanya">${urun.KampanyaAdi}</p>` 
                                            : ''}
                                    </div>
                                    <div class="favori-meta">
                                        <span class="date">Favoriler Listesine Eklenme Tarihi: ${formatTarih(item.EklenmeTarihi)}</span>
                                        <div class="star-btn favori" onclick="favoriKaldir(${urun.UrunID}, this)">★</div>
                                    </div>
                                </div>
                            `;
                        })
                        .catch(err => console.error(`Ürün ${item.UrunID} yüklenirken hata:`, err))
                );

                Promise.all(promises).then(() => {
                    console.log("Tüm favori ürünler yüklendi.");
                });
            } else {
                favoriListesi.innerHTML = '<p>Henüz favori ürününüz yok.</p>';
            }
        })
        .catch(err => console.error('Favoriler yüklenirken hata oluştu:', err));
}

function favoriKaldir(urunID, element) {
    fetch(`/api/favoriler`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kullaniciID: 1000, urunID })
    })
    .then(response => response.json())
    .then(() => element.parentElement.parentElement.remove())
    .catch(err => console.error('Favori kaldırılırken hata oluştu:', err));
}

// -------------------- //
// ADRESLER KODLARI     //
// -------------------- //

function adresleriYukle() {
    const addressSection = document.querySelector('.address-section');
    fetch('/api/adresler')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderAddresses(data.adresler);
            } else {
                console.error('Adresler alınamadı:', data.message);
            }
        })
        .catch(err => console.error('Adres verileri çekilirken hata:', err));
}

function renderAddresses(adresler) {
    const addressSection = document.querySelector('.address-section');
    if (adresler.length === 0) {
        addressSection.innerHTML = '<p style="text-align: center;">Adres bulunamadı.</p>';
        return;
    }

    addressSection.innerHTML = `
        <button class="add-address" onclick="openNewAddressBox()">+ Yeni Teslimat Adresi Ekle</button>
    `;

    adresler.forEach(adres => {
        const addressCard = `
            <div class="address-card">
                <h3>${adres.AdresBaslik}</h3>
                <p>${adres.AdresAciklama}, ${adres.Ilce}/${adres.Sehir}</p>
                <div class="actions">
                    <button class="edit" onclick="openEditBox(${adres.AdresID}, '${adres.AdresBaslik}', '${adres.AdresAciklama}', '${adres.Sehir}', '${adres.Ilce}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete" onclick="deleteAddress(${adres.AdresID})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        addressSection.innerHTML += addressCard;
    });
}

function openNewAddressBox() {
    document.getElementById('editBox').style.display = 'flex';
}

function deleteAddress(adresID) {
    if (!confirm('Bu adresi silmek istediğinizden emin misiniz?')) return;
    fetch(`/api/adresler/${adresID}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) location.reload();
            else alert('Adres silinemedi!');
        })
        .catch(err => alert('Sunucu hatası!'));
}

// -------------------- //
// TARİH FORMATLAMA     //
// -------------------- //

function formatTarih(tarih) {
    const date = new Date(tarih);
    return `${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')} / ${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
}
