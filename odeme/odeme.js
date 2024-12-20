
function togglePaymentMethod(method) {
    // Hide all payment methods
    const methods = document.querySelectorAll('.payment-method');
    methods.forEach((method) => {
        method.style.display = 'none';
    });

    // Show the selected payment method
    const selectedMethod = document.getElementById(method);
    selectedMethod.style.display = 'block';
}
function togglePaymentMethod(id) {
    // Tüm ödeme metodu detaylarını gizle
    const methods = document.querySelectorAll('[id$="-method"]');
    methods.forEach(method => method.style.display = 'none');

    // Sadece seçilen metodu göster
    const selectedMethod = document.getElementById(id);
    if (selectedMethod) {
        selectedMethod.style.display = 'block';
    }
}

function selectKapidaOption(option) {
    console.log('Seçilen ödeme yöntemi:', option);
    // Burada seçilen ödeme yöntemine göre işlemler yapabilirsiniz.
}