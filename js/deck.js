// ==========================================================
// deck.js – Construtor de Decks com Menu, Zoom e Dark Mode
// ==========================================================

const STORAGE_KEY = 'greedstore_decks';
let decks = [];
let deckAtual = null;
let isEditing = false;
let termoBusca = '';
let paginaCartas = 0;
const CARTAS_POR_PAGINA = 15;

// ---------- FUNÇÕES AUXILIARES DE REGRAS DO JOGO ----------
function isExtraDeckCard(type) {
    if (!type) return false;
    const t = type.toLowerCase();
    return t.includes('fusion') || t.includes('synchro') || t.includes('xyz') || t.includes('link');
}

function isSpell(type) { return type && type.toLowerCase().includes('spell'); }
function isTrap(type) { return type && type.toLowerCase().includes('trap'); }

// ---------- AUXILIARES GERAIS ----------
function gerarId() { return Date.now() + '-' + Math.random().toString(36).substr(2, 8); }

function getCurrentUsername() {
    const user = typeof getCurrentUser !== 'undefined' ? getCurrentUser() : null;
    return user ? user.username : null;
}

function salvarDecks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    if (document.getElementById('modoVisualizacao').style.display !== 'none') {
        renderizarListaVisualizacao();
    }
}

// ---------- NAVEGAÇÃO ENTRE TELAS (MENU vs CONTEÚDO) ----------
function mostrarMenuPrincipal() {
    document.getElementById('telaMenuPrincipal').style.display = 'block';
    document.getElementById('telaConteudo').style.display = 'none';
}

function abrirModoConstrutor() {
    document.getElementById('telaMenuPrincipal').style.display = 'none';
    document.getElementById('telaConteudo').style.display = 'block';
    document.getElementById('btnModoCriar').click(); 
}

function abrirModoVisualizacao() {
    document.getElementById('telaMenuPrincipal').style.display = 'none';
    document.getElementById('telaConteudo').style.display = 'block';
    document.getElementById('btnModoVisualizar').click(); 
}

// ---------- CARREGAMENTO ----------
function carregarDecks() {
    const dados = localStorage.getItem(STORAGE_KEY);
    decks = dados ? JSON.parse(dados) : [];

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

    deckAtual = null;
    isEditing = false;
    atualizarBuilderUI();
}

function criarNovoDeckBuilder() {
    const currentUser = getCurrentUsername();
    if (!currentUser) {
        mostrarMensagem('Você precisa estar logado para criar um deck.', 'warning');
        return;
    }

    if (deckAtual && isEditing) {
        if (!confirm("Você tem um deck em edição. Deseja descartar as alterações e criar um novo?")) return;
    }

    let count = 1;
    let novoNome = `Novo Deck ${count}`;
    while (decks.some(d => d.owner === currentUser && d.nome.toLowerCase() === novoNome.toLowerCase())) {
        count++;
        novoNome = `Novo Deck ${count}`;
    }

    deckAtual = {
        id: gerarId(),
        nome: novoNome,
        cartas: [],
        owner: currentUser
    };
    
    isEditing = true;
    atualizarBuilderUI();
    mostrarMensagem('Novo deck iniciado. Pode começar a adicionar as cartas!', 'success');
}

