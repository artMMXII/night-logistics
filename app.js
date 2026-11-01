const STORAGE_KEY = "night-logistics-v1";
const departmentsRoot = document.getElementById("departments");
const reportField = document.getElementById("report");
const includeZero = document.getElementById("includeZero");
const status = document.getElementById("copyStatus");

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return Array.from({ length: 15 }, (_, i) => ({
      incoming: validNumber(saved[i + 1]?.incoming),
      returns: validNumber(saved[i + 1]?.returns)
    }));
  } catch {
    return Array.from({ length: 15 }, () => ({ incoming: 0, returns: 0 }));
  }
}
function validNumber(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}
let values = loadState();

function saveState() {
  const saved = {};
  values.forEach((v, i) => saved[i + 1] = v);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}
function plural(n, one, few, many) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  const mod10 = n % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
function makeLine(dept, incoming, returns) {
  const parts = [];
  if (incoming > 0) parts.push(`${incoming} ${plural(incoming, "паллетa", "паллеты", "паллет")}`);
  if (returns > 0) parts.push(`${returns} ${plural(returns, "отзыв", "отзыва", "отзывов")}`);
  return `${dept} — ${parts.join(", ")}`;
}
function updateReport() {
  const totalIncoming = values.reduce((sum, v) => sum + v.incoming, 0);
  const totalReturns = values.reduce((sum, v) => sum + v.returns, 0);
  const total = totalIncoming + totalReturns;
  document.getElementById("totalIncoming").textContent = totalIncoming;
  document.getElementById("totalReturns").textContent = totalReturns;
  document.getElementById("totalAll").textContent = total;

  const lines = values.map((v, i) => {
    if (v.incoming === 0 && v.returns === 0) {
      return includeZero.checked ? `${i + 1} — без остатков` : null;
    }
    return makeLine(i + 1, v.incoming, v.returns);
  }).filter(Boolean);

  let report = "Остатки ночной логистики:\n\n";
  report += lines.length ? lines.join("\n") : "Остатков нет";
  report += `\n\nИтого: ${total} ${plural(total, "паллетa", "паллеты", "паллет")}`;
  report += `\nПриход — ${totalIncoming}; отзывы — ${totalReturns}`;
  reportField.value = report;
  saveState();
}
function renderDepartments() {
  departmentsRoot.innerHTML = "";
  values.forEach((v, index) => {
    const dept = document.createElement("div");
    dept.className = "dept";
    dept.innerHTML = `
      <div class="dept-number">${index + 1}</div>
      <div class="field">
        <label for="incoming-${index}">Приход</label>
        <input id="incoming-${index}" type="number" min="0" step="1" inputmode="numeric" pattern="[0-9]*" aria-label="Отдел ${index + 1}, приход">
      </div>
      <div class="field">
        <label for="returns-${index}">Отзывы</label>
        <input id="returns-${index}" type="number" min="0" step="1" inputmode="numeric" pattern="[0-9]*" aria-label="Отдел ${index + 1}, отзывы">
      </div>`;
    const incomingInput = dept.querySelector(`#incoming-${index}`);
    const returnsInput = dept.querySelector(`#returns-${index}`);
    incomingInput.value = v.incoming || "";
    returnsInput.value = v.returns || "";
    const bind = (input, key) => input.addEventListener("input", () => {
      const raw = input.value;
      if (raw === "") values[index][key] = 0;
      else {
        const n = Number(raw);
        values[index][key] = Number.isInteger(n) && n >= 0 ? n : 0;
        if (values[index][key] !== n) input.value = values[index][key] || "";
      }
      status.textContent = "";
      updateReport();
    });
    bind(incomingInput, "incoming");
    bind(returnsInput, "returns");
    departmentsRoot.appendChild(dept);
  });
}
document.getElementById("clearButton").addEventListener("click", () => {
  if (!confirm("Очистить все значения за текущую смену?")) return;
  values = Array.from({ length: 15 }, () => ({ incoming: 0, returns: 0 }));
  renderDepartments();
  updateReport();
  status.textContent = "Ведомость очищена.";
});
includeZero.addEventListener("change", updateReport);
document.getElementById("copyButton").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(reportField.value);
    status.textContent = "Отчёт скопирован. Можно вставить его в рабочий чат.";
  } catch {
    reportField.focus();
    reportField.select();
    status.textContent = "Выделите текст и скопируйте его вручную.";
  }
});
renderDepartments();
updateReport();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
