let allGames = [];

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const toggleFilters = document.getElementById("toggleFilters");
const advancedFilters = document.getElementById("advancedFilters");
const consoleFilter = document.getElementById("consoleFilter");
const yearFilter = document.getElementById("yearFilter");
const regionFilter = document.getElementById("regionFilter");
const sortFilter = document.getElementById("sortFilter");

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
      (game.Publisher || "").toLowerCase().includes(searchValue) ||
      (game.Edition || "").toLowerCase().includes(searchValue);

    const filtered = allGames.filter(game =>
      (game.Games || "").toLowerCase().includes(value) ||
      (game.Console || "").toLowerCase().includes(value) ||
      (game.Developer || "").toLowerCase().includes(value)
    );
    const matchesConsole = selectedConsole === "all" || (game.Console || "") === selectedConsole;
    const matchesYear = selectedYear === "all" || (game.Year || "") === selectedYear;
    const matchesRegion = selectedRegion === "all" || (game.Edition || "") === selectedRegion;

    render(filtered);
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

    if (sortOption === "title_desc") return -titleCompare;
    if (sortOption === "year_desc") return yearB - yearA || titleCompare;
    if (sortOption === "year_asc") return yearA - yearB || titleCompare;

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
    grid.innerHTML = "<p class='empty'>No games found</p>";
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
  grid.innerHTML = `
    <div class="list-header game-row">
      <div>Title</div>
      <div>Console</div>
      <div>Region</div>
      <div>Developer</div>
      <div>Publisher</div>
      <div>Year</div>
      <div>New</div>
      <div>Box</div>
      <div>Manual</div>
    </div>
  `).join("");
    ${data.map((game) => `
      <article class="game-row">
        <div class="title-cell" title="${escapeHtml(game.Games || "")}">${escapeHtml(game.Games || "")}</div>
        <div>${escapeHtml(game.Console || "")}</div>
        <div>${escapeHtml(game.Edition || "")}</div>
        <div>${escapeHtml(game.Developer || "")}</div>
        <div>${escapeHtml(game.Publisher || "")}</div>
        <div>${escapeHtml(game.Year || "")}</div>
        <div>${escapeHtml(game.New || "")}</div>
        <div>${escapeHtml(game.Box || "")}</div>
        <div>${escapeHtml(game.Manual || "")}</div>
      </article>
    `).join("")}
  `;
}

function sortYearsDesc(a, b) {
  return (Number.parseInt(b, 10) || 0) - (Number.parseInt(a, 10) || 0);
}

function localeSort(a, b) {
  return a.localeCompare(b, undefined, { sensitivity: "base", numeric: true });
}

// ------------------------
// IMAGE SYSTEM (KEEP SIMPLE FOR NOW)
// ------------------------
function getCover(game) {
  const name = encodeURIComponent(game.Games || "");
  return `https://via.placeholder.com/300x400?text=${name}`;
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
