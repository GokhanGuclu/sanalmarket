function loginUser() {
    const email = document.querySelector('#login-box input[type="email"]').value;
    const password = document.querySelector('#login-box input[type="password"]').value;

    // Giriş işlemi için kontrol
    if (!email || !password) {
        alert('Lütfen tüm alanları doldurun.');
        return;
    }

    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mail: email, password }),
    })    
        .then(res => {
            if (res.ok) return res.json();
            throw new Error('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
        })
        .then(data => {
            if (data.success) {
                alert(`Hoş geldiniz, ${data.user.name}`);
                window.location.href = '/'; // Ana sayfaya yönlendir
            } else {
                throw new Error(data.message || 'Giriş başarısız.');
            }
        })
        .catch(err => alert(err.message));
}

function registerUser() {
    const ad = document.querySelector('#ad').value;
    const soyad = document.querySelector('#soyad').value;
    const email = document.querySelector('#email').value;
    const telefon = document.querySelector('#telefon').value;
    const password = document.querySelector('#password').value;

    // Tüm alanların doldurulduğundan emin olun
    if (!ad || !soyad || !email || !telefon || !password) {
        alert('Lütfen tüm alanları doldurun.');
        return;
    }

    // API'ye istek gönder
    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad, soyad, mail: email, telefon, password }),
    })
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => {
            if (data.success) {
                alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
                showLoginBox(); // Giriş ekranına yönlendir
            } else {
                throw new Error(data.message);
            }
        })
        .catch(err => alert(err.message || 'Kayıt sırasında bir hata oluştu.'));
}


function showRegisterBox() {
    console.log('Üye Ol kutusu gösteriliyor...');
    document.getElementById('login-box').style.display = 'none';
    const registerBox = document.getElementById('register-box');
    registerBox.style.display = 'block';
    setTimeout(() => {
        registerBox.classList.add('show'); // Geçiş animasyonunu başlat
    }, 10); // küçük bir zaman gecikmesiyle animasyon başlatılır
}


function showLoginBox() {
    // Üye ol kutusunu gizle, Giriş kutusunu göster
    document.getElementById('register-box').style.display = 'none';
    const loginBox = document.getElementById('login-box');
    loginBox.style.display = 'block';
    loginBox.classList.remove('show');
}
