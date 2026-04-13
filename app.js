let allGames = [];
const grid = document.getElementById("grid");
const search = document.getElementById("search");
const RAWG_KEY = "7746f81d5f174c5f9680d649b81cd37a";

let allGames = [];
const grid = document.getElementById("grid");

// 🔹 Ladda CSV
Papa.parse("games_clean.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,

  complete: async function(result) {
    allGames = result.data;

    // 🔥 Hämta bilder från RAWG
    await Promise.all(
      allGames.map(async (game) => {
        game.image = await fetchImage(game.Games);
      })
    );

    render(allGames);
  }
});

// 🔹 Render
function render(data) {
  if (!data || data.length === 0) {
    grid.innerHTML = "<p>No games found</p>";
    return;
  }

  grid.innerHTML = data.map(game => `
    <div class="card">
      <img src="${game.image || 'https://via.placeholder.com/300x400'}">
      <div class="title">${game.Games || ""}</div>
      <div class="meta">${game.Console || ""}</div>
      <div class="meta">${game.Year || ""} • ${game.Developer || ""}</div>
    </div>
  `).join("");
}

// 🔹 Search
document.getElementById("search").addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();

  const filtered = allGames.filter(game =>
    (game.Games || "").toLowerCase().includes(value) ||
    (game.Console || "").toLowerCase().includes(value) ||
    (game.Developer || "").toLowerCase().includes(value)
  );

  render(filtered);
});

// 🔹 Hämta bild (RAWG API)
async function fetchImage(name) {
  try {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=66968a72697f470d8d38f30e466f148c&search=${encodeURIComponent(name)}`
    );

    const data = await res.json();
    return data.results?.[0]?.background_image || null;
  } catch {
    return null;
  }
}
