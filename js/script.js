/* ==========================================================
   VARIÁVEIS DE CONTROLE GLOBAL
   ========================================================== */
let cartasAtuais = [];      
let paginaAtual = 0;        
const cartasPorPagina = 20; 

/* ==========================================================
   1. LÓGICA DO MARKETPLACE (BUSCA OTIMIZADA)
   ========================================================= */

async function carregarCartasDaAPI() {
    let container = document.getElementById("listaCartas");
    if (!container) return;

    let campoBusca = document.getElementById("campoPesquisa");
    let termoBusca = campoBusca ? campoBusca.value.trim() : "";
    
    container.innerHTML = "<h4 class='text-center w-100 text-muted'>Buscando dados...</h4>";

    let url = "";
    if (termoBusca !== "") {
        url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(termoBusca)}&num=${cartasPorPagina}&offset=${paginaAtual * cartasPorPagina}`;
    } else {
        url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${cartasPorPagina}&offset=${paginaAtual * cartasPorPagina}`;
    }

    try {
        let resposta = await fetch(url);
        let dados = await resposta.json();
        
        if (!dados.data || dados.data.length === 0) {
            container.innerHTML = "<h4 class='text-center w-100 text-danger'>Nenhuma carta encontrada.</h4>";
            renderizarControlesPaginacao(true);
            return;
        }

        let listaBruta = dados.data;

        // Ordenação por preço (ascendente)
        listaBruta.sort((a, b) => {
            let precoA = parseFloat(a.card_prices[0].tcgplayer_price) || 0;
            let precoB = parseFloat(b.card_prices[0].tcgplayer_price) || 0;
            return precoA - precoB;
        });

        cartasAtuais = listaBruta;
        
        let htmlFinal = "";
        cartasAtuais.forEach((carta, index) => {
            let nomeCarta = carta.name;
            let imagemCarta = carta.card_images[0].image_url;
            let precoCarta = carta.card_prices[0].tcgplayer_price;

            htmlFinal += `
            <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
                <div class="card h-100 shadow-sm border-0" data-index="${index}">
                    <img src="${imagemCarta}" class="card-img-top" alt="${nomeCarta}" loading="lazy">
                    <div class="card-body text-center d-flex flex-column justify-content-between">
                        <div>
                            <p class="card-text fw-bold" style="font-size: 13px; min-height: 40px;">${nomeCarta}</p>
                            <p class="card-text text-success fw-bold">US$ ${precoCarta}</p>
                        </div>
                        <button class="btn btn-warning btn-sm mt-2 favoritar-btn" data-index="${index}">
                            ⭐ Favoritar
                        </button>
                    </div>
                </div>
            </div>`;
        });

        container.innerHTML = htmlFinal;
        renderizarControlesPaginacao(false);

        // Adiciona evento de clique em cada card para abrir o modal de detalhes
        document.querySelectorAll('.card[data-index]').forEach(card => {
            card.addEventListener('click', (e) => {
                // Se o clique foi no botão favoritar, não abre o modal
                if (e.target.classList.contains('favoritar-btn')) return;
                const idx = card.dataset.index;
                abrirModalDetalhes(cartasAtuais[idx]);
            });
        });

        // Adiciona evento de clique nos botões favoritar
        document.querySelectorAll('.favoritar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = btn.dataset.index;
                adicionarFavoritoPeloIndex(parseInt(idx));
            });
        });

    } catch (erro) {
        console.error("Erro na requisição:", erro);
        container.innerHTML = "<h4 class='text-center text-danger w-100'>Erro de conexão. Tente novamente.</h4>";
    }
}

/* ==========================================================
   2. MODAL DE DETALHES (ZOOM)
   ========================================================= */