// ---------- UI DO BUILDER (COM CONTROLE DE EDIÇÃO) ----------
function atualizarBuilderUI() {
    const containerMain = document.getElementById('builderMainDeckArea');
    const containerExtra = document.getElementById('builderExtraDeckArea');
    const emptyState = document.getElementById('emptyStateMessage');
    const avisoEdicao = document.getElementById('avisoEdicao');

    const btnEditar = document.getElementById('btnEditarDeck');
    const btnSalvar = document.getElementById('btnSalvarDeck');
    const btnRenomear = document.getElementById('builderRenomearBtn');
    const btnFechar = document.getElementById('btnFecharDeck');

    if (!deckAtual) {
        document.getElementById('builderDeckNome').innerText = "Nenhum Deck Carregado";
        btnEditar.style.display = 'none';
        btnSalvar.style.display = 'none';
        btnRenomear.style.display = 'none';
        btnFechar.style.display = 'none';
        document.getElementById('statsContainer').style.opacity = '0.5';
        
        containerMain.innerHTML = '';
        if (emptyState) containerMain.appendChild(emptyState);
        emptyState.style.display = 'block';
        containerExtra.innerHTML = '';
        avisoEdicao.style.display = 'none';
        
        zerarBadges();
        return;
    }

    document.getElementById('builderDeckNome').innerText = deckAtual.nome;
    document.getElementById('statsContainer').style.opacity = '1';
    
    btnEditar.style.display = 'inline-block';
    
    if (isEditing) {
        btnEditar.innerText = '❌ Descartar Alterações';
        btnEditar.className = 'btn btn-sm btn-danger fw-bold';
        btnSalvar.style.display = 'inline-block';
        btnRenomear.style.display = 'inline-block';
        btnFechar.style.display = 'none';
        avisoEdicao.style.display = 'none';
    } else {
        btnEditar.innerText = '✏️ Editar Deck';
        btnEditar.className = 'btn btn-sm btn-warning fw-bold text-dark';
        btnSalvar.style.display = 'none';
        btnRenomear.style.display = 'none';
        btnFechar.style.display = 'inline-block';
        avisoEdicao.style.display = 'block';
    }

    containerMain.innerHTML = '';
    containerExtra.innerHTML = '';

    let countMain = 0, countExtra = 0;
    let countMonsters = 0, countSpells = 0, countTraps = 0;

    deckAtual.cartas.forEach((carta, idx) => {
        const ehExtra = isExtraDeckCard(carta.type);
        const divMini = criarMiniaturaCarta(carta, idx);

        if (ehExtra) {
            containerExtra.appendChild(divMini);
            countExtra++;
        } else {
            containerMain.appendChild(divMini);
            countMain++;
            if (isSpell(carta.type)) countSpells++;
            else if (isTrap(carta.type)) countTraps++;
            else countMonsters++;
        }
    });

    document.getElementById('countMain').innerText = countMain;
    document.getElementById('countMain').parentElement.className = `badge badge-main ${countMain === 60 ? 'bg-danger border border-white' : ''}`;
    
    document.getElementById('countExtra').innerText = countExtra;
    document.getElementById('countExtra').parentElement.className = `badge badge-extra ${countExtra === 15 ? 'bg-danger border border-white' : ''}`;
    
    document.getElementById('countMonsters').innerText = countMonsters;
    document.getElementById('countSpells').innerText = countSpells;
    document.getElementById('countTraps').innerText = countTraps;
}

function zerarBadges() {
    document.getElementById('countMain').innerText = '0';
    document.getElementById('countExtra').innerText = '0';
    document.getElementById('countMonsters').innerText = '0';
    document.getElementById('countSpells').innerText = '0';
    document.getElementById('countTraps').innerText = '0';
}

function criarMiniaturaCarta(carta, idx) {
    const div = document.createElement('div');
    div.className = 'carta-mini';
    div.innerHTML = `
        <img src="${carta.imagem}" alt="${escapeHtml(carta.nome)}">
        <p title="${escapeHtml(carta.nome)}">${carta.nome}</p>
        <button class="remover-carta" data-index="${idx}" title="Remover" style="display: ${isEditing ? 'flex' : 'none'};">✕</button>
    `;
    
    if (isEditing) {
        div.querySelector('.remover-carta').addEventListener('click', (e) => {
            e.stopPropagation();
            removerCartaDoDeckAtual(parseInt(e.currentTarget.dataset.index));
        });
    }
    return div;
}

// ---------- LÓGICA DE EDIÇÃO E FECHAMENTO ----------
function fecharDeck() {
    deckAtual = null;
    isEditing = false;
    atualizarBuilderUI();
}

