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
}
// ürünleri yükleme
async function loadProducts() {
    try {
      const response = await fetch('/api/urun'); // API endpoint'ine GET isteği gönder
      if (!response.ok) {
        const message = `Ürünler yüklenirken bir hata oluştu: ${response.status}`;
        throw new Error(message);
      }
  
      const data = await response.json(); // API'den gelen JSON verisini ayrıştır
      if (!data.success) {
        throw new Error(data.message || 'Ürünler alınamadı.');
      }
  
      const products = data.urunler; // Ürünler dizisini al
      const productList = document.getElementById('product-list'); // Ürünlerin listeleneceği HTML elementini seç
      productList.innerHTML = ''; // Eski ürünleri temizle
  
      if (products.length === 0) {
        // Eğer ürün yoksa, kullanıcıya bilgi mesajı göster
        productList.innerHTML = '<p>Şu anda görüntülenecek ürün bulunmamaktadır.</p>';
        return;
      }
  
      products.forEach(product => {
        // Her ürün için HTML elementleri oluştur ve listeye ekle
        const li = document.createElement('li');
        li.classList.add('product-item'); // Daha iyi tasarım için bir sınıf ekleyebilirsiniz
        li.innerHTML = `
          <h3>${product.UrunAdi}</h3>
          <p><strong>Stok:</strong> ${product.Stok}</p>
          <p><strong>Fiyat:</strong> ${product.UrunFiyat} ₺</p>
          <p><strong>Kategori:</strong> ${product.Kategori}</p>
          <p><strong>Açıklama:</strong> ${product.Aciklama}</p>
          ${product.Gorsel ? `<img src="${product.Gorsel}" alt="${product.UrunAdi} görseli">` : ''}
        `;
        productList.appendChild(li);
      });
    } catch (error) {
      console.error('Ürün yükleme hatası:', error); // Hata mesajını konsola yazdır
      alert('Ürünler yüklenirken bir hata oluştu.'); // Kullanıcıya hata mesajı göster
    }
  }
  
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

// Kampanya ekleme fonksiyonu
async function addCampaign() {
    const campaignName = document.getElementById('campaign-name').value.trim();
    const discountRate = parseFloat(document.getElementById('discount-rate').value);
    const campaignType = document.getElementById('campaign-type').value;
    let campaignCategory = null;
    let selectedProducts = [];

    try {
        if (campaignType === 'category') {
            campaignCategory = document.getElementById('campaign-category')?.value;
            if (!campaignCategory) {
                alert('Lütfen bir kategori seçin.');
                return;
            }
            selectedProducts = []; // Kategori seçiliyse ürünleri temizle
        } else if (campaignType === 'product') {
            selectedProducts = Array.from(document.getElementById('campaign-products').selectedOptions)
                .map(option => option.value);

            if (selectedProducts.length === 0) {
                alert('Lütfen en az bir ürün seçin.');
                return;
            }
            campaignCategory = null; // Ürünler seçiliyse kategoriyi temizle
        } else {
            alert('Geçersiz kampanya tipi!');
            return;
        }

        const response = await fetch('/api/kampanya-ekle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                kampanyaAdi: campaignName,
                indirimOrani: discountRate,
                kategori: campaignCategory,
                urunler: selectedProducts,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.message || errorData.error || 'Kampanya ekleme başarısız oldu.';
            throw new Error(errorMessage);
        }

        alert('Kampanya başarıyla eklendi!');
        document.getElementById('add-campaign-form').reset();
        loadCampaigns();
    } catch (error) {
        console.error('Kampanya ekleme hatası:', error);
        alert('Bir hata oluştu: ' + error.message);
    }
}

