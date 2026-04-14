let allGames = [];

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const consoleFilter = document.getElementById("consoleFilter");

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

  grid.innerHTML = data.map((game) => `
    <div class="card">
      <img
        src="${getCover(game)}"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/300x400?text=No+Cover'"
      />

      <div class="title">${escapeHtml(game.Games || "")}</div>
      <div class="meta">${escapeHtml(game.Console || "")}</div>
      <div class="meta">${escapeHtml(game.Year || "")} • ${escapeHtml(game.Developer || "")}</div>
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
