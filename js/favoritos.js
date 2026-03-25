/* ==========================================================
   PÁGINA DE FAVORITOS (CARREGAR E REMOVER)
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
        container.innerHTML = "<h4 class='text-center w-100 mt-5' style='color:#8b949e;'>Você ainda não favoritou nenhuma carta.</h4>";
        return;
    }

    favoritos.forEach((carta, index) => {
        container.innerHTML += `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
            <div class="card card-favorito h-100 shadow-sm border-0" style="background-color: #161b22; border: 1px solid #30363d !important; border-radius: 8px;">
                <img src="${carta.imagem}" class="card-img-top" alt="${carta.nome}" style="height: 280px; object-fit: contain; padding: 10px; background-color: #0d1117; border-bottom: 1px solid #30363d;">
                <div class="card-body text-center d-flex flex-column justify-content-between">
                    <div>
                        <h5 class="card-title fw-bold text-white" style="font-size: 14px;">${carta.nome}</h5>
                        <p class="card-text text-success fw-bold">US$ ${carta.preco}</p>
                    </div>
                    <button class="btn btn-outline-danger btn-sm mt-2 fw-bold" onclick="removerFavoritoPeloIndex(${index})">Remover</button>
                </div>
            </div>
        </div>`;
    });
}

function removerFavoritoPeloIndex(index) {
    let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
    favoritos.splice(index, 1);
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
    carregarPaginaFavoritos(); // Recarrega a tela
}