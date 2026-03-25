// Protege a página logo ao carregar
if (typeof protegerPagina === 'function') protegerPagina();

let modalCapa, modalFoto, modalNome;

document.addEventListener('DOMContentLoaded', () => {
    modalCapa = new bootstrap.Modal(document.getElementById('modalEditarCapa'));
    modalFoto = new bootstrap.Modal(document.getElementById('modalEditarFoto'));
    modalNome = new bootstrap.Modal(document.getElementById('modalEditarNome'));
    
    preencherDadosUsuario();
    carregarDecksUsuario();
});

function preencherDadosUsuario() {
    if (typeof getCurrentUser !== 'undefined') {
        const user = getCurrentUser();
        if (user) {
            document.getElementById('nomeUsuario').innerText = user.username;
            
            // Renderiza Foto
            const fotoContainer = document.getElementById('fotoContainer');
            const perfilImg = document.getElementById('perfilImg');
            if (user.profilePicUrl && user.profilePicUrl !== '') {
                perfilImg.src = user.profilePicUrl;
                fotoContainer.classList.add('tem-imagem');
            } else {
                perfilImg.src = '';
                fotoContainer.classList.remove('tem-imagem');
            }

            // Renderiza Banner
            const bannerContainer = document.getElementById('bannerContainer');
            const bannerImg = document.getElementById('bannerImg');
            if (user.bannerUrl && user.bannerUrl !== '') {
                bannerImg.src = user.bannerUrl;
                bannerContainer.classList.add('tem-imagem');
            } else {
                bannerImg.src = '';
                bannerContainer.classList.remove('tem-imagem');
            }

            // Badge Admin
            if (user.role === 'admin') {
                const bioUsuario = document.getElementById('bioUsuario');
                if (!bioUsuario.innerHTML.includes('badge')) {
                     bioUsuario.innerHTML += '<br><span class="badge bg-danger mt-2">Administrador</span>';
                }
            }
        }
    }
}

function abrirModalCapa() {
    document.getElementById('inputCapa').value = '';
    modalCapa.show();
}

function abrirModalFoto() {
    document.getElementById('inputFoto').value = '';
    modalFoto.show();
}

function abrirModalNome() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('inputNome').value = user.username;
        modalNome.show();
    }
}

function salvarCapa() {
    const input = document.getElementById('inputCapa');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            atualizarUsuarioNoBanco({ bannerUrl: e.target.result });
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        alert("Por favor, selecione uma imagem primeiro.");
    }
}

function salvarFoto() {
    const input = document.getElementById('inputFoto');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            atualizarUsuarioNoBanco({ profilePicUrl: e.target.result });
        };
        reader.readAsDataURL(input.files[0]);
    } else {
        alert("Por favor, selecione uma imagem primeiro.");
    }
}

function salvarNome() {
    const novoNome = document.getElementById('inputNome').value.trim();
    const user = getCurrentUser();

    if (novoNome.length < 3) {
        alert("O nome deve ter pelo menos 3 caracteres.");
        return;
    }

    if (novoNome === user.username) {
        modalNome.hide();
        return; 
    }

    const confirmacao = confirm("⚠️ ATENÇÃO:\nVocê está prestes a alterar seu nome de usuário. Isso afetará como você é visto em todo o sistema, incluindo suas postagens na comunidade e seus decks.\n\nDeseja realmente continuar?");
    
    if (confirmacao) {
        atualizarUsuarioNoBanco({ username: novoNome });
    }
}

function atualizarUsuarioNoBanco(novosDados) {
    const sessionData = sessionStorage.getItem('greedstore_session');
    if (!sessionData) return;
    
    const session = JSON.parse(sessionData);
    const originalUsername = session.username;

    let usersData = localStorage.getItem('greedstore_users');
    if (!usersData) return;
    
    let users = JSON.parse(usersData);
    const userIndex = users.findIndex(u => u.username === originalUsername);
    
    if (userIndex !== -1) {
        if (novosDados.username) {
            if (users.some(u => u.username === novosDados.username)) {
                alert("Este nome de usuário já está sendo usado por outro Duelista.");
                return;
            }
            users[userIndex].username = novosDados.username;
            session.username = novosDados.username;
        }

        if (novosDados.profilePicUrl !== undefined) {
            users[userIndex].profilePicUrl = novosDados.profilePicUrl;
            session.profilePicUrl = novosDados.profilePicUrl;
        }

        if (novosDados.bannerUrl !== undefined) {
            users[userIndex].bannerUrl = novosDados.bannerUrl;
            session.bannerUrl = novosDados.bannerUrl;
        }
        
        localStorage.setItem('greedstore_users', JSON.stringify(users));
        sessionStorage.setItem('greedstore_session', JSON.stringify(session));

        window.location.reload(); 
    } else {
        alert("Erro ao localizar seu usuário no banco de dados.");
    }
}

function carregarDecksUsuario() {
    const container = document.getElementById('decksDoUsuario');
    if (!container) return;

    // Obtém o usuário atual da sessão
    const currentUser = getCurrentUser();
    if (!currentUser) {
        container.innerHTML = '<div class="col-12 text-center text-muted">Você precisa estar logado para ver seus decks.</div>';
        return;
    }

    // Carrega todos os decks do localStorage
    const allDecks = JSON.parse(localStorage.getItem('greedstore_decks') || '[]');
    
    // Filtra apenas os decks que pertencem ao usuário atual
    const meusDecks = allDecks.filter(deck => deck.owner === currentUser.username);

    if (meusDecks.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted">Você ainda não criou nenhum deck. <a href="decks.html">Crie agora!</a></div>';
        return;
    }

    container.innerHTML = '';
    meusDecks.forEach(deck => {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
        col.innerHTML = `
            <div class="deck-card h-100">
                <h5>${escapeHtml(deck.nome)}</h5>
                <p class="text-muted">${deck.cartas.length} carta(s)</p>
                <a href="decks.html" class="btn btn-sm btn-primary">Gerenciar</a>
            </div>
        `;
        container.appendChild(col);
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