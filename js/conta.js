// Se já estiver logado, redireciona para o perfil
if (typeof isLoggedIn !== 'undefined' && isLoggedIn()) {
    window.location.href = 'perfil.html';
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const result = login(username, password);
        const msgDiv = document.getElementById('loginMessage');
        
        if (result.success) {
            msgDiv.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
            setTimeout(() => { window.location.href = 'perfil.html'; }, 1000);
        } else {
            msgDiv.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
        }
    });

    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirm').value;
        
        if (password !== confirm) {
            document.getElementById('registerMessage').innerHTML = `<div class="alert alert-danger">As senhas não coincidem.</div>`;
            return;
        }
        
        const result = register(username, password);
        const msgDiv = document.getElementById('registerMessage');
        
        if (result.success) {
            msgDiv.innerHTML = `<div class="alert alert-success">${result.message} Agora faça login.</div>`;
            document.getElementById('registerForm').reset();
            const loginTab = new bootstrap.Tab(document.getElementById('login-tab'));
            loginTab.show();
        } else {
            msgDiv.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
        }
    });
});