/* ==========================================================
   VARIÁVEIS DE CONTROLE DO MARKETPLACE
   ========================================================== */
let todasAsCartasRetornadas = []; 
let cartasFiltradasParaExibicao = [];
let paginaAtual = 0;        
const CARTAS_POR_PAGINA = 15; 
let timeoutPesquisa;

// Código de afiliado da Amazon (substitua pelo seu)
const AMAZON_AFFILIATE_TAG = '3153150d-20';

document.addEventListener("DOMContentLoaded", () => {
    // 1. Limpar todos os filtros ao carregar a página
    function resetarFiltros() {
        document.getElementById("campoPesquisa").value = "";
        document.getElementById("filtroTipo").value = "";
        document.getElementById("filtroAtributo").value = "";
        document.getElementById("filtroNivel").value = "";
        document.getElementById("filtroAtk").value = "";
        document.getElementById("filtroDef").value = "";
        document.getElementById("filtroPrecoMin").value = "";
        document.getElementById("filtroPrecoMax").value = "";
        document.getElementById("filtroOcultarSemPreco").checked = true;
    }
    resetarFiltros();

    document.getElementById("btnPesquisarTop").addEventListener("click", buscarCartasAPI);
    document.getElementById("btnAplicarFiltros").addEventListener("click", buscarCartasAPI);
    document.getElementById("filtroOcultarSemPreco").addEventListener("change", aplicarFiltroDePrecoLocal);
    document.getElementById("btnLimparFiltros").addEventListener("click", () => {
        resetarFiltros();
        buscarCartasAPI();
    });
    document.getElementById("campoPesquisa").addEventListener("keyup", () => {
        clearTimeout(timeoutPesquisa);
        timeoutPesquisa = setTimeout(() => {
            buscarCartasAPI();
        }, 800);
    });

    buscarCartasAPI();
});

/* ==========================================================
   1. BUSCA NA API (YGOPRODeck)
   ========================================================= */
async function buscarCartasAPI() {
    let container = document.getElementById("listaCartas");
    container.innerHTML = "<h4 class='text-center w-100 text-info mt-5'>Buscando no banco de dados...</h4>";
    document.getElementById("paginacao").innerHTML = ""; 

    const nome = document.getElementById("campoPesquisa").value.trim();
    const tipo = document.getElementById("filtroTipo").value;
    const atributo = document.getElementById("filtroAtributo").value;
    const nivel = document.getElementById("filtroNivel").value;
    const atk = document.getElementById("filtroAtk").value;
    const def = document.getElementById("filtroDef").value;

    let url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt`;
    if (nome) url += `&fname=${encodeURIComponent(nome)}`;
    if (tipo) url += `&type=${encodeURIComponent(tipo)}`;
    if (atributo) url += `&attribute=${encodeURIComponent(atributo)}`;
    if (nivel) url += `&level=${encodeURIComponent(nivel)}`;
    if (atk) url += `&atk=${encodeURIComponent(atk)}`;
    if (def) url += `&def=${encodeURIComponent(def)}`;

    try {
        let resposta = await fetch(url);
        if (resposta.status === 400) {
            container.innerHTML = "<h4 class='text-center w-100 text-warning mt-5'>Nenhuma carta encontrada com esses filtros.</h4>";
            return;
        }
        let dados = await resposta.json();
        if (!dados.data || dados.data.length === 0) {
            container.innerHTML = "<h4 class='text-center w-100 text-warning mt-5'>Nenhuma carta encontrada.</h4>";
            return;
        }
        todasAsCartasRetornadas = dados.data;
        aplicarFiltroDePrecoLocal(); 
    } catch (erro) {
        console.error("Erro na requisição:", erro);
        container.innerHTML = "<h4 class='text-center text-danger w-100 mt-5'>Erro de conexão com o servidor.</h4>";
    }
}

function obterPreco(carta) {
    if (!carta.card_prices || !carta.card_prices[0]) return 0.00;
    return parseFloat(carta.card_prices[0].tcgplayer_price || 0);
}

function aplicarFiltroDePrecoLocal() {
    const precoMin = parseFloat(document.getElementById("filtroPrecoMin").value);
    const precoMax = parseFloat(document.getElementById("filtroPrecoMax").value);
    const ocultarIndisponiveis = document.getElementById("filtroOcultarSemPreco").checked;

    cartasFiltradasParaExibicao = todasAsCartasRetornadas.filter(carta => {
        let preco = obterPreco(carta);
        if (ocultarIndisponiveis && preco <= 0) return false;
        if (!isNaN(precoMin) && preco < precoMin) return false;
        if (!isNaN(precoMax) && preco > precoMax) return false;
        return true;
    });

    cartasFiltradasParaExibicao.sort((a, b) => obterPreco(a) - obterPreco(b));

    if (cartasFiltradasParaExibicao.length === 0) {
        document.getElementById("listaCartas").innerHTML = "<h4 class='text-center w-100 text-warning mt-5'>Nenhuma carta atende aos filtros de preço solicitados.</h4>";
        document.getElementById("paginacao").innerHTML = "";
        return;
    }

    paginaAtual = 0; 
    renderizarPaginaAtual();
}

function renderizarPaginaAtual() {
    const container = document.getElementById("listaCartas");
    container.innerHTML = "";

    const inicio = paginaAtual * CARTAS_POR_PAGINA;
    const fim = inicio + CARTAS_POR_PAGINA;
    const cartasDestaPagina = cartasFiltradasParaExibicao.slice(inicio, fim);

    let htmlFinal = "";
    cartasDestaPagina.forEach(carta => {
        let nomeCarta = carta.name;
        let imagemCarta = carta.card_images[0].image_url;
        let precoRaw = obterPreco(carta);
        let precoDisplay = precoRaw > 0 ? `US$ ${precoRaw.toFixed(2)}` : '<span class="text-secondary" style="font-size: 12px;">Indisponível</span>';

        htmlFinal += `
        <div class="col-12 col-sm-6 col-md-4 mb-4">
            <div class="card h-100 shadow-sm rounded-3">
                <button class="favoritar-btn" data-id="${carta.id}" title="Adicionar aos Favoritos">⭐</button>
                <div onclick="abrirModalDetalhes('${carta.id}')" style="cursor:pointer;">
                    <img src="${imagemCarta}" class="card-img-top w-100" alt="${escapeHtml(nomeCarta)}" loading="lazy">
                    <div class="card-body text-center d-flex flex-column justify-content-between pb-3">
                        <div>
                            <p class="card-text fw-bold text-white mb-1" style="font-size: 14px; min-height: 40px;">${escapeHtml(nomeCarta)}</p>
                            <p class="card-text text-success fw-bold m-0" style="font-size: 18px;">
                                <span style="font-size: 12px; color: #20aeea;">TCGPlayer:</span><br>
                                ${precoDisplay}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    });

    container.innerHTML = htmlFinal;

    document.querySelectorAll('.favoritar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            adicionarFavoritoPeloId(btn.dataset.id);
        });
    });

    renderizarControlesPaginacao();
}

function renderizarControlesPaginacao() {
    const totalPaginas = Math.ceil(cartasFiltradasParaExibicao.length / CARTAS_POR_PAGINA);
    const paginacaoContainer = document.getElementById("paginacao");

    if (totalPaginas <= 1) {
        paginacaoContainer.innerHTML = "";
        return;
    }

    paginacaoContainer.innerHTML = `
        <div class="d-flex justify-content-center align-items-center gap-3">
            <button class="btn btn-outline-info" ${paginaAtual === 0 ? 'disabled' : ''} onclick="mudarPagina(-1)">⮜ Anterior</button>
            <span class="fw-bold text-light">Página ${paginaAtual + 1} de ${totalPaginas}</span>
            <button class="btn btn-outline-info" ${paginaAtual >= totalPaginas - 1 ? 'disabled' : ''} onclick="mudarPagina(1)">Próxima ⮞</button>
        </div>
    `;
}

function mudarPagina(direcao) {
    paginaAtual += direcao;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderizarPaginaAtual();
}

/* ==========================================================
   5. MODAL DETALHADO COM LINK AFILIADO E CTA
   ========================================================= */
async function abrirModalDetalhes(idCarta) {
    const carta = cartasFiltradasParaExibicao.find(c => c.id == idCarta);
    if (!carta) return;

    const modalBody = document.getElementById('modalCardBody');
    modalBody.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-info" role="status"></div>
            <p class="mt-3">Carregando informações da carta...</p>
        </div>
    `;
    const modal = new bootstrap.Modal(document.getElementById('cardModal'));
    modal.show();

    // Buscar nome em inglês usando o ID da carta
    let englishName = carta.name;
    try {
        const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${carta.id}`;
        console.log(`Buscando nome em inglês para ID ${carta.id}...`);
        const response = await fetch(url);
        const data = await response.json();
        if (data.data && data.data[0] && data.data[0].name) {
            englishName = data.data[0].name;
            console.log(`✅ Nome em inglês encontrado: "${englishName}"`);
        } else {
            console.warn(`⚠️ API não retornou nome em inglês para ID ${carta.id}. Usando português: "${carta.name}"`);
        }
    } catch (err) {
        console.error(`❌ Erro ao buscar nome em inglês para ID ${carta.id}:`, err);
    }

    // Constrói o link de busca na Amazon com o nome em inglês
    const searchTerm = `Yu-Gi-Oh! ${englishName}`;
    const encodedSearch = encodeURIComponent(searchTerm);
    const amazonLink = `https://www.amazon.com/s?k=${encodedSearch}&tag=${AMAZON_AFFILIATE_TAG}`;
    console.log(`🔗 Link gerado: ${amazonLink}`);

    const precos = carta.card_prices ? carta.card_prices[0] : {};

    const formatarPrecoModal = (valor, simbolo = "US$") => {
        let valFloat = parseFloat(valor || 0);
        return valFloat > 0 
            ? `<span class="vendor-price">${simbolo} ${valFloat.toFixed(2)}</span>` 
            : `<span class="vendor-price indisponivel">Fora de estoque</span>`;
    };

    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-5 text-center mb-4">
                <img id="imgZoomMarketplace" src="${carta.card_images[0].image_url}" class="img-fluid rounded border border-secondary img-zoomable" alt="${escapeHtml(carta.name)}" style="box-shadow: 0 4px 15px rgba(0,0,0,0.5); max-height: 400px; object-fit: contain;" title="Clique para dar Zoom">
                <p class="mt-2" style="font-size: 0.8rem; color: #8b949e;">🔍 Clique na imagem para dar zoom</p>
            </div>
            <div class="col-md-7">
                <h3 class="fw-bold text-white border-bottom border-secondary pb-2 mb-3">${escapeHtml(carta.name)}</h3>
                
                <div class="d-flex flex-wrap gap-2 mb-4">
                    <span class="badge bg-dark border border-secondary p-2">Tipo: ${carta.type || 'N/A'}</span>
                    <span class="badge bg-dark border border-secondary p-2">Atr: ${carta.attribute || 'N/A'}</span>
                    <span class="badge bg-dark border border-secondary p-2">Nv/Rank: ${carta.level || carta.rank || 'N/A'}</span>
                    <span class="badge bg-dark border border-secondary p-2">ATK/DEF: ${carta.atk !== undefined ? carta.atk : 'N/A'} / ${carta.def !== undefined ? carta.def : 'N/A'}</span>
                </div>
                
                <h5 class="text-info fw-bold mb-3">🛒 Comparar Ofertas</h5>
                <div class="vendor-list mb-4">
                    
                    <div class="vendor-card">
                        <div class="vendor-name"><span style="color: #20aeea; font-size: 1.2rem;">🔵</span> TCGPlayer</div>
                        ${formatarPrecoModal(precos.tcgplayer_price)}
                    </div>

                    <a href="${amazonLink}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit;">
                        <div class="vendor-card">
                            <div class="vendor-name"><span style="color: #ff9900; font-size: 1.2rem;">🅰️</span> Amazon</div>
                            ${formatarPrecoModal(precos.amazon_price)}
                        </div>
                    </a>

                    <div class="vendor-card">
                        <div class="vendor-name"><span style="color: #e53238; font-size: 1.2rem;">🛍️</span> eBay</div>
                        ${formatarPrecoModal(precos.ebay_price)}
                    </div>

                    <div class="vendor-card">
                        <div class="vendor-name"><span style="color: #0055ff; font-size: 1.2rem;">🇪🇺</span> Cardmarket</div>
                        ${formatarPrecoModal(precos.cardmarket_price, '€')}
                    </div>

                    <div class="vendor-card">
                        <div class="vendor-name"><span style="color: #a55eea; font-size: 1.2rem;">🎲</span> CoolStuffInc</div>
                        ${formatarPrecoModal(precos.coolstuffinc_price)}
                    </div>

                </div>

                <!-- CALL TO ACTION -->
                <div class="text-center mt-3 mb-4 p-2 rounded" style="background: rgba(0, 210, 255, 0.1); border: 1px solid #00d2ff; border-radius: 8px;">
                    <p class="mb-0" style="font-size: 0.85rem; color: #b0e0ff;">
                        💡 <strong>Clique em qualquer loja acima</strong> para ser direcionado ao site parceiro e garantir o melhor preço!
                    </p>
                    <p class="mb-0" style="font-size: 0.75rem; color: #8b949e;">
                        🔗 Você estará apoiando a Greed Store — comissão revertida em melhorias!
                    </p>
                </div>

                <h5 class="border-bottom border-secondary pb-2">Efeito da Carta</h5>
                <p class="text-light" style="white-space: pre-wrap; font-size: 0.95rem; line-height: 1.6;">${escapeHtml(carta.desc)}</p>
            </div>
        </div>
    `;

    // Ativação do Zoom por Clique
    setTimeout(() => {
        const imgEl = document.getElementById('imgZoomMarketplace');
        if (imgEl) {
            imgEl.addEventListener('click', function() {
                this.classList.toggle('img-zoomed');
            });
        }
    }, 100);
}

function adicionarFavoritoPeloId(idCarta) {
    const carta = cartasFiltradasParaExibicao.find(c => c.id == idCarta);
    if (!carta) return;

    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    let precoParaFavorito = obterPreco(carta).toFixed(2);

    let novaCarta = {
        nome: carta.name,
        imagem: carta.card_images[0].image_url,
        preco: precoParaFavorito
    };

    if (!favoritos.some(f => f.nome === novaCarta.nome)) {
        favoritos.push(novaCarta);
        localStorage.setItem("favoritos", JSON.stringify(favoritos));
        
        let msg = document.getElementById("mensagem");
        msg.style.display = "block";
        setTimeout(() => { msg.style.display = "none"; }, 2000);
    } else {
        alert("Esta carta já está na sua lista de favoritos!");
    }
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