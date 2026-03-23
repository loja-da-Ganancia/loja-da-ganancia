/* ==========================================================
   VARIÁVEIS DE CONTROLE GLOBAL
   ========================================================== */
let cartasAtuais = [];      
let paginaAtual = 0;        
const cartasPorPagina = 20; 
let timeoutPesquisa; // Variável para controlar o delay da digitação (Debounce)

/* ==========================================================
   1. LÓGICA DO MARKETPLACE (BUSCA OTIMIZADA)
   ========================================================= */

async function carregarCartasDaAPI() {
    let container = document.getElementById("listaCartas");
    if (!container) return;

    let campoBusca = document.getElementById("campoPesquisa");
    let termoBusca = campoBusca ? campoBusca.value.trim() : "";
    
    container.innerHTML = "<h4 class='text-center w-100 text-muted'>Buscando dados...</h4>";

    // Adicionamos &language=pt para trazer em português
    let url = "";
    if (termoBusca !== "") {
        url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(termoBusca)}&num=${cartasPorPagina}&offset=${paginaAtual * cartasPorPagina}&language=pt`;
    } else {
        url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?num=${cartasPorPagina}&offset=${paginaAtual * cartasPorPagina}&language=pt`;
    }

    try {
        let resposta = await fetch(url);
        
        // TRATAMENTO DO BUG: Se a API retornar erro 400 (carta não encontrada), evitamos quebrar o JS
        if (resposta.status === 400) {
            container.innerHTML = "<h4 class='text-center w-100 text-warning mt-4'>Nenhuma carta encontrada com esse nome.</h4>";
            renderizarControlesPaginacao(true);
            cartasAtuais = [];
            return;
        }

        let dados = await resposta.json();
        
        if (!dados.data || dados.data.length === 0) {
            container.innerHTML = "<h4 class='text-center w-100 text-danger'>Nenhuma carta encontrada.</h4>";
            renderizarControlesPaginacao(true);
            return;
        }

        let listaBruta = dados.data;

        // Ordenação por preço da Amazon (ascendente)
        listaBruta.sort((a, b) => {
            let precoA = a.card_prices && a.card_prices[0].amazon_price ? parseFloat(a.card_prices[0].amazon_price) : 0;
            let precoB = b.card_prices && b.card_prices[0].amazon_price ? parseFloat(b.card_prices[0].amazon_price) : 0;
            return precoA - precoB;
        });

        cartasAtuais = listaBruta;
        
        let htmlFinal = "";
        cartasAtuais.forEach((carta, index) => {
            let nomeCarta = carta.name;
            let imagemCarta = carta.card_images[0].image_url;
            
            // Puxa o preço da Amazon principal, se não tiver, exibe 0.00
            let precoCarta = carta.card_prices && carta.card_prices[0].amazon_price 
                             ? parseFloat(carta.card_prices[0].amazon_price).toFixed(2) 
                             : "0.00";

            htmlFinal += `
            <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
                <div class="card h-100 shadow-sm border-0" data-index="${index}">
                    <img src="${imagemCarta}" class="card-img-top" alt="${nomeCarta}" loading="lazy">
                    <div class="card-body text-center d-flex flex-column justify-content-between">
                        <div>
                            <p class="card-text fw-bold" style="font-size: 13px; min-height: 40px;">${nomeCarta}</p>
                            <p class="card-text text-success fw-bold"> US$ ${precoCarta}</p>
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
   2. MODAL DE DETALHES (ZOOM) E MÚLTIPLOS PREÇOS
   ========================================================= */
function abrirModalDetalhes(carta) {
    const modalBody = document.getElementById('modalCardBody');
    if (!modalBody) return;

    const nome = carta.name;
    const imagem = carta.card_images[0].image_url;
    const tipo = carta.type || 'N/A';
    const descricao = carta.desc || 'Sem descrição';
    const atributo = carta.attribute || 'N/A';
    const nivel = carta.level || carta.rank || 'N/A';
    const atk = carta.atk !== undefined ? carta.atk : 'N/A';
    const def = carta.def !== undefined ? carta.def : 'N/A';
    const arquetipo = carta.archetype || 'N/A';

    // Capturando todos os preços
    const precos = carta.card_prices ? carta.card_prices[0] : {};
    const amazon = precos.amazon_price || '0.00';
    const ebay = precos.ebay_price || '0.00';
    const tcgplayer = precos.tcgplayer_price || '0.00';
    const cardmarket = precos.cardmarket_price || '0.00';
    const coolstuff = precos.coolstuffinc_price || '0.00';

    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-5 text-center mb-3">
                <img src="${imagem}" class="img-fluid rounded shadow-sm" alt="${nome}" style="max-height: 400px;">
            </div>
            <div class="col-md-7">
                <h3 class="fw-bold border-bottom pb-2">${escapeHtml(nome)}</h3>
                <p><strong>Tipo:</strong> ${escapeHtml(tipo)}</p>
                <p><strong>Atributo:</strong> ${escapeHtml(atributo)}</p>
                <p><strong>Nível/Rank:</strong> ${nivel}</p>
                <p><strong>ATK / DEF:</strong> ${atk} / ${def}</p>
                <p><strong>Arquétipo:</strong> ${escapeHtml(arquetipo)}</p>
                
                <h5 class="mt-4 text-success fw-bold">💰 Cotações de Mercado</h5>
                <ul class="list-group list-group-flush mb-3 shadow-sm rounded">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Amazon <span class="badge bg-success rounded-pill">US$ ${amazon}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        eBay <span class="badge bg-primary rounded-pill">US$ ${ebay}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        TCGPlayer <span class="badge bg-info text-dark rounded-pill">US$ ${tcgplayer}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Cardmarket <span class="badge bg-secondary rounded-pill">€ ${cardmarket}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        CoolStuffInc <span class="badge bg-dark rounded-pill">US$ ${coolstuff}</span>
                    </li>
                </ul>

                <h5 class="mt-3 border-bottom pb-2">Descrição / Efeito</h5>
                <p class="small text-muted" style="white-space: pre-wrap;">${escapeHtml(descricao)}</p>
            </div>
        </div>
    `;
    const modal = new bootstrap.Modal(document.getElementById('cardModal'));
    modal.show();
}

function escapeHtml(text) {
    if (!text) return '';
    return text.toString().replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

/* ==========================================================
   3. CONTROLES DE PAGINAÇÃO E PESQUISA COM DEBOUNCE
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

// Nova função de pesquisa com "Debounce" para não travar a API digitando rápido
function pesquisarCarta() {
    clearTimeout(timeoutPesquisa);
    timeoutPesquisa = setTimeout(() => {
        paginaAtual = 0; 
        carregarCartasDaAPI();
    }, 500); // Aguarda meio segundo após parar de digitar
}

/* ==========================================================
   4. FAVORITOS
   ========================================================= */
function adicionarFavoritoPeloIndex(index) {
    let carta = cartasAtuais[index];
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    
    // Puxando o preço da Amazon também para o favorito
    let precoParaFavorito = carta.card_prices && carta.card_prices[0].amazon_price 
                            ? carta.card_prices[0].amazon_price 
                            : "0.00";

    let novaCarta = {
        nome: carta.name,
        imagem: carta.card_images[0].image_url,
        preco: precoParaFavorito
    };

    if (!favoritos.some(f => f.nome === novaCarta.nome)) {
        favoritos.push(novaCarta);
        localStorage.setItem("favoritos", JSON.stringify(favoritos));
        mostrarMensagem("Adicionado aos favoritos!");
    } else {
        mostrarMensagem("Já está na sua lista!");
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
        container.innerHTML = "<p class='text-center w-100 text-muted'>Nenhuma carta favoritada ainda.</p>";
        return;
    }

    favoritos.forEach((carta, index) => {
        container.innerHTML += `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
            <div class="card card-favorito h-100 shadow-sm border-0">
                <img src="${carta.imagem}" class="card-img-top" alt="${carta.nome}">
                <div class="card-body text-center d-flex flex-column justify-content-between">
                    <div>
                        <h5 class="card-title fw-bold" style="font-size: 14px;">${carta.nome}</h5>
                        <p class="card-text text-success fw-bold">Amazon: US$ ${carta.preco}</p>
                    </div>
                    <button class="btn btn-danger btn-sm mt-2" onclick="removerFavoritoPeloIndex(${index})">Remover</button>
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
    if (document.getElementById("listaCartas")) {
        carregarCartasDaAPI();
    }
    if (document.getElementById("favoritosContainer")) {
        carregarPaginaFavoritos();
    }
});