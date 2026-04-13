let allGames = [];

Papa.parse("games_clean.csv", {
  download: true,
  header: true,
  complete: function(result) {
    allGames = result.data;
    render(allGames);
  }
});

function render(data) {
  const grid = document.getElementById("grid");

  grid.innerHTML = data.map(game => `
    <div class="card">
      <div class="title">${game.Games}</div>
      <div class="meta">${game.Console}</div>
      <div class="meta">${game.Year} • ${game.Developer}</div>
    </div>
  `).join("");
}


document.getElementById("search").addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();

  const filtered = allGames.filter(g =>
    (g.Games || "").toLowerCase().includes(value)
  );

  render(filtered);
});

document.getElementById("search").addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();

  const filtered = allGames.filter(game =>
    (game.Games || "").toLowerCase().includes(value) ||
    (game.Console || "").toLowerCase().includes(value) ||
    (game.Developer || "").toLowerCase().includes(value)
  );

  render(filtered);
});

