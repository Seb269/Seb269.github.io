const csvData = [
  {
    Games: "戦国BASARA クロニクルヒーローズ",
    Console: "Playstation Portable",
    Edition: "Japanese",
    Developer: "CAPCOM",
    Publisher: "CAPCOM",
    Year: 2009,
    New: "No",
    Box: "Yes",
    Manual: "No"
  },
  {
    Games: "VitaminZ Revolution",
    Console: "Playstation Portable",
    Edition: "Japanese",
    Developer: "Hune X",
    Publisher: "D3 Publisher",
    Year: 2010,
    New: "No",
    Box: "Yes",
    Manual: "No"
  },
  {
    Games: "Diabolik Lovers",
    Console: "Playstation Portable",
    Edition: "Japanese",
    Developer: "Rejet",
    Publisher: "Idea Factory",
    Year: 2012,
    New: "No",
    Box: "Yes",
    Manual: "Yes"
  },
  {
    Games: "Amnesia crowd",
    Console: "Playstation Portable",
    Edition: "Japanese",
    Developer: "Desing Factory",
    Publisher: "Idea Factory",
    Year: 2013,
    New: "No",
    Box: "Yes",
    Manual: "No"
  },
  {
    Games: "金色のコルダ",
    Console: "Playstation Portable",
    Edition: "Japanese",
    Developer: "Ruby Party",
    Publisher: "Koei",
    Year: 2009,
    New: "No",
    Box: "Yes",
    Manual: "Yes"
  },
  {
    Games: "遥かなる時空の中で４",
    Console: "Playstation Portable",
    Edition: "Japanese",
    Developer: "Koei",
    Publisher: "Koei",
    Year: 2008,
    New: "No",
    Box: "Yes",
    Manual: "Yes"
  },
  {
    Games: "遙かなる時空の中で3",
    Console: "Playstation Portable",
    Edition: "Japanese",
    Developer: "Koei",
    Publisher: "Koei",
    Year: 2009,
    New: "No",
    Box: "Yes",
    Manual: "Yes"
  },
  {
    Games: "薄桜鬼",
    Console: "Playstation Portable",
    Edition: "Japanese",
    Developer: "Design Factory",
    Publisher: "Idea Factory",
    Year: 2009,
    New: "No",
    Box: "Yes",
    Manual: "Yes"
  },
  {
    Games: "ファンタシースターポータブル",
    Console: "Playstation Portable",
    Edition: "Japanese",
    Developer: "SEGA",
    Publisher: "SEGA",
    Year: 2008,
    New: "Yes",
    Box: "Yes",
    Manual: "Yes"
  },
  {
    Games: "つカレっ☆ 恋愛デビュー宣言",
    Console: "Playstation Portable",
    Edition: "Japanese",
    Developer: "Bridge Co., Ltd",
    Publisher: "Bridge Co., Ltd",
    Year: 2012,
    New: "No",
    Box: "Yes",
    Manual: "Yes"
  }
  // NOTE: dataset truncated due to extreme length.
];

export default csvData;

function parseCSV(data) {
  return data.trim().split("\n").slice(1).map(row => {
    const cols = row.split(";");
    return {
      title: cols[0],
      console: cols[1],
      year: cols[5]
    };
  });
}

function renderGames(games) {
  const grid = document.getElementById("grid");

  games.forEach(game => {
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <h3>${game.title}</h3>
      <p class="console">${game.console}</p>
      <p>${game.year}</p>
    `;

    grid.appendChild(card);
  });
}

const games = parseCSV(csvData);
renderGames(games);



function parseCSV(text) {
  return text
    .trim()
    .split("\n")
    .map(row => row.split(","));
}

Papa.parse("games_clean.csv", {
  download: true,
  header: true,
  complete: (result) => console.log(result.data)
});

