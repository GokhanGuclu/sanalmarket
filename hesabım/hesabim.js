document.addEventListener('DOMContentLoaded', () => {
    // Kullanıcı bilgileri
    const userInfo = {
        name: "Veli Yılmaz",
        email: "yilmazv2001@gmail.com",
        money: "0,00"
    };

    // Kullanıcı bilgilerini HTML'ye yerleştirme
    document.querySelector('.user-info h3').textContent = userInfo.name;
    document.querySelector('.user-info p').textContent = userInfo.email;
    document.querySelector('.money-card strong').textContent = userInfo.money;

    // Dinamik içerik yükleme
    const menuItems = document.querySelectorAll('.menu li');
    const content = document.getElementById('content');

    function loadPage(page) {
        fetch(`${page}/${page}.html`)
            .then(response => response.text())
            .then(data => {
                content.innerHTML = data; // İçeriği yükle

                // Sayfaya özel script yükleme
                const script = document.createElement('script');
                script.src = `${page}/${page}.js`;
                script.defer = true;
                document.body.appendChild(script);
            })
            .catch(err => {
                content.innerHTML = '<p>Sayfa yüklenemedi.</p>';
                console.error('Sayfa yüklenirken hata oluştu:', err);
            });
    }

    // Menü tıklama işlemleri
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.getAttribute('data-page');

            // Aktif menü öğesini değiştir
            document.querySelector('.menu .active').classList.remove('active');
            item.classList.add('active');

            // Sayfayı yükle
            loadPage(page);
        });
    });

    // Varsayılan sayfa yükleme
    loadPage('adresler');
});
