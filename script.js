/* Matka King — script.js
   Data stored in localStorage key: 'mk_results'
   Admin password: 'jaishreeshyam03' (set by user)
*/

const ADMIN_PASSWORD = "jaishreeshyam03";
const STORAGE_KEY = "mk_results";

// UI elements
const datetimeEl = document.getElementById("datetime");
const yearEl = document.getElementById("year");
const openLoginBtn = document.getElementById("openLogin");
const loginModal = document.getElementById("loginModal");
const closeLogin = document.getElementById("closeLogin");
const loginBtn = document.getElementById("loginBtn");
const adminPassInput = document.getElementById("adminPass");
const loginMsg = document.getElementById("loginMsg");

const adminPanel = document.getElementById("adminPanel");
const logoutBtn = document.getElementById("logoutBtn");
const resultForm = document.getElementById("resultForm");
const resultDateInput = document.getElementById("resultDate");
const resultValueInput = document.getElementById("resultValue");
const clearAllBtn = document.getElementById("clearAll");

const todayTableBody = document.querySelector("#todayTable tbody");
const monthTableBody = document.querySelector("#monthTable tbody");
const monthlyChartCtx = document.getElementById("monthlyChart").getContext("2d");

let chartInstance = null;

// live datetime
function updateDateTime() {
  const now = new Date();
  datetimeEl.textContent = now.toLocaleString();
  yearEl.textContent = now.getFullYear();
}
setInterval(updateDateTime, 1000);
updateDateTime();

// load results from localStorage
let results = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

// UTIL: format date to YYYY-MM-DD
function toISODate(d) {
  if (!(d instanceof Date)) d = new Date(d);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// AUTH UI
openLoginBtn.addEventListener("click", () => {
  adminPassInput.value = "";
  loginMsg.textContent = "";
  loginModal.classList.remove("hidden");
});
closeLogin.addEventListener("click", () => loginModal.classList.add("hidden"));

// Login action
loginBtn.addEventListener("click", () => {
  const pass = adminPassInput.value.trim();
  if (pass === ADMIN_PASSWORD) {
    loginModal.classList.add("hidden");
    adminPanel.classList.remove("hidden");
    openLoginBtn.classList.add("hidden");
    loginMsg.textContent = "";
  } else {
    loginMsg.textContent = "Incorrect password.";
  }
});

// Logout
logoutBtn.addEventListener("click", () => {
  adminPanel.classList.add("hidden");
  openLoginBtn.classList.remove("hidden");
});

// Save / Update result
resultForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const date = resultDateInput.value;
  const value = resultValueInput.value.trim();
  if (!date || !value) return alert("Please fill both fields.");

  // If date exists, update existing record
  const idx = results.findIndex(r => r.date === date);
  if (idx >= 0) {
    results[idx].value = value;
  } else {
    results.push({ date, value });
  }
  // keep results sorted descending
  results.sort((a,b) => new Date(b.date) - new Date(a.date));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  resultForm.reset();
  renderAll();
});

// Clear all (danger)
clearAllBtn.addEventListener("click", () => {
  if (!confirm("Are you sure you want to delete ALL saved results?")) return;
  results = [];
  localStorage.removeItem(STORAGE_KEY);
  renderAll();
});

// Show only Today and Tomorrow table
function renderTodayTomorrow() {
  todayTableBody.innerHTML = "";
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const todayStr = toISODate(today);
  const tomorrowStr = toISODate(tomorrow);

  const entries = results.filter(r => r.date === todayStr || r.date === tomorrowStr)
                         .sort((a,b) => new Date(b.date) - new Date(a.date));

  // Add rows (if no entry show "—")
  if (entries.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="3">No results for Today or Tomorrow</td>`;
    todayTableBody.appendChild(tr);
    return;
  }

  entries.forEach(r => {
    const d = new Date(r.date);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.date}</td>
                    <td>${d.toLocaleDateString(undefined, { weekday: "long" })}</td>
                    <td>${escapeHtml(r.value)}</td>`;
    todayTableBody.appendChild(tr);
  });
}

// Render last 30 days table and chart
function renderMonthView() {
  monthTableBody.innerHTML = "";

  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 29); // include today -> 30 days

  // Build a map date->value (if multiple entries keep last saved)
  const map = {};
  results.forEach(r => { map[r.date] = r.value; });

  const labels = [];
  const data = [];

  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toISODate(d);
    labels.push(key);

    const val = map[key] ?? "";
    // For chart we try to extract numeric part (e.g., "12-34-56" -> use first number 12) or NaN -> null
    const numeric = extractNumeric(val);
    data.push(numeric);

    // Table row
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${key}</td>
                    <td>${d.toLocaleDateString(undefined, { weekday: "short" })}</td>
                    <td>${escapeHtml(val)}</td>`;
    monthTableBody.appendChild(tr);
  }

  // draw chart
  drawChart(labels, data);
}

// Utility: extract numeric value from a string for chart (returns number or null)
function extractNumeric(s) {
  if (!s) return null;
  // find first integer in string
  const m = s.match(/-?\d+/);
  if (!m) return null;
  return Number(m[0]);
}

// Chart drawing using Chart.js
function drawChart(labels, data) {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  chartInstance = new Chart(monthlyChartCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Result (numeric)',
        data: data,
        borderRadius: 6,
        barThickness: 18,
        maxBarThickness: 36,
        backgroundColor: function(context) {
          const v = context.raw;
          if (v === null) return 'rgba(255,255,255,0.06)';
          return 'rgba(255,127,80,0.9)';
        }
      }]
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        x: { ticks: { maxRotation: 45, minRotation: 0 }, grid: { display:false } },
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.03)' } }
      },
      plugins: {
        legend: { display:false },
        tooltip: { mode: 'index', intersect: false }
      }
    }
  });
}

// Escape HTML
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); });
}

// render all UI
function renderAll() {
  renderTodayTomorrow();
  renderMonthView();
}

// initial render
renderAll();

/* Helper: pre-fill date input with today by default */
resultDateInput.value = toISODate(new Date());
resultValueInput.placeholder = "e.g. 12-34-56";

/* small UX: close login modal when clicking outside */
loginModal.addEventListener("click", (e) => {
  if (e.target === loginModal) loginModal.classList.add("hidden");
});
