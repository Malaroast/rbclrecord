const battersCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7qAaMm3tG_1oEuIPbn4pLZiDzzwl6d-Ur-y3_fw9fXIjJN-SYwdap5rbmOk63nDApmzCiqYYa495j/pub?gid=0&single=true&output=csv";
const pitchersCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7qAaMm3tG_1oEuIPbn4pLZiDzzwl6d-Ur-y3_fw9fXIjJN-SYwdap5rbmOk63nDApmzCiqYYa495j/pub?gid=249730824&single=true&output=csv";

// 원하는 칼럼을 A1:T1 헤더에서 골라 쓰도록 구성
const COLUMN_CONFIG = {
  playerName: "Player",
  table: {
    batters: [
      "Player",
      "타석",
      "안타",
      "2루타",
      "3루타",
      "홈런",
      "볼넷",
      "삼진",
      "도루",
      "타점",
      "득점",
      "타율",
      "출루율",
      "장타율",
      "OPS",
      "wRC+",
      "소속 팀",
      "hWAR"
    ],
    pitchers: [
      "Player",
      "출장 수",
      "선발등판 수",
      "이닝",
      "자책점",
      "탈삼진",
      "피안타",
      "피홈런",
      "볼넷",
      "승리",
      "패배",
      "세이브",
      "ERA",
      "WHIP",
      "pWAR",
      "소속 팀"
    ]
  },
  detail: {
    batters: [
      "Player",
      "타석",
      "안타",
      "2루타",
      "3루타",
      "홈런",
      "볼넷",
      "삼진",
      "도루",
      "타점",
      "득점",
      "타율",
      "출루율",
      "장타율",
      "OPS",
      "wOBA",
      "wRC",
      "wRC+",
      "소속 팀",
      "wRAA",
      "hWAR",
      "FA 등급"
    ],
    pitchers: [
      "Player",
      "출장 수",
      "선발등판 수",
      "이닝",
      "자책점",
      "탈삼진",
      "피안타",
      "피홈런",
      "볼넷",
      "승리",
      "패배",
      "세이브",
      "ERA",
      "WHIP",
      "ERA+",
      "pWAR",
      "소속 팀",
      "FIP",
      "FA 등급",
      "RAA"
    ]
  }
};

const dataStore = {
  batters: { header: [], rows: [], map: new Map() },
  pitchers: { header: [], rows: [], map: new Map() }
};

const sortState = {};
const filters = {
  batters: { col: null, min: null, max: null },
  pitchers: { col: null, min: null, max: null }
};

// 기본 split(",") 대신 큰따옴표를 고려한 간단 CSV 파서
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        field += '"'; // 이스케이프된 큰따옴표
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i++; // CRLF 처리
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }

  // 마지막 필드/행 추가
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // trim 및 양끝 큰따옴표 제거
  return rows
    .filter((r) => r.length > 0)
    .map((r) =>
      r.map((cell) =>
        cell
          .replace(/^"(.*)"$/s, "$1")
          .replace(/""/g, '"')
          .trim()
      )
    );
}

function toObjects(raw) {
  if (!raw.length) return { header: [], rows: [] };
  const header = raw[0]; // 전체 헤더 사용 (필요한 것만 COLUMN_CONFIG로 선택)
  const rows = raw
    .slice(1)
    .filter((row) => row.slice(0, 11).some((cell) => (cell || "").trim() !== "")) // A~K가 모두 비면 제외
    .map((row) => {
      const obj = {};
      header.forEach((key, idx) => {
        obj[key] = row[idx] ?? "";
      });
      return obj;
    });
  return { header, rows };
}

function mapByName(rows) {
  const m = new Map();
  rows.forEach((row) => {
    const name = row[COLUMN_CONFIG.playerName];
    if (name) m.set(name, row);
  });
  return m;
}

function zeroRow(columns, name) {
  const obj = {};
  columns.forEach((col) => {
    obj[col] = "";
  });
  if (name) obj[COLUMN_CONFIG.playerName] = name;
  return obj;
}

function pick(row, columns) {
  return columns.map((col) => row?.[col] ?? "");
}