function alternarModoEdicao() {
    if (!deckAtual) return;
    
    if (isEditing) {
        const deckOriginal = decks.find(d => d.id === deckAtual.id);
        if (deckOriginal) {
            deckAtual = JSON.parse(JSON.stringify(deckOriginal));
            isEditing = false;
            atualizarBuilderUI();
            mostrarMensagem('Alterações descartadas.', 'warning');
        } else {
            deckAtual = null;
            isEditing = false;
            atualizarBuilderUI();
        }
    } else {
        isEditing = true;
        atualizarBuilderUI();
    }
}

function adicionarCartaAoDeckAtual(carta) {
    if (!deckAtual) {
        mostrarMensagem('⚠️ Crie ou carregue um deck primeiro!', 'warning');
        return;
    }

    if (!isEditing) {
        mostrarMensagem('⚠️ Você precisa clicar em "Editar Deck" para modificá-lo.', 'warning');
        return;
    }

    const copiasAtuais = deckAtual.cartas.filter(c => c.nome === carta.nome).length;
    if (copiasAtuais >= 3) {
        mostrarMensagem(`⚠️ Limite atingido: Você já possui 3 cópias de "${carta.nome}".`, 'warning');
        return;
    }

    const ehExtra = isExtraDeckCard(carta.type);
    const qtdExtra = deckAtual.cartas.filter(c => isExtraDeckCard(c.type)).length;
    const qtdMain = deckAtual.cartas.filter(c => !isExtraDeckCard(c.type)).length;

    if (ehExtra && qtdExtra >= 15) {
        mostrarMensagem(`⚠️ Seu Extra Deck está cheio (Máx 15 cartas).`, 'warning');
        return;
    }
    if (!ehExtra && qtdMain >= 60) {
        mostrarMensagem(`⚠️ Seu Main Deck está cheio (Máx 60 cartas).`, 'warning');
        return;
    }

    deckAtual.cartas.push(carta);
    atualizarBuilderUI();
    mostrarMensagem(`➕ ${carta.nome} adicionada!`, 'success');
}

function removerCartaDoDeckAtual(idx) {
    if (!isEditing) return;
    deckAtual.cartas.splice(idx, 1);
    atualizarBuilderUI();
}

function salvarDeckAtual() {
    if (!deckAtual || !isEditing) return;
    
    const currentUser = getCurrentUsername();
    const jaExiste = decks.some(d => d.owner === currentUser && d.nome.toLowerCase() === deckAtual.nome.toLowerCase() && d.id !== deckAtual.id);
    if (jaExiste) {
        mostrarMensagem('⚠️ Já existe um deck salvo com este nome! Renomeie antes de salvar.', 'warning');
        return;
    }

    const index = decks.findIndex(d => d.id === deckAtual.id);
    if (index !== -1) decks[index] = deckAtual;
    else decks.push(deckAtual);
    
    salvarDecks();
    
    const nomeSalvo = deckAtual.nome;
    deckAtual = null;
    isEditing = false;
    atualizarBuilderUI();
    
    mostrarMensagem(`✔️ Deck "${nomeSalvo}" guardado no Banco de Dados!`, 'success');
}

function renomearDeckAtual() {
    if (!deckAtual || !isEditing) return;
    const novoNome = prompt('Digite o novo nome do deck:', deckAtual.nome);
    
    if (novoNome && novoNome.trim() !== '') {
        const nomeFormatado = novoNome.trim();
        const currentUser = getCurrentUsername();
        
        const jaExiste = decks.some(d => d.owner === currentUser && d.nome.toLowerCase() === nomeFormatado.toLowerCase() && d.id !== deckAtual.id);
        
        if (jaExiste) {
            mostrarMensagem('⚠️ Já existe um deck com este nome! Escolha outro.', 'warning');
            return;
        }
        
        deckAtual.nome = nomeFormatado;
        atualizarBuilderUI();
    }
}

function carregarOutroDeck() {
    const userDecks = decks.filter(d => d.owner === getCurrentUsername());
    if (userDecks.length === 0) {
        mostrarMensagem('Você não tem decks guardados. Crie um novo primeiro.', 'warning');
        return;
    }
    
    if (deckAtual && isEditing) {
        if (!confirm("Você tem edições não salvas. Deseja descartar e carregar outro deck?")) return;
    }

    const select = document.getElementById('selectCarregarDeck');
    select.innerHTML = '<option value="">-- Selecione um Deck --</option>' + 
                       userDecks.map(d => `<option value="${d.id}">${escapeHtml(d.nome)}</option>`).join('');
    
    new bootstrap.Modal(document.getElementById('carregarDeckModal')).show();
}

