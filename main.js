import { ThreeScene } from './three-scene.js';
import { Game } from './game.js';
import { UI } from './ui.js';

/* ...existing code... */
const canvas = document.getElementById('webgl');
const floaterRoot = document.getElementById('floaters');
const three = new ThreeScene(canvas);
const game = new Game();
const ui = new UI(game, floaterRoot);

/* wire scene to game click */
three.onCubeClick = (ndcX, ndcY, worldPoint) => {
  const gained = game.click();
  ui.showFloater(`+${ui.format(gained)}`, ndcX, ndcY);
};

/* wire upgrade purchase */
ui.onBuy = (id) => {
  if (game.buy(id)) {
    ui.renderUpgrades();
    ui.renderStats();
  }
};

/* wire perk purchase */
ui.onBuyPerk = (id) => {
  if (game.buyPerk(id)) {
    ui.renderUpgrades();
    ui.renderStats();
  }
};

/* wire buyFU */
ui.onBuyFU = (id) => {
  if (game.buyFU(id)) {
    ui.renderUpgrades();
    ui.renderStats();
  }
};

/* reset */
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Reset all progress?')) {
    game.reset();
    ui.renderUpgrades();
    ui.renderStats();
  }
});

/* game-loop */
let last = performance.now();
function loop(now) {
  const dt = (now - last) / 1000;
  last = now;
  game.update(dt);
  ui.renderStats();
  ui.updateAffordability();
  three.vibe = game.visualVibe;
  three.update(dt, game.visualEnergyOut);
  three.setPrestigeVisible(game.canPrestige());
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* resize */
window.addEventListener('resize', () => three.onResize());

/* global click/tap overlay */
document.getElementById('clickOverlay').addEventListener('pointerdown', (e) => {
  three.handlePointer(e);
});
document.getElementById('clickOverlay').addEventListener('pointermove', (e) => {
  three.handlePointerMove(e);
});

/* wire prestige click */
three.onPrestigeClick = () => {
  const shards = game.shardsForPrestige();
  if (confirm(`WARNING: PROCEEDING WILL RESET ALL YOUR PROGRESS IN EXCHANGE FOR ${ui.format(shards)} SHARDS.\nARE YOU SURE?`)) {
    if (game.prestige()) {
      three.enterVoid();
      ui.renderUpgrades();
      ui.renderStats();
    }
  }
};

/* wire hoverFU */
three.onHoverFU = (hovering) => {
  if (hovering) ui.showTooltip('Fragmented Upgrade Sphere — Spend shards to unlock one-time power.');
  else ui.hideTooltip();
};

/* init */
ui.renderUpgrades();
