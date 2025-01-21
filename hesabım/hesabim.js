// -------------------- //
// SAYFA YÜKLEME VE MENÜ //
// -------------------- //
window.addEventListener('DOMContentLoaded', () => {
    loadPage('adresler');
    kullaniciBilgileriniYukle()
});

const logoutButton = document.querySelector('.logout');

if (logoutButton) {
    logoutButton.addEventListener('click', function(event) {
        event.preventDefault(); 

        fetch('/api/logout', {
            method: 'POST',
            credentials: 'same-origin', 
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/'; 
            } else {
                console.error('Çıkış yapılırken bir hata oluştu.');
            }
        })
        .catch(error => {
            console.error('Çıkış yapma işlemi sırasında bir hata oluştu:', error);
        });
    });
}


function kullaniciBilgileriniYukle() {
    fetch('/api/kullanicibilgi', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const { Ad, Soyad, Mail } = data.kullanici;
                document.querySelector('.user-info h3').textContent = `${Ad} ${Soyad}`; 
                document.querySelector('.user-info p').textContent = Mail;
            } else {
                console.warn('Kullanıcı bilgisi alınamadı:', data.message);
            }
        })
        .catch(error => console.error('Kullanıcı bilgileri yüklenirken hata oluştu:', error));
}

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
            } else if (page == 'kartlarim') {
                kartlariYukle();
            } else if (page == 'siparisler') {
                siparisleriYukle();
            } else if (page == 'puanlarım') {
                puanlariYukle()
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

// -------------------- //
// FAVORİLER KODLARI    //
// -------------------- //

function favorileriYukle() {
    const favoriListesi = document.getElementById('favori-listesi');

    fetch(`/api/favoriler`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.favoriler.length > 0) {
                favoriListesi.innerHTML = '';

                const promises = data.favoriler.map(item => 
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
        body: JSON.stringify({ urunID }) 
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            element.parentElement.parentElement.remove();
        } else {
            alert('Favori kaldırılamadı!');
        }
    })
    .catch(err => console.error('Favori kaldırılırken hata oluştu:', err));
}


// -------------------- //
// ADRESLER KODLARI     //
// -------------------- //

let selectedAddressID = null;

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

function openEditBox(adresID, baslik, aciklama, sehir, ilce) {
    const editBox = document.getElementById('editBox');
    document.getElementById('editBaslik').value = baslik;
    document.getElementById('editAciklama').value = aciklama;
    document.getElementById('editSehir').value = sehir;
    document.getElementById('editIlce').value = ilce;

    editBox.style.display = 'flex';
    editBox.setAttribute('data-id', adresID);
}

function openNewAddressBox() {
    const editBox = document.getElementById('editBox');
    document.getElementById('editBaslik').value = '';
    document.getElementById('editAciklama').value = '';
    document.getElementById('editSehir').value = '';
    document.getElementById('editIlce').value = '';

    editBox.style.display = 'flex';
    editBox.removeAttribute('data-id');
}

function closeEditBox() {
    const editBox = document.getElementById('editBox');
    editBox.style.display = 'none';
}

function saveEdit() {
    const editBox = document.getElementById('editBox');
    const adresID = editBox.getAttribute('data-id');

    const baslik = document.getElementById('editBaslik').value;
    const aciklama = document.getElementById('editAciklama').value;
    const sehir = document.getElementById('editSehir').value;
    const ilce = document.getElementById('editIlce').value;

    const method = adresID ? 'PUT' : 'POST'; 
    const url = adresID ? `/api/adresler/${adresID}` : '/api/adresler';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            adresBaslik: baslik,
            adresAciklama: aciklama,
            sehir: sehir,
            ilce: ilce
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Adres başarıyla ${adresID ? 'güncellendi' : 'eklendi'}!`);
                location.reload();
            } else {
                console.error(`Adres ${adresID ? 'güncellenemedi' : 'eklenemedi'}:`, data.message);
                alert(`Adres ${adresID ? 'güncellenemedi' : 'eklenemedi'}!`);
            }
        })
        .catch(err => {
            console.error(`Adres ${adresID ? 'güncelleme' : 'ekleme'} hatası:`, err);
            alert('Sunucu hatası! Lütfen tekrar deneyin.');
        });
}


function deleteAddress(adresID) {
    if (!confirm('Bu adresi silmek istediğinizden emin misiniz?')) return;
    fetch(`/api/adresler/${adresID}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) adresleriYukle();
            else alert('Adres silinemedi!');
        })
        .catch(err => alert('Sunucu hatası!'));
}

// -------------------- //
// KARTLARIM KODLARI    //
// -------------------- //

