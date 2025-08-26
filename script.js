const sheets = {
  batters: "https://docs.google.com/spreadsheets/d/1KIW6RJT7knTMGgCEkSeeGr5v5-uB3864Oqzqd7ATu5Y/gviz/tq?tqx=out:csv&sheet=Batters",
  pitchers: "https://docs.google.com/spreadsheets/d/1KIW6RJT7knTMGgCEkSeeGr5v5-uB3864Oqzqd7ATu5Y/gviz/tq?tqx=out:csv&sheet=Pitchers"
};

let dataCache = { batters: [], pitchers: [] };

// CSV 파싱
function parseCSV(text) {
  return text.trim().split("\n").map(row => row.split(","));
}

// 데이터 불러오기
async function loadSheet(type) {
  const res = await fetch(sheets[type]);
  const text = await res.text();
  const rows = parseCSV(text);
  dataCache[type] = rows;
  renderTable(type);
}

// 테이블 출력
function renderTable(type) {
  const container = document.getElementById(type);
  const rows = dataCache[type];
  if (!rows.length) return;

  let html = "<table><thead><tr>";
  rows[0].forEach((col, i) => {
    html += `<th onclick="sortTable('${type}', ${i})">${col}</th>`;
  });
  html += "</tr></thead><tbody>";
  rows.slice(1).forEach(row => {
    html += "<tr>" + row.map(col => `<td>${col}</td>`).join("") + "</tr>";
  });
  html += "</tbody></table>";
  container.innerHTML = html;
}

// 정렬
function sortTable(type, colIndex) {
  let rows = dataCache[type];
  const header = rows[0];
  let body = rows.slice(1);

  const isNumber = body.every(r => !isNaN(parseFloat(r[colIndex])));
  const asc = !(dataCache[`${type}_asc`] === colIndex);
  dataCache[`${type}_asc`] = asc ? colIndex : null;

  body.sort((a, b) => {
    let x = a[colIndex], y = b[colIndex];
    if (isNumber) { x = parseFloat(x)||0; y = parseFloat(y)||0; }
    return asc ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
  });

  dataCache[type] = [header, ...body];
  renderTable(type);
}

// 검색
function searchPlayer() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  ["batters","pitchers"].forEach(type=>{
    const container = document.getElementById(type);
    const rows = dataCache[type];
    if (!rows.length) return;

    let filtered = [rows[0], ...rows.slice(1).filter(r => r.some(c => c.toLowerCase().includes(query)))];
    let html = "<table><thead><tr>";
    filtered[0].forEach((col,i)=> html += `<th onclick="sortTable('${type}', ${i})">${col}</th>`);
    html += "</tr></thead><tbody>";
    filtered.slice(1).forEach(row=>{
      html += "<tr>" + row.map(c=>`<td>${c}</td>`).join("") + "</tr>";
    });
    html += "</tbody></table>";
    container.innerHTML = html;
  });
}

// 탭 전환
function showTab(tab) {
  document.querySelectorAll(".tab-content").forEach(div => div.style.display = "none");
  document.getElementById(tab).style.display = "block";
}

// 초기 실행
loadSheet("batters");
loadSheet("pitchers");
