const csvData = `Games;Console;Edition;Developer;Publisher;Year;New;Box;Manual
Final Fantasy VII;Playstation;Japanese;Square;Square;1997;No;Yes;No
Crash Bandicoot;Playstation;European;Naughty Dog;Sony;1996;No;Yes;No
Tekken 3;Playstation;European;Namco;Namco;1997;No;Yes;Yes`;

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