function kartlariYukle() {
    const cardSection = document.querySelector('.card-section');

    if (!cardSection) {
        console.error('Kartlar bölümü bulunamadı!');
        return;
    }

    fetch('/api/kartlar', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            console.log('Kart API Yanıtı:', data); 

            if (data.success && data.kartlar.length > 0) {
                cardSection.innerHTML = ''; 

                data.kartlar.forEach(kart => {
                    const kartHTML = `
                        <div class="card-item">
                            <h3>${kart.KartIsim}</h3>
                            <p>${maskKartNumara(kart.KartNumara)}</p>
                            <div class="actions">
                                <button onclick="kartDuzenle(${kart.KartID}, '${kart.KartIsim}', '${kart.KartNumara}', '${kart.SonKullanmaTarih}', '${kart.CVV}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="kartSil(${kart.KartID})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                    cardSection.innerHTML += kartHTML;
                });
            } else {
                cardSection.innerHTML = '<p>Henüz kart eklenmemiş.</p>';
            }
        })
        .catch(error => console.error('Kartlar yüklenirken hata oluştu:', error));
}

function maskKartNumara(numara) {
    return '**** **** **** ' + numara.slice(-4);
}

function kartDuzenle(kartID = null, isim = '', numara = '', tarih = '', cvv = '') {
    const editBox = document.getElementById('editCardBox');
    document.getElementById('editKartIsim').value = isim;
    document.getElementById('editKartNumara').value = numara;
    document.getElementById('editKartTarih').value = tarih;
    document.getElementById('editKartCVV').value = cvv;

    editBox.style.display = 'flex';
    editBox.dataset.kartId = kartID; 
}

function closeCardEditBox() {
    document.getElementById('editCardBox').style.display = 'none';
}

function saveCardEdit() {
    const editBox = document.getElementById('editCardBox');
    const kartID = editBox.dataset.kartId || null;
    const isim = document.getElementById('editKartIsim').value.trim();
    const numara = document.getElementById('editKartNumara').value.trim();
    const tarih = document.getElementById('editKartTarih').value.trim();
    const cvv = document.getElementById('editKartCVV').value.trim();

    if (!isim || isim.length < 3 || isim.length > 100) {
        alert('Kart ismi 3-100 karakter arasında olmalıdır!');
        return;
    }

    if (!/^\d{16}$/.test(numara)) {
        alert('Kart numarası 16 haneli olmalıdır!');
        return;
    }

    const tarihRegex = /^(0[1-9]|1[0-2])\/\d{4}$/;
    if (!tarihRegex.test(tarih)) {
        alert('Geçerli bir son kullanma tarihi giriniz (MM/YYYY)!');
        return;
    }

    if (!/^\d{3}$/.test(cvv)) {
        alert('CVV geçersiz! 3 haneli olmalıdır.');
        return;
    }

    const method = kartID ? 'PUT' : 'POST';
    const url = kartID ? `/api/kartlar/${kartID}` : '/api/kartlar';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            KartIsim: isim,
            KartNumara: numara,
            SonKullanmaTarih: tarih,
            CVV: cvv
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Kart başarıyla ${kartID ? 'güncellendi' : 'eklendi'}!`);
                closeCardEditBox();
                kartlariYukle();
            } else {
                alert(`Kart ${kartID ? 'güncellenemedi' : 'eklenemedi'}!`);
            }
        })
        .catch(error => {
            console.error('Kart kaydetme sırasında hata oluştu:', error);
            alert('Sunucu hatası! Lütfen tekrar deneyin.');
        });
}


function kartSil(kartID) {
    if (!confirm('Bu kartı silmek istediğinizden emin misiniz?')) return;

    fetch(`/api/kartlar/${kartID}`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Kart başarıyla silindi!');
                kartlariYukle();
            } else {
                alert('Kart silinemedi!');
            }
        })
        .catch(error => {
            console.error('Kart silme sırasında hata oluştu:', error);
            alert('Sunucu hatası! Lütfen tekrar deneyin.');
        });
}


// -------------------- //
// SİPARİŞLER KODLARI   //
// -------------------- //

