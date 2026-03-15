const cartasBase = [
  { nome: "Spirit of the Pot of Greed", img: "imagens/spirit_of_the_pot_of_greed.jpg" },
  { nome: "Pot of Desires", img: "imagens/por_of_desires.jpg" },
  { nome: "Pot of Extravagance", img: "imagens/pot_of_extravagance.jpg" },
  { nome: "Jar of Greed", img: "imagens/pote-ganancia.png" } // <- aqui é pote-ganancia.png
];

let todasCartas = [];
for(let i=0;i<40;i++){todasCartas.push(cartasBase[i % cartasBase.length]);}

/* Deck do usuário */
let deckUsuario = {}; // { "nome da carta": quantidade }

function mostrarCartas()
{
let container = document.getElementById("listaCartas");
container.innerHTML = "";

todasCartas.forEach(function(carta){
let div = document.createElement("div");
div.classList.add("carta");
div.dataset.nome = carta.nome;
div.dataset.preco = carta.preco;

div.innerHTML = `
<img src="${carta.img}" alt="${carta.nome}">
<p>${carta.nome}</p>
<button class="info-btn">i</button>
`;

/* Clicar para adicionar ao deck 1 */
div.addEventListener("click", function(e){
if(e.target.classList.contains("info-btn")) return; // ignora o botão info
let deckArea = document.querySelector(".deck-card .deck-area");
let clone = div.cloneNode(true);
deckArea.appendChild(clone);

/* Atualizar quantidade do usuário */
deckUsuario[carta.nome] = (deckUsuario[carta.nome] || 0) + 1;
});

/* Botão info */
div.querySelector(".info-btn").addEventListener("click", function(e){
e.stopPropagation(); // não adiciona ao deck
let modalBody = document.getElementById("modalBody");
let qtd = deckUsuario[carta.nome] || 0;
modalBody.innerHTML = `
<p><strong>Nome:</strong> ${carta.nome}</p>
<p><strong>Preço:</strong> R$ ${carta.preco.toFixed(2)}</p>
<p><strong>Você possui:</strong> ${qtd} unidade(s) neste deck</p>
`;
let modal = new bootstrap.Modal(document.getElementById('infoModal'));
modal.show();
});

container.appendChild(div);
});

}

mostrarCartas();