function confirmarCarregarDeck() {
    const deckId = document.getElementById('selectCarregarDeck').value;
    if (!deckId) return;

    const deckEncontrado = decks.find(d => d.id === deckId);
    if (deckEncontrado) {
        deckAtual = JSON.parse(JSON.stringify(deckEncontrado));
        isEditing = false; 
        atualizarBuilderUI();
        bootstrap.Modal.getInstance(document.getElementById('carregarDeckModal')).hide();
        mostrarMensagem(`📂 Deck "${deckAtual.nome}" carregado para visualização.`, 'success');
    }
}

// ---------- MODO VISUALIZAÇÃO LISTA ----------
function renderizarListaVisualizacao() {
    const container = document.getElementById('listaDecksVisualizacao');
    const userDecks = decks.filter(d => d.owner === getCurrentUsername());

    if (userDecks.length === 0) {
        container.innerHTML = '<div class="col-12 text-center" style="color: #8b949e;">Você ainda não criou nenhum deck.</div>';
        return;
    }

    container.innerHTML = '';
    userDecks.forEach(deck => {
        container.innerHTML += `
            <div class="col-12 col-sm-6 col-md-4 col-lg-3">
                <div class="deck-list-card h-100">
                    <h5>${escapeHtml(deck.nome)}</h5>
                    <p style="color: #8b949e;">${deck.cartas.length} carta(s)</p>
                    <div class="d-flex gap-2 mt-3">
                        <button class="btn btn-sm btn-info visualizar-deck" data-id="${deck.id}">👁️ Visualizar</button>
                        <button class="btn btn-sm btn-warning editar-direto" data-id="${deck.id}">✏️ Editar</button>
                        <button class="btn btn-sm btn-danger excluir-deck" data-id="${deck.id}">🗑️ Excluir</button>
                    </div>
                </div>
            </div>
        `;
    });

    document.querySelectorAll('.visualizar-deck').forEach(btn => btn.addEventListener('click', () => visualizarDeckFullscreen(btn.dataset.id)));
    document.querySelectorAll('.excluir-deck').forEach(btn => btn.addEventListener('click', () => excluirDeckVisualizacao(btn.dataset.id)));
    
    document.querySelectorAll('.editar-direto').forEach(btn => {
        btn.addEventListener('click', () => {
            const deckId = btn.dataset.id;
            const deckEncontrado = decks.find(d => d.id === deckId);
            if (deckEncontrado) {
                deckAtual = JSON.parse(JSON.stringify(deckEncontrado));
                isEditing = true;
                document.getElementById('btnModoCriar').click(); 
                atualizarBuilderUI();
            }
        });
    });
}

function visualizarDeckFullscreen(deckId) {
    const deck = decks.find(d => d.id === deckId);
    if (deck) abrirVisualizacaoDeck(deck);
}

function excluirDeckVisualizacao(deckId) {
    if (!confirm('Tem certeza que deseja excluir este deck permanentemente?')) return;
    decks = decks.filter(d => d.id !== deckId);
    
    if (deckAtual && deckAtual.id === deckId) {
        deckAtual = null;
        isEditing = false;
        atualizarBuilderUI();
    }
    salvarDecks();
    renderizarListaVisualizacao();
    mostrarMensagem('Deck excluído com sucesso.', 'success');
}

// ---------- MODO FULLSCREEN ----------
function abrirVisualizacaoDeck(deck) {
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
        col.querySelector('.card-item').addEventListener('click', () => mostrarDetalhesCartaCompleta(carta));
        cardsContainer.appendChild(col);
    });
    
    new bootstrap.Modal(document.getElementById('fullDeckModal')).show();
}

