// ==========================================================
// auth.js – Versão robusta
// ==========================================================

const USERS_KEY = 'greedstore_users';
const SESSION_KEY = 'greedstore_session';

// Inicialização: cria usuário admin se não existir
function inicializarUsuarios() {
    let users = localStorage.getItem(USERS_KEY);
    if (!users) {
        const admin = {
            username: 'admin',
            password: 'admin',
            role: 'admin'
        };
        localStorage.setItem(USERS_KEY, JSON.stringify([admin]));
    }
}

function getUsers() {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function register(username, password) {
    const users = getUsers();
    if (users.find(u => u.username === username)) {
        return { success: false, message: 'Nome de usuário já existe.' };
    }
    if (username.length < 3 || password.length < 3) {
        return { success: false, message: 'Usuário e senha devem ter pelo menos 3 caracteres.' };
    }
    users.push({ username, password, role: 'user' });
    saveUsers(users);
    return { success: true, message: 'Cadastro realizado com sucesso!' };
}

function login(username, password) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return { success: false, message: 'Usuário ou senha incorretos.' };
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        username: user.username,
        role: user.role,
        loggedAt: Date.now()
    }));
    return { success: true, message: `Bem-vindo, ${user.username}!` };
}

function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
}

function isLoggedIn() {
    return sessionStorage.getItem(SESSION_KEY) !== null;
}

function getCurrentUser() {
    const session = sessionStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
}

function protegerPagina() {
    if (!isLoggedIn()) {
        alert('Você precisa estar logado para acessar esta página.');
        window.location.href = 'contas.html';
    }
}

// Função que encontra ou cria o container onde os links serão inseridos
function getNavContainer() {
    // Tenta encontrar o elemento com a classe ms-auto dentro da navbar
    let container = document.querySelector('.navbar-nav.ms-auto');
    if (!container) {
        // Se não existir, tenta encontrar qualquer .navbar-nav
        container = document.querySelector('.navbar-nav');
    }
    if (!container) {
        // Se ainda não existir, cria um novo elemento e o insere no final da navbar
        const navbar = document.querySelector('.navbar-collapse');
        if (navbar) {
            container = document.createElement('div');
            container.className = 'navbar-nav ms-auto';
            navbar.appendChild(container);
        } else {
            console.error('Não foi possível encontrar a navbar para inserir os links.');
            return null;
        }
    }
    return container;
}

function atualizarNavbar() {
    const navContainer = getNavContainer();
    if (!navContainer) return;

    const user = getCurrentUser();
    // Limpa os links que não são fixos – mas mantém os links fixos se você quiser preservar
    // Para evitar remover links fixos, vamos apenas adicionar os nossos no final.
    // Porém, é mais fácil remover todos e recriar com os fixos + os dinâmicos.
    // Vamos supor que os links fixos são aqueles que não dependem de login.
    // Se você quiser manter os fixos, precisamos identificá-los. Vou fazer simples:
    // Vamos substituir todo o conteúdo do container pelos links fixos + os dinâmicos.
    // Mas para não perder os links fixos que você já tem no HTML, vamos pegar os que estão lá e reutilizá-los.

    // Coleta os links fixos que estão atualmente no container (excluindo os que serão adicionados dinamicamente)
    const existingLinks = Array.from(navContainer.querySelectorAll('a:not(.dynamic-link)'));
    let fixedLinksHtml = '';
    existingLinks.forEach(link => {
        fixedLinksHtml += `<a class="${link.className}" href="${link.href}">${link.innerHTML}</a>`;
    });

    let dynamicHtml = '';
    if (user) {
        // Logado: exibe nome, link para perfil e botão sair
        dynamicHtml = `
            <a class="nav-link dynamic-link" href="perfil.html">Minha Conta</a>
            <button id="logoutBtn" class="btn btn-outline-light ms-2 dynamic-link">Sair</button>
        `;
        if (user.role === 'admin') {
            dynamicHtml += `<a class="nav-link dynamic-link" href="admin.html">Admin</a>`;
        }
    } else {
    dynamicHtml = `<a class="nav-link dynamic-link" href="contas.html">Entrar / Cadastrar</a>`;
    }

    navContainer.innerHTML = fixedLinksHtml + dynamicHtml;

    // Adiciona evento de logout se existir
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    inicializarUsuarios();
    atualizarNavbar();
});
function gerarToken() {
    return Math.random().toString(36).substring(2) + Date.now();
} function solicitarReset(username) {
    const users = getUsers();
    const user = users.find(u => u.username === username);

    if (!user) {
        return { success: false, message: 'Usuário não encontrado.' };
    }

    const token = gerarToken();

    // salva token no usuário
    user.resetToken = token;
    user.resetExpira = Date.now() + (10 * 60 * 1000); // 10 minutos

    saveUsers(users);

    // simulação de email
    const link = `${window.location.origin}/loja-da-ganancia/reset.html?token=${token}`;

    return {
        success: true,
        message: 'Link gerado com sucesso!',
        link: link
    };
}
function redefinirSenhaComToken(token, novaSenha) {
    const users = getUsers();

    const user = users.find(u => u.resetToken === token);

    if (!user) {
        return { success: false, message: 'Token inválido.' };
    }

    if (Date.now() > user.resetExpira) {
        return { success: false, message: 'Token expirado.' };
    }

    user.password = novaSenha;

    // limpa token
    delete user.resetToken;
    delete user.resetExpira;

    saveUsers(users);

    return { success: true, message: 'Senha redefinida com sucesso!' };
}