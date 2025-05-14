const sections = document.querySelectorAll('.section');
const addProductForm = document.getElementById('add-product-form');
const addCampaignForm = document.getElementById('add-campaign-form');
const campaignTypeSelect = document.getElementById('campaign-type');
const campaignCategoryField = document.getElementById('campaign-category-field');
const campaignProductField = document.getElementById('campaign-product-field');
const campaignProductSelect = document.getElementById('campaign-product');
const newOrdersList = document.getElementById('new-orders-list');
const decreasingStockList = document.getElementById('decreasing-stock-list');
const productList = document.getElementById('product-list');
const orderList = document.getElementById('order-list');
const campaignList = document.getElementById('campaign-list');
const reviewList = document.getElementById('review-list');
// Section'ları gösterme fonksiyonu
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
}

// Kampanya ekleme formunu dinamik olarak güncelleme fonksiyonu
function toggleCampaignFields() {
    const campaignType = document.getElementById('campaign-type').value;
    const productField = document.getElementById('campaign-product-field');
    if (campaignType === 'product') {
        productField.style.display = 'block';
    } else {
        productField.style.display = 'none';
    }
}

// API'den veri çekme ve listeleme fonksiyonu
async function loadData(url, listElement, formatItem) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        listElement.innerHTML = '';
        if (Array.isArray(data)) {
            data.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = formatItem(item);
                listElement.appendChild(li);
            });
        } else if (data.urunler && Array.isArray(data.urunler)) {
            // Ürün listesi için özel durum
            displayProducts(data.urunler);
            // Kampanya ekleme formunu doldur
            const datalist = document.getElementById('urun-listesi');
            datalist.innerHTML = '';
            data.urunler.forEach(product => {
                const option = document.createElement('option');
                option.value = product.UrunAdi;
                datalist.appendChild(option);
            });
        }
    } catch (error) {
        console.error(`Veriler yüklenirken hata oluştu: ${error.message}`);
    }
}

// Liste öğelerini formatlama fonksiyonları
function formatOrderItem(order) {
    return `Sipariş ID: ${order.SiparisID}, Müşteri ID: ${order.MusteriID}, ...`;
}

function formatCampaignItem(campaign) {
    return `Kampanya ID: ${campaign.kampanya_id}, İndirim Oranı: ${campaign.indirim_orani}`;
}

function formatReviewItem(review) {
    return `Müşteri Adı: <b>${review.musteri_adi}</b>, Puan: <b>${review.puan}</b>, Yorum: <i>${review.yorum}</i>`;
}