function mostrarDetalhesCartaCompleta(carta) {
    const modalBody = document.getElementById('cardInfoModalBody');
    modalBody.innerHTML = '<p class="text-info mt-3">Carregando informações...</p>';
    
    // Pega a instância existente do Modal ou cria uma nova para evitar duplicação de fundo escuro
    let modalElement = document.getElementById('cardInfoModal');
    let infoModal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    infoModal.show();

    // Se a carta NÃO tiver a descrição (ou seja, veio do banco de dados local)
    // nós fazemos o fetch nela usando o Nome para garantir que a descrição apareça na tela
    if (!carta.desc) {
        fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt&name=${encodeURIComponent(carta.nome || carta.name)}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.data && data.data.length > 0) {
                    renderizarDetalhes(data.data[0]); // Renderiza com os dados completos da API
                } else {
                    renderizarDetalhes(carta); // Fallback de segurança
                }
            })
            .catch(() => { 
                modalBody.innerHTML = '<p class="text-danger mt-3">Erro de conexão ao buscar os detalhes da carta.</p>'; 
            });
    } else {
        // Se a carta já tem a descrição (veio da aba de pesquisa), renderiza direto
        renderizarDetalhes(carta);
    }

    function renderizarDetalhes(cartaFull) {
        // Tratamento de segurança: a imagem vem de locais diferentes dependendo da origem
        const imgUrl = (cartaFull.card_images && cartaFull.card_images.length > 0) 
            ? cartaFull.card_images[0].image_url 
            : (cartaFull.imagem || '');
            
        const nome = cartaFull.name || cartaFull.nome || 'Desconhecido';
        const tipo = cartaFull.type || 'N/A';
        const descricao = cartaFull.desc || 'Descrição não disponível no momento.';

        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-5 text-center">
                    <img id="imgZoomCard" src="${imgUrl}" class="img-fluid rounded border border-secondary img-zoomable" style="max-height: 400px; object-fit: contain;" title="Clique para dar Zoom">
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

        // Timeout apenas para garantir que o DOM inseriu o HTML antes de atrelar o EventListener
        setTimeout(() => {
            const imgEl = document.getElementById('imgZoomCard');
            if (imgEl) {
                imgEl.addEventListener('click', function() {
                    this.classList.toggle('img-zoomed');
                });
            }
        }, 100);
    }
}

