const games = [
  {
    title: "Elden Ring",
    console: "PS5",
    year: 2022
  },
  {
    title: "God of War",
    console: "PS4",
    year: 2018
  }
];

const grid = document.getElementById("grid");

games.forEach(game => {
  const card = document.createElement("div");
  card.classList.add("card");

  card.innerHTML = `
    <h3>${game.title}</h3>
    <p>${game.console}</p>
    <p>${game.year}</p>
  `;

  grid.appendChild(card);
});


fetch("games.csv")
  .then(response => response.text())
  .then(data => {
    const rows = data.split("\n");

    const games = rows.slice(1).map(row => {
      const cols = row.split(",");

      return {
        title: cols[0],
        console: cols[1],
        edition: cols[2],
        developer: cols[3],
        publisher: cols[4],
        year: cols[5],
        new: cols[6],
        box: cols[7],
        manual: cols[8]
      };
    });

    renderGames(games);
  });

function renderGames(games) {
  const grid = document.getElementById("grid");

  games.forEach(game => {
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
      <h3>${game.title}</h3>
      <p>${game.console}</p>
      <p>${game.year}</p>
    `;

    grid.appendChild(card);
  });
}


// games.js
// FULL CSV DATA (Part 1 of 4 - PS1 section)

const csvData = `Games;Console;Edition;Developer;Publisher;Year;New;Box;Manual

???;Playstation ;Japanese;Tamsoft;Takara;1995;No;Yes;Yes
???;Playstation ;Japanese;CAPCOM ;CAPCOM;1997;No;Yes;No
Konami Computer Entertainment Shinjuku;Playstation ;Japanese;Konami Computer Entertainment Shinjuku;Konami;1998;No;Yes;Yes
??;Playstation ;Japanese;Aques;Aques;1997;No;Yes;Yes
??????????;Playstation ;Japanese;Konami;Konami;1999;No;Yes;Yes
?????????;Playstation ;Japanese;Koei;Koei;1994;No;Yes;Yes
??????????;Playstation ;Japanese;CAPCOM ;CAPCOM;1998;No;Yes;Yes
Konami Special 1998;Playstation ;Japanese;Konami;Konami;1998;No;Yes;Yes
???????;Playstation ;Japanese;Sugar & Rockets;Sony Interactive Entertainment;1999;No;Yes;No
Final Fantasy VII;Playstation ;Japanese;Square;Square;1997;No;Yes;No
Final Fantasy VIII;Playstation ;Japanese;Square Enix;Square Enix ;1999;No;Yes;Yes
Final Fantasy IX;Playstation ;Japanese;Square;Square;1997;No;Yes;No
??????;Playstation ;Japanese;Universal Entertainment;Universal Entertainment;1999;No;Yes;No
Dragon Quest VII;Playstation ;Japanese;Enix;Enix ;2001;No;Yes;Yes
??????;Playstation ;Japanese;Artdink;Artdink;1998;No;Yes;No
Crash Bandicoot;Playstation ;European;Naughty Dog;Vivendi Games;1996;No;Yes;No
Crash Bandicoot 2 Cortex Strikes Back;Playstation ;European;Naughty Dog;Sony Interactive Entertainment;1997;No;Yes;No
Crash Bandicoot 3 Warped;Playstation ;European;Naughty Dog;Vivendi Games;1998;No;Yes;Yes
Gran Turismo;Playstation ;European;Polyphony Digital;Sony Computer Entertainment;1997;No;Yes;Yes
Tekken 3;Playstation ;European;Namco;Namco;1997;No;Yes;Yes
Tekken Tag Tournament;Playstation ;European;Namco;Sony Computer Entertainment;1999;No;Yes;No
R4 Ridge Racer Type 4;Playstation ;Japanese;Namco;Namco;1998;No;Yes;Yes
I.Q. Intelligent Qube;Playstation ;Japanese;G-Artists;Sony Interactive Entertainment;1997;No;Yes;Yes
Dino Crisis;Playstation ;Japanese;CAPCOM;CAPCOM;1999;No;Yes;Yes
Duke Nukem Time to Kill;Playstation ;European;n-Space;GT Interactive;1998;No;Yes;Yes
Tony Hawk Pro Skater;Playstation ;European;Neversoft;Activision;1999;No;Yes;No
Tony Hawk Pro Skater 2;Playstation ;European;Neversoft;Activision;2000;No;Yes;No
Tony Hawk Pro Skater 3;Playstation ;European;Neversoft;Activision;2001;No;Yes;No

`;

function parseCSV(data) {
    return data.trim().split("\n").map(row => row.split(";"));
}

const games = parseCSV(csvData);

console.log("Part 1 loaded (PS1 section)");
console.log(games.length);
