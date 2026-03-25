// ==========================================================
// deck.js – Construtor de Decks com dois modos (builder + listagem)
// ==========================================================

const STORAGE_KEY = 'greedstore_decks';
let decks = [];
let deckAtual = null;           // deck que está sendo editado no builder
let termoBusca = '';
let paginaCartas = 0;
const CARTAS_POR_PAGINA = 20;

// ---------- AUXILIARES ----------
function gerarId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 8);
}

function getCurrentUsername() {
    const user = typeof getCurrentUser !== 'undefined' ? getCurrentUser() : null;
    return user ? user.username : null;
}

function isAdmin() {
    const user = typeof getCurrentUser !== 'undefined' ? getCurrentUser() : null;
    return user && user.role === 'admin';
}

function salvarDecks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    // Se estiver no modo visualização, atualiza a lista
    if (document.getElementById('modoVisualizacao').style.display !== 'none') {
        renderizarListaVisualizacao();
    }
}

function carregarDecks() {
    const dados = localStorage.getItem(STORAGE_KEY);
    if (dados) {
        decks = JSON.parse(dados);
    } else {
        decks = [];
    }

    // MIGRAÇÃO: adiciona owner para decks antigos
    const currentUser = getCurrentUsername();
    let mudou = false;
    decks = decks.map(deck => {
        if (!deck.owner) {
            mudou = true;
            return { ...deck, owner: currentUser || 'admin' };
        }
        return deck;
    });
    if (mudou) salvarDecks();

    // Define o deck atual (primeiro deck do usuário ou cria novo)
    const userDecks = decks.filter(d => d.owner === currentUser);
    if (userDecks.length > 0) {
        deckAtual = JSON.parse(JSON.stringify(userDecks[0]));
    } else {
        criarNovoDeckBuilder();  // isso define deckAtual e chama atualizarBuilderUI
    }

    // Atualiza a interface do builder (caso deckAtual já exista)
    atualizarBuilderUI();
}

function criarNovoDeckBuilder() {
    const currentUser = getCurrentUsername();
    if (!currentUser) {
        alert('Você precisa estar logado para criar um deck.');
        return;
    }
    deckAtual = {
        id: gerarId(),
        nome: `Novo Deck ${decks.filter(d => d.owner === currentUser).length + 1}`,
        cartas: [],
        owner: currentUser
    };
    atualizarBuilderUI();
}

function atualizarBuilderUI() {
    if (!deckAtual) return;
    document.getElementById('builderDeckNome').innerText = deckAtual.nome;
    const container = document.getElementById('builderDeckArea');
    container.innerHTML = '';
    deckAtual.cartas.forEach((carta, idx) => {
        container.appendChild(criarMiniaturaCarta(carta, idx));
    });
    document.getElementById('builderCardCount').innerText = `${deckAtual.cartas.length}/60 Cartas`;
}

function criarMiniaturaCarta(carta, idx) {
    const div = document.createElement('div');
    div.className = 'carta-mini';
    div.innerHTML = `
        <img src="${carta.imagem}" alt="${escapeHtml(carta.nome)}">
        <p title="${escapeHtml(carta.nome)}">${carta.nome}</p>
        <button class="remover-carta" data-index="${idx}" title="Remover">✕</button>
    `;
    div.querySelector('.remover-carta').addEventListener('click', (e) => {
        e.stopPropagation();
        removerCartaDoDeckAtual(parseInt(e.currentTarget.dataset.index));
    });
    return div;
}

function removerCartaDoDeckAtual(idx) {
    deckAtual.cartas.splice(idx, 1);
    atualizarBuilderUI();
}

function adicionarCartaAoDeckAtual(carta) {
    if (deckAtual.cartas.length >= 60) {
        alert('Limite máximo de 60 cartas atingido.');
        return;
    }
    deckAtual.cartas.push(carta);
    atualizarBuilderUI();
    mostrarMensagem(`➕ ${carta.nome} adicionada ao deck.`);
}

function salvarDeckAtual() {
    if (!deckAtual) return;
    const index = decks.findIndex(d => d.id === deckAtual.id);
    if (index !== -1) {
        decks[index] = deckAtual;
    } else {
        decks.push(deckAtual);
    }
    salvarDecks();
    mostrarMensagem(`✔️ Deck "${deckAtual.nome}" salvo!`);
}

function renomearDeckAtual() {
    if (!deckAtual) return;
    const novoNome = prompt('Digite o novo nome do deck:', deckAtual.nome);
    if (novoNome && novoNome.trim() !== '') {
        deckAtual.nome = novoNome.trim();
        atualizarBuilderUI();
    }
}

function carregarOutroDeck() {
    const currentUser = getCurrentUsername();
    const userDecks = decks.filter(d => d.owner === currentUser);
    if (userDecks.length === 0) {
        alert('Você não tem outros decks. Crie um novo primeiro.');
        return;
    }
    const select = document.getElementById('selectCarregarDeck');
    select.innerHTML = userDecks.map(d => `<option value="${d.id}">${escapeHtml(d.nome)}</option>`).join('');
    const modal = new bootstrap.Modal(document.getElementById('carregarDeckModal'));
    modal.show();
}

