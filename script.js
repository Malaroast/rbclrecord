// ====== 설정 ======
const SHEET_ID = "1KIW6RJT7knTMGgCEkSeeGr5v5-uB3864Oqzqd7ATu5Y";
// 시트 이름은 정확히 "Batters", "Pitchers"를 사용합니다.
const SHEET_URL = (sheetName) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

// ====== 상태 ======
const state = {
  batters: { cols: [], types: [], rows: [], sort: { col: 0, dir: null } },
  pitchers: { cols: [], types: [], rows: [], sort: { col: 0, dir: null } }
};

// ====== 유틸 ======
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function parseGViz(text) {
  // gviz 응답에서 JSON 본문만 안전하게 추출
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return JSON.parse(text.slice(start, end + 1));
}

function formatCell(c) {
  if (!c) return "";
  // 포맷된 문자열(c.f)이 있으면 그걸 우선 사용
  if (typeof c.f !== "undefined" && c.f !== null) return String(c.f);
  if (typeof c.v === "undefined" || c.v === null) return "";
  return String(c.v);
}

function isNumericColumn(types, colIdx, sampleRows) {
  // gviz 타입 또는 샘플 데이터로 숫자 판단
  if (types[colIdx] && ["number"].includes(types[colIdx])) return true;
  let numericCount = 0, checked = 0;
  for (const r of sampleRows) {
    const v = r[colIdx];
    if (v === "" || v === null || typeof v === "undefined") continue;
    checked++;
    if (!isNaN(Number(String(v).replace(/,/g, "")))) numericCount++;
    if (checked >= 12) break;
  }
  return checked > 0 && numericCount / checked >= 0.7;
}

function cmp(a, b, numeric) {
  if (numeric) {
    const na = Number(String(a).replace(/,/g, ""));
    const nb = Number(String(b).replace(/,/g, ""));
    return (isNaN(na) ? -Infinity : na) - (isNaN(nb) ? -Infinity : nb);
  }
  return String(a).localeCompare(String(b), "ko", { numeric: true, sensitivity: "base" });
}

function renderTable(kind, filterText = "") {
  const headEl = document.getElementById(`${kind}Head`);
  const bodyEl = document.getElementById(`${kind}Body`);
  const { cols, rows, types, sort } = state[kind];

  // 헤더
  headEl.innerHTML = `<tr>${cols
    .map((label, i) => {
      const safe = label && label.trim() ? label : `열 ${i + 1}`;
      const cls =
        sort.col === i ? (sort.dir === "asc" ? "sort-asc" : sort.dir === "desc" ? "sort-desc" : "") : "";
      return `<th data-col="${i}" class="${cls}">${safe}</th>`;
    })
    .join("")}</tr>`;

  // 필터 (닉네임: 첫 열 기준)
  const ft = filterText.trim().toLowerCase();
  let view = rows.filter((r) => (r[0] + "").toLowerCase().includes(ft));

  // 정렬
  if (sort.dir) {
    const colIdx = sort.col;
    const numeric = isNumericColumn(types, colIdx, view);
    view = view.slice().sort((ra, rb) => {
      const base = cmp(ra[colIdx], rb[colIdx], numeric);
      return sort.dir === "asc" ? base : -base;
    });
  }

  // 바디
  bodyEl.innerHTML = view
    .map((r) => `<tr>${r.map((c) => `<td>${c === null ? "" : c}</td>`).join("")}</tr>`)
    .join("");

  // 헤더 클릭 -> 정렬 토글
  headEl.querySelecto
