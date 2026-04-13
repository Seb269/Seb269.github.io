let allGames = [];
const grid = document.getElementById("grid");
const search = document.getElementById("search");
const RAWG_KEY = "7746f81d5f174c5f9680d649b81cd37a";

// LOAD CSV
Papa.parse("games_clean.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,
  complete: function(result) {
    allGames = result.data;
    render(allGames);
  }
});

// SEARCH
search.addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();

  const filtered = allGames.filter(game =>
    (game.Games || "").toLowerCase().includes(value) ||
    (game.Console || "").toLowerCase().includes(value) ||
    (game.Developer || "").toLowerCase().includes(value)
  );

  render(filtered);
});

// RENDER
function render(data) {
  grid.innerHTML = "";

  data.forEach(async (game) => {
    const image = await fetchImage(game.Games);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${image || 'https://via.placeholder.com/300x400'}">
      <div class="title">${game.Games || ""}</div>
      <div class="meta">${game.Console || ""}</div>
      <div class="meta">${game.Year || ""} • ${game.Developer || ""}</div>
    `;

    grid.appendChild(card);
  });
}

  data.forEach(async (game) => {
    const image = await fetchImage(game.Games);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${image || 'https://via.placeholder.com/300x400'}">
      <div class="title">${game.Games || ""}</div>
      <div class="meta">${game.Console || ""}</div>
      <div class="meta">${game.Year || ""} • ${game.Developer || ""}</div>
    `;

    grid.appendChild(card);
  });
}

// RAWG IMAGE FETCH (optional)
async function fetchImage(name) {
  try {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=YOUR_API_KEY&search=${encodeURIComponent(name)}`
    );

    const data = await res.json();
    return data.results?.[0]?.background_image || null;

  } catch (e) {
    return null;
  }
}
async function fetchImage(name) {
  try {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=66968a72697f470d8d38f30e466f148c&search=${encodeURIComponent(name)}&page_size=1`
    );

    const data = await res.json();

    return data.results?.[0]?.background_image || null;
  } catch (e) {
    return null;
  }
}
