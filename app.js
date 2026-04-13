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
