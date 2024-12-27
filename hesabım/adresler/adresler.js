document.addEventListener('DOMContentLoaded', () => {
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
});

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
    editBox.removeAttribute('data-id'); // Yeni adres için ID boş
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

    const method = adresID ? 'PUT' : 'POST'; // Yeni ekleme veya güncelleme
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
    if (!confirm('Bu adresi silmek istediğinizden emin misiniz?')) {
        return;
    }

    fetch(`/api/adresler/${adresID}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Adres başarıyla silindi!');
                location.reload();
            } else {
                console.error('Adres silinemedi:', data.message);
                alert('Adres silinemedi!');
            }
        })
        .catch(err => {
            console.error('Adres silme hatası:', err);
            alert('Sunucu hatası! Lütfen tekrar deneyin.');
        });
}
