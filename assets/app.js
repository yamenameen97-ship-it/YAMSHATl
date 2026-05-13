function showRegister() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

function login(btn) {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    console.log('Login attempt:', email);
    alert('تم النقر على دخول (هذا العرض لا يتصل بباكيند حقيقي حالياً)');
}

function register(btn) {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    console.log('Register attempt:', name, email);
    alert('تم النقر على تسجيل (هذا العرض لا يتصل بباكيند حقيقي حالياً)');
}