function getActiveTab() {
  return document.querySelector(".tab-content.active")?.id || "batters";
}

function getNumericColumns(tab) {
  const skip = new Set([COLUMN_CONFIG.playerName, "소속 팀", "팀명"]);
  return COLUMN_CONFIG.table[tab].filter((col) => !skip.has(col));
}

function populateFilterOptions(tab) {
  const select = document.getElementById("filterColumn");
  if (!select) return;
  select.innerHTML = "";

  const emptyOpt = document.createElement("option");
  emptyOpt.value = "";
  emptyOpt.textContent = "전체";
  select.appendChild(emptyOpt);

  getNumericColumns(tab).forEach((col) => {
    const opt = document.createElement("option");
    opt.value = col;
    opt.textContent = col;
    select.appendChild(opt);
  });

  const state = filters[tab];
  select.value = state.col || "";
  document.getElementById("filterMin").value = state.min ?? "";
  document.getElementById("filterMax").value = state.max ?? "";
}

function renderTable(category, tableId, columns, rows) {
  const table = document.getElementById(tableId);
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");
  const nameField = COLUMN_CONFIG.playerName;

  thead.innerHTML = "";
  const headerRow = document.createElement("tr");
  columns.forEach((label, i) => {
    const th = document.createElement("th");
    th.textContent = label;
    th.dataset.col = i;
    th.addEventListener("click", () => sortTable(tableId, i));
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  tbody.innerHTML = "";
  if (!rows.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = columns.length;
    td.textContent = "데이터를 불러오지 못했습니다.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    pick(row, columns).forEach((cell, idx) => {
      const td = document.createElement("td");
      if (columns[idx] === nameField) {
        const span = document.createElement("span");
        span.className = "clickable player-link";
        span.dataset.player = cell;
        span.dataset.category = category;
        span.textContent = cell;
        td.appendChild(span);
      } else {
        td.textContent = cell;
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function sortTable(tableId, col) {
  const table = document.getElementById(tableId);
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  const isAsc = sortState[tableId] && sortState[tableId].col === col && sortState[tableId].dir === "asc";
  sortState[tableId] = { col, dir: isAsc ? "desc" : "asc" };

  rows.sort((a, b) => {
    const aText = a.children[col].textContent.replace(/,/g, "");
    const bText = b.children[col].textContent.replace(/,/g, "");
    const aNum = parseFloat(aText);
    const bNum = parseFloat(bText);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return isAsc ? bNum - aNum : aNum - bNum;
    }
    return isAsc ? bText.localeCompare(aText) : aText.localeCompare(bText);
  });

  tbody.innerHTML = "";
  rows.forEach((r) => tbody.appendChild(r));

  table.querySelectorAll("th").forEach((th) => th.classList.remove("sort-asc", "sort-desc"));
  const th = table.querySelector(`th:nth-child(${col + 1})`);
  if (th) th.classList.add(isAsc ? "sort-desc" : "sort-asc");
}

function applyAllFilters() {
  const activeTab = getActiveTab();
  const searchText = document.getElementById("searchInput").value.toLowerCase();
  const filter = filters[activeTab];
  const table = document.querySelector(`#${activeTab} table`);
  const headerCells = Array.from(table.querySelectorAll("th"));
  const colIndex = filter.col ? headerCells.findIndex((th) => th.textContent === filter.col) : -1;

  document.querySelectorAll(`#${activeTab} tbody tr`).forEach((row) => {
    const textMatch = row.textContent.toLowerCase().includes(searchText);
    let numericMatch = true;

    if (filter.col && colIndex >= 0) {
      const raw = row.children[colIndex]?.textContent || "";
      const num = parseFloat(raw.replace(/,/g, ""));
      if (raw.trim() === "" || isNaN(num)) {
        numericMatch = false;
      } else {
        if (filter.min !== null && num < filter.min) numericMatch = false;
        if (filter.max !== null && num > filter.max) numericMatch = false;
      }
    }

    row.style.display = textMatch && numericMatch ? "" : "none";
  });
}

function renderDetail(containerId, columns, row) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "detail-grid";
  columns.forEach((col) => {
    const item = document.createElement("div");
    item.className = "detail-item";
    const label = document.createElement("strong");
    label.textContent = col;
    const value = document.createElement("span");
    value.textContent = row?.[col] ?? "0";
    item.appendChild(label);
    item.appendChild(value);
    grid.appendChild(item);
  });
  container.appendChild(grid);
}

function openModal(playerName) {
  const modal = document.getElementById("playerModal");
  document.getElementById("modalPlayerName").textContent = playerName;

  const batterRow = dataStore.batters.map.get(playerName) || zeroRow(COLUMN_CONFIG.detail.batters, playerName);
  const pitcherRow = dataStore.pitchers.map.get(playerName) || zeroRow(COLUMN_CONFIG.detail.pitchers, playerName);

  renderDetail("detailBatters", COLUMN_CONFIG.detail.batters, batterRow);
  renderDetail("detailPitchers", COLUMN_CONFIG.detail.pitchers, pitcherRow);

  document.querySelectorAll("[data-detail-tab]").forEach((btn) => btn.classList.remove("active"));
  document.querySelectorAll(".detail-content").forEach((c) => c.classList.remove("active"));
  document.querySelector("[data-detail-tab='detailBatters']").classList.add("active");
  document.getElementById("detailBatters").classList.add("active");

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  const modal = document.getElementById("playerModal");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
}

function setupModalEvents() {
  const modal = document.getElementById("playerModal");
  modal.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal__overlay")) closeModal();
  });
  modal.querySelector(".modal__close").addEventListener("click", closeModal);
  document.querySelectorAll("[data-detail-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-detail-tab]").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".detail-content").forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(btn.dataset.detailTab).classList.add("active");
    });
  });
}

