let allGames = [];

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const toggleFilters = document.getElementById("toggleFilters");
const advancedFilters = document.getElementById("advancedFilters");
const consoleFilter = document.getElementById("consoleFilter");
const yearFilter = document.getElementById("yearFilter");
const regionFilter = document.getElementById("regionFilter");
const sortFilter = document.getElementById("sortFilter");

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

    render(allGames);
    setupSearch();
    setupCategoryFilters();
    setupFilterEvents();
    applyFilters();
  }
});

// ------------------------
// SEARCH
// ------------------------
function setupSearch() {
  search.addEventListener("input", (e) => {
    const value = e.target.value.toLowerCase();
function setupCategoryFilters() {
  populateSelect(consoleFilter, allGames.map((game) => game.Console), "All Consoles");
  populateSelect(yearFilter, allGames.map((game) => game.Year), "All Years", sortYearsDesc);
  populateSelect(regionFilter, allGames.map((game) => game.Edition), "All Regions");
}

function populateSelect(selectElement, values, defaultLabel, sortFn = localeSort) {
  const uniqueValues = Array.from(
    new Set(values.map((value) => (value || "").trim()).filter(Boolean))
  ).sort(sortFn);

  uniqueValues.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    selectElement.append(option);
  });

  selectElement.options[0].textContent = defaultLabel;
}

function setupFilterEvents() {
  search.addEventListener("input", applyFilters);
  consoleFilter.addEventListener("change", applyFilters);
  yearFilter.addEventListener("change", applyFilters);
  regionFilter.addEventListener("change", applyFilters);
  sortFilter.addEventListener("change", applyFilters);

  toggleFilters.addEventListener("click", () => {
    const isOpen = !advancedFilters.hidden;
    advancedFilters.hidden = isOpen;
    toggleFilters.textContent = isOpen ? "Categories ▾" : "Categories ▴";
  });
}

function applyFilters() {
  const searchValue = search.value.toLowerCase();
  const selectedConsole = consoleFilter.value;
  const selectedYear = yearFilter.value;
  const selectedRegion = regionFilter.value;
  const selectedSort = sortFilter.value;

  const filteredGames = allGames.filter((game) => {
    const matchesSearch =
      (game.Games || "").toLowerCase().includes(searchValue) ||
      (game.Console || "").toLowerCase().includes(searchValue) ||
      (game.Developer || "").toLowerCase().includes(searchValue) ||
      (game.Edition || "").toLowerCase().includes(searchValue);

    const matchesConsole = selectedConsole === "all" || (game.Console || "") === selectedConsole;
    const matchesYear = selectedYear === "all" || (game.Year || "") === selectedYear;
    const matchesRegion = selectedRegion === "all" || (game.Edition || "") === selectedRegion;

    return matchesSearch && matchesConsole && matchesYear && matchesRegion;
  });

  const sortedGames = sortGames(filteredGames, selectedSort);
  render(sortedGames);
}

function sortGames(games, sortOption) {
  const sorted = [...games];

  sorted.sort((a, b) => {
    const titleCompare = localeSort((a.Games || "").trim(), (b.Games || "").trim());
    const yearA = Number.parseInt(a.Year, 10) || 0;
    const yearB = Number.parseInt(b.Year, 10) || 0;

    const filtered = allGames.filter(game =>
      (game.Games || "").toLowerCase().includes(value) ||
      (game.Console || "").toLowerCase().includes(value) ||
      (game.Developer || "").toLowerCase().includes(value)
    );
    if (sortOption === "title_desc") return -titleCompare;
    if (sortOption === "year_desc") return yearB - yearA || titleCompare;
    if (sortOption === "year_asc") return yearA - yearB || titleCompare;

    render(filtered);
    return titleCompare;
  });

  return sorted;
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

function sortYearsDesc(a, b) {
  return (Number.parseInt(b, 10) || 0) - (Number.parseInt(a, 10) || 0);
}

function localeSort(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
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