function confirmarCarregarDeck() {
    const deckId = document.getElementById('selectCarregarDeck').value;
    if (!deckId) return;
    const deckEncontrado = decks.find(d => d.id === deckId);
    if (deckEncontrado) {
        deckAtual = JSON.parse(JSON.stringify(deckEncontrado));
        atualizarBuilderUI();
        bootstrap.Modal.getInstance(document.getElementById('carregarDeckModal')).hide();
        mostrarMensagem(`📂 Deck "${deckAtual.nome}" carregado.`);
    } else {
        alert('Deck não encontrado.');
    }
}

// ---------- MODO VISUALIZAÇÃO ----------
function renderizarListaVisualizacao() {
    const container = document.getElementById('listaDecksVisualizacao');
    if (!container) return;

    const currentUser = getCurrentUsername();
    const userDecks = decks.filter(d => d.owner === currentUser);

    if (userDecks.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted">Você ainda não criou nenhum deck. Vá para o modo "Criar/Atualizar Deck" e crie um.</div>';
        return;
    }

    container.innerHTML = '';
    userDecks.forEach(deck => {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-md-4 col-lg-3';
        col.innerHTML = `
            <div class="deck-list-card h-100">
                <h5>${escapeHtml(deck.nome)}</h5>
                <p class="text-muted">${deck.cartas.length} carta(s)</p>
                <div class="d-flex gap-2 mt-3">
                    <button class="btn btn-sm btn-info visualizar-deck" data-id="${deck.id}">👁️ Visualizar</button>
                    <button class="btn btn-sm btn-danger excluir-deck" data-id="${deck.id}">🗑️ Excluir</button>
                </div>
            </div>
        `;
        container.appendChild(col);
    });

    document.querySelectorAll('.visualizar-deck').forEach(btn => {
        btn.addEventListener('click', () => visualizarDeckFullscreen(btn.dataset.id));
    });
    document.querySelectorAll('.excluir-deck').forEach(btn => {
        btn.addEventListener('click', () => excluirDeckVisualizacao(btn.dataset.id));
    });
}

function visualizarDeckFullscreen(deckId) {
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;
    abrirVisualizacaoDeck(deck);
}

function excluirDeckVisualizacao(deckId) {
    if (!confirm('Tem certeza que deseja excluir este deck permanentemente?')) return;
    decks = decks.filter(d => d.id !== deckId);
    if (deckAtual && deckAtual.id === deckId) {
        // O deck que estava sendo editado foi excluído
        const currentUser = getCurrentUsername();
        const userDecks = decks.filter(d => d.owner === currentUser);
        if (userDecks.length > 0) {
            deckAtual = JSON.parse(JSON.stringify(userDecks[0]));
        } else {
            criarNovoDeckBuilder();
        }
        atualizarBuilderUI();
    }
    salvarDecks();
    renderizarListaVisualizacao();
    mostrarMensagem('Deck excluído com sucesso.');
}

// ---------- FUNÇÕES DE VISUALIZAÇÃO FULLSCREEN (mesmo da comunidade) ----------
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

// ---------- BUSCA DE CARTAS NA API ----------
async function carregarCartasAPI(termo = '', pagina = 0) {
    const container = document.getElementById('listaCartas');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center text-info w-100 mt-4">Buscando cartas...</div>';
    termoBusca = termo;
    paginaCartas = pagina;

    let url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt&num=${CARTAS_POR_PAGINA}&offset=${pagina * CARTAS_POR_PAGINA}`;
    if (termo.trim() !== '') {
        url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt&fname=${encodeURIComponent(termo)}&num=${CARTAS_POR_PAGINA}&offset=${pagina * CARTAS_POR_PAGINA}`;
    }

    try {
        const resp = await fetch(url);
        if (resp.status === 400) {
            container.innerHTML = '<div class="text-center text-warning w-100 mt-4">Nenhuma carta encontrada.</div>';
            renderizarPaginacao(0);
            return;
        }
        const dados = await resp.json();
        if (!dados.data || dados.data.length === 0) {
            container.innerHTML = '<div class="text-center text-warning w-100 mt-4">Nenhuma carta encontrada.</div>';
            renderizarPaginacao(0);
            return;
        }
        renderizarCartas(dados.data);
        renderizarPaginacao(dados.data.length);
    } catch (erro) {
        console.error(erro);
        container.innerHTML = '<div class="text-center text-danger w-100 mt-4">Erro de conexão. Tente novamente.</div>';
    }
}

