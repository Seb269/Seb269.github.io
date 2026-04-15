let allGames = [];

const CSV_FILE = "sebs game list.csv";

const grid = document.getElementById("grid");
const resultsMeta = document.getElementById("resultsMeta");
const search = document.getElementById("search");
const toggleFilters = document.getElementById("toggleFilters");
const advancedFilters = document.getElementById("advancedFilters");
const consoleFilter = document.getElementById("consoleFilter");
const yearFilter = document.getElementById("yearFilter");
const regionFilter = document.getElementById("regionFilter");
const companyFilter = document.getElementById("companyFilter");
const sortFilter = document.getElementById("sortFilter");

grid.innerHTML = "<p class='empty'>Loading games...</p>";
initialize();

function initialize() {
  Papa.parse(CSV_FILE, {
    download: true,
    header: true,
    skipEmptyLines: true,
    delimitersToGuess: [",", ";", "\t", "|"],
    transformHeader: sanitizeHeader,
    complete: (result) => {
      allGames = normalizeRows(result.data || []);

      if (allGames.length === 0) {
        grid.innerHTML = "<p class='empty'>No games found in CSV. If your file is .xlsx, export it as .csv first.</p>";
        resultsMeta.textContent = "0 games shown";
        return;
      }

      setupCategoryFilters();
      setupFilterEvents();
      applyFilters();
    },
    error: () => {
      grid.innerHTML = `<p class='empty'>Could not load <strong>${escapeHtml(CSV_FILE)}</strong>. Check filename/path and use .csv (not .xlsx).</p>`;
      resultsMeta.textContent = "0 games shown";
    }
  });
}

function normalizeRows(rows) {
  return rows
    .map((rawRow) => {
      const row = normalizeKeys(rawRow);

      const game = {
        Games: pick(row, ["games", "game", "title", "name", "spel"]),
        Console: pick(row, ["console", "platform", "system", "konsol"]),
        Edition: pick(row, ["edition", "region", "version"]),
        Developer: pick(row, ["developer", "company", "studio", "utvecklare"]),
        Publisher: pick(row, ["publisher", "utgivare"]),
        Year: pick(row, ["year", "releaseyear", "release", "ar", "år"]),
        New: pick(row, ["new", "condition", "ny"]),
        Box: pick(row, ["box", "fodral"]),
        Manual: pick(row, ["manual", "instruktion"])
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
    if (value) {
      return value;
    }
  }

  return "";
}

function setupCategoryFilters() {
  populateSelect(consoleFilter, allGames.map((game) => game.Console), "All Consoles");
  populateSelect(yearFilter, allGames.map((game) => game.Year), "All Years", sortYearsDesc);
  populateSelect(regionFilter, allGames.map((game) => game.Edition), "All Regions");
  populateSelect(companyFilter, allGames.map((game) => game.Developer), "All Companies");
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
  sortFilter.addEventListener("change", applyFilters);

  toggleFilters.addEventListener("click", () => {
    const opening = advancedFilters.hidden;
    advancedFilters.hidden = !opening;
    toggleFilters.textContent = opening ? "Categories ▴" : "Categories ▾";
  });
}

function applyFilters() {
  const query = search.value.toLowerCase();

  const filteredGames = allGames.filter((game) => {
    const title = normalize(game.Games).toLowerCase();
    const consoleName = normalize(game.Console).toLowerCase();
    const developer = normalize(game.Developer).toLowerCase();
    const publisher = normalize(game.Publisher).toLowerCase();
    const region = normalize(game.Edition).toLowerCase();

    const matchesSearch =
      title.includes(query) ||
      consoleName.includes(query) ||
      developer.includes(query) ||
      publisher.includes(query) ||
      region.includes(query);

    const matchesConsole = consoleFilter.value === "all" || normalize(game.Console) === consoleFilter.value;
    const matchesYear = yearFilter.value === "all" || normalize(game.Year) === yearFilter.value;
    const matchesRegion = regionFilter.value === "all" || normalize(game.Edition) === regionFilter.value;
    const matchesCompany = companyFilter.value === "all" || normalize(game.Developer) === companyFilter.value;

    return matchesSearch && matchesConsole && matchesYear && matchesRegion && matchesCompany;
  });

  render(sortGames(filteredGames, sortFilter.value), filteredGames.length);
}

function sortGames(games, sortOption) {
  const sorted = [...games];

  sorted.sort((a, b) => {
    const titleCompare = localeSort(normalize(a.Games), normalize(b.Games));
    const yearA = Number.parseInt(a.Year, 10) || 0;
    const yearB = Number.parseInt(b.Year, 10) || 0;

    if (sortOption === "title_desc") return -titleCompare;
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

  grid.innerHTML = `
    <div class="list-header game-row">
      <div>Title</div><div>Console</div><div>Region</div><div>Developer</div><div>Publisher</div><div>Year</div><div>New</div><div>Box</div><div>Manual</div>
    </div>
    ${data.map((game) => `
      <article class="game-row">
        <div class="title-cell" title="${escapeHtml(game.Games)}">${escapeHtml(game.Games)}</div>
        <div>${escapeHtml(game.Console)}</div>
        <div>${escapeHtml(game.Edition)}</div>
        <div>${escapeHtml(game.Developer)}</div>
        <div>${escapeHtml(game.Publisher)}</div>
        <div>${escapeHtml(game.Year)}</div>
        <div>${escapeHtml(game.New)}</div>
        <div>${escapeHtml(game.Box)}</div>
        <div>${escapeHtml(game.Manual)}</div>
      </article>
    `).join("")}
  `;
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
