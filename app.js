let allGames = [];

const FILE_CANDIDATES = [
  "Sebs Game List(All game 全部ゲーム).csv",
  "sebs game list.csv",
  "Sebs Game List(All game 全部ゲーム).xlsx",
  "Sebs Game List.xlsx",
  "sebs game list.xlsx",
  "games_clean.csv",
  "games.csv"
];

const METACRITIC_PROXY_API = window.location.hostname === "localhost"
  ? "http://localhost:8787/api/metacritic"
  : "/api/metacritic";
const METACRITIC_SEARCH_API = "https://www.cheapshark.com/api/1.0/games";
const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";
const WIKIDATA_API = "https://www.wikidata.org/w/api.php";

const scoreCache = new Map();
const pendingScoreLoads = new Map();
const genreCache = new Map();
const pendingGenreLoads = new Map();

const grid = document.getElementById("grid");
const resultsMeta = document.getElementById("resultsMeta");
const search = document.getElementById("search");
const consoleFilter = document.getElementById("consoleFilter");
const yearFilter = document.getElementById("yearFilter");
const regionFilter = document.getElementById("regionFilter");
const companyFilter = document.getElementById("companyFilter");
const genreFilter = document.getElementById("genreFilter");
const sortFilter = document.getElementById("sortFilter");

grid.innerHTML = "<p class='empty'>Loading games...</p>";
initialize();

async function initialize() {
  const loaded = await loadGameData();

  if (!loaded) {
    grid.innerHTML = `<p class='empty'>No game rows found. Check your file name and first worksheet.</p>`;
    resultsMeta.textContent = "0 games shown";
    return;
  }

  setupCategoryFilters();
  setupFilterEvents();
  applyFilters();
}

async function loadGameData() {
  for (const fileName of FILE_CANDIDATES) {
    try {
      const response = await fetch(fileName);
      if (!response.ok) continue;

      let rawRows = [];

      if (fileName.toLowerCase().endsWith(".xlsx")) {
        const buffer = await response.arrayBuffer();
        rawRows = parseXlsxBuffer(buffer);
      } else {
        const text = await response.text();
        rawRows = parseCsvText(text);
      }

      allGames = normalizeRows(rawRows);
      if (allGames.length > 0) return true;
    } catch {
      // try next file
    }
  }

  return false;
}

function parseCsvText(text) {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    delimitersToGuess: [",", ";", "\t", "|"],
    transformHeader: sanitizeHeader
  });

  return parsed.data || [];
}

function parseXlsxBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (rows.length < 2) return [];

  const headerRowIndex = findHeaderRowIndex(rows);
  const headers = (rows[headerRowIndex] || []).map((header) => sanitizeHeader(header));

  return rows.slice(headerRowIndex + 1).map((row) => {
    const record = {};

    headers.forEach((header, idx) => {
      if (!header) return;
      record[header] = normalize(row[idx]);
    });

    return record;
  });
}

function findHeaderRowIndex(rows) {
  const sample = rows.slice(0, 10);
  let bestIdx = 0;
  let bestScore = -1;

  sample.forEach((row, idx) => {
    const score = row.reduce((acc, cell) => acc + (normalize(cell) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = idx;
    }
  });

  return bestIdx;
}

function normalizeRows(rows) {
  return rows
    .map((rawRow) => {
      const row = normalizeKeys(rawRow);

      const game = {
        Games: pick(row, ["games", "game", "title", "name", "spel"]),
        Console: pick(row, ["console", "consoles", "platform", "consoleplatform", "system", "konsol", "plattform"]),
        Edition: pick(row, ["edition", "region", "version"]),
        Developer: pick(row, ["developer", "company", "studio", "utvecklare"]),
        Publisher: pick(row, ["publisher", "utgivare"]),
        Year: pick(row, ["year", "releaseyear", "release", "ar", "år"]),
        Genre: pick(row, ["genre", "genres", "typ", "kategori"]),
        Metacritic: pick(row, ["metacritic", "metacriticscore", "metascore", "review", "score"])
      };

      if (!game.Games) {
        game.Games = findFirstValue(row);
      }

      return game;
    })
    .filter((game) => normalize(game.Games));
}

function normalizeKeys(row) {
  const normalized = {};
  for (const [key, value] of Object.entries(row || {})) {
    normalized[sanitizeHeader(key)] = normalize(value);
  }
  return normalized;
}

function sanitizeHeader(header) {
  return String(header || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9åäö]/g, "");
}

function findFirstValue(row) {
  const values = Object.values(row || {}).map(normalize).filter(Boolean);
  return values[0] || "";
}

function pick(row, keys) {
  for (const key of keys) {
    const value = normalize(row[key]);
    if (value) return value;
  }
  return "";
}

function setupCategoryFilters() {
  populateSelect(consoleFilter, allGames.map((game) => game.Console), "All Consoles");
  populateSelect(yearFilter, allGames.map((game) => game.Year), "All Years", sortYearsDesc);
  populateSelect(regionFilter, allGames.map((game) => game.Edition), "All Regions");
  populateSelect(companyFilter, allGames.map((game) => game.Developer), "All Companies");
  updateGenreFilterOptions();
}

function updateGenreFilterOptions() {
  genreFilter.innerHTML = "<option value=\"all\">All Genres</option>";
  populateSelect(genreFilter, getAllGenreValues(), "All Genres");
}

function getAllGenreValues() {
  return allGames.flatMap((game) => splitGenres(game.Genre));
}

function splitGenres(value) {
  return normalize(value)
    .split(/,|\//)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function populateSelect(selectElement, values, defaultLabel, sortFn = localeSort) {
  const uniqueValues = Array.from(new Set(values.map(normalize).filter(Boolean))).sort(sortFn);

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
  companyFilter.addEventListener("change", applyFilters);
  genreFilter.addEventListener("change", applyFilters);
  sortFilter.addEventListener("change", applyFilters);
}

function applyFilters() {
  const query = search.value.toLowerCase();
  const selectedGenre = genreFilter.value;

  const filteredGames = allGames.filter((game) => {
    const title = normalize(game.Games).toLowerCase();
    const consoleName = normalize(game.Console).toLowerCase();
    const developer = normalize(game.Developer).toLowerCase();
    const publisher = normalize(game.Publisher).toLowerCase();
    const region = normalize(game.Edition).toLowerCase();
    const genre = normalize(game.Genre).toLowerCase();

    const matchesSearch =
      title.includes(query) ||
      consoleName.includes(query) ||
      developer.includes(query) ||
      publisher.includes(query) ||
      region.includes(query) ||
      genre.includes(query);

    const matchesConsole = consoleFilter.value === "all" || normalize(game.Console) === consoleFilter.value;
    const matchesYear = yearFilter.value === "all" || normalize(game.Year) === yearFilter.value;
    const matchesRegion = regionFilter.value === "all" || normalize(game.Edition) === regionFilter.value;
    const matchesCompany = companyFilter.value === "all" || normalize(game.Developer) === companyFilter.value;
    const matchesGenre = selectedGenre === "all" || splitGenres(game.Genre).includes(selectedGenre);

    return matchesSearch && matchesConsole && matchesYear && matchesRegion && matchesCompany && matchesGenre;
  });

  render(sortGames(filteredGames, sortFilter.value), filteredGames.length);
}

function sortGames(games, sortOption) {
  const sorted = [...games];

  sorted.sort((a, b) => {
    const titleCompare = localeSort(normalize(a.Games), normalize(b.Games));
    const consoleCompare = localeSort(normalize(a.Console), normalize(b.Console));
    const yearA = Number.parseInt(a.Year, 10) || 0;
    const yearB = Number.parseInt(b.Year, 10) || 0;

    if (sortOption === "title_desc") return -titleCompare;
    if (sortOption === "console_asc") return consoleCompare || titleCompare;
    if (sortOption === "console_desc") return -consoleCompare || titleCompare;
    if (sortOption === "year_desc") return yearB - yearA || titleCompare;
    if (sortOption === "year_asc") return yearA - yearB || titleCompare;

    return titleCompare;
  });

  return sorted;
}

function render(data, count) {
  resultsMeta.textContent = `${count} game${count === 1 ? "" : "s"} shown`;

  if (data.length === 0) {
    grid.innerHTML = "<p class='empty'>No games found with this filter.</p>";
    return;
  }

  grid.innerHTML = data.map((game) => {
    const gameKey = getGameKey(game);
    const score = getCurrentScore(game);

    return `
      <article class="game-card">
        <div class="cover-placeholder" aria-hidden="true"></div>

        <div class="info-bar">
          <div class="game-title">${escapeHtml(game.Games)}</div>
          <div class="game-meta">${escapeHtml(game.Console || "Unknown Console")} • ${escapeHtml(game.Year || "?")}</div>
          <div class="game-meta genre-value" data-game-key="${escapeHtml(gameKey)}">Genre: ${renderGenreBadges(game)}</div>
          <div class="game-meta">${escapeHtml(game.Developer || game.Publisher || "Unknown Company")}</div>
          <div class="game-meta">Rating: <strong class="meta-score" data-game-key="${escapeHtml(gameKey)}">${escapeHtml(score.score)}</strong> <span class="score-source">(${escapeHtml(score.source || "Unknown")})</span> <a href="${escapeHtml(score.link)}" target="_blank" rel="noopener noreferrer">reviews</a></div>
        </div>
      </article>
    `;
  }).join("");

  loadMetacriticScores(data);
  loadGenresFromWikipedia(data);
}

function getGameKey(game) {
  return `${normalize(game.Games)}|${normalize(game.Console)}`;
}

function getCurrentScore(game) {
  const key = getGameKey(game);
  const cached = scoreCache.get(key);

  if (cached) return cached;

  const existing = normalize(game.Metacritic);
  if (existing) {
    const value = {
      score: existing,
      link: buildMetacriticSearchLink(game.Games),
      source: "CSV/XLSX"
    };

    scoreCache.set(key, value);
    return value;
  }

  const fallback = {
    score: "N/A",
    link: buildMetacriticSearchLink(game.Games),
    source: "No source"
  };

  scoreCache.set(key, fallback);
  return fallback;
}

async function loadMetacriticScores(games) {
  for (const game of games) {
    const key = getGameKey(game);
    const current = scoreCache.get(key);

    if ((current && current.score !== "N/A") || pendingScoreLoads.has(key)) continue;

    const promise = fetchMetacriticScore(game)
      .then((value) => {
        if (!value) return;

        scoreCache.set(key, value);
        updateScoreElements(key, value);
      })
      .finally(() => {
        pendingScoreLoads.delete(key);
      });

    pendingScoreLoads.set(key, promise);
  }
}

async function fetchMetacriticScore(game) {
  const title = normalize(game.Games);
  if (!title) return null;

  const proxyData = await fetchScoreFromProxy(title);
  if (proxyData) return proxyData;

  const cheapSharkData = await fetchScoreFromCheapShark(title);
  if (cheapSharkData) return cheapSharkData;

  return fetchScoreFromWikidata(title);
}

async function fetchScoreFromProxy(title) {
  try {
    const response = await fetch(`${METACRITIC_PROXY_API}?title=${encodeURIComponent(title)}`);
    if (!response.ok) return null;

    const data = await response.json();
    const score = normalize(data?.score);

    if (!score || score === "0") return null;

    return {
      score,
      link: buildMetacriticSearchLink(title),
      source: "Metacritic API Proxy"
    };
  } catch {
    return null;
  }
}

async function fetchScoreFromCheapShark(title) {
  const url = `${METACRITIC_SEARCH_API}?title=${encodeURIComponent(title)}&limit=1`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const best = data[0];
  const rawScore = normalize(best.metacriticScore);

  if (!rawScore || rawScore === "0") return null;

  return {
    score: rawScore,
    link: best.metacriticLink ? `https://www.metacritic.com${best.metacriticLink}` : buildMetacriticSearchLink(title),
    source: "CheapShark/Metacritic"
  };
}

async function fetchScoreFromWikidata(title) {
  try {
    const searchUrl = new URL(WIKIDATA_API);
    searchUrl.searchParams.set("action", "wbsearchentities");
    searchUrl.searchParams.set("search", `${title} video game`);
    searchUrl.searchParams.set("language", "en");
    searchUrl.searchParams.set("type", "item");
    searchUrl.searchParams.set("limit", "1");
    searchUrl.searchParams.set("format", "json");
    searchUrl.searchParams.set("origin", "*");

    const searchResponse = await fetch(searchUrl.toString());
    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();
    const entityId = searchData?.search?.[0]?.id;
    if (!entityId) return null;

    const entityUrl = new URL(WIKIDATA_API);
    entityUrl.searchParams.set("action", "wbgetentities");
    entityUrl.searchParams.set("ids", entityId);
    entityUrl.searchParams.set("props", "claims");
    entityUrl.searchParams.set("format", "json");
    entityUrl.searchParams.set("origin", "*");

    const entityResponse = await fetch(entityUrl.toString());
    if (!entityResponse.ok) return null;

    const entityData = await entityResponse.json();
    const claims = entityData?.entities?.[entityId]?.claims?.P444 || [];
    if (claims.length === 0) return null;

    const scored = claims
      .map((claim) => {
        const value = claim?.mainsnak?.datavalue?.value;
        const raw = typeof value === "object" ? value.amount : value;
        const score = normalize(raw).replace(/^\+/, "");
        const sourceId = claim?.qualifiers?.P447?.[0]?.datavalue?.value?.id || "";
        return { score, sourceId };
      })
      .filter((item) => item.score);

    if (scored.length === 0) return null;

    const sourceIds = Array.from(new Set(scored.map((item) => item.sourceId).filter(Boolean)));
    const sourceLabels = await fetchWikidataLabels(sourceIds);

    const preferred = pickPreferredWikidataScore(scored, sourceLabels, title);
    if (!preferred) return null;

    const sourceLabel = sourceLabels.get(preferred.sourceId) || "Wikidata";

    return {
      score: preferred.score,
      link: sourceLabel.toLowerCase().includes("famitsu")
        ? `https://www.famitsu.com/search/?q=${encodeURIComponent(title)}`
        : buildMetacriticSearchLink(title),
      source: sourceLabel
    };
  } catch {
    return null;
  }
}

async function fetchWikidataLabels(ids) {
  const labelMap = new Map();
  if (ids.length === 0) return labelMap;

  const labelsUrl = new URL(WIKIDATA_API);
  labelsUrl.searchParams.set("action", "wbgetentities");
  labelsUrl.searchParams.set("ids", ids.join("|"));
  labelsUrl.searchParams.set("props", "labels");
  labelsUrl.searchParams.set("languages", "en");
  labelsUrl.searchParams.set("format", "json");
  labelsUrl.searchParams.set("origin", "*");

  const response = await fetch(labelsUrl.toString());
  if (!response.ok) return labelMap;

  const data = await response.json();
  Object.entries(data?.entities || {}).forEach(([id, entity]) => {
    const label = entity?.labels?.en?.value;
    if (label) {
      labelMap.set(id, label);
    }
  });

  return labelMap;
}

function pickPreferredWikidataScore(scores, sourceLabels, title) {
  const japanese = /[぀-ヿ㐀-鿿]/.test(title);

  if (japanese) {
    const famitsu = scores.find((item) => (sourceLabels.get(item.sourceId) || "").toLowerCase().includes("famitsu"));
    if (famitsu) return famitsu;
  }

  const metacritic = scores.find((item) => (sourceLabels.get(item.sourceId) || "").toLowerCase().includes("metacritic"));
  if (metacritic) return metacritic;

  return scores[0] || null;
}

async function loadGenresFromWikipedia(games) {
  for (const game of games) {
    if (normalize(game.Genre)) continue;

    const key = normalize(game.Games);
    if (!key || pendingGenreLoads.has(key) || genreCache.has(key)) continue;

    const promise = fetchGenreFromWikipedia(game.Games)
      .then(async (genre) => {
        let resolvedGenre = genre;
        if (!resolvedGenre) {
          resolvedGenre = await fetchGenreFromWikidata(game.Games);
        }
        if (!resolvedGenre) return;

        genreCache.set(key, resolvedGenre);
        allGames.forEach((entry) => {
          if (normalize(entry.Games) === key && !normalize(entry.Genre)) {
            entry.Genre = resolvedGenre;
          }
        });

        updateGenreElements(key, resolvedGenre);
        updateGenreFilterOptions();
      })
      .finally(() => {
        pendingGenreLoads.delete(key);
      });

    pendingGenreLoads.set(key, promise);
  }
}

async function fetchGenreFromWikipedia(title) {
  const searchUrl = new URL(WIKIPEDIA_API);
  searchUrl.searchParams.set("action", "query");
  searchUrl.searchParams.set("list", "search");
  searchUrl.searchParams.set("srsearch", `${title} video game`);
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("origin", "*");

  const searchResponse = await fetch(searchUrl.toString());
  if (!searchResponse.ok) return null;

  const searchData = await searchResponse.json();
  const pageTitle = searchData?.query?.search?.[0]?.title;
  if (!pageTitle) return null;

  const categoriesUrl = new URL(WIKIPEDIA_API);
  categoriesUrl.searchParams.set("action", "query");
  categoriesUrl.searchParams.set("prop", "categories");
  categoriesUrl.searchParams.set("titles", pageTitle);
  categoriesUrl.searchParams.set("cllimit", "max");
  categoriesUrl.searchParams.set("format", "json");
  categoriesUrl.searchParams.set("origin", "*");

  const categoriesResponse = await fetch(categoriesUrl.toString());
  if (!categoriesResponse.ok) return null;

  const categoriesData = await categoriesResponse.json();
  const page = Object.values(categoriesData?.query?.pages || {})[0];
  const categories = (page?.categories || []).map((item) => String(item.title || "").toLowerCase());

  return findGenreFromCategories(categories);
}

async function fetchGenreFromWikidata(title) {
  try {
    const searchUrl = new URL(WIKIDATA_API);
    searchUrl.searchParams.set("action", "wbsearchentities");
    searchUrl.searchParams.set("search", `${title} video game`);
    searchUrl.searchParams.set("language", "en");
    searchUrl.searchParams.set("type", "item");
    searchUrl.searchParams.set("limit", "1");
    searchUrl.searchParams.set("format", "json");
    searchUrl.searchParams.set("origin", "*");

    const searchResponse = await fetch(searchUrl.toString());
    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();
    const entityId = searchData?.search?.[0]?.id;
    if (!entityId) return null;

    const entityUrl = new URL(WIKIDATA_API);
    entityUrl.searchParams.set("action", "wbgetentities");
    entityUrl.searchParams.set("ids", entityId);
    entityUrl.searchParams.set("props", "claims");
    entityUrl.searchParams.set("format", "json");
    entityUrl.searchParams.set("origin", "*");

    const entityResponse = await fetch(entityUrl.toString());
    if (!entityResponse.ok) return null;

    const entityData = await entityResponse.json();
    const claims = entityData?.entities?.[entityId]?.claims?.P136 || [];
    const genreIds = claims
      .map((claim) => claim?.mainsnak?.datavalue?.value?.id)
      .filter(Boolean);

    const labels = await fetchWikidataLabels(genreIds);
    const values = genreIds.map((id) => labels.get(id)).filter(Boolean);

    return values.join(", ") || null;
  } catch {
    return null;
  }
}

function findGenreFromCategories(categories) {
  const genreMap = [
    ["role-playing", "RPG"],
    ["action-adventure", "Action-Adventure"],
    ["action", "Action"],
    ["platform", "Platformer"],
    ["first-person shooter", "Shooter"],
    ["shooter", "Shooter"],
    ["fighting", "Fighting"],
    ["racing", "Racing"],
    ["sports", "Sports"],
    ["simulation", "Simulation"],
    ["strategy", "Strategy"],
    ["puzzle", "Puzzle"],
    ["survival horror", "Survival Horror"],
    ["horror", "Horror"],
    ["visual novel", "Visual Novel"],
    ["rhythm", "Rhythm"],
    ["party", "Party"],
    ["adventure", "Adventure"],
    ["stealth", "Stealth"],
    ["metroidvania", "Metroidvania"],
    ["roguelike", "Roguelike"]
  ];

  const found = [];

  genreMap.forEach(([keyword, label]) => {
    if (categories.some((cat) => cat.includes(keyword)) && !found.includes(label)) {
      found.push(label);
    }
  });

  return found.join(", ") || null;
}


function renderGenreBadges(game) {
  const genres = splitGenres(game.Genre);

  if (genres.length === 0) {
    return "<span class=\"genre-tag genre-pending\">Finding genre...</span>";
  }

  return genres
    .map((genre) => `<span class=\"genre-tag ${genreClassName(genre)}\">${escapeHtml(genre)}</span>`)
    .join(" ");
}

function genreClassName(genre) {
  return `genre-${normalize(genre).toLowerCase().replaceAll(" ", "-").replaceAll("/", "-")}`;
}

function updateGenreElements(titleKey, genre) {
  allGames.forEach((game) => {
    if (normalize(game.Games) === titleKey) {
      const gameKey = getGameKey(game);
      const nodes = document.querySelectorAll(`.genre-value[data-game-key="${cssEscape(gameKey)}"]`);
      nodes.forEach((node) => {
        node.innerHTML = `Genre: ${renderGenreBadges({ Genre: genre })}`;
      });
    }
  });
}

function updateScoreElements(gameKey, value) {
  const nodes = document.querySelectorAll(`.meta-score[data-game-key="${cssEscape(gameKey)}"]`);

  nodes.forEach((node) => {
    node.textContent = value.score;
    const link = node.parentElement.querySelector("a");
    if (link && value.link) {
      link.href = value.link;
    }
  });
}

function buildMetacriticSearchLink(title) {
  return `https://www.metacritic.com/search/${encodeURIComponent(normalize(title))}/`;
}

function cssEscape(value) {
  if (window.CSS && typeof window.CSS.escape === "function") {
    return window.CSS.escape(value);
  }

  return String(value).replace(/"/g, "\\\"");
}

function normalize(value) {
  return String(value || "").trim();
}

function sortYearsDesc(a, b) {
  return (Number.parseInt(b, 10) || 0) - (Number.parseInt(a, 10) || 0);
}

function localeSort(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
