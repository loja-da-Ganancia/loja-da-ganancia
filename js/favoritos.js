function carregarFavoritos() {

let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

let container = document.getElementById("favoritosContainer");

container.innerHTML = "";

if (favoritos.length === 0) {
container.innerHTML = "<p>Nenhuma carta favorita ainda.</p>";
return;
}

favoritos.forEach(carta => {

let card = `
<div class="col-md-3 mb-4">
<div class="card">

<img src="${carta.imagem}" class="card-img-top">

<div class="card-body">

<h5 class="card-title">${carta.nome}</h5>

<p class="card-text">
Preço: R$ ${carta.preco}
</p>

<button class="btn btn-danger" onclick="removerFavorito('${carta.nome}')">
Remover
</button>

</div>
</div>
</div>
`;

container.innerHTML += card;

});

}

function removerFavorito(nome) {

let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

favoritos = favoritos.filter(carta => carta.nome !== nome);

localStorage.setItem("favoritos", JSON.stringify(favoritos));

carregarFavoritos();

}

carregarFavoritos();