// Ürünleri listeleme fonksiyonu
function displayProducts(products) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.Gorsel}" alt="${product.UrunAdi}">
            <h4>${product.UrunAdi}</h4>
            <p>Fiyat: ${product.UrunFiyat} TL</p>
            <p>Aciklama: ${product.Aciklama}</p>
            <p>Stok: ${product.Stok}</p>
            <p>Kategori: ${product.Kategori}</p>
        `;
        productList.appendChild(card);
    });
}

// Yeni ürün ekleme fonksiyonu
async function addProduct() {
    try {
        const urunAdi = document.getElementById('urun-adi').value;
        const urunFiyati = document.getElementById('urun-fiyati').value;
        const urunAciklamasi = document.getElementById('urun-aciklamasi').value;
        const urunStok = document.getElementById('urun-stok').value;
        const urunKategori = document.getElementById('urun-kategori').value;
        const urunGorsel = document.getElementById('urun-gorsel').files[0];

        if (!urunGorsel) {
            alert('Lütfen bir görsel seçin.');
            return;
        }

        const formData = new FormData();
        formData.append('UrunAdi', urunAdi);
        formData.append('UrunFiyat', urunFiyati);
        formData.append('Aciklama', urunAciklamasi);
        formData.append('Stok', urunStok);
        formData.append('Kategori', urunKategori);
        formData.append('Gorsel', urunGorsel);

        const response = await fetch('/api/urun', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ürün eklenirken bir hata oluştu.');
        }

        alert('Ürün başarıyla eklendi!');
        document.getElementById('add-product-form').reset();
        loadProducts();
    } catch (error) {
        console.error('Hata:', error);
        alert('Ürün eklenirken bir hata oluştu: ' + error.message);
    }
}async function loadProducts() {
    try {
        const response = await fetch('/api/urun');
        const data = await response.json();

        const productList = document.getElementById('product-list');
        productList.innerHTML = '';

        if (!data.success || !Array.isArray(data.urunler) || data.urunler.length === 0) {
            productList.innerHTML = '<p>Şu anda görüntülenecek ürün bulunmamaktadır.</p>';
            return;
        }

        data.urunler.forEach(product => {
            const li = document.createElement('li');
            li.innerHTML = `
                <h3>${product.UrunAdi}</h3>
                <p>Fiyat: ${product.UrunFiyat} TL</p>
                <p>Stok: ${product.Stok}</p>
                <button onclick="deleteProduct(${product.UrunID})">Sil</button>
            `;
            productList.appendChild(li);
        });
    } catch (error) {
        console.error('Ürünler yüklenirken hata oluştu:', error);
    }
}

async function deleteProduct(urunID) {
    try {
        await fetch(`/api/urun/${urunID}`, { method: 'DELETE' });
        alert('Ürün silindi!');
        loadProducts();
    } catch (error) {
        console.error('Ürün silme hatası:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadProducts);

  
// Stok güncelleme fonksiyonu
async function updateStock() {
    try {
        const productName = document.getElementById('update-stock-name').value;
        const newStock = document.getElementById('update-stock-value').value;

        if (productName.trim() === '') {
            alert('Lütfen bir ürün adı girin.');
            return;
        }

        const response = await fetch('/api/urun/stok-guncelle', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ UrunAdi: productName, yeniStok: newStock })
        });

        if (!response.ok) {
            if (response.status === 404) {
                alert('Ürün bulunamadı!');
            } else if (response.status === 400) {
                const errorData = await response.json();
                alert(errorData.message || 'Geçersiz istek!');
            } else {
                alert('Stok güncelleme başarısız oldu!');
            }
            return;
        }

        alert('Stok başarıyla güncellendi!');
        document.getElementById('update-stock-form').reset();
        loadProducts();
    } catch (error) {
        console.error('Stok güncelleme hatası:', error);
        alert('Bir hata oluştu: ' + error.message);
    }
}
let availableProducts = []; // Ürünleri saklayacağız

// **📌 Kampanyaya Eklenebilir Ürünleri Listeleme**
async function loadProductsForCampaign() {
    try {
        const response = await fetch('/api/kampanya-urun'); // API çağrısı
        if (!response.ok) {
            throw new Error(`Ürünler alınamadı. HTTP Hata Kodu: ${response.status}`);
        }

        const data = await response.json();
        console.log("Kampanya Ürünleri API Yanıtı:", data); // Konsolda veriyi kontrol et

        const campaignProductSelect = document.getElementById('campaign-product');
        if (!campaignProductSelect) {
            console.error("HATA: 'campaign-product' ID'li öğe bulunamadı!");
            return;
        }

        campaignProductSelect.innerHTML = ''; // Önceki ürünleri temizle
        availableProducts = data.urunler; // API'den gelen ürünleri kaydet

        if (!data.success || !Array.isArray(data.urunler) || data.urunler.length === 0) {
            campaignProductSelect.innerHTML = '<option disabled>Hiç ürün bulunamadı</option>';
            return;
        }

        data.urunler.forEach(product => {
            const option = document.createElement('option');
            option.value = product.UrunAdi; // Kullanıcıya gösterilecek değer
            option.textContent = product.UrunAdi;
            campaignProductSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Ürünler yüklenirken hata oluştu:', error);
        alert('Ürünler yüklenemedi!');
    }
}

async function loadCampaigns() {
    try {
        const response = await fetch('/api/kampanya'); // Kampanyaları çekiyoruz
        if (!response.ok) {
            throw new Error('Kampanyalar alınamadı.');
        }
        const data = await response.json();
        console.log("Kampanyalar API Yanıtı:", data); // API yanıtını kontrol edin

        const campaignList = document.getElementById('campaign-list');
        campaignList.innerHTML = ''; // Önceki listeyi temizle

        if (!data.success || !Array.isArray(data.kampanyalar) || data.kampanyalar.length === 0) {
            campaignList.innerHTML = '<p>Şu anda kampanyalı ürün bulunmamaktadır.</p>';
            return;
        }

        data.kampanyalar.forEach(campaign => {
            const li = document.createElement('li');
            li.innerHTML = `
                <h3>${campaign.KampanyaAdi}</h3>
                <p>Ürün: ${campaign.UrunAdi}</p>
                <p>İndirim Oranı: %${campaign.IndirimOrani}</p>
                <p>Yeni Fiyat: ${(campaign.UrunFiyat * (1 - campaign.IndirimOrani / 100)).toFixed(2)} TL</p>
                <button onclick="deleteCampaign(${campaign.IndirimID})">Kampanyayı Sil</button>
            `;
            campaignList.appendChild(li);
        });
    } catch (error) {
        console.error('Kampanyalar yüklenirken hata oluştu:', error);
        alert('Kampanyalar yüklenemedi!');
    }
}


// **📌 Kampanya Ekleme Fonksiyonu**
async function addCampaign() {
    try {
        const selectedProductName = document.getElementById('campaign-product').value;
        const indirimOrani = document.getElementById('discount-rate').value;
        const kampanyaAdi = document.getElementById('campaign-name').value;

        if (!selectedProductName || !indirimOrani || !kampanyaAdi) {
            alert("Lütfen tüm alanları doldurun!");
            return;
        }

        // **Ürün adından ID bul**
        const selectedProduct = availableProducts.find(p => p.UrunAdi === selectedProductName);
        if (!selectedProduct) {
            alert("Seçilen ürün sistemde bulunamadı!");
            return;
        }

        const urunID = selectedProduct.UrunID; // Ürün ID'yi al

        const response = await fetch('/api/kampanya-ekle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                urunID, // ID'yi gönderiyoruz
                indirimOrani,
                kampanyaAdi
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Kampanya eklenemedi.");
        }

        alert("Kampanya başarıyla eklendi!");
        document.getElementById('add-campaign-form').reset();
        
        loadCampaigns(); // Kampanyaları yenile

    } catch (error) {
        console.error("Kampanya ekleme hatası:", error);
        alert("Bir hata oluştu: " + error.message);
    }
}

async function deleteCampaign(indirimID) {
    try {
        console.log("Silinecek Kampanya ID:", indirimID); // ID'yi kontrol et

        if (!indirimID) {
            alert("Hata: Kampanya ID alınamadı!");
            return;
        }

        if (!confirm("Bu kampanyayı silmek istediğinize emin misiniz?")) {
            return;
        }

        const response = await fetch(`/api/kampanya/${indirimID}`, { method: 'DELETE' });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Kampanya silinemedi.");
        }

        alert("Kampanya başarıyla silindi!");
        loadCampaigns(); // Listeyi yenile
    } catch (error) {
        console.error('Kampanya silme hatası:', error);
        alert("Kampanya silinemedi. Detay: " + error.message);
    }
}



// **📌 Sayfa Yüklendiğinde Kampanyaları ve Ürünleri Getir**
document.addEventListener('DOMContentLoaded', () => {
    loadCampaigns(); // Kampanyaları yükle
    loadProductsForCampaign(); // Kampanyaya eklenebilir ürünleri getir
});
// Ürün arama fonksiyonu
async function searchProduct() {
    const searchQuery = document.getElementById("search-product").value.trim();

    if (!searchQuery) {
        alert("Lütfen bir ürün adı girin.");
        return;
    }

    try {
        const response = await fetch(`/api/ara/urun?arama=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();

        const searchResult = document.getElementById("search-result");
        searchResult.innerHTML = "";

        if (!data.success || !data.urunler || data.urunler.length === 0) {
            searchResult.innerHTML = "<p>Ürün bulunamadı.</p>";
            return;
        }

        // **Yanlış ürünü çekmeyi önlemek için kontrol ekleyelim**
        const product = data.urunler.find(p => p.UrunAdi.toLowerCase() === searchQuery.toLowerCase());

        if (!product) {
            searchResult.innerHTML = "<p>Ürün bulunamadı.</p>";
            return;
        }

        // Ürün düzenleme formunu oluştur
        const form = document.createElement("form");
        form.id = "edit-form";
        form.innerHTML = `
            <label>Ürün Adı:</label>
            <input type="text" id="edit-name" value="${product.UrunAdi}" disabled>

            <label>Açıklama:</label>
            <input type="text" id="edit-description" value="${product.Aciklama}">

            <label>Fiyat (TL):</label>
            <input type="number" id="edit-price" value="${product.UrunFiyat}" step="0.01">

            <label>Stok:</label>
            <input type="number" id="edit-stock" value="${product.Stok}" step="1">

            <label>Mevcut Görsel:</label>
            <img id="current-image" src="${product.Gorsel}" alt="Ürün Görseli" style="width: 100px; height: auto;">

            <label>Yeni Görsel Yükle:</label>
            <input type="file" id="edit-image" accept="image/*">

            <button type="button" id="update-button">Düzenle</button>
            <button type="button" id="delete-button">Sil</button>
        `;

        searchResult.appendChild(form);

        // Yeni görsel seçildiğinde önizleme yap
        const imageInput = document.getElementById("edit-image");
        const currentImage = document.getElementById("current-image");
        imageInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    currentImage.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Güncelleme butonu için event ekleyelim
        document.getElementById("update-button").addEventListener("click", () => updateProduct(product.UrunID));

        // Silme butonu için event ekleyelim
        document.getElementById("delete-button").addEventListener("click", () => deleteProduct(product.UrunID));

    } catch (error) {
        console.error("Ürün arama hatası:", error);
        alert("Ürün aranırken hata oluştu.");
    }
}


