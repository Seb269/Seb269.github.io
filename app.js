let allGames = [];
const grid = document.getElementById("grid");

// 1. Ladda CSV
Papa.parse("games_clean.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: async function(result) {
    allGames = result.data;

    // (valfritt) hämta bilder
    for (let game of allGames) {
      game.image = await fetchImage(game.Games);
    }

    render(allGames);
  }
});

// 2. Render funktion
function render(data) {
  grid.innerHTML = data.map(game => `
    <div class="card">
      <img src="${game.image || 'https://via.placeholder.com/300x400'}" />
      <div class="title">${game.Games || ""}</div>
      <div class="meta">${game.Console || ""}</div>
      <div class="meta">${game.Year || ""} • ${game.Developer || ""}</div>
    </div>
  `).join("");
}

// 3. Search
document.getElementById("search").addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();

  const filtered = allGames.filter(game =>
    (game.Games || "").toLowerCase().includes(value) ||
    (game.Console || "").toLowerCase().includes(value) ||
    (game.Developer || "").toLowerCase().includes(value)
  );

  render(filtered);
});

// 4. Hämta bild från RAWG
async function fetchImage(name) {
  try {
    const res = await fetch(`https://api.rawg.io/api/games?key=YOUR_API_KEY&search=${name}`);
    const data = await res.json();

    return data.results?.[0]?.background_image || null;
  } catch (e) {
    return null;
  }
}
