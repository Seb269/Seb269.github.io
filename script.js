
export default csvData;

function parseCSV(data) {
  return data.trim().split("\n").slice(1).map(row => {
    const cols = row.split(";");
    return {
      title: cols[0],
      console: cols[1],
      year: cols[5]
    };
  });
}

function renderGames(games) {
  const grid = document.getElementById("grid");

  games.forEach(game => {
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <h3>${game.title}</h3>
      <p class="console">${game.console}</p>
      <p>${game.year}</p>
    `;

    grid.appendChild(card);
  });
}

const games = parseCSV(csvData);
renderGames(games);



function parseCSV(text) {
  return text
    .trim()
    .split("\n")
    .map(row => row.split(","));
}

Papa.parse("games_clean.csv", {
  download: true,
  header: true,
  complete: (result) => console.log(result.data)
});

