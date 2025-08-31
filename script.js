document.addEventListener("DOMContentLoaded", () => {
  const SHEET_ID = "1KIW6RJT7knTMGgCEkSeeGr5v5-uB3864Oqzqd7ATu5Y";
  const URL_BATTERS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Batters`;
  const URL_PITCHERS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Pitchers`;

  const searchInput = document.getElementById("searchInput");
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  let battersData = { cols: [], rows: [] };
  let pitchersData = { cols: [], rows: [] };

  async function loadSheet(url) {
    const res = await fetch(url);
    const text = await res.text();
    const json = JSON.parse(text.substr(47).slice(0, -2));
    return {
      cols: json.table.cols.map(c => c.label),
      rows: json.table.rows.map(r => r.c.map(c => (c ? c.v : "")))
    };
  }

  function renderTable(prefix, data, filter = "") {
    const head = document.getElementById(prefix + "Head");
    const body = document.getElementById(prefix + "Body");
    head.innerHTML = `<tr>${data.cols.map(h => `<th>${h}</th>`).join("")}</tr>`;
    body.innerHTML = data.rows
      .filter(r => r[0].toString().toLowerCase().includes(filter))
      .map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`)
      .join("");
  }

  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.trim().toLowerCase();
    renderTable("battersTable", battersData, filter);
    renderTable("pitchersTable", pitchersData, filter);
  });

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.getAttribute("data-tab")).classList.add("active");
    });
  });

  (async function init() {
    battersData = await loadSheet(URL_BATTERS);
    pitchersData = await loadSheet(URL_PITCHERS);
    renderTable("battersTable", battersData);
    renderTable("pitchersTable", pitchersData);
  })();
});