// Ürün Güncelleme Fonksiyonu (Görsel Dahil)
async function updateProduct(urunID) {
    const aciklama = document.getElementById("edit-description").value;
    const fiyat = document.getElementById("edit-price").value;
    const stok = document.getElementById("edit-stock").value;
    const gorsel = document.getElementById("edit-image").files[0];

    const formData = new FormData();
    formData.append("Aciklama", aciklama);
    formData.append("UrunFiyat", fiyat);
    formData.append("Stok", stok);
    if (gorsel) {
        formData.append("Gorsel", gorsel);
    }

    try {
        const response = await fetch(`/api/urun/${urunID}`, {
            method: "PUT",
            body: formData
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        alert("Ürün başarıyla güncellendi!");
        searchProduct(); // Ürünü yeniden yükle
    } catch (error) {
        console.error("Ürün güncelleme hatası:", error);
        alert("Ürün güncellenirken hata oluştu.");
    }
}

// Ürün Silme Fonksiyonu
async function deleteProduct(urunID) {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) {
        return;
    }

    try {
        const response = await fetch(`/api/urun/${urunID}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        alert("Ürün başarıyla silindi!");
        document.getElementById("search-result").innerHTML = ""; // Ürünü ekrandan kaldır
    } catch (error) {
        console.error("Ürün silme hatası:", error);
        alert("Ürün silinemedi.");
    }
}
async function loadOrders() {
    try {
        const response = await fetch('/api/siparis');
        if (!response.ok) {
            throw new Error('Siparişler alınamadı.');
        }
        const data = await response.json();
        console.log("Siparişler API Yanıtı:", data);

        const orderList = document.getElementById('order-list');
        orderList.innerHTML = '';

        if (!data.success || data.siparisler.length === 0) {
            orderList.innerHTML = '<p>Şu anda sipariş bulunmamaktadır.</p>';
            return;
        }

        data.siparisler.forEach(order => {
            const listItem = document.createElement('li');
            let butonDurum = order.Durum;
            let butonRenk = "blue"; // Default olarak "Hazırlanıyor" rengi mavi

            if (order.Durum === "Hazırlandı") {
                butonRenk = "green";
            }

            listItem.innerHTML = `
                <strong>Sipariş ID:</strong> ${order.SiparisID} <br>
                <strong>Müşteri Adı:</strong> ${order.MusteriAdi} ${order.MusteriSoyad} <br>
                <strong>Ürünler:</strong> ${order.Urunler} <br>
                <strong>Toplam Tutar:</strong> ${order.ToplamFiyat} TL <br>
                <strong>Tarih:</strong> ${order.SiparisTarihi} <br>
                <strong>Durum:</strong> <span id="durum-${order.SiparisID}">${butonDurum}</span> <br>
                <button id="btn-${order.SiparisID}" style="background-color: ${butonRenk};" 
                    onclick="toggleOrderStatus(${order.SiparisID})">
                    ${butonDurum}
                </button>
            `;
            orderList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Siparişler yüklenirken hata oluştu:', error);
        alert('Siparişler yüklenemedi!');
    }
}

async function toggleOrderStatus(siparisID) {
    try {
        const response = await fetch(`/api/siparis/guncelle/${siparisID}`, { method: 'PUT' });

        const data = await response.json();
        if (!response.ok) {
            alert(data.message);
            return;
        }

        console.log("Sipariş Güncellendi:", data);

        // Buton ve sipariş durumunu güncelle
        document.getElementById(`durum-${siparisID}`).innerText = data.yeniDurum;
        document.getElementById(`btn-${siparisID}`).innerText = data.yeniDurum;

        // Buton rengini yeni duruma göre değiştir
        let yeniRenk = "blue"; 
        if (data.yeniDurum === "Hazırlandı") {
            yeniRenk = "green";
        }
        document.getElementById(`btn-${siparisID}`).style.backgroundColor = yeniRenk;

    } catch (error) {
        console.error('Sipariş durumu güncellenirken hata oluştu:', error);
        alert('Sipariş durumu güncellenemedi!');
    }
}


async function loadReviews() {
    try {
        const response = await fetch('/api/musteripuanlari');
        if (!response.ok) {
            throw new Error('Yorumlar alınamadı.');
        }
        const data = await response.json();

        console.log("Yorum Verileri:", data); // Hata ayıklama için

        const reviewList = document.getElementById('review-list');
        reviewList.innerHTML = '';

        if (data.yorumlar.length === 0) {
            reviewList.innerHTML = '<p>Henüz müşteri yorumu bulunmamaktadır.</p>';
            return;
        }

        data.yorumlar.forEach(review => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>Müşteri:</strong> ${review.MusteriAdi || 'Bilinmiyor'} ${review.MusteriSoyad || ''} <br>
                <strong>Ürünler:</strong> ${review.Urunler || 'Ürünler bulunamadı'} <br>
                <strong>Puan:</strong> ${review.Puan} <br>
                <strong>Yorum:</strong> ${review.Yorum} <br>
                <strong>Tarih:</strong> ${review.YorumTarihi || 'Tarih Yok'} <br>
            `;
            reviewList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Yorumları yüklerken hata oluştu:', error);
        alert('Yorumlar yüklenemedi!');
    }
}

async function loadNewOrders() {
    try {
        const response = await fetch('/api/yeni-siparisler');
        if (!response.ok) {
            throw new Error(`Yeni siparişler alınamadı. HTTP Hata Kodu: ${response.status}`);
        }

        const data = await response.json();
        console.log("Yeni Siparişler API Yanıtı:", data);

        const orderList = document.getElementById('new-orders-list');
        orderList.innerHTML = '';

        if (!data.success || data.siparisler.length === 0) {
            orderList.innerHTML = '<p>Hazırlanıyor durumunda sipariş bulunmamaktadır.</p>';
            return;
        }

        data.siparisler.forEach(order => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>Sipariş ID:</strong> ${order.SiparisID} <br>
                <strong>Müşteri Adı:</strong> ${order.MusteriAdi} ${order.MusteriSoyad} <br>
                <strong>Ürünler:</strong> ${order.Urunler} <br>
                <strong>Toplam Tutar:</strong> ${order.ToplamFiyat} TL <br>
                <strong>Tarih:</strong> ${order.SiparisTarihi} <br>
            `;
            orderList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Yeni siparişler yüklenirken hata oluştu:', error);
        alert('Yeni siparişler yüklenemedi!');
    }
}

async function loadDecreasingStock() {
    try {
        const response = await fetch('/api/azalan-stoklar');
        if (!response.ok) {
            throw new Error(`Azalan stoklar alınamadı. HTTP Hata Kodu: ${response.status}`);
        }

        const data = await response.json();
        console.log("Azalan Stoklar API Yanıtı:", data);

        const stockList = document.getElementById('decreasing-stock-list');
        stockList.innerHTML = '';

        if (!data.success || data.urunler.length === 0) {
            stockList.innerHTML = '<p>50’den az stoklu ürün bulunmamaktadır.</p>';
            return;
        }

        data.urunler.forEach(urun => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>Ürün Adı:</strong> ${urun.UrunAdi} <br>
                <strong>Stok:</strong> ${urun.Stok} adet <br>
            `;
            stockList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Azalan stoklar yüklenirken hata oluştu:', error);
        alert('Azalan stoklar yüklenemedi!');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadNewOrders(); // Yeni siparişleri yükle
    loadDecreasingStock(); // Azalan stokları yükle
});

document.addEventListener('DOMContentLoaded', () => {
    loadReviews();
});

document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});
document.addEventListener('DOMContentLoaded', () => {
    loadProductsForCampaign();
});

// Sayfa yüklendiğinde çalışacak fonksiyonlar
function initializePage() {
    loadOrders();
    loadReviews();
    loadProductsForCampaign();
    loadCampaigns();
    loadProducts();
}

// Event listener'ları ekle
document.getElementById('add-product-form').addEventListener('submit', (event) => {
    event.preventDefault();
    addProduct();
});

document.getElementById('update-stock-form').addEventListener('submit', (event) => {
    event.preventDefault();
    updateStock();
});

document.getElementById('add-campaign-form').addEventListener('submit', (event) => {
    event.preventDefault();
    addCampaign();
});

document.getElementById('campaign-type').addEventListener('change', toggleCampaignFields);

// Sayfa yüklendiğinde initializePage fonksiyonunu çağır
document.addEventListener('DOMContentLoaded', () => {
   
    loadData('/api/urun', document.getElementById('product-list'), displayProducts); // Ürünleri yükle
    initializePage();
});