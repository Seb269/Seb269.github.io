const games = [
  {
    title: "Elden Ring",
    console: "PS5",
    year: 2022
  },
  {
    title: "God of War",
    console: "PS4",
    year: 2018
  }
];

const grid = document.getElementById("grid");

games.forEach(game => {
  const card = document.createElement("div");
  card.classList.add("card");

  card.innerHTML = `
    <h3>${game.title}</h3>
    <p>${game.console}</p>
    <p>${game.year}</p>
  `;

  grid.appendChild(card);
});
