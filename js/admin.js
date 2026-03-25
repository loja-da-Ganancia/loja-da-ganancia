// Protege a página: só admin pode acessar
(function() {
    if (!isLoggedIn()) {
        window.location.href = 'contas.html';
        return;
    }
    const user = getCurrentUser();
    if (user.role !== 'admin') {
        alert('Acesso negado. Você não é administrador.');
        window.location.href = 'index.html';
        return;
    }
})();

function getUsers() {
    const users = localStorage.getItem('greedstore_users');
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem('greedstore_users', JSON.stringify(users));
}

function getDecks() {
    const decks = localStorage.getItem('greedstore_decks');
    return decks ? JSON.parse(decks) : [];
}

function atualizarEstatisticas() {
    const users = getUsers();
    const decks = getDecks();
    const totalCartas = decks.reduce((acc, deck) => acc + deck.cartas.length, 0);
    document.getElementById('totalUsuarios').innerText = users.length;
    document.getElementById('totalDecks').innerText = decks.length;
    document.getElementById('totalCartas').innerText = totalCartas;
}

function renderizarTabelaUsuarios() {
    const users = getUsers();
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(user.username)}</td>
            <td>
                <span class="badge ${user.role === 'admin' ? 'bg-danger' : 'bg-secondary'} role-badge">
                    ${user.role === 'admin' ? 'Admin' : 'Usuário'}
                </span>
            </td>
            <td>
                ${user.username !== 'admin' ? `
                    <button class="btn btn-sm btn-warning toggle-role" data-username="${user.username}">
                        ${user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                    </button>
                    <button class="btn btn-sm btn-danger delete-user" data-username="${user.username}">
                        Excluir
                    </button>
                ` : '<span class="text-muted">Protegido</span>'}
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Eventos dos botões
    document.querySelectorAll('.toggle-role').forEach(btn => {
        btn.addEventListener('click', () => {
            const username = btn.dataset.username;
            let users = getUsers();
            const userIndex = users.findIndex(u => u.username === username);
            if (userIndex !== -1) {
                users[userIndex].role = users[userIndex].role === 'admin' ? 'user' : 'admin';
                saveUsers(users);
                renderizarTabelaUsuarios();
                atualizarEstatisticas();
            }
        });
    });

    document.querySelectorAll('.delete-user').forEach(btn => {
        btn.addEventListener('click', () => {
            const username = btn.dataset.username;
            if (confirm(`Tem certeza que deseja excluir o usuário "${username}"?`)) {
                let users = getUsers();
                users = users.filter(u => u.username !== username);
                saveUsers(users);
                renderizarTabelaUsuarios();
                atualizarEstatisticas();
            }
        });
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    atualizarEstatisticas();
    renderizarTabelaUsuarios();
    document.getElementById('logoutBtn').addEventListener('click', logout);
});