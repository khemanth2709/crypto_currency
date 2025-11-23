
// DOM references
const cryptoContainer = document.getElementById("crypto-container");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error-message");
const retryBtn = document.getElementById("retry-btn");

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const voiceBtn = document.getElementById("voice-btn");
const suggestionsEl = document.getElementById("suggestions");

const allBtn = document.getElementById("all-btn");
const favoritesBtn = document.getElementById("favorites-btn");
const compareBtn = document.getElementById("compare-btn");

const tickerInner = document.getElementById("ticker-inner");

const portfolioCoin = document.getElementById("portfolio-coin");
const portfolioQty = document.getElementById("portfolio-qty");
const portfolioBuy = document.getElementById("portfolio-buy");
const portfolioAdd = document.getElementById("portfolio-add");
const portfolioTableBody = document.querySelector("#portfolio-table tbody");
const portfolioSummary = document.getElementById("portfolio-summary");

const coinModal = document.getElementById("coin-modal");
const closeModalBtn = document.getElementById("close-modal");
const modalImage = document.getElementById("modal-image");
const modalName = document.getElementById("modal-name");
const modalPrice = document.getElementById("modal-price");
const modalChange = document.getElementById("modal-change");
const modalRank = document.getElementById("modal-rank");
const modalHigh = document.getElementById("modal-high");
const modalLow = document.getElementById("modal-low");
const modalAth = document.getElementById("modal-ath");
const modalAtl = document.getElementById("modal-atl");
const modalMarketCap = document.getElementById("modal-marketcap");
const priceChartCanvas = document.getElementById("price-chart");

const newsContainer = document.getElementById("news-container");

// API URLs
const MARKET_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h";
const COIN_DETAILS_URL =
  "https://api.coingecko.com/api/v3/coins/"; // + id + ?localization=false
const NEWS_URL =
  "https://api.coinstats.app/public/v1/news?skip=0&limit=6";

// State
let cryptocurrencies = [];
let filteredCryptos = [];
let favorites = JSON.parse(localStorage.getItem("cryptoFavorites") || "[]");
let portfolio = JSON.parse(localStorage.getItem("portfolio") || "[]");
let compareSelection = [];
let currentFilter = "all";
let priceChartInstance = null;

// ---------------------- FETCH & DISPLAY MAIN DATA ----------------------
async function fetchCryptoData() {
  try {
    showSkeleton();
    hideError();

    const res = await fetch(MARKET_URL);
    if (!res.ok) throw new Error("API error " + res.status);
    const data = await res.json();

    cryptocurrencies = data;
    filteredCryptos = data;
    updatePortfolioDropdown(data);
    updateTicker(data);
    renderCards(data);
    updatePortfolioView();
  } catch (err) {
    console.error(err);
    showError();
  } finally {
    hideLoading();
  }
}