function siparisleriYukle() {
    const siparisListesi = document.getElementById('siparis-listesi');

    fetch('/api/siparisler-cek', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.siparisler.length > 0) {
                siparisListesi.innerHTML = ''; 

                data.siparisler.forEach(siparis => {
                    const siparisHTML = `
                        <div class="siparis-item">
                            <div class="siparis-detay">
                                <p><strong>Sipariş Numarası:</strong> ${siparis.SiparisID}</p>
                                <p><strong>Sipariş Tarihi:</strong> ${formatTarih(siparis.SiparisTarihi)}</p>
                                <p><strong>Toplam Tutar:</strong> ${siparis.ToplamTutar} TL</p>
                            </div>
                            <button class="detay-btn" onclick="siparisDetayGoster(${siparis.SiparisID})">Detay</button>
                            ${!siparis.Puanlanmis ? 
                                `<button class="puan-btn" onclick="puanVer(${siparis.SiparisID})">Puan Ver</button>` : 
                                ''
                            }
                        </div>
                    `;
                    siparisListesi.innerHTML += siparisHTML;
                });
            } else {
                siparisListesi.innerHTML = '<p>Henüz siparişiniz bulunmamaktadır.</p>';
            }
        })
        .catch(error => console.error('Siparişler yüklenirken hata oluştu:', error));
}

function puanVer(siparisID) {
    const puanlamaModal = document.getElementById('puanlamaModal');
    puanlamaModal.style.display = 'flex'; 

    document.getElementById('siparisIDInput').value = siparisID;
}

let selectedRating = 0;  

function setRating(rating) {
    selectedRating = rating; 
    updateStars(rating);
}

function updateStars(rating) {
    document.querySelectorAll('.star').forEach((star, index) => {
        if (index < rating) {
            star.classList.add('selected');
        } else {
            star.classList.remove('selected');
        }
    });

    console.log(`Seçilen puan: ${rating}`);
}

document.addEventListener('DOMContentLoaded', function() {
    updateStars(selectedRating);
});


function siparisDetayGoster(siparisID) {
    fetch(`/api/siparisler-cek/detay/${siparisID}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const modal = document.getElementById('siparisModal');
                const urunListesi = document.getElementById('urunListesi');
                urunListesi.innerHTML = ''; 

                data.urunler.forEach(urun => {
                    urunListesi.innerHTML += `
                        <li>${urun.UrunAdi} - ${urun.Adet} Adet - ${urun.Fiyat} TL</li>
                    `;
                });

                modal.style.display = 'flex';
            } else {
                alert('Sipariş detayları alınamadı.');
            }
        })
        .catch(error => console.error('Sipariş detayları yüklenirken hata oluştu:', error));
}

function modalKapat() {
    const siparisModal = document.getElementById('siparisModal');
    const puanlamaModal = document.getElementById('puanlamaModal');
    siparisModal.style.display = 'none';
    puanlamaModal.style.display = 'none';
}

function yorumKaydet() {
    const yorum = document.getElementById('yorum').value;
    const puan = selectedRating;
    const siparisID = document.getElementById('siparisIDInput').value;

    if (!puan || !yorum) {
        alert("Lütfen puan ve yorum girin.");
        return;
    }

    fetch('/api/yorum-puan', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ siparisID, puan, yorum })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("Yorum ve puan başarıyla kaydedildi.");
            modalKapat();  
        } else {
            alert("Bir hata oluştu, lütfen tekrar deneyin.");
        }
    })
    .catch(error => console.error("Yorum kaydedilirken hata oluştu:", error));
}


// -------------------- //
// PUANLARIM KODLARI   //
// -------------------- //

function puanlariYukle() {
    fetch('/api/siparis-puanlari')
        .then(response => response.json())
        .then(data => {
            const puanlarListesi = document.getElementById('puanlar-listesi');
            if (data.success) {
                data.puanlar.forEach(puan => {
                    const puanDiv = document.createElement('div');
                    puanDiv.classList.add('puan-item');
                    puanDiv.innerHTML = `
                        <p>Sipariş ID: ${puan.SiparisID}</p>
                        <p>Sipariş Tarihi: ${formatPuanTarih(puan.SiparisTarihi)}</p>
                        <div class="yildizlar" id="puan-${puan.SiparisID}">
                            ${createStars(puan.Puan)}
                        </div>
                        <p>Yorum: ${puan.Yorum || 'Yorum yapılmamış.'}</p>
                    `;
                    puanlarListesi.appendChild(puanDiv);
                });
            } else {
                puanlarListesi.innerHTML = '<p>Henüz puan vermediniz.</p>';
            }
        })
        .catch(error => {
            console.error('Puanlar yüklenirken hata oluştu:', error);
        });
}

function createStars(puan) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= puan) {
            starsHtml += `<div class="yildiz dolu"></div>`; 
        } else {
            starsHtml += `<div class="yildiz"></div>`;
        }
    }
    return starsHtml;
}

// -------------------- //
// TARİH FORMATLAMA     //
// -------------------- //

function formatTarih(tarih) {
    const date = new Date(tarih);
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

function formatPuanTarih(tarih) {
    const date = new Date(tarih);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0'); 
    const hours = String(date.getHours()).padStart(2, '0'); 
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} / ${hours}-${minutes}`;
}
