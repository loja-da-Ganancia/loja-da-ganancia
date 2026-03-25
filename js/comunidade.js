const DB_POSTS = 'greedstore_posts';
const DB_DECKS = 'greedstore_decks';
const DB_USERS = 'greedstore_users';
let modalInstance;

document.addEventListener('DOMContentLoaded', () => {
    modalInstance = new bootstrap.Modal(document.getElementById('modalPost'));
    atualizarFeed();
});

function prepararNovoPost() {
    if (!isLoggedIn()) return alert("Logue para interagir!");
    
    document.getElementById('formPost').reset();
    document.getElementById('postId').value = '';
    document.getElementById('modalTitle').innerText = "Novo Post";
    
    const user = getCurrentUser();
    document.getElementById('postAuthorName').value = user.username;
    
    carregarMeusDecks();
    modalInstance.show();
}

function carregarMeusDecks() {
    const select = document.getElementById('postDeckId');
    const user = getCurrentUser();
    if (!user) return;

    const allDecks = JSON.parse(localStorage.getItem(DB_DECKS) || '[]');
    const meusDecks = allDecks.filter(deck => deck.owner === user.username);

    if (meusDecks.length === 0) {
        select.innerHTML = '<option value="">Crie um deck primeiro na aba Decks!</option>';
    } else {
        select.innerHTML = '<option value="">-- Selecione um Deck --</option>' + 
            meusDecks.map(d => `<option value="${d.id}">${escapeHtml(d.nome)}</option>`).join('');
    }
}

function publicarPost() {
    const id = document.getElementById('postId').value;
    const authorName = document.getElementById('postAuthorName').value.trim();
    const comment = document.getElementById('postComment').value.trim();
    const deckId = document.getElementById('postDeckId').value;

    if (!authorName || !comment || !deckId) return alert("Preencha os campos!");

    const decks = JSON.parse(localStorage.getItem(DB_DECKS) || '[]');
    const deckObj = decks.find(d => d.id === deckId);
    const user = getCurrentUser();
    let posts = JSON.parse(localStorage.getItem(DB_POSTS) || '[]');

    if (id) {
        const idx = posts.findIndex(p => p.id === id);
        if (idx !== -1) {
            posts[idx].authorName = authorName;
            posts[idx].comment = comment;
            posts[idx].deck = deckObj;
        }
    } else {
        posts.unshift({
            id: Date.now().toString(),
            authorUsername: user.username,
            authorName: authorName,
            comment: comment,
            deck: deckObj,
            date: new Date().toLocaleString()
        });
    }

    localStorage.setItem(DB_POSTS, JSON.stringify(posts));
    modalInstance.hide();
    atualizarFeed();
}