// Kampanya ekleme formu için ürünleri listeleme fonksiyonu
async function loadProductsForCampaign() {
    try {
        const response = await fetch('/api/kampanya-urun');
        if (!response.ok) {
            throw new Error('Ürünler alınamadı.');
        }
        const data = await response.json();

        const campaignProductSelect = document.getElementById('campaign-products');
        campaignProductSelect.innerHTML = ''; // Seçenekleri temizle

        data.urunler.forEach(product => {
            const option = document.createElement('option');
            option.value = product.UrunAdi; // product.UrunID kullanabilirsiniz
            option.text = product.UrunAdi;
            campaignProductSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Ürünler yüklenirken hata oluştu:', error);
        alert('Ürünler yüklenemedi!');
    }
}
async function loadCampaigns() {
    try {
        const response = await fetch('/api/kampanya');
        if (!response.ok) {
            throw new Error('Kampanyalar alınamadı.');
        }
        const data = await response.json(); // API yanıtını data değişkenine ata

        console.log(data); // Veriyi konsola yazdırarak kontrol et

        const campaignList = document.getElementById('campaign-list');
        campaignList.innerHTML = '';

        if (Array.isArray(data.kampanyalar)) {
            data.kampanyalar.forEach(campaign => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `<strong>${campaign.KampanyaAdi}</strong> <br>
                    Kategori: ${campaign.Kategori} <br>
                    Stok: ${campaign.Stok} <br>
                    Açıklama: ${campaign.Aciklama} <br>
                    Görsel: <img src="${campaign.Gorsel}" alt="${campaign.UrunAdi}" width="100" /> <br>
                    Fiyat: ${campaign.UrunFiyat} TL <br>
                    İndirim Oranı: %${campaign.IndirimOrani} <br>
                `;
                campaignList.appendChild(listItem);
            });
        } else {
            console.error('API yanıtı beklenen formatta değil:', data);
            alert('Kampanyalar yüklenemedi!');
        }

    } catch (error) {
        console.error('Kampanyalar yüklenirken hata oluştu:', error);
        alert('Kampanyalar yüklenemedi!');
    }
}


// Siparişleri Listeleme Fonksiyonu
async function loadOrders() {
    try {
        const response = await fetch('/api/siparis');
        if (!response.ok) {
            throw new Error('Siparişler alınamadı.');
        }
        const data = await response.json();

        const orderList = document.getElementById('order-list');
        orderList.innerHTML = '';

        if (data && Array.isArray(data.siparisler)) {
            data.siparisler.forEach(order => {
                const listItem = document.createElement('li');

                // Eğer "Urunler" boş ya da tanımlı değilse, kontrol ekliyoruz.
                const urunlerListesi = Array.isArray(order.Urunler)
                    ? order.Urunler.join(', ')
                    : 'Ürün bilgisi mevcut değil';

                listItem.innerHTML = `
                    <strong>Sipariş ID:</strong> ${order.SiparisID} <br>
                    <strong>Müşteri Adı:</strong> ${order.MusteriAdi || 'Bilinmiyor'} <br>
                    <strong>Ürünler:</strong> ${urunlerListesi} <br>
                    <strong>Toplam Tutar:</strong> ${order.ToplamTutar || '0.00'} TL <br>
                    <strong>Sipariş Tarihi:</strong> ${order.SiparisTarihi || 'Tarih bilgisi yok'} <br>
                `;
                orderList.appendChild(listItem);
            });
        } else {
            console.error('API yanıtı beklenen formatta değil:', data);
            alert('Siparişler yüklenemedi!');
        }
    } catch (error) {
        console.error('Siparişler yüklenirken hata oluştu:', error);
        alert('Siparişler yüklenemedi!');
    }
}

// Yorumları Listeleme Fonksiyonu
async function loadReviews() {
    try {
        const response = await fetch('/api/musteripuanlari');
        if (!response.ok) {
            throw new Error('Yorumlar alınamadı.');
        }
        const data = await response.json();

        const reviewList = document.getElementById('review-list');
        reviewList.innerHTML = '';

        if (Array.isArray(data.yorumlar)) {
            data.yorumlar.forEach(review => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <strong>Müşteri Adı:</strong> ${review.MusteriAdi} <br>
                    <strong>Ürün:</strong> ${review.UrunAdi} <br>
                    <strong>Puan:</strong> ${review.Puan} <br>
                    <strong>Yorum:</strong> ${review.Yorum} <br>
                    <strong>Yorum Tarihi:</strong> ${review.YorumTarihi} <br>
                `;
                reviewList.appendChild(listItem);
            });
        } else {
            console.error('API yanıtı beklenen formatta değil:', data);
            alert('Yorumlar yüklenemedi!');
        }
    } catch (error) {
        console.error('Yorumlar yüklenirken hata oluştu:', error);
        alert('Yorumlar yüklenemedi!');
    }
}

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