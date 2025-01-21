document.addEventListener('DOMContentLoaded', () => {
    setupTabSwitching();
    fetchOrders();
});

function setupTabSwitching() {
    const tabs = {
        'profile-tab': 'profile-section',
        'active-orders-tab': 'active-orders-section',
        'past-orders-tab': 'past-orders-section',
    };

    document.querySelectorAll('nav ul li a').forEach(tab => {
        tab.addEventListener('click', e => {
            e.preventDefault();

            document.querySelectorAll('.tab-section').forEach(section => section.classList.add('hidden'));
            document.querySelectorAll('nav ul li a').forEach(link => link.classList.remove('active'));

            const target = tabs[e.target.id];
            document.getElementById(target).classList.remove('hidden');
            e.target.classList.add('active');

            if (e.target.id === 'active-orders-tab' || e.target.id === 'past-orders-tab') {
                fetchOrders();
            }
        });
    });
}

function updateDeliveredOrdersCount(count) {
    const deliveredOrdersCountElement = document.getElementById('completed-orders-count');
    deliveredOrdersCountElement.textContent = count;
}

function fetchOrders() {
    fetch('/api/siparisler')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const activeOrders = data.data.filter(order => order.durum !== 'Teslim Edildi');
                const pastOrders = data.data.filter(order => order.durum === 'Teslim Edildi');

                displayActiveOrders(activeOrders);
                displayPastOrders(pastOrders);

                updateDeliveredOrdersCount(pastOrders.length);
            } else {
                console.error('Sipariş verileri alınamadı:', data.message);
            }
        })
        .catch(error => console.error('Siparişler yüklenirken hata:', error));
}

function showModal(options) {
    const modal = document.getElementById('delivery-modal');
    const title = document.getElementById('modal-title');
    const message = document.getElementById('modal-message');
    const inputContainer = document.getElementById('modal-input-container');
    const detailsContainer = document.getElementById('modal-details');
    const addressField = document.getElementById('modal-address');
    const productsField = document.getElementById('modal-products');
    const confirmButton = document.getElementById('modal-confirm');
    const cancelButton = document.getElementById('modal-cancel');

    title.textContent = options.title || 'Başlık';
    message.textContent = options.message || '';
    addressField.textContent = options.address || '';
    productsField.textContent = options.products ? options.products.join(', ') : '';

    inputContainer.classList.toggle('hidden', !options.showInput);
    detailsContainer.classList.toggle('hidden', !options.showDetails);

    confirmButton.textContent = options.confirmText || 'Onayla';
    confirmButton.onclick = options.onConfirm || (() => {});
    cancelButton.onclick = () => closeModal();

    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('delivery-modal');
    modal.classList.remove('show');
}

function displayActiveOrders(orders) {
    const activeOrdersBody = document.getElementById('active-orders-body');
    activeOrdersBody.innerHTML = '';

    if (orders.length === 0) {
        activeOrdersBody.innerHTML = `<tr><td colspan="6">Aktif sipariş bulunmamaktadır.</td></tr>`;
        return;
    }

    orders.forEach((order, index) => {
        const row = activeOrdersBody.insertRow();
        let actionButton = '';

        if (order.durum === 'Hazırlanıyor') {
            actionButton = `<button class="btn btn-success" onclick="showOrderDetails(${order.id})">Teslim Al</button>`;
        } else if (order.durum === 'Yolda') {
            actionButton = `<button class="btn btn-success" onclick="handleDelivery(${order.id}, '${order.teslimatKodu}')">Teslim Et</button>`;
        }

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${order.ad} ${order.soyad}</td>
            <td>${order.adres}</td>
            <td>${order.durum}</td>
            <td>${actionButton}</td>
        `;
    });
}

function showOrderDetails(orderId) {
    fetch(`/api/siparisler`)
        .then(response => response.json())
        .then(data => {
            const order = data.data.find(order => order.id === orderId);
            if (order) {
                showModal({
                    title: 'Sipariş Detayları',
                    message: 'Lütfen varış süresini girin ve teslim alın.',
                    address: `${order.adres}`,
                    showInput: true,
                    showDetails: true,
                    confirmText: 'Teslim Al',
                    onConfirm: () => {
                        const varisSuresi = document.getElementById('modal-input').value;
                        if (!varisSuresi) {
                            alert('Varış süresi girilmesi zorunludur.');
                            return;
                        }
                        markAsInTransit(orderId, varisSuresi);
                    },
                });

                const modalDetails = document.getElementById('modal-details');
                modalDetails.innerHTML = `
                    <p><strong>Sipariş Numarası:</strong> ${order.id}</p>
                    <p><strong>Adres:</strong> ${order.adres}</p>
                    <p><strong>Durum:</strong> ${order.durum}</p>
                `;
            } else {
                alert('Sipariş bulunamadı.');
            }
        })
        .catch(error => console.error('Sipariş detayları yüklenirken hata:', error));
}


function markAsInTransit(orderId, varisSuresi) {
    fetch('/api/siparis/guncelle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siparisId: orderId, action: 'teslimAl', varisSuresi }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Sipariş "Yolda" olarak güncellendi.');
                closeModal();
                fetchOrders(); 
            } else {
                alert(data.message || 'Sipariş güncellenemedi.');
            }
        })
        .catch(error => console.error('Sipariş güncelleme hatası:', error));
}


function handleDelivery(orderId, correctCode) {
    showModal({
        title: 'Teslimat Kodu Girişi',
        message: 'Bu siparişi teslim etmek için teslimat kodunu girin:',
        showInput: true,
        confirmText: 'Onayla',
        onConfirm: () => {
            const teslimatKodu = document.getElementById('modal-input').value.trim();
            if (!teslimatKodu) {
                alert('Teslimat kodu gerekli.');
                return;
            }

            const payload = { siparisId: orderId, teslimatKodu, action: 'teslimEt' };

            fetch('/api/siparis/guncelle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.success) {
                        alert('Sipariş başarıyla teslim edildi.');
                        closeModal();
                        fetchOrders();
                    } else {
                        alert(data.message || 'Sipariş güncellenemedi.');
                    }
                })
                .catch(error => {
                    console.error('Teslimat hatası:', error);
                    alert('Bir hata oluştu: ' + error.message);
                });
        },
    });
}

function displayPastOrders(orders) {
    const pastOrdersBody = document.getElementById('delivered-orders-body');
    pastOrdersBody.innerHTML = '';

    if (orders.length === 0) {
        pastOrdersBody.innerHTML = `<tr><td colspan="5">Geçmiş sipariş bulunmamaktadır.</td></tr>`;
        return;
    }

    orders.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));

    orders.forEach((order, index) => {
        const row = pastOrdersBody.insertRow();
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${order.ad} ${order.soyad}</td>
            <td>${order.adres}</td>
            <td>${order.durum}</td>
            <td>${new Date(order.tarih).toLocaleString()}</td>
        `;
    });
}
