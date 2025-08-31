// -----------------------
// CSV URL 설정
// -----------------------
const battersCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7qAaMm3tG_1oEuIPbn4pLZiDzzwl6d-Ur-y3_fw9fXIjJN-SYwdap5rbmOk63nDApmzCiqYYa495j/pub?gid=0&single=true&output=csv";   // 웹에 게시한 Batters CSV URL
const pitchersCSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT7qAaMm3tG_1oEuIPbn4pLZiDzzwl6d-Ur-y3_fw9fXIjJN-SYwdap5rbmOk63nDApmzCiqYYa495j/pub?gid=249730824&single=true&output=csv";  // 웹에 게시한 Pitchers CSV URL

// -----------------------
// CSV 파싱 함수
// -----------------------
function parseCSV(text){
  return text.trim().split("\n").map(r=>r.split(","));
}

// -----------------------
// 테이블 렌더링
// -----------------------
function renderTable(tableId, data){
  const table = document.getElementById(tableId);
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");
  if(data.length === 0) return;

  // 헤더
  thead.innerHTML = "";
  const headerRow = document.createElement("tr");
  data[0].forEach((cell,i)=>{
    const th = document.createElement("th");
    th.textContent = cell;
    th.dataset.col=i;
    th.addEventListener("click", ()=>{
      sortTable(tableId, i);
    });
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // 데이터
  tbody.innerHTML="";
  data.slice(1).forEach(row=>{
    const tr=document.createElement("tr");
    row.forEach(cell=>{
      const td=document.createElement("td");
      td.textContent=cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// -----------------------
// 테이블 정렬 기능
// -----------------------
const sortState = {};

function sortTable(tableId, col){
  const table = document.getElementById(tableId);
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));

  const isAsc = sortState[tableId] && sortState[tableId].col===col && sortState[tableId].dir==="asc";
  sortState[tableId] = { col: col, dir: isAsc ? "desc":"asc" };

  rows.sort((a,b)=>{
    const aText = a.children[col].textContent.replace(/,/g,'');
    const bText = b.children[col].textContent.replace(/,/g,'');
    const aNum = parseFloat(aText);
    const bNum = parseFloat(bText);
    if(!isNaN(aNum) && !isNaN(bNum)){
      return isAsc ? bNum - aNum : aNum - bNum;
    }
    return isAsc ? bText.localeCompare(aText) : aText.localeCompare(bText);
  });

  tbody.innerHTML="";
  rows.forEach(r=>tbody.appendChild(r));

  // 헤더 화살표
  table.querySelectorAll("th").forEach(th=>{
    th.classList.remove("sort-asc","sort-desc");
  });
  const th = table.querySelector(`th:nth-child(${col+1})`);
  th.classList.add(isAsc ? "sort-desc":"sort-asc");
}

// -----------------------
// 검색 기능
// -----------------------
document.getElementById("searchInput").addEventListener("input", function(){
  const filter = this.value.toLowerCase();
  document.querySelectorAll("tbody tr").forEach(row=>{
    row.style.display = row.textContent.toLowerCase().includes(filter) ? "" : "none";
  });
});

// -----------------------
// 탭 전환
// -----------------------
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c=>c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// -----------------------
// 데이터 로드
// -----------------------
async function loadData(){
  const bRes = await fetch(battersCSV);
  const pRes = await fetch(pitchersCSV);
  const bData = parseCSV(await bRes.text());
  const pData = parseCSV(await pRes.text());
  renderTable("battersTable", bData);
  renderTable("pitchersTable", pData);
}

document.addEventListener("DOMContentLoaded", loadData);