// ---------- API E PESQUISA DE CARTAS ----------
async function carregarCartasAPI(termo = '', pagina = 0) {
    const container = document.getElementById('listaCartas');
    container.innerHTML = '<div class="text-center text-info w-100 mt-4">Buscando cartas...</div>';
    termoBusca = termo;
    paginaCartas = pagina;

    let url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt&num=${CARTAS_POR_PAGINA}&offset=${pagina * CARTAS_POR_PAGINA}`;
    if (termo.trim() !== '') url += `&fname=${encodeURIComponent(termo)}`;

    try {
        const resp = await fetch(url);
        if (resp.status === 400) {
            container.innerHTML = '<div class="text-center text-warning w-100 mt-4">Nenhuma carta encontrada.</div>';
            renderizarPaginacao(0);
            return;
        }
        const dados = await resp.json();
        renderizarCartas(dados.data || []);
        renderizarPaginacao(dados.data ? dados.data.length : 0);
    } catch (erro) {
        container.innerHTML = '<div class="text-center text-danger w-100 mt-4">Erro de conexão.</div>';
    }
}

function renderizarCartas(cartas) {
    const container = document.getElementById('listaCartas');
    container.innerHTML = '';
    
    cartas.forEach(carta => {
        const div = document.createElement('div');
        div.className = 'carta';
        
        div.innerHTML = `
            <button class="info-btn" title="Ver Detalhes">i</button>
            <img src="${carta.card_images[0].image_url}" alt="${escapeHtml(carta.name)}" loading="lazy">
            <p>${escapeHtml(carta.name)}</p>
        `;
        
        div.addEventListener('click', (e) => {
            if (e.target.classList.contains('info-btn')) return;
            adicionarCartaAoDeckAtual({
                id: carta.id,
                nome: carta.name,
                imagem: carta.card_images[0].image_url,
                preco: carta.card_prices?.[0]?.tcgplayer_price || '0.00',
                type: carta.type
            });
        });
        
        div.querySelector('.info-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            mostrarDetalhesCartaCompleta(carta); 
        });
        container.appendChild(div);
    });
}

function renderizarPaginacao(totalRecebido) {
    const container = document.getElementById('paginacaoCartas');
    container.innerHTML = `
        <div class="d-flex gap-2">
            <button class="btn btn-outline-info btn-sm fw-bold" id="btnPagAnterior" ${paginaCartas === 0 ? 'disabled' : ''}>⮜ Ant</button>
            <span class="d-flex align-items-center" style="font-size: 14px; color: #F2F3F4;">Pág ${paginaCartas + 1}</span>
            <button class="btn btn-outline-info btn-sm fw-bold" id="btnPagProxima" ${totalRecebido < CARTAS_POR_PAGINA ? 'disabled' : ''}>Próx ⮞</button>
        </div>
    `;
    document.getElementById('btnPagAnterior')?.addEventListener('click', () => carregarCartasAPI(termoBusca, paginaCartas - 1));
    document.getElementById('btnPagProxima')?.addEventListener('click', () => carregarCartasAPI(termoBusca, paginaCartas + 1));
}

// ---------- UI FEEDBACK ----------
function mostrarMensagem(texto, tipo = 'success') {
    const toast = document.getElementById('saveToast');
    if (toast) {
        toast.innerText = texto;
        toast.style.background = tipo === 'warning' ? '#d97700' : '#2ea043';
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 2500);
    } else alert(texto);
}

function escapeHtml(texto) {
    return texto ? texto.toString().replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;' })[m]) : '';
}

// ---------- INICIALIZAÇÃO ----------
document.addEventListener('DOMContentLoaded', () => {
    if (typeof protegerPagina === 'function') protegerPagina();
    
    mostrarMenuPrincipal();
    
    carregarDecks();
    carregarCartasAPI('', 0);

    // Eventos do Menu Principal
    document.getElementById('cardAbrirConstrutor').addEventListener('click', abrirModoConstrutor);
    document.getElementById('cardAbrirVisualizacao').addEventListener('click', abrirModoVisualizacao);
    document.getElementById('btnVoltarMenu').addEventListener('click', mostrarMenuPrincipal);

    // Toggle entre abas internas
    const btnCriar = document.getElementById('btnModoCriar');
    const btnVisualizar = document.getElementById('btnModoVisualizar');

    btnCriar.addEventListener('click', () => {
        document.getElementById('modoConstrutor').style.display = 'block';
        document.getElementById('modoVisualizacao').style.display = 'none';
        btnCriar.classList.add('active');
        btnVisualizar.classList.remove('active');
        atualizarBuilderUI();
    });
    
    btnVisualizar.addEventListener('click', () => {
        document.getElementById('modoConstrutor').style.display = 'none';
        document.getElementById('modoVisualizacao').style.display = 'block';
        btnVisualizar.classList.add('active');
        btnCriar.classList.remove('active');
        renderizarListaVisualizacao();
    });

    // Eventos dos botões do builder
    document.getElementById('btnNovoDeckBuilder').addEventListener('click', criarNovoDeckBuilder);
    document.getElementById('btnSalvarDeck').addEventListener('click', salvarDeckAtual);
    document.getElementById('btnEditarDeck').addEventListener('click', alternarModoEdicao);
    document.getElementById('btnFecharDeck').addEventListener('click', fecharDeck);
    document.getElementById('builderRenomearBtn').addEventListener('click', renomearDeckAtual);
    document.getElementById('builderCarregarDeck').addEventListener('click', carregarOutroDeck);
    document.getElementById('confirmarCarregarDeck').addEventListener('click', confirmarCarregarDeck);
    
    // Pesquisa de cartas
    document.getElementById('btnBuscarCartas').addEventListener('click', () => carregarCartasAPI(document.getElementById('campoBuscaCartas').value, 0));
    document.getElementById('campoBuscaCartas').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') carregarCartasAPI(e.target.value, 0);
    });
});