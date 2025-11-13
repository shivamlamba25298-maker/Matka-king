// Display current date & time
function updateDateTime() {
  const now = new Date();
  document.getElementById("datetime").textContent = now.toLocaleString();
}
setInterval(updateDateTime, 1000);
updateDateTime();

// Load saved results
let results = JSON.parse(localStorage.getItem("results")) || [];

// Function to display only today & yesterday results
function displayResults() {
  const tableBody = document.querySelector("#resultTable tbody");
  tableBody.innerHTML = "";

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const formatDate = d => d.toISOString().split("T")[0];

  results
    .filter(r => r.date === formatDate(today) || r.date === formatDate(yesterday))
    .forEach(r => {
      const row = document.createElement("tr");
      const date = new Date(r.date);
      row.innerHTML = `
        <td>${r.date}</td>
        <td>${date.toLocaleDateString("en-US", { weekday: "long" })}</td>
        <td>${r.value}</td>
      `;
      tableBody.appendChild(row);
    });
}
displayResults();

// Handle form submission
document.getElementById("resultForm").addEventListener("submit", e => {
  e.preventDefault();
  const date = document.getElementById("resultDate").value;
  const value = document.getElementById("resultValue").value;
  if (!date || !value) return alert("Please fill all fields!");

  results.push({ date, value });
  localStorage.setItem("results", JSON.stringify(results));
  displayResults();

  e.target.reset();
}); 