function setupTableClick() {
  document.querySelectorAll("table").forEach((table) => {
    table.addEventListener("click", (e) => {
      const target = e.target.closest(".player-link");
      if (!target) return;
      const name = target.dataset.player;
      if (name) openModal(name);
    });
  });
}

document.getElementById("searchInput").addEventListener("input", applyAllFilters);

document.getElementById("applyFilter").addEventListener("click", () => {
  const tab = getActiveTab();
  const col = document.getElementById("filterColumn").value || null;
  const minVal = parseFloat(document.getElementById("filterMin").value);
  const maxVal = parseFloat(document.getElementById("filterMax").value);
  filters[tab] = {
    col,
    min: isNaN(minVal) ? null : minVal,
    max: isNaN(maxVal) ? null : maxVal
  };
  applyAllFilters();
});

document.getElementById("clearFilter").addEventListener("click", () => {
  const tab = getActiveTab();
  filters[tab] = { col: null, min: null, max: null };
  document.getElementById("filterColumn").value = "";
  document.getElementById("filterMin").value = "";
  document.getElementById("filterMax").value = "";
  applyAllFilters();
});

document.querySelectorAll(".tab-btn[data-tab]").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn[data-tab]").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
    populateFilterOptions(btn.dataset.tab);
    applyAllFilters();
  });
});

async function loadData() {
  try {
    const [bRes, pRes] = await Promise.all([fetch(battersCSV), fetch(pitchersCSV)]);
    const bData = toObjects(parseCSV(await bRes.text()));
    const pData = toObjects(parseCSV(await pRes.text()));

    dataStore.batters = { ...bData, map: mapByName(bData.rows) };
    dataStore.pitchers = { ...pData, map: mapByName(pData.rows) };

    renderTable("batters", "battersTable", COLUMN_CONFIG.table.batters, dataStore.batters.rows);
    renderTable("pitchers", "pitchersTable", COLUMN_CONFIG.table.pitchers, dataStore.pitchers.rows);
    setupTableClick();
    populateFilterOptions(getActiveTab());
    applyAllFilters();
  } catch (err) {
    console.error("데이터를 불러오는 중 문제가 발생했습니다.", err);
    renderTable("batters", "battersTable", COLUMN_CONFIG.table.batters, []);
    renderTable("pitchers", "pitchersTable", COLUMN_CONFIG.table.pitchers, []);
  }
}

setupModalEvents();
document.addEventListener("DOMContentLoaded", loadData);