function abrirModalDetalhes(carta) {
    const modalBody = document.getElementById('modalCardBody');
    if (!modalBody) return;

    const nome = carta.name;
    const imagem = carta.card_images[0].image_url;
    const preco = carta.card_prices[0].tcgplayer_price || '0';
    const tipo = carta.type || 'N/A';
    const descricao = carta.desc || 'Sem descrição';
    const atributo = carta.attribute || 'N/A';
    const nivel = carta.level || carta.rank || 'N/A';
    const atk = carta.atk || 'N/A';
    const def = carta.def || 'N/A';
    const arquetipo = carta.archetype || 'N/A';

    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-5 text-center">
                <img src="${imagem}" class="img-fluid rounded" alt="${nome}" style="max-height: 350px;">
            </div>
            <div class="col-md-7">
                <h3>${escapeHtml(nome)}</h3>
                <p><strong>Tipo:</strong> ${escapeHtml(tipo)}</p>
                <p><strong>Descrição:</strong> ${escapeHtml(descricao)}</p>
                <p><strong>Preço (TCGPlayer):</strong> US$ ${preco}</p>
                <p><strong>Atributo:</strong> ${escapeHtml(atributo)}</p>
                <p><strong>Nível/Rank:</strong> ${nivel}</p>
                <p><strong>ATK/DEF:</strong> ${atk} / ${def}</p>
                <p><strong>Arquetipo:</strong> ${escapeHtml(arquetipo)}</p>
            </div>
        </div>
    `;
    const modal = new bootstrap.Modal(document.getElementById('cardModal'));
    modal.show();
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

/* ==========================================================
   3. CONTROLES DE PAGINAÇÃO
   ========================================================= */
function renderizarControlesPaginacao(esconder) {
    let paginacaoContainer = document.getElementById("paginacao");
    if (!paginacaoContainer) return;

    if (esconder) {
        paginacaoContainer.innerHTML = "";
        return;
    }

    paginacaoContainer.innerHTML = `
        <div class="d-flex justify-content-center align-items-center gap-3 mt-4">
            <button class="btn btn-dark" ${paginaAtual === 0 ? 'disabled' : ''} onclick="mudarPagina(-1)">Anterior</button>
            <span class="fw-bold">Página ${paginaAtual + 1}</span>
            <button class="btn btn-dark" onclick="mudarPagina(1)">Próxima</button>
        </div>
    `;
}

function mudarPagina(direcao) {
    paginaAtual += direcao;
    if (paginaAtual < 0) paginaAtual = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    carregarCartasDaAPI();
}

/* ==========================================================
   4. PESQUISA E FAVORITOS
   ========================================================= */
function pesquisarCarta() {
    paginaAtual = 0; 
    carregarCartasDaAPI();
}

function adicionarFavoritoPeloIndex(index) {
    let carta = cartasAtuais[index];
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    let novaCarta = {
        nome: carta.name,
        imagem: carta.card_images[0].image_url,
        preco: carta.card_prices[0].tcgplayer_price
    };

    if (!favoritos.some(f => f.nome === novaCarta.nome)) {
        favoritos.push(novaCarta);
        localStorage.setItem("favoritos", JSON.stringify(favoritos));
        mostrarMensagem("Adicionado!");
    } else {
        mostrarMensagem("Já está na lista!");
    }
}

function mostrarMensagem(texto) {
    let msg = document.getElementById("mensagem");
    if (msg) {
        msg.innerText = texto;
        msg.style.display = "block";
        setTimeout(() => { msg.style.display = "none"; }, 2000);
    }
}

/* ==========================================================
   5. PÁGINA DE FAVORITOS (REMOVER)
   ========================================================= */
function carregarPaginaFavoritos() {
    let container = document.getElementById("favoritosContainer");
    if (!container) return;

    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    container.innerHTML = "";

    if (favoritos.length === 0) {
        container.innerHTML = "<p class='text-center w-100 text-muted'>Nenhuma carta favoritada.</p>";
        return;
    }

    favoritos.forEach((carta, index) => {
        container.innerHTML += `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
            <div class="card card-favorito h-100 shadow-sm">
                <img src="${carta.imagem}" class="card-img-top" alt="${carta.nome}">
                <div class="card-body text-center">
                    <h5 class="card-title" style="font-size: 14px;">${carta.nome}</h5>
                    <p class="card-text text-success fw-bold">US$ ${carta.preco}</p>
                    <button class="btn btn-danger btn-sm" onclick="removerFavoritoPeloIndex(${index})">Remover</button>
                </div>
            </div>
        </div>`;
    });
}

function removerFavoritoPeloIndex(index) {
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    favoritos.splice(index, 1);
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    carregarPaginaFavoritos();
}

/* ==========================================================
   6. INICIALIZAÇÃO
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
    // Se estiver na página marketplace, carrega as cartas
    if (document.getElementById("listaCartas")) {
        carregarCartasDaAPI();
    }
    // Se estiver na página favoritos, carrega os favoritos
    if (document.getElementById("favoritosContainer")) {
        carregarPaginaFavoritos();
    }
});