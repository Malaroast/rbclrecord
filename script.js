const SPREADSHEET_ID = "1KIW6RJT7knTMGgCEkSeeGr5v5-uB3864Oqzqd7ATu5Y";
const API_KEY = "YOUR_GOOGLE_API_KEY"; // 👉 본인 Google API Key 입력 필요

const battersRange = "Batters!A:Z";
const pitchersRange = "Pitchers!A:Z";

async function fetchSheet(range) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.values;
}

function renderTable(data, headId, bodyId) {
  const headers = data[0];
  const rows = data.slice(1);

  const thead = document.getElementById(headId);
  const tbody = document.getElementById(bodyId);

  thead.innerHTML = "<tr>" + headers.map(h => `<th onclick="sortTable('${bodyId}', ${headers.indexOf(h)})">${h}</th>`).join("") + "</tr>";

  tbody.innerHTML = rows.map(row =>
    `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`
  ).join("");
}

function showTab(tab) {
  document.getElementById("battersTab").classList.remove("active");
  document.getElementById("pitchersTab").classList.remove("active");
  document.getElementById(tab + "Tab").classList.add("active");
}

function sortTable(tableId, colIndex) {
  const tbody = document.getElementById(tableId);
  const rows = Array.from(tbody.rows);

  const isAsc = tbody.getAttribute("data-sort") !== "asc";
  tbody.setAttribute("data-sort", isAsc ? "asc" : "desc");

  rows.sort((a, b) => {
    let x = a.cells[colIndex].innerText;
    let y = b.cells[colIndex].innerText;

    let numX = parseFloat(x);
    let numY = parseFloat(y);

    if (!isNaN(numX) && !isNaN(numY)) {
      return isAsc ? numX - numY : numY - numX;
    } else {
      return isAsc ? x.localeCompare(y) : y.localeCompare(x);
    }
  });

  tbody.innerHTML = "";
  rows.forEach(r => tbody.appendChild(r));
}

function searchPlayer() {
  const keyword = document.getElementById("searchInput").value.trim();
  if (!keyword) return;

  const allTables = [...document.querySelectorAll("tbody tr")];
  const match = allTables.find(tr => tr.cells[0] && tr.cells[0].innerText.includes(keyword));

  if (match) {
    const playerName = match.cells[0].innerText;
    const stats = Array.from(match.cells).map((c, i) => `${match.parentElement.parentElement.rows[0].cells[i].innerText}: ${c.innerText}`).join("<br>");

    document.getElementById("playerName").innerText = playerName;
    document.getElementById("playerStats").innerHTML = stats;
    document.getElementById("playerModal").style.display = "block";
  } else {
    alert("선수를 찾을 수 없습니다.");
  }
}

function closeModal() {
  document.getElementById("playerModal").style.display = "none";
}

(async function init() {
  const batters = await fetchSheet(battersRange);
  const pitchers = await fetchSheet(pitchersRange);

  renderTable(batters, "battersHead", "battersBody");
  renderTable(pitchers, "pitchersHead", "pitchersBody");
})();
