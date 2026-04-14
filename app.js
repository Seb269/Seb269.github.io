let allGames = [];

const grid = document.getElementById("grid");
const search = document.getElementById("search");

// ------------------------
// LOAD CSV
// ------------------------
Papa.parse("games_clean.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,

  complete: (result) => {
    allGames = result.data;

    render(allGames);
    setupSearch();
  }
});

// ------------------------
// SEARCH
// ------------------------
function setupSearch() {
  search.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase();

    const filtered = allGames.filter(game =>
      (game.Games || "").toLowerCase().includes(value) ||
      (game.Console || "").toLowerCase().includes(value) ||
      (game.Developer || "").toLowerCase().includes(value)
    );

    render(filtered);
  });
}

// ------------------------
// RENDER
// ------------------------
function render(data) {
  if (!data || data.length === 0) {
    grid.innerHTML = "<p>No games found</p>";
    return;
  }

  grid.innerHTML = data.map(game => `
    <div class="card">
      <img
        src="${getCover(game)}"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/300x400?text=No+Cover'"
      />

      <div class="title">${game.Games || ""}</div>
      <div class="meta">${game.Console || ""}</div>
      <div class="meta">${game.Year || ""} • ${game.Developer || ""}</div>
    </div>
  `).join("");
}

// ------------------------
// IMAGE SYSTEM (KEEP SIMPLE FOR NOW)
// ------------------------
function getCover(game) {
  const name = encodeURIComponent(game.Games || "");
  return `https://via.placeholder.com/300x400?text=${name}`;
}
