/* CARTAS DISPONÍVEIS COM PREÇO */

const cartasBase = [

{
nome: "Spirit of the Pot of Greed",
img: "imagens/spirit_of_the_pot_of_greed.jpg",
preco: 25.50
},

{
nome: "Jar of Greed",
img: "imagens/pote-ganancia.png",
preco: 10.00
},

{
nome: "Pot of Extravagance",
img: "imagens/pot_of_extravagance.jpg",
preco: 18.75
},

{
nome: "Pot of Desires",
img: "imagens/por_of_desires.jpg",
preco: 12.30
},

];


/* GERAR CARTAS REPETIDAS */

let todasCartas = [];

for (let i = 0; i < 60; i++)
{
todasCartas.push(cartasBase[i % cartasBase.length]);
}


/* CONFIG PAGINAÇÃO */

let paginaAtual = 1;
let cartasPorPagina = 12;


/* MOSTRAR CARTAS NA TELA */

function mostrarCartas()
{

let inicio = (paginaAtual - 1) * cartasPorPagina;
let fim = inicio + cartasPorPagina;

let cartasPagina = todasCartas.slice(inicio, fim);

let container = document.getElementById("listaCartas");

container.innerHTML = "";

cartasPagina.forEach(function(carta)
{

container.innerHTML += `

<div class="col-6 col-md-4 col-lg-3 carta-item" data-nome="${carta.nome}">

<div class="card h-100">

<img src="${carta.img}" class="card-img-top" alt="${carta.nome}" loading="lazy">

<div class="card-body text-center">

<p class="card-text">${carta.nome}</p>
<p class="card-text fw-bold text-success">R$ ${carta.preco.toFixed(2)}</p>

</div>

</div>

</div>

`;

});

}


/* CRIAR PAGINAÇÃO */

function criarPaginacao()
{

let totalPaginas = Math.ceil(todasCartas.length / cartasPorPagina);

let paginacao = document.getElementById("paginacao");

paginacao.innerHTML = "";


/* ANTERIOR */

paginacao.innerHTML += `
<li class="page-item ${paginaAtual === 1 ? "disabled" : ""}">
<a class="page-link" href="#" onclick="trocarPagina(${paginaAtual - 1})">Anterior</a>
</li>
`;


/* NÚMEROS DAS PÁGINAS */

for (let i = 1; i <= totalPaginas; i++)
{

paginacao.innerHTML += `

<li class="page-item ${i === paginaAtual ? "active" : ""}">

<a class="page-link" href="#" onclick="trocarPagina(${i})">${i}</a>

</li>

`;

}


/* PRÓXIMO */

paginacao.innerHTML += `
<li class="page-item ${paginaAtual === totalPaginas ? "disabled" : ""}">
<a class="page-link" href="#" onclick="trocarPagina(${paginaAtual + 1})">Próximo</a>
</li>
`;

}


/* TROCAR DE PÁGINA */

function trocarPagina(pagina)
{

let totalPaginas = Math.ceil(todasCartas.length / cartasPorPagina);

if (pagina < 1 || pagina > totalPaginas)
{
return;
}

paginaAtual = pagina;

mostrarCartas();
criarPaginacao();

}


/* PESQUISAR CARTA */

function pesquisarCarta()
{

let texto = document
.getElementById("campoPesquisa")
.value
.toLowerCase();

let cartas = document.querySelectorAll(".carta-item");

cartas.forEach(function(carta)
{

let nome = carta.dataset.nome.toLowerCase();

if (nome.includes(texto))
{
carta.style.display = "block";
}
else
{
carta.style.display = "none";
}

});

}


/* INICIAR */

mostrarCartas();
criarPaginacao();