/* ============================================================
   AI Tools Catalog — Script
   Loads data from tools.json + filtering logic.
   To add a new tool, just edit tools.json — no JS changes needed.
   ============================================================ */

// ── Mobile nav toggle ───────────────────────────────────────
const navToggle = document.getElementById("navToggle");
const navLinks = document.querySelector(".nav-links");
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
  navLinks.querySelectorAll("a").forEach(a =>
    a.addEventListener("click", () => navLinks.classList.remove("open"))
  );
}

// ── Data (loaded from tools.json) ───────────────────────────
let tools = [];

// ── DOM references ──────────────────────────────────────────
const heroSearchInput  = document.getElementById("heroSearchInput");
const categoryFilter   = document.getElementById("categoryFilter");
const typeFilter       = document.getElementById("typeFilter");
const useCaseFilter    = document.getElementById("useCaseFilter");
const personaFilter    = document.getElementById("personaFilter");
const purposeFilter    = document.getElementById("purposeFilter");
const resetBtn         = document.getElementById("resetBtn");
const cardGrid         = document.getElementById("cardGrid");
const emptyState       = document.getElementById("emptyState");
const resultsCount     = document.getElementById("resultsCount");

// ── Initialisation ──────────────────────────────────────────

/** Populate a <select> with unique sorted values from the data. */
function populateSelect(selectEl, key) {
  const values = [...new Set(tools.map((t) => t[key]))].sort();
  values.forEach((val) => {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = val;
    selectEl.appendChild(opt);
  });
}

/** Populate persona dropdown with unique sorted personas. */
function populatePersonaFilter() {
  const allPersonas = [...new Set(tools.flatMap((t) => t.personas))].sort();
  allPersonas.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    personaFilter.appendChild(opt);
  });
}

/** Load tools from tools.json and initialise the page. */
async function init() {
  try {
    const res = await fetch("tools.json");
    tools = await res.json();
  } catch (err) {
    cardGrid.innerHTML = '<p style="color:#ef4444;padding:40px;text-align:center;">Failed to load tools data. Make sure tools.json is in the same folder.</p>';
    return;
  }

  // Populate all filter dropdowns from the loaded data
  populateSelect(categoryFilter, "category");
  populateSelect(typeFilter, "type");
  populateSelect(useCaseFilter, "useCase");
  populateSelect(purposeFilter, "purpose");
  populatePersonaFilter();

  // First render
  applyFilters();
}

// ── Rendering ───────────────────────────────────────────────

/** Escape strings for safe HTML insertion. */
function esc(str) {
  const el = document.createElement("span");
  el.textContent = str;
  return el.innerHTML;
}

/** Generate maturity dots HTML. */
function maturityHTML(level) {
  let dots = "";
  for (let i = 1; i <= 5; i++) {
    dots += `<span class="maturity-dot${i <= level ? " filled" : ""}"></span>`;
  }
  const labels = ["", "Emerging", "Growing", "Established", "Mature", "Mainstream"];
  return `
    <div class="maturity">
      <div class="maturity-dots">${dots}</div>
      ${labels[level] || ""}
    </div>
  `;
}

/** Create the HTML for a single tool card. */
function createCard(tool) {
  const card = document.createElement("article");
  card.className = "card";

  // Pick an accent color based on the first persona
  const personaColorMap = {
    Developer: "#3b82f6", QA: "#10b981", Architect: "#8b5cf6",
    "Product Owner": "#f59e0b", Stakeholder: "#ef4444",
    "Data Engineer": "#06b6d4", Designer: "#ec4899", DevOps: "#f97316",
    Researcher: "#6366f1", Educator: "#14b8a6", Legal: "#64748b",
    Healthcare: "#e11d48", Marketing: "#a855f7", Executive: "#0284c7",
    "Agile Coach": "#059669"
  };
  const accent = personaColorMap[tool.personas[0]] || "#4f46e5";
  card.style.setProperty("--card-accent", accent);

  const personaBadges = tool.personas
    .map((p) => `<span class="persona-badge" data-persona="${esc(p)}">${esc(p)}</span>`)
    .join("");

  card.innerHTML = `
    <div class="card-header">
      <span class="card-name">${esc(tool.name)}</span>
      <span class="card-type">${esc(tool.type)}</span>
    </div>
    <p class="card-description">${esc(tool.description)}</p>
    <div class="card-meta">
      <span class="tag">${esc(tool.category)}</span>
      <span class="tag">${esc(tool.useCase)}</span>
      <span class="tag tag-purpose">${esc(tool.purpose)}</span>
    </div>
    <div class="card-personas">${personaBadges}</div>
    <div class="card-footer">
      <a class="card-link" href="${esc(tool.url)}" target="_blank" rel="noopener noreferrer">
        Visit
      </a>
      ${maturityHTML(tool.maturity)}
    </div>
  `;

  return card;
}

/** Render the filtered list of tools into the grid. */
function render(filtered) {
  cardGrid.innerHTML = "";

  if (filtered.length === 0) {
    emptyState.classList.remove("hidden");
  } else {
    emptyState.classList.add("hidden");
    filtered.forEach((tool) => cardGrid.appendChild(createCard(tool)));
  }

  resultsCount.textContent = `Showing ${filtered.length} of ${tools.length} tools`;
}

// ── Filtering ───────────────────────────────────────────────

/** Return the subset of tools matching the current filter state. */
function getFilteredTools() {
  const query    = heroSearchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const type     = typeFilter.value;
  const useCase  = useCaseFilter.value;
  const persona  = personaFilter.value;
  const purpose  = purposeFilter.value;

  return tools.filter((t) => {
    // Text search: match name, description, category, purpose, or personas
    if (query && !t.name.toLowerCase().includes(query)
              && !t.description.toLowerCase().includes(query)
              && !t.category.toLowerCase().includes(query)
              && !t.purpose.toLowerCase().includes(query)
              && !t.useCase.toLowerCase().includes(query)
              && !t.personas.some(p => p.toLowerCase().includes(query))) {
      return false;
    }
    if (category !== "all" && t.category !== category) return false;
    if (type     !== "all" && t.type     !== type)     return false;
    if (useCase  !== "all" && t.useCase  !== useCase)  return false;
    if (persona  !== "all" && !t.personas.includes(persona)) return false;
    if (purpose  !== "all" && t.purpose  !== purpose)  return false;
    return true;
  });
}

/** Re-run filter and re-render. */
function applyFilters() {
  render(getFilteredTools());
}

/** Reset all filters to default state. */
function resetAll() {
  heroSearchInput.value = "";
  categoryFilter.value  = "all";
  typeFilter.value      = "all";
  useCaseFilter.value   = "all";
  personaFilter.value   = "all";
  purposeFilter.value   = "all";
  applyFilters();
}

// ── Event listeners ─────────────────────────────────────────
heroSearchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
typeFilter.addEventListener("change", applyFilters);
useCaseFilter.addEventListener("change", applyFilters);
personaFilter.addEventListener("change", applyFilters);
purposeFilter.addEventListener("change", applyFilters);
resetBtn.addEventListener("click", resetAll);

// ── Load data and start ─────────────────────────────────────
init();
