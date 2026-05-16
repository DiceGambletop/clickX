let clicks = 0;
let multiplier = 1;

// Upgrade costs
const costSlight = 25;
const costCompound = 250;

// Upgrade multipliers
let slightMultiplier = 1.0;
let compoundMultiplier = 1.0;

const button = document.getElementById("clickBtn");
const display = document.getElementById("counter-display");
const upgradeSlight = document.getElementById("upgradeSlight");
const upgradeCompound = document.getElementById("upgradeCompound");

// Update display
function updateDisplay() {
  display.textContent = "Clicks: " + Math.floor(clicks);
}

// Click logic
button.addEventListener("click", () => {
  clicks += 1 * multiplier;
  updateDisplay();
});

// Slight Improvement upgrade
upgradeSlight.addEventListener("click", () => {
  if (clicks >= costSlight) {
    clicks -= costSlight;
    slightMultiplier *= 1.8; // +80% per purchase
    multiplier = slightMultiplier * compoundMultiplier;
    updateDisplay();
    upgradeSlight.textContent = "Slight Improvement (+80%) — Cost: " + costSlight + " Clicks";
  }
});

// Compounding Results upgrade
upgradeCompound.addEventListener("click", () => {
  if (clicks >= costCompound) {
    clicks -= costCompound;
    compoundMultiplier *= 2; // doubles each purchase
    multiplier = slightMultiplier * compoundMultiplier * 1.2; // base compounding factor
    updateDisplay();
    upgradeCompound.textContent = "Compounding Results (x" + compoundMultiplier + ") — Cost: " + costCompound + " Clicks";
  }
});