function renderCards(list) {
  cryptoContainer.innerHTML = "";

  if (!list.length) {
    cryptoContainer.innerHTML = `
      <div class="card" style="grid-column:1/-1; text-align:center; padding:20px;">
        <h3><i class="fas fa-search"></i> No results</h3>
        <p>Try a different search term or clear filters.</p>
      </div>`;
    return;
  }

  list.forEach((coin, idx) => {
    const card = document.createElement("div");
    card.className = "card";
    const change = coin.price_change_percentage_24h || 0;
    const isUp = change >= 0;
    const isFavorite = favorites.includes(coin.id);

    card.innerHTML = `
      <div class="card-header">
        <h3>
          <img src="${coin.image}" alt="${coin.name}" width="24" height="24" />
          ${coin.name}
        </h3>
        <div class="card-header-right">
          <label style="font-size:0.75rem;">
            <input type="checkbox" class="compare-checkbox" data-id="${coin.id}" />
            Compare
          </label>
          <button class="favorite-btn" data-id="${coin.id}" title="Toggle favorite">
            <i class="${isFavorite ? "fas" : "far"} fa-star"></i>
          </button>
        </div>
      </div>
      <div class="card-body">
        <div class="crypto-info">
          <div class="price">$${coin.current_price.toLocaleString()}</div>
          <div class="change ${isUp ? "positive" : "negative"}">
            <i class="fas ${isUp ? "fa-arrow-up" : "fa-arrow-down"}"></i>
            ${change.toFixed(2)}%
          </div>
          <div class="info-row">
            <span>Market Cap:</span>
            <span>$${coin.market_cap.toLocaleString()}</span>
          </div>
          <div class="info-row">
            <span>24h Volume:</span>
            <span>$${coin.total_volume.toLocaleString()}</span>
          </div>
          <div class="info-row">
            <span>Circulating Supply:</span>
            <span>${coin.circulating_supply
              ? coin.circulating_supply.toLocaleString()
              : "N/A"}</span>
          </div>
          <div class="info-row">
            <span>7d Trend:</span>
            <span>
              <canvas class="sparkline" data-id="${coin.id}" width="110" height="35"></canvas>
            </span>
          </div>
        </div>
      </div>
    `;

    card.style.animationDelay = `${idx * 0.04}s`;

    // Favorites toggle
    const favBtn = card.querySelector(".favorite-btn");
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(coin.id, favBtn);
    });

    // Compare checkbox
    const compareCheckbox = card.querySelector(".compare-checkbox");
    compareCheckbox.addEventListener("change", (e) => {
      e.stopPropagation();
      const id = coin.id;
      if (e.target.checked) {
        if (compareSelection.length >= 2) {
          alert("You can compare only 2 coins at a time.");
          e.target.checked = false;
          return;
        }
        compareSelection.push(id);
      } else {
        compareSelection = compareSelection.filter((x) => x !== id);
      }
    });

    // Open modal
    card.addEventListener("click", () => {
      openCoinModal(coin.id);
    });

    cryptoContainer.appendChild(card);
  });

  drawSparklines(list);
}

// ---------------------- TICKER ----------------------
function updateTicker(data) {
  if (!tickerInner) return;
  tickerInner.innerHTML = "";
  data.slice(0, 15).forEach((coin) => {
    const change = coin.price_change_percentage_24h || 0;
    const isUp = change >= 0;
    const el = document.createElement("span");
    el.className = "ticker-item";
    el.innerHTML = `
      <strong>${coin.symbol.toUpperCase()}</strong>
      $${coin.current_price.toLocaleString()}
      <span class="${isUp ? "up" : "down"}">
        ${isUp ? "▲" : "▼"} ${change.toFixed(2)}%
      </span>
    `;
    tickerInner.appendChild(el);
  });
}