function atualizarFeed() {
    const container = document.getElementById('feed');
    const posts = JSON.parse(localStorage.getItem(DB_POSTS) || '[]');
    const users = JSON.parse(localStorage.getItem(DB_USERS) || '[]');
    const currentUser = typeof getCurrentUser !== 'undefined' ? getCurrentUser() : null;

    if (posts.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Nenhum duelo postado ainda.</p>';
        return;
    }

    container.innerHTML = '';
    posts.forEach(post => {
        const autorReal = users.find(u => u.username === post.authorUsername);
        const isOwner = currentUser && (currentUser.username === post.authorUsername || currentUser.role === 'admin');
        const foto = (autorReal && autorReal.profilePicUrl) ? autorReal.profilePicUrl : '';

        // Cria o elemento principal do post
        const postDiv = document.createElement('div');
        postDiv.className = 'post-card p-3 reduced-scale';
        postDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="d-flex align-items-center gap-3">
                    <div class="author-avatar">
                        ${foto ? `<img src="${foto}">` : '👤'}
                    </div>
                    <div>
                        <h6 class="m-0 text-white">${escapeHtml(post.authorName)}</h6>
                        <small class="text-muted">@${escapeHtml(post.authorUsername)} • ${post.date}</small>
                    </div>
                </div>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle text-white" data-bs-toggle="dropdown">Opções</button>
                    <ul class="dropdown-menu dropdown-menu-dark">
                        <li><a class="dropdown-item" href="#" onclick="compartilharZap('${post.id}'); return false;">Compartilhar</a></li>
                        ${isOwner ? `
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="#" onclick="editarPost('${post.id}')">Editar</a></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="excluirPost('${post.id}')">Excluir</a></li>
                        ` : ''}
                    </ul>
                </div>
            </div>
            <p class="text-light">${escapeHtml(post.comment)}</p>
            <div class="deck-preview-grid" style="cursor: pointer;" title="Clique para ver todas as cartas">
                ${post.deck.cartas.map(c => `<img src="${c.imagem}" class="card-mini-img" title="${escapeHtml(c.nome)}">`).join('')}
            </div>
            <div class="mt-2"><small class="text-info">Deck: ${escapeHtml(post.deck.nome)} (${post.deck.cartas.length} cartas)</small></div>
        `;

        // Adiciona evento de clique na área de deck preview
        const deckPreviewDiv = postDiv.querySelector('.deck-preview-grid');
        deckPreviewDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirVisualizacaoDeck(post.deck);
        });

        container.appendChild(postDiv);
    });
}

function editarPost(id) {
    const posts = JSON.parse(localStorage.getItem(DB_POSTS) || '[]');
    const post = posts.find(p => p.id === id);
    if (!post) return;

    document.getElementById('postId').value = post.id;
    document.getElementById('postAuthorName').value = post.authorName;
    document.getElementById('postComment').value = post.comment;
    
    carregarMeusDecks();
    document.getElementById('postDeckId').value = post.deck.id;
    
    document.getElementById('modalTitle').innerText = "Editar Minha Postagem";
    modalInstance.show();
}

function excluirPost(id) {
    if (!confirm("Excluir postagem?")) return;
    let posts = JSON.parse(localStorage.getItem(DB_POSTS) || '[]');
    localStorage.setItem(DB_POSTS, JSON.stringify(posts.filter(p => p.id !== id)));
    atualizarFeed();
}

function compartilharZap(postId) {
    const posts = JSON.parse(localStorage.getItem(DB_POSTS) || '[]');
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const counts = {};
    post.deck.cartas.forEach(c => counts[c.nome] = (counts[c.nome] || 0) + 1);
    let lista = `🃏 Deck: *${post.deck.nome}*\n\n`;
    for (const [n, q] of Object.entries(counts)) lista += `- ${q}x ${n}\n`;

    if (navigator.share) {
        navigator.share({ title: post.deck.nome, text: lista });
    } else {
        navigator.clipboard.writeText(lista);
        alert("Lista copiada!");
    }
}

// ==========================================================
// NOVAS FUNÇÕES PARA VISUALIZAÇÃO DE DECK EM FULLSCREEN
// ==========================================================

function abrirVisualizacaoDeck(deck) {
    const modalTitle = document.getElementById('fullDeckModalTitle');
    const cardsContainer = document.getElementById('fullDeckCardsContainer');
    
    modalTitle.innerText = `Deck: ${deck.nome} (${deck.cartas.length} cartas)`;
    cardsContainer.innerHTML = '';
    
    deck.cartas.forEach(carta => {
        const col = document.createElement('div');
        col.className = 'col-6 col-sm-4 col-md-3 col-lg-2';
        col.innerHTML = `
            <div class="card-item bg-dark border border-secondary rounded p-2 text-center">
                <img src="${carta.imagem}" class="img-fluid" alt="${escapeHtml(carta.nome)}">
                <small class="d-block mt-2 text-truncate" title="${escapeHtml(carta.nome)}">${escapeHtml(carta.nome)}</small>
                <small class="text-success">US$ ${carta.preco}</small>
            </div>
        `;
        const cardDiv = col.querySelector('.card-item');
        cardDiv.addEventListener('click', () => {
            mostrarDetalhesCarta(carta);
        });
        cardsContainer.appendChild(col);
    });
    
    const fullModal = new bootstrap.Modal(document.getElementById('fullDeckModal'));
    fullModal.show();
}

function mostrarDetalhesCarta(carta) {
    const modalBody = document.getElementById('cardInfoModalBody');
    modalBody.innerHTML = `
        <img src="${carta.imagem}" class="img-fluid mb-3" style="max-height: 300px;">
        <h5>${escapeHtml(carta.nome)}</h5>
        <p class="text-success fw-bold">Preço: US$ ${carta.preco}</p>
    `;
    const infoModal = new bootstrap.Modal(document.getElementById('cardInfoModal'));
    infoModal.show();
}

function escapeHtml(texto) {
    if (!texto) return '';
    return texto.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}