let clicks = 0;
let multiplier = 1;
let upgradePurchased = false;

const button = document.getElementById("clickBtn");
const display = document.getElementById("counter-display");
const upgradeBtn = document.getElementById("upgradeBtn");

// Click logic
button.addEventListener("click", () => {
  clicks += 1 * multiplier;
  display.textContent = "Clicks: " + clicks;
});

// Upgrade logic
upgradeBtn.addEventListener("click", () => {
  if (!upgradePurchased) {
    multiplier = 2; // +100% clicks
    upgradePurchased = true;
    upgradeBtn.textContent = "Purchased!";
    upgradeBtn.disabled = true;
  }
});