// ---------------------- SKELETON LOADING ----------------------
function showSkeleton() {
  loadingEl.style.display = "none";
  cryptoContainer.innerHTML = "";
  for (let i = 0; i < 12; i++) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-header" style="background:#e0e0e0;height:32px;"></div>
      <div class="card-body">
        <div class="skeleton">
          <div class="skeleton-price"></div>
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line"></div>
        </div>
      </div>
    `;
    card.style.animationDelay = `${i * 0.04}s`;
    cryptoContainer.appendChild(card);
  }
}

function showLoading() {
  loadingEl.style.display = "flex";
}
function hideLoading() {
  loadingEl.style.display = "none";
}
function showError() {
  errorEl.style.display = "block";
  cryptoContainer.style.display = "none";
}
function hideError() {
  errorEl.style.display = "none";
  cryptoContainer.style.display = "grid";
}

// ---------------------- SEARCH & SUGGESTIONS ----------------------
function searchCryptos() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    applyFilter(currentFilter);
    return;
  }
  const result = cryptocurrencies.filter(
    (c) =>
      c.name.toLowerCase().includes(term) ||
      c.symbol.toLowerCase().includes(term)
  );
  filteredCryptos = result;
  renderCards(result);
}

function showSuggestions() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    suggestionsEl.style.display = "none";
    return;
  }
  const matches = cryptocurrencies
    .filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.symbol.toLowerCase().includes(term)
    )
    .slice(0, 6);
  if (!matches.length) {
    suggestionsEl.style.display = "none";
    return;
  }
  suggestionsEl.innerHTML = "";
  matches.forEach((coin) => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.innerHTML = `
      <img src="${coin.image}" width="18" height="18" />
      <span>${coin.name} (${coin.symbol.toUpperCase()})</span>
    `;
    div.addEventListener("click", () => {
      searchInput.value = coin.name;
      suggestionsEl.style.display = "none";
      searchCryptos();
    });
    suggestionsEl.appendChild(div);
  });
  suggestionsEl.style.display = "block";
}

// ---------------------- FILTERS & FAVORITES ----------------------
function applyFilter(filter) {
  currentFilter = filter;
  if (filter === "all") {
    allBtn.classList.add("active");
    favoritesBtn.classList.remove("active");
    filteredCryptos = cryptocurrencies;
  } else {
    favoritesBtn.classList.add("active");
    allBtn.classList.remove("active");
    filteredCryptos = cryptocurrencies.filter((c) => favorites.includes(c.id));
  }
  renderCards(filteredCryptos);
}

function toggleFavorite(id, btn) {
  const idx = favorites.indexOf(id);
  if (idx === -1) favorites.push(id);
  else favorites.splice(idx, 1);
  localStorage.setItem("cryptoFavorites", JSON.stringify(favorites));

  if (btn) {
    const icon = btn.querySelector("i");
    if (favorites.includes(id)) icon.className = "fas fa-star";
    else icon.className = "far fa-star";
  }

  if (currentFilter === "favorites") applyFilter("favorites");
}

// ---------------------- SPARKLINES ----------------------
function drawSparklines(list) {
  list.forEach((coin) => {
    const canvas = document.querySelector(
      `canvas.sparkline[data-id="${coin.id}"]`
    );
    if (!canvas || !coin.sparkline_in_7d || !coin.sparkline_in_7d.price)
      return;
    const prices = coin.sparkline_in_7d.price;
    if (!prices.length) return;

    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    ctx.beginPath();
    prices.forEach((p, i) => {
      const x = (i / (prices.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineWidth = 1.4;
    ctx.strokeStyle = "#3498db";
    ctx.stroke();
  });
}

// ---------------------- MODAL & 7-DAY CHART ----------------------
async function openCoinModal(id) {
  try {
    showLoading();

    const [infoRes, chartRes] = await Promise.all([
      fetch(`${COIN_DETAILS_URL}${id}?localization=false&sparkline=true`),
      fetch(
        `${COIN_DETAILS_URL}${id}/market_chart?vs_currency=usd&days=7&interval=hourly`
      ),
    ]);
    if (!infoRes.ok || !chartRes.ok) throw new Error("Coin details error");

    const info = await infoRes.json();
    const chartData = await chartRes.json();

    // Fill modal
    modalImage.src = info.image.small;
    modalName.textContent = info.name;
    const price = info.market_data.current_price.usd;
    modalPrice.textContent = `$${price.toLocaleString()}`;

    const change = info.market_data.price_change_percentage_24h || 0;
    const isUp = change >= 0;
    modalChange.className = "change " + (isUp ? "positive" : "negative");
    modalChange.innerHTML = `
      <i class="fas ${isUp ? "fa-arrow-up" : "fa-arrow-down"}"></i>
      ${change.toFixed(2)}%
    `;

    modalRank.textContent = info.market_cap_rank ?? "-";
    modalHigh.textContent = `$${info.market_data.high_24h.usd.toLocaleString()}`;
    modalLow.textContent = `$${info.market_data.low_24h.usd.toLocaleString()}`;
    modalAth.textContent = `$${info.market_data.ath.usd.toLocaleString()}`;
    modalAtl.textContent = `$${info.market_data.atl.usd.toLocaleString()}`;
    modalMarketCap.textContent = `$${info.market_data.market_cap.usd.toLocaleString()}`;

    // Chart
    const prices = chartData.prices.map((p) => p[1]);
    const labels = chartData.prices.map((p) => {
      const d = new Date(p[0]);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    });

    if (priceChartInstance) priceChartInstance.destroy();
    priceChartInstance = new Chart(priceChartCanvas.getContext("2d"), {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `${info.name} price (USD)`,
            data: prices,
            borderColor: "#3498db",
            backgroundColor: "rgba(52, 152, 219, 0.12)",
            tension: 0.35,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
        },
        scales: {
          x: {
            ticks: { display: false },
            grid: { display: false },
          },
          y: {
            grid: { color: "rgba(0,0,0,0.08)" },
          },
        },
      },
    });

    coinModal.style.display = "flex";
  } catch (err) {
    console.error(err);
    alert("Unable to load coin details right now.");
  } finally {
    hideLoading();
  }
}

function closeModal() {
  coinModal.style.display = "none";
}

// ---------------------- COMPARE (2 COINS) ----------------------
async function compareSelected() {
  if (compareSelection.length !== 2) {
    alert("Select exactly 2 coins to compare (use Compare checkbox on cards).");
    return;
  }
  const [id1, id2] = compareSelection;
  try {
    showLoading();
    const [r1, r2] = await Promise.all([
      fetch(`${COIN_DETAILS_URL}${id1}?localization=false`),
      fetch(`${COIN_DETAILS_URL}${id2}?localization=false`),
    ]);
    const c1 = await r1.json();
    const c2 = await r2.json();

    modalImage.src = c1.image.small;
    modalName.textContent = `${c1.name} vs ${c2.name}`;
    modalPrice.textContent = `${c1.symbol.toUpperCase()}: $${c1.market_data.current_price.usd.toLocaleString()}  |  ${c2.symbol.toUpperCase()}: $${c2.market_data.current_price.usd.toLocaleString()}`;

    const ch1 = c1.market_data.price_change_percentage_24h || 0;
    const ch2 = c2.market_data.price_change_percentage_24h || 0;
    modalChange.className = "change";
    modalChange.textContent = `24h: ${ch1.toFixed(2)}% vs ${ch2.toFixed(2)}%`;

    modalRank.textContent = `${c1.market_cap_rank} vs ${c2.market_cap_rank}`;
    modalHigh.textContent = `$${c1.market_data.high_24h.usd.toLocaleString()} vs $${c2.market_data.high_24h.usd.toLocaleString()}`;
    modalLow.textContent = `$${c1.market_data.low_24h.usd.toLocaleString()} vs $${c2.market_data.low_24h.usd.toLocaleString()}`;
    modalAth.textContent = `$${c1.market_data.ath.usd.toLocaleString()} vs $${c2.market_data.ath.usd.toLocaleString()}`;
    modalAtl.textContent = `$${c1.market_data.atl.usd.toLocaleString()} vs $${c2.market_data.atl.usd.toLocaleString()}`;
    modalMarketCap.textContent = `$${c1.market_data.market_cap.usd.toLocaleString()} vs $${c2.market_data.market_cap.usd.toLocaleString()}`;

    if (priceChartInstance) priceChartInstance.destroy();
    priceChartInstance = null;
    priceChartCanvas.getContext("2d").clearRect(
      0,
      0,
      priceChartCanvas.width,
      priceChartCanvas.height
    );

    coinModal.style.display = "flex";
  } catch (err) {
    console.error(err);
    alert("Unable to compare right now.");
  } finally {
    hideLoading();
  }
}

// ---------------------- PORTFOLIO ----------------------
function updatePortfolioDropdown(data) {
  portfolioCoin.innerHTML = '<option value="">Select coin</option>';
  data.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.name} (${c.symbol.toUpperCase()})`;
    portfolioCoin.appendChild(opt);
  });
}

function updatePortfolioView() {
  if (!cryptocurrencies.length) return;
  portfolioTableBody.innerHTML = "";

  let totalValue = 0;
  let totalInvested = 0;

  portfolio.forEach((entry, idx) => {
    const coin = cryptocurrencies.find((c) => c.id === entry.id);
    if (!coin) return;
    const currentPrice = coin.current_price;
    const currentValue = currentPrice * entry.qty;
    const invested = entry.buyPrice * entry.qty;
    const pl = currentValue - invested;

    totalValue += currentValue;
    totalInvested += invested;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${coin.name}</td>
      <td>${entry.qty}</td>
      <td>$${entry.buyPrice.toFixed(2)}</td>
      <td>$${currentPrice.toFixed(2)}</td>
      <td style="color:${pl >= 0 ? "#2ecc71" : "#e74c3c"};">$${pl.toFixed(
      2
    )}</td>
    `;
    portfolioTableBody.appendChild(tr);
  });

  if (!portfolio.length) {
    portfolioSummary.textContent = "No holdings added yet.";
  } else {
    const totalPL = totalValue - totalInvested;
    portfolioSummary.innerHTML = `
      Invested: <strong>$${totalInvested.toFixed(2)}</strong> |
      Current: <strong>$${totalValue.toFixed(2)}</strong> |
      P/L: <strong style="color:${
        totalPL >= 0 ? "#2ecc71" : "#e74c3c"
      };">$${totalPL.toFixed(2)}</strong>
    `;
  }
}

function addPortfolioEntry() {
  const id = portfolioCoin.value;
  const qty = parseFloat(portfolioQty.value);
  const buyPrice = parseFloat(portfolioBuy.value);
  if (!id || isNaN(qty) || isNaN(buyPrice) || qty <= 0 || buyPrice <= 0) {
    alert("Select a coin and enter valid quantity & buy price.");
    return;
  }
  portfolio.push({ id, qty, buyPrice });
  localStorage.setItem("portfolio", JSON.stringify(portfolio));
  portfolioQty.value = "";
  portfolioBuy.value = "";
  updatePortfolioView();
}

// ---------------------- NEWS ----------------------
async function fetchNews() {
  try {
    const res = await fetch(NEWS_URL);
    if (!res.ok) throw new Error("News error");
    const json = await res.json();
    newsContainer.innerHTML = "";
    json.news.forEach((n) => {
      const div = document.createElement("div");
      div.className = "news-card";
      div.innerHTML = `
        <div class="news-card-title">${n.title}</div>
        <div class="news-card-meta">${n.source}</div>
        <a href="${n.link}" target="_blank" rel="noopener noreferrer">Read more</a>
      `;
      newsContainer.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

// ---------------------- VOICE SEARCH ----------------------
function initVoiceSearch() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceBtn.style.display = "none";
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    searchInput.value = text;
    searchCryptos();
  };
  recognition.onerror = () => {
    alert("Voice recognition error. Please try again.");
  };

  voiceBtn.addEventListener("click", () => {
    recognition.start();
  });
}

// ---------------------- EVENTS ----------------------
searchBtn.addEventListener("click", searchCryptos);
searchInput.addEventListener("input", showSuggestions);
searchInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    searchCryptos();
    suggestionsEl.style.display = "none";
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-container")) {
    suggestionsEl.style.display = "none";
  }
});

retryBtn.addEventListener("click", fetchCryptoData);
allBtn.addEventListener("click", () => applyFilter("all"));
favoritesBtn.addEventListener("click", () => applyFilter("favorites"));
compareBtn.addEventListener("click", compareSelected);
portfolioAdd.addEventListener("click", addPortfolioEntry);

closeModalBtn.addEventListener("click", closeModal);
coinModal.addEventListener("click", (e) => {
  if (e.target === coinModal) closeModal();
});

// ---------------------- INIT ----------------------
document.addEventListener("DOMContentLoaded", () => {
  fetchCryptoData();
  fetchNews();
  initVoiceSearch();
  updatePortfolioView();
  // Auto-refresh every 2 minutes
  setInterval(fetchCryptoData, 120000);
});
