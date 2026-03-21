// ==========================================================
// deck.js – CRUD de decks com botão "Salvar" em cada card
// ==========================================================

const STORAGE_KEY = 'greedstore_decks';
let decks = [];
let deckAtivoId = null;          // Deck que está sendo editado (para adicionar cartas)
let termoBusca = '';
let paginaCartas = 0;
const CARTAS_POR_PAGINA = 20;

// ---------- AUXILIARES ----------
function gerarId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 8);
}

function salvarDecks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    renderizarListaDecks();   // Atualiza a interface (miniaturas, etc.)
}

function carregarDecks() {
    const dados = localStorage.getItem(STORAGE_KEY);
    if (dados) {
        decks = JSON.parse(dados);
    } else {
        decks = [
            { id: gerarId(), nome: 'Deck Poderoso', cartas: [] },
            { id: gerarId(), nome: 'Deck Rápido', cartas: [] },
            { id: gerarId(), nome: 'Deck Defensivo', cartas: [] }
        ];
        salvarDecks();
    }
    renderizarListaDecks();
}

// ---------- RENDERIZAÇÃO DOS DECKS ----------
function renderizarListaDecks() {
    const container = document.getElementById('listaDecks');
    if (!container) return;

    if (decks.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Nenhum deck criado. Clique em "+ Novo Deck".</p>';
        return;
    }

    container.innerHTML = '';
    decks.forEach(deck => {
        const deckDiv = document.createElement('div');
        deckDiv.className = 'deck-card';
        if (deckAtivoId === deck.id) deckDiv.classList.add('active');

        deckDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong class="deck-nome" data-id="${deck.id}">${escapeHtml(deck.nome)}</strong>
                    <button class="editar-nome" data-id="${deck.id}">✎</button>
                </div>
                <div>
                    <button class="btn btn-sm btn-primary salvar-deck" data-id="${deck.id}">💾 Salvar</button>
                </div>
            </div>
            <div class="deck-area" data-deck-id="${deck.id}"></div>
            <div class="deck-botoes mt-2">
                <button class="btn btn-sm btn-secondary visualizar-deck" data-id="${deck.id}">Visualizar</button>
                <button class="btn btn-sm btn-info editar-deck" data-id="${deck.id}">Editar</button>
                <button class="btn btn-sm btn-danger excluir-deck" data-id="${deck.id}">Excluir</button>
            </div>
        `;
        container.appendChild(deckDiv);

        // Preencher miniaturas das cartas
        const deckArea = deckDiv.querySelector('.deck-area');
        deck.cartas.forEach((carta, idx) => {
            deckArea.appendChild(criarMiniaturaCarta(carta, deck.id, idx));
        });
    });

    // Eventos dos botões
    document.querySelectorAll('.visualizar-deck').forEach(btn => {
        btn.addEventListener('click', () => visualizarDeck(btn.dataset.id));
    });
    document.querySelectorAll('.editar-deck').forEach(btn => {
        btn.addEventListener('click', () => ativarDeck(btn.dataset.id));
    });
    document.querySelectorAll('.excluir-deck').forEach(btn => {
        btn.addEventListener('click', () => excluirDeck(btn.dataset.id));
    });
    document.querySelectorAll('.salvar-deck').forEach(btn => {
        btn.addEventListener('click', () => salvarDeckEspecifico(btn.dataset.id));
    });
    document.querySelectorAll('.editar-nome').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            renomearDeck(btn.dataset.id);
        });
    });
    document.querySelectorAll('.deck-nome').forEach(nomeEl => {
        nomeEl.addEventListener('dblclick', () => renomearDeck(nomeEl.dataset.id));
    });
}

function criarMiniaturaCarta(carta, deckId, idx) {
    const div = document.createElement('div');
    div.className = 'carta-mini';
    div.innerHTML = `
        <img src="${carta.imagem}" alt="${escapeHtml(carta.nome)}">
        <p title="${escapeHtml(carta.nome)}">${carta.nome.length > 10 ? carta.nome.substring(0, 8) + '…' : carta.nome}</p>
        <button class="remover-carta" data-deck="${deckId}" data-index="${idx}">✕</button>
    `;
    const btnRemover = div.querySelector('.remover-carta');
    btnRemover.addEventListener('click', (e) => {
        e.stopPropagation();
        removerCartaDoDeck(deckId, parseInt(btnRemover.dataset.index));
    });
    return div;
}

// Atualiza a área de miniaturas de um deck específico
function atualizarDeckArea(deckId) {
    const deckArea = document.querySelector(`.deck-area[data-deck-id="${deckId}"]`);
    if (!deckArea) return;
    const deck = decks.find(d => d.id === deckId);
    if (!deck) return;
    deckArea.innerHTML = '';
    deck.cartas.forEach((carta, idx) => {
        deckArea.appendChild(criarMiniaturaCarta(carta, deckId, idx));
    });
}

// ---------- AÇÕES DOS DECKS ----------
function visualizarDeck(id) {
    const deck = decks.find(d => d.id === id);
    if (!deck) return;
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;
    let cartasHtml = '';
    if (deck.cartas.length === 0) {
        cartasHtml = '<p>Este deck ainda não tem cartas.</p>';
    } else {
        cartasHtml = '<div class="row">';
        deck.cartas.forEach(carta => {
            cartasHtml += `
                <div class="col-3 text-center mb-2">
                    <img src="${carta.imagem}" style="width:100%; border-radius:4px;">
                    <small>${escapeHtml(carta.nome)}</small>
                </div>
            `;
        });
        cartasHtml += '</div>';
    }
    modalBody.innerHTML = `
        <h5>${escapeHtml(deck.nome)}</h5>
        <p><strong>Total de cartas:</strong> ${deck.cartas.length}</p>
        <hr>
        <h6>Cartas no deck:</h6>
        ${cartasHtml}
    `;
    const modal = new bootstrap.Modal(document.getElementById('infoModal'));
    modal.show();
}

function ativarDeck(id) {
    deckAtivoId = id;
    renderizarListaDecks();  // destaca o deck ativo
    // Rola até o deck ativo
    const activeDeck = document.querySelector('.deck-card.active');
    if (activeDeck) activeDeck.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renomearDeck(id) {
    const deck = decks.find(d => d.id === id);
    if (!deck) return;
    const novoNome = prompt('Digite o novo nome do deck:', deck.nome);
    if (novoNome && novoNome.trim() !== '') {
        deck.nome = novoNome.trim();
        salvarDecks();  // salva e re-renderiza
    }
}

function excluirDeck(id) {
    if (confirm('Tem certeza que deseja excluir este deck permanentemente?')) {
        decks = decks.filter(d => d.id !== id);
        if (deckAtivoId === id) deckAtivoId = null;
        salvarDecks();
    }
}

function removerCartaDoDeck(deckId, idx) {
    const deck = decks.find(d => d.id === deckId);
    if (deck) {
        deck.cartas.splice(idx, 1);
        salvarDecks();       // salva e atualiza tudo
    }
}

function adicionarCartaAoDeck(carta) {
    if (!deckAtivoId) {
        alert('Selecione um deck clicando em "Editar" primeiro.');
        return;
    }
    const deck = decks.find(d => d.id === deckAtivoId);
    if (!deck) return;
    if (deck.cartas.length >= 60) {
        alert('Limite máximo de 60 cartas.');
        return;
    }
    deck.cartas.push(carta);
    salvarDecks();          // salva e atualiza interface
}

function criarNovoDeck() {
    const novoDeck = {
        id: gerarId(),
        nome: `Deck ${decks.length + 1}`,
        cartas: []
    };
    decks.push(novoDeck);
    salvarDecks();
    ativarDeck(novoDeck.id);  // já seleciona o novo deck
}

// ---------- BOTÃO SALVAR (salva um deck específico) ----------
function salvarDeckEspecifico(id) {
    const deck = decks.find(d => d.id === id);
    if (!deck) return;
    
    // Se o deck que está sendo salvo for o deck ativo de edição, removemos a seleção dele
    if (deckAtivoId === id) {
        deckAtivoId = null;
    }

    salvarDecks();  // já faz a persistência completa e remove a borda azul
    mostrarMensagem(`Deck "${deck.nome}" salvo!`);
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

// ---------- BUSCA DE CARTAS NA API ----------
async function carregarCartasAPI(termo = '', pagina = 0) {
    const container = document.getElementById('listaCartas');
    if (!container) return;
    container.innerHTML = '<div class="text-center text-muted">Carregando cartas...</div>';
    termoBusca = termo;
    paginaCartas = pagina;

    let url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${CARTAS_POR_PAGINA}&offset=${pagina * CARTAS_POR_PAGINA}`;
    if (termo.trim() !== '') {
        url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(termo)}&num=${CARTAS_POR_PAGINA}&offset=${pagina * CARTAS_POR_PAGINA}`;
    }

    try {
        const resp = await fetch(url);
        const dados = await resp.json();
        if (!dados.data || dados.data.length === 0) {
            container.innerHTML = '<div class="text-center text-muted">Nenhuma carta encontrada.</div>';
            renderizarPaginacao(0);
            return;
        }
        renderizarCartas(dados.data);
        renderizarPaginacao(dados.data.length);
    } catch (erro) {
        console.error(erro);
        container.innerHTML = '<div class="text-center text-danger">Erro de conexão. Tente novamente.</div>';
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
        const preco = carta.card_prices[0]?.tcgplayer_price || '0';
        div.innerHTML = `
            <img src="${img}" alt="${escapeHtml(nome)}" loading="lazy">
            <p>${escapeHtml(nome)}</p>
            <button class="info-btn">i</button>
        `;
        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('info-btn')) return;
            adicionarCartaAoDeck({
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
            modalBody.innerHTML = `
                <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
                <p><strong>Tipo:</strong> ${carta.type || 'N/A'}</p>
                <p><strong>Descrição:</strong> ${escapeHtml(carta.desc || 'Sem descrição')}</p>
                <p><strong>Preço:</strong> $${preco}</p>
                <p><strong>Atributo:</strong> ${carta.attribute || 'N/A'}</p>
                <p><strong>Nível/Rank:</strong> ${carta.level || carta.rank || 'N/A'}</p>
            `;
            const modal = new bootstrap.Modal(document.getElementById('infoModal'));
            modal.show();
        });
        container.appendChild(div);
    });
}

function renderizarPaginacao(totalItens) {
    const container = document.getElementById('paginacaoCartas');
    if (!container) return;
    const temMais = totalItens === CARTAS_POR_PAGINA;
    container.innerHTML = `
        <div class="d-flex gap-2">
            <button class="btn btn-dark" id="btnPagAnterior" ${paginaCartas === 0 ? 'disabled' : ''}>Anterior</button>
            <span>Página ${paginaCartas + 1}</span>
            <button class="btn btn-dark" id="btnPagProxima" ${!temMais ? 'disabled' : ''}>Próxima</button>
        </div>
    `;
    const btnAnt = document.getElementById('btnPagAnterior');
    const btnProx = document.getElementById('btnPagProxima');
    if (btnAnt) btnAnt.addEventListener('click', () => carregarCartasAPI(termoBusca, paginaCartas - 1));
    if (btnProx) btnProx.addEventListener('click', () => carregarCartasAPI(termoBusca, paginaCartas + 1));
}

function escapeHtml(texto) {
    if (!texto) return '';
    return texto.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
}

// ---------- INICIALIZAÇÃO ----------
document.addEventListener('DOMContentLoaded', () => {
    if (typeof protegerPagina === 'function') protegerPagina();
    carregarDecks();
    carregarCartasAPI('', 0);

    document.getElementById('btnNovoDeck')?.addEventListener('click', criarNovoDeck);
    document.getElementById('btnBuscarCartas')?.addEventListener('click', () => {
        carregarCartasAPI(document.getElementById('campoBuscaCartas').value, 0);
    });
    document.getElementById('campoBuscaCartas')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') carregarCartasAPI(e.target.value, 0);
    });
});