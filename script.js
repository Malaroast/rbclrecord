document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  // 스프레드시트 CSV 가져오기 (공유링크 → CSV 변환)
  const sheetId = "1KIW6RJT7knTMGgCEkSeeGr5v5-uB3864Oqzqd7ATu5Y";
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

  fetch(csvUrl)
    .then(res => res.text())
    .then(data => {
      const rows = data.split("\n").map(r => r.split(","));

      // 타자 / 투수 분리
      rows.forEach(row => {
        const type = row[0]?.trim();
        const nickname = row[1]?.trim();

        if (type === "타자") {
          addRow("hittersTable", row.slice(1));
        } else if (type === "투수") {
          addRow("pitchersTable", row.slice(1));
        }
      });
    });

  function addRow(tableId, rowData) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    const tr = document.createElement("tr");
    rowData.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  }

  // 검색
  searchInput.addEventListener("keyup", () => {
    const keyword = searchInput.value.toLowerCase();
    document.querySelectorAll("tbody tr").forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(keyword) ? "" : "none";
    });
  });

  // 탭 전환
  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      button.classList.add("active");

      tabContents.forEach(tab => tab.classList.remove("active"));
      document.getElementById(button.dataset.tab).classList.add("active");
    });
  });
});
