fetch('../navbar/navbar.html')
.then(response => response.text())
.then(data => {
    document.getElementById('navbar').innerHTML = data;
})
.catch(error => console.error('Navbar yüklenirken hata oluştu:', error));


function checkLoginStatus() {
    fetch('/api/check-login')
        .then(res => res.json())
        .then(data => {
            const navbar = document.getElementById('navbar');
            if (data.loggedIn) {
                const loginButton = navbar.querySelector('.nav-item1 a span');
                if (loginButton) {
                    loginButton.textContent = data.user.name; 
                }
            }
        })
        .catch(err => console.error('Giriş durumu kontrol edilirken hata oluştu:', err));
}

function logoutUser() {
    fetch('/api/logout', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Başarıyla çıkış yaptınız.');
                window.location.href = '/';
            }
        })
        .catch(err => console.error('Çıkış yapılırken hata oluştu:', err));
}

document.addEventListener('DOMContentLoaded', checkLoginStatus);

