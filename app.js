let allGames = [];

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const consoleFilter = document.getElementById("consoleFilter");

const FALLBACK_COVER = "https://via.placeholder.com/300x400?text=No+Cover";
const coverCache = new Map();
const pendingCoverLoads = new Map();

// ------------------------
// LOAD CSV
// ------------------------
Papa.parse("games_clean.csv", {
  download: true,
  header: true,
  skipEmptyLines: true,

  complete: (result) => {
    allGames = result.data;

    setupConsoleFilter();
    setupFilters();
    applyFilters();
  }
});

// ------------------------
// FILTER CONTROLS
// ------------------------
function setupConsoleFilter() {
  const consoles = Array.from(
    new Set(allGames.map((game) => (game.Console || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const options = consoles.map(
    (consoleName) => `<option value="${escapeHtml(consoleName)}">${escapeHtml(consoleName)}</option>`
  );

  consoleFilter.insertAdjacentHTML("beforeend", options.join(""));
}

function setupFilters() {
  search.addEventListener("input", applyFilters);
  consoleFilter.addEventListener("change", applyFilters);
}

function applyFilters() {
  const value = search.value.toLowerCase();
  const selectedConsole = consoleFilter.value;

  const filtered = allGames.filter((game) => {
    const matchesSearch =
      (game.Games || "").toLowerCase().includes(value) ||
      (game.Console || "").toLowerCase().includes(value) ||
      (game.Developer || "").toLowerCase().includes(value);

    const matchesConsole = selectedConsole === "all" || (game.Console || "") === selectedConsole;

    return matchesSearch && matchesConsole;
  });

  render(filtered);
}

// ------------------------
// RENDER
// ------------------------
function render(data) {
  if (!data || data.length === 0) {
    grid.innerHTML = "<p>No games found</p>";
    return;
  }

  grid.innerHTML = data.map((game) => {
    const gameKey = getGameKey(game);

    return `
      <div class="card">
        <img
          src="${escapeHtml(getCachedCover(game))}"
          loading="lazy"
          class="game-cover"
          data-game-key="${escapeHtml(gameKey)}"
          alt="${escapeHtml((game.Games || "Unknown game") + " cover art")}" 
          onerror="this.src='${FALLBACK_COVER}'"
        />

        <div class="title">${escapeHtml(game.Games || "")}</div>
        <div class="meta">${escapeHtml(game.Console || "")}</div>
        <div class="meta">${escapeHtml(game.Year || "")} • ${escapeHtml(game.Developer || "")}</div>
      </div>
    `;
  }).join("");

  loadWikipediaCovers(data);
}

function getCachedCover(game) {
  const gameKey = getGameKey(game);
  return coverCache.get(gameKey) || FALLBACK_COVER;
}

function getGameKey(game) {
  return `${(game.Games || "").trim()}|${(game.Console || "").trim()}`;
}

// ------------------------
// WIKIPEDIA COVER SYSTEM
// ------------------------
async function loadWikipediaCovers(games) {
  for (const game of games) {
    const gameKey = getGameKey(game);

    if (coverCache.has(gameKey) || pendingCoverLoads.has(gameKey)) {
      continue;
    }

    const loadPromise = fetchWikipediaCover(game)
      .then((coverUrl) => {
        coverCache.set(gameKey, coverUrl || FALLBACK_COVER);
        updateCoverElements(gameKey, coverCache.get(gameKey));
      })
      .catch(() => {
        coverCache.set(gameKey, FALLBACK_COVER);
      })
      .finally(() => {
        pendingCoverLoads.delete(gameKey);
      });

    pendingCoverLoads.set(gameKey, loadPromise);
  }
}

function updateCoverElements(gameKey, coverUrl) {
  const selector = `.game-cover[data-game-key="${cssEscape(gameKey)}"]`;
  const images = document.querySelectorAll(selector);

  images.forEach((img) => {
    img.src = coverUrl;
  });
}

async function fetchWikipediaCover(game) {
  const terms = buildWikipediaSearchTerms(game);

  for (const term of terms) {
    const imageUrl = await fetchCoverFromSearch(term);

    if (imageUrl) {
      return imageUrl;
    }
  }

  return null;
}

function buildWikipediaSearchTerms(game) {
  const title = (game.Games || "").trim();
  const consoleName = (game.Console || "").trim();

  const termSet = new Set([
    `${title} video game`,
    `${title} (${consoleName} video game)`,
    `${title} ${consoleName} video game`,
    title
  ].filter(Boolean));

  return Array.from(termSet);
}

async function fetchCoverFromSearch(searchTerm) {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrsearch", searchTerm);
  url.searchParams.set("gsrlimit", "1");
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("piprop", "thumbnail");
  url.searchParams.set("pithumbsize", "500");

  const response = await fetch(url.toString());

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const pages = Object.values(data?.query?.pages || {});

  if (pages.length === 0) {
    return null;
  }

  return pages[0]?.thumbnail?.source || null;
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === "function") {
    return window.CSS.escape(value);
  }

  return value.replaceAll('"', '\\"');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