function renderizarCartas(cartas) {
    const container = document.getElementById('listaCartas');
    container.innerHTML = '';
    
    cartas.forEach(carta => {
        const div = document.createElement('div');
        div.className = 'carta';
        
        const img = carta.card_images[0].image_url;
        const nome = carta.name;
        const preco = carta.card_prices?.[0]?.tcgplayer_price || '0.00';
        
        div.innerHTML = `
            <button class="info-btn" title="Ver Detalhes">i</button>
            <img src="${img}" alt="${escapeHtml(nome)}" loading="lazy">
            <p title="Clique para adicionar ao deck">${escapeHtml(nome)}</p>
        `;
        
        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('info-btn')) return;
            adicionarCartaAoDeckAtual({
                id: carta.id,
                nome: nome,
                imagem: img,
                preco: preco
            });
        });
        
        const infoBtn = div.querySelector('.info-btn');
        infoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const modalBody = document.getElementById('modalBody');
            document.getElementById('infoModalLabel').innerText = "Detalhes da Carta";
            modalBody.innerHTML = `
                <div class="row">
                    <div class="col-5">
                        <img src="${img}" class="img-fluid rounded border border-secondary">
                    </div>
                    <div class="col-7">
                        <h5 class="text-info">${escapeHtml(nome)}</h5>
                        <p class="mb-1 text-light small"><strong>Tipo:</strong> ${carta.type || 'N/A'}</p>
                        <p class="mb-1 text-light small"><strong>Atr:</strong> ${carta.attribute || 'N/A'}</p>
                        <p class="mb-1 text-light small"><strong>Nível/Rank:</strong> ${carta.level || carta.rank || 'N/A'}</p>
                        <hr class="border-secondary my-2">
                        <p class="small text-muted" style="white-space: pre-wrap; font-size: 12px;">${escapeHtml(carta.desc || 'Sem descrição')}</p>
                    </div>
                </div>
            `;
            const modal = new bootstrap.Modal(document.getElementById('infoModal'));
            modal.show();
        });
        container.appendChild(div);
    });
}

function renderizarPaginacao(totalItensRecebidos) {
    const container = document.getElementById('paginacaoCartas');
    if (!container) return;
    const temMais = totalItensRecebidos === CARTAS_POR_PAGINA;
    container.innerHTML = `
        <div class="d-flex gap-2">
            <button class="btn btn-outline-info btn-sm fw-bold" id="btnPagAnterior" ${paginaCartas === 0 ? 'disabled' : ''}>⮜ Ant</button>
            <span class="text-light d-flex align-items-center" style="font-size: 14px;">Pág ${paginaCartas + 1}</span>
            <button class="btn btn-outline-info btn-sm fw-bold" id="btnPagProxima" ${!temMais ? 'disabled' : ''}>Próx ⮞</button>
        </div>
    `;
    const btnAnt = document.getElementById('btnPagAnterior');
    const btnProx = document.getElementById('btnPagProxima');
    if (btnAnt) btnAnt.addEventListener('click', () => carregarCartasAPI(termoBusca, paginaCartas - 1));
    if (btnProx) btnProx.addEventListener('click', () => carregarCartasAPI(termoBusca, paginaCartas + 1));
}

function mostrarMensagem(texto) {
    const toast = document.getElementById('saveToast');
    if (toast) {
        toast.innerText = texto;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 2000);
    } else {
        alert(texto);
    }
}

function escapeHtml(texto) {
    if (!texto) return '';
    return texto.toString().replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
}

// ---------- INICIALIZAÇÃO ----------
document.addEventListener('DOMContentLoaded', () => {
    if (typeof protegerPagina === 'function') protegerPagina();
    carregarDecks();      // carrega e define deckAtual, já chama atualizarBuilderUI internamente
    carregarCartasAPI('', 0);

    // Toggle entre modos
    const modoConstrutor = document.getElementById('modoConstrutor');
    const modoVisualizacao = document.getElementById('modoVisualizacao');
    const btnCriar = document.getElementById('btnModoCriar');
    const btnVisualizar = document.getElementById('btnModoVisualizar');

    btnCriar.addEventListener('click', () => {
        modoConstrutor.style.display = 'block';
        modoVisualizacao.style.display = 'none';
        btnCriar.classList.add('active');
        btnVisualizar.classList.remove('active');
        atualizarBuilderUI();  // Garante que a UI do builder esteja atualizada
    });
    btnVisualizar.addEventListener('click', () => {
        modoConstrutor.style.display = 'none';
        modoVisualizacao.style.display = 'block';
        btnVisualizar.classList.add('active');
        btnCriar.classList.remove('active');
        renderizarListaVisualizacao();
    });

    // Eventos do builder
    document.getElementById('btnNovoDeckBuilder').addEventListener('click', criarNovoDeckBuilder);
    document.getElementById('btnSalvarDeck').addEventListener('click', salvarDeckAtual);
    document.getElementById('builderRenomearBtn').addEventListener('click', renomearDeckAtual);
    document.getElementById('builderCarregarDeck').addEventListener('click', carregarOutroDeck);
    document.getElementById('confirmarCarregarDeck').addEventListener('click', confirmarCarregarDeck);
    document.getElementById('btnBuscarCartas').addEventListener('click', () => {
        carregarCartasAPI(document.getElementById('campoBuscaCartas').value, 0);
    });
    document.getElementById('campoBuscaCartas').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') carregarCartasAPI(e.target.value, 0);
    });
});