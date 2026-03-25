const DB_POSTS = 'greedstore_posts';
const DB_DECKS = 'greedstore_decks';
const DB_USERS = 'greedstore_users';

let modalInstance;
let modalEditInstance;
let modalShareInstance;
let currentShareData = null;

document.addEventListener('DOMContentLoaded', () => {
    const modalEl = document.getElementById('modalPost');
    if(modalEl) modalInstance = new bootstrap.Modal(modalEl);
    
    const modalEditEl = document.getElementById('modalEditPost');
    if(modalEditEl) modalEditInstance = new bootstrap.Modal(modalEditEl);

    const modalShareEl = document.getElementById('modalShare');
    if(modalShareEl) modalShareInstance = new bootstrap.Modal(modalShareEl);
    
    atualizarFeed();

    const form = document.getElementById('formPost');
    if(form) form.addEventListener('submit', (e) => { e.preventDefault(); salvarPost(); });

    const formEdit = document.getElementById('formEditPost');
    if(formEdit) formEdit.addEventListener('submit', (e) => { e.preventDefault(); salvarEdicaoPost(); });

    configurarBotoesCompartilhamento();
});

function configurarBotoesCompartilhamento() {
    const btnCopiar = document.getElementById('btnCopiarLink');
    if(btnCopiar) {
        btnCopiar.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert("Link da página copiado!");
                modalShareInstance.hide();
            }).catch(err => console.error("Erro ao copiar link:", err));
        });
    }

    // Botões das redes sociais: Facebook, X, WhatsApp
    const btnFacebook = document.querySelector('#modalShare .btn-primary');
    const btnX = document.querySelector('#modalShare .btn-info'); // botão com texto "X"
    const btnWhatsApp = document.querySelector('#modalShare .btn-success');

    if(btnFacebook) {
        btnFacebook.addEventListener('click', () => {
            if(!currentShareData) return;
            const url = encodeURIComponent(window.location.href);
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,noreferrer');
        });
    }

    if(btnX) {
        btnX.addEventListener('click', () => {
            if(!currentShareData) return;
            const text = encodeURIComponent(currentShareData.text.substring(0, 280));
            const url = encodeURIComponent(window.location.href);
            window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
        });
    }

    if(btnWhatsApp) {
        btnWhatsApp.addEventListener('click', () => {
            if(!currentShareData) return;
            const text = encodeURIComponent(currentShareData.text);
            window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
        });
    }
}

function prepararNovoPost() {
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        alert("Você precisa estar logado para publicar na comunidade!");
        return;
    }
    document.getElementById('formPost').reset();
    document.getElementById('postId').value = '';
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

function salvarPost() {
    const id = document.getElementById('postId').value || Date.now().toString();
    const author = document.getElementById('postAuthorName').value;
    const deckId = document.getElementById('postDeckId').value;
    const content = document.getElementById('postContent').value;
    if(!deckId) { alert("Selecione um deck válido."); return; }
    let posts = JSON.parse(localStorage.getItem(DB_POSTS) || '[]');
    const novoPost = { id, author, deckId, content, date: new Date().toISOString() };
    posts.unshift(novoPost);
    localStorage.setItem(DB_POSTS, JSON.stringify(posts));
    modalInstance.hide();
    atualizarFeed();
}

function deletarPost(postId) {
    if(!confirm("Tem certeza que deseja excluir esta publicação? Essa ação não pode ser desfeita.")) return;
    let posts = JSON.parse(localStorage.getItem(DB_POSTS) || '[]');
    posts = posts.filter(p => p.id !== postId);
    localStorage.setItem(DB_POSTS, JSON.stringify(posts));
    atualizarFeed();
}

function abrirEdicaoPost(postId) {
    const posts = JSON.parse(localStorage.getItem(DB_POSTS) || '[]');
    const post = posts.find(p => p.id === postId);
    if(!post) return;
    document.getElementById('editPostId').value = post.id;
    document.getElementById('editPostContent').value = post.content;
    modalEditInstance.show();
}

function salvarEdicaoPost() {
    const postId = document.getElementById('editPostId').value;
    const content = document.getElementById('editPostContent').value;
    let posts = JSON.parse(localStorage.getItem(DB_POSTS) || '[]');
    const index = posts.findIndex(p => p.id === postId);
    if(index !== -1) {
        posts[index].content = content;
        localStorage.setItem(DB_POSTS, JSON.stringify(posts));
        modalEditInstance.hide();
        atualizarFeed();
    }
}

function compartilharPost(postId) {
    const posts = JSON.parse(localStorage.getItem(DB_POSTS) || '[]');
    const post = posts.find(p => p.id === postId);
    if(!post) return;
    const decks = JSON.parse(localStorage.getItem(DB_DECKS) || '[]');
    const deck = decks.find(d => d.id === post.deckId);
    if(!deck) return;

    const counts = {};
    deck.cartas.forEach(c => { counts[c.nome] = (counts[c.nome] || 0) + 1; });
    let lista = `🃏 *Deck: ${deck.nome}*\n\n`;
    for (const [nome, qtd] of Object.entries(counts)) {
        lista += `${qtd}x ${nome}\n`;
    }
    lista += `\n📝 *Comentário:* ${post.content}\n\n🔗 Compartilhado via Greed Store`;

    currentShareData = { text: lista, url: window.location.href };
    modalShareInstance.show();
}

function atualizarFeed() {
    const container = document.getElementById('feedComunidade');
    const posts = JSON.parse(localStorage.getItem(DB_POSTS) || '[]');
    const decks = JSON.parse(localStorage.getItem(DB_DECKS) || '[]');
    const users = JSON.parse(localStorage.getItem(DB_USERS) || '[]');

    const currentUserObj = (typeof getCurrentUser !== 'undefined') ? getCurrentUser() : null;
    const currentUsername = currentUserObj ? currentUserObj.username : null;
    const isUserAdmin = currentUserObj && currentUserObj.role === 'admin';

    if(posts.length === 0) {
        container.innerHTML = '<div class="col-12 text-center mt-5" style="color: #8b949e;">Nenhum deck compartilhado ainda. Seja o primeiro!</div>';
        return;
    }

    container.innerHTML = '';
    posts.forEach(post => {
        const deck = decks.find(d => d.id === post.deckId);
        if(!deck) return;
        const autorUser = users.find(u => u.username === post.author);
        let avatarStyle = '';
        let avatarContent = '';
        if (autorUser && autorUser.profilePicUrl) {
            avatarStyle = `background-image: url('${autorUser.profilePicUrl}'); background-size: cover; background-position: center;`;
        } else {
            avatarContent = post.author.charAt(0).toUpperCase();
        }

        let botoesAcaoHtml = '';
        if (currentUsername === post.author || isUserAdmin) {
            botoesAcaoHtml = `
                <button class="btn btn-sm btn-outline-warning text-white fw-bold me-2" onclick="abrirEdicaoPost('${post.id}')" title="Editar Publicação">✏️ Editar</button>
                <button class="btn btn-sm btn-outline-danger fw-bold" onclick="deletarPost('${post.id}')" title="Excluir Publicação">🗑️ Excluir</button>
            `;
        }

        container.innerHTML += `
            <div class="post-card p-4">
                <div class="d-flex justify-content-between align-items-start mb-3 border-bottom border-secondary pb-3">
                    <div class="d-flex align-items-center">
                        <div class="author-avatar me-3 d-flex align-items-center justify-content-center fw-bold text-dark bg-info" style="font-size: 1.5rem; ${avatarStyle}">
                            ${avatarContent}
                        </div>
                        <div>
                            <h5 class="text-white mb-0 fw-bold">${escapeHtml(post.author)}</h5>
                            <small style="color: #8b949e;">Compartilhou o deck: <strong class="text-info">${escapeHtml(deck.nome)}</strong> (${deck.cartas.length} cartas)</small>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-light" onclick="compartilharPost('${post.id}')" title="Compartilhar nas Redes">🔗</button>
                    </div>
                </div>
                
                <p style="white-space: pre-wrap; font-size: 1.05rem; line-height: 1.6;">${escapeHtml(post.content)}</p>
                
                <div class="d-flex justify-content-between mt-4 align-items-center flex-wrap gap-2">
                    <div>${botoesAcaoHtml}</div>
                    <button class="btn btn-sm btn-info text-dark fw-bold px-4" onclick="abrirVisualizacaoDeckComunidade('${deck.id}')">👁️ Ver Deck Completo</button>
                </div>
            </div>
        `;
    });
}

function abrirVisualizacaoDeckComunidade(deckId) {
    const decks = JSON.parse(localStorage.getItem(DB_DECKS) || '[]');
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;
    document.getElementById('fullDeckModalTitle').innerText = `Deck: ${deck.nome} (${deck.cartas.length} cartas)`;
    const cardsContainer = document.getElementById('fullDeckCardsContainer');
    cardsContainer.innerHTML = '';
    deck.cartas.forEach(carta => {
        const col = document.createElement('div');
        col.className = 'col-6 col-sm-4 col-md-3 col-lg-2';
        col.innerHTML = `
            <div class="card-item" style="background-color: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 10px; text-center; cursor: pointer; transition: 0.2s;">
                <img src="${carta.imagem}" class="img-fluid" alt="${escapeHtml(carta.nome)}">
                <small class="d-block mt-2 text-truncate text-white" title="${escapeHtml(carta.nome)}">${escapeHtml(carta.nome)}</small>
            </div>
        `;
        col.querySelector('.card-item').addEventListener('click', () => mostrarDetalhesCarta(carta));
        cardsContainer.appendChild(col);
    });
    let modalElement = document.getElementById('fullDeckModal');
    let fullModal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    fullModal.show();
}

function mostrarDetalhesCarta(carta) {
    const modalBody = document.getElementById('cardInfoModalBody');
    modalBody.innerHTML = '<p class="text-info mt-3">Carregando informações...</p>';
    let modalElement = document.getElementById('cardInfoModal');
    let infoModal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    infoModal.show();
    if (!carta.desc) {
        fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt&name=${encodeURIComponent(carta.nome || carta.name)}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.data && data.data.length > 0) renderizarDetalhesModal(data.data[0]);
                else renderizarDetalhesModal(carta);
            })
            .catch(() => { modalBody.innerHTML = '<p class="text-danger mt-3">Erro de conexão ao buscar os detalhes da carta.</p>'; });
    } else {
        renderizarDetalhesModal(carta);
    }
}

function renderizarDetalhesModal(cartaFull) {
    const imgUrl = (cartaFull.card_images && cartaFull.card_images.length > 0) ? cartaFull.card_images[0].image_url : (cartaFull.imagem || '');
    const nome = cartaFull.name || cartaFull.nome || 'Desconhecido';
    const tipo = cartaFull.type || 'N/A';
    const descricao = cartaFull.desc || 'Descrição não disponível no momento.';
    const modalBody = document.getElementById('cardInfoModalBody');
    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-5 text-center">
                <img id="imgZoomComunidade" src="${imgUrl}" class="img-fluid rounded border border-secondary img-zoomable" style="max-height: 400px; object-fit: contain;" title="Clique para dar Zoom">
                <p class="mt-2" style="font-size: 0.8rem; color: #8b949e;">🔍 Clique na imagem para dar zoom</p>
            </div>
            <div class="col-md-7 text-start">
                <h3 class="fw-bold text-white">${escapeHtml(nome)}</h3>
                <p><strong>Tipo:</strong> <span style="color: #00d2ff;">${escapeHtml(tipo)}</span></p>
                <hr style="border-color: #30363d;">
                <p style="white-space: pre-wrap; font-size: 0.95rem; line-height: 1.6; color: #F2F3F4;">${escapeHtml(descricao)}</p>
            </div>
        </div>
    `;
    setTimeout(() => {
        const imgEl = document.getElementById('imgZoomComunidade');
        if (imgEl) imgEl.addEventListener('click', function() { this.classList.toggle('img-zoomed'); });
    }, 100);
}

function escapeHtml(texto) {
    if (!texto) return '';
    return texto.toString().replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' })[m]);
}