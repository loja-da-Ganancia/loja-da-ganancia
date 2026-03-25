/* ==========================================================
   PÁGINA DE FAVORITOS (CARREGAR, REMOVER E DETALHES COM ZOOM)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    carregarPaginaFavoritos();
});

function carregarPaginaFavoritos() {
    let container = document.getElementById("favoritosContainer");
    if (!container) return;

    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    container.innerHTML = "";

    if (favoritos.length === 0) {
        container.innerHTML = "<div class='col-12 text-center mt-5' style='color:#8b949e; font-size: 1.1rem;'>Você ainda não favoritou nenhuma carta. <br><a href='marketplace.html' class='text-info text-decoration-none'>Explore o Marketplace!</a></div>";
        return;
    }

    favoritos.forEach((carta, index) => {
        // Garantindo escapeHTML para evitar bugs com nomes que contenham aspas
        const nomeEscapado = escapeHtml(carta.nome);
        
        container.innerHTML += `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
            <div class="card card-favorito h-100 shadow-sm rounded-3">
                <div onclick="mostrarDetalhesFavorito('${nomeEscapado}', '${carta.imagem}')" style="cursor:pointer;" title="Ver detalhes">
                    <img src="${carta.imagem}" class="card-img-top w-100" alt="${nomeEscapado}" loading="lazy">
                    <div class="card-body text-center d-flex flex-column justify-content-between pb-2">
                        <div>
                            <h5 class="card-title fw-bold text-white mb-2" style="font-size: 15px; min-height: 40px;">${nomeEscapado}</h5>
                            <p class="card-text text-success fw-bold m-0" style="font-size: 16px;">US$ ${carta.preco}</p>
                        </div>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-0 pt-0 text-center pb-3">
                    <button class="btn btn-outline-danger btn-sm w-100 fw-bold" onclick="removerFavoritoPeloIndex(${index})">🗑️ Remover dos Favoritos</button>
                </div>
            </div>
        </div>`;
    });
}

function removerFavoritoPeloIndex(index) {
    if(!confirm("Tem certeza que deseja remover esta carta dos seus favoritos?")) return;
    
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    favoritos.splice(index, 1);
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    
    carregarPaginaFavoritos(); // Recarrega a tela instantaneamente
}

/* ==========================================================
   INTEGRAÇÃO COM A API E EFEITO DE ZOOM
   ========================================================= */
function mostrarDetalhesFavorito(nomeCarta, imagemLocal) {
    const modalBody = document.getElementById('cardInfoModalBody');
    modalBody.innerHTML = '<p class="text-info mt-3">Carregando informações do banco de dados...</p>';

    // Abre o Modal
    let modalElement = document.getElementById('cardInfoModal');
    let infoModal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    infoModal.show();

    // Busca na API as descrições em tempo real (pois Favoritos só salva nome, imagem e preço)
    fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?language=pt&name=${encodeURIComponent(nomeCarta)}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.data && data.data.length > 0) {
                renderizarDetalhesModal(data.data[0], imagemLocal);
            } else {
                // Fallback de segurança se a carta não for encontrada
                renderizarDetalhesModal({ name: nomeCarta, imagemFallback: imagemLocal }, imagemLocal); 
            }
        })
        .catch(() => { 
            modalBody.innerHTML = '<p class="text-danger mt-3">Erro de conexão ao buscar os detalhes da carta.</p>'; 
        });
}

function renderizarDetalhesModal(cartaFull, imagemFallback) {
    const imgUrl = (cartaFull.card_images && cartaFull.card_images.length > 0) 
        ? cartaFull.card_images[0].image_url 
        : imagemFallback;
        
    const nome = cartaFull.name || cartaFull.nome || 'Desconhecido';
    const tipo = cartaFull.type || 'N/A';
    const descricao = cartaFull.desc || 'Descrição não disponível no momento.';
    const modalBody = document.getElementById('cardInfoModalBody');

    modalBody.innerHTML = `
        <div class="row">
            <div class="col-md-5 text-center">
                <img id="imgZoomFavoritos" src="${imgUrl}" class="img-fluid rounded border border-secondary img-zoomable" style="max-height: 400px; object-fit: contain;" title="Clique para dar Zoom">
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

    // Ativação do Zoom por Clique
    setTimeout(() => {
        const imgEl = document.getElementById('imgZoomFavoritos');
        if (imgEl) {
            imgEl.addEventListener('click', function() {
                this.classList.toggle('img-zoomed');
            });
        }
    }, 100);
}

// Utilidade de Escape
function escapeHtml(text) {
    if (!text) return '';
    return text.toString().replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}