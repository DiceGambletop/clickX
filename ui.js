/* ...existing code... */
export class UI {
  constructor(game, floaterRoot) {
    this.game = game;
    this.floaters = floaterRoot;
    this.upgradesRoot = document.getElementById('upgrades');
    this.perksRoot = document.getElementById('perks');
    this.fusRoot = document.getElementById('fus');
    this.fuHeader = document.getElementById('fuHeader');
    this.tooltip = document.getElementById('sceneTooltip');
    this.onBuy = () => {};
    this.onBuyPerk = () => {};
    this.onBuyFU = () => {};
    this.revealedUpgrades = new Set();
    this.revealedPerks = new Set();
  }

  format(n) {
    if (n < 1000) return `${Math.floor(n)}`;
    const units = ['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
    let u = -1;
    while (n >= 1000 && u < units.length - 1) { n /= 1000; u++; }
    return `${n.toFixed(2)}${units[u]}`;
  }

  renderStats() {
    document.getElementById('fragments').textContent = this.format(this.game.state.fragments);
    document.getElementById('perClick').textContent = this.format(this.game.getPerClick());
    document.getElementById('perSec').textContent = this.format(this.game.state.perSec);
    const goal = 1_000_000_000;
    const p = Math.max(0, Math.min(1, this.game.state.fragments / goal));
    const fill = document.getElementById('progressFill');
    const label = document.getElementById('progressText');
    if (fill) fill.style.width = `${(p*100).toFixed(2)}%`;
    if (label) label.textContent = `${(p*100).toFixed(2)}% to 1,000,000,000`;
    const shardsEl = document.getElementById('shards');
    if (shardsEl) shardsEl.textContent = this.format(this.game.state.shards || 0);
  }

  renderUpgrades() {
    const defs = this.game.upgradeDefs;
    this.upgradesRoot.innerHTML = '';
    for (let i = 0; i < defs.length; i++) {
      const def = defs[i];
      const owned = this.game.state.upgrades[def.id] || 0;
      const prevOwned = i > 0 ? (this.game.state.upgrades[defs[i-1].id] || 0) : 0;
      const shouldReveal = (i === 0) || owned > 0 || prevOwned >= 5 || this.revealedUpgrades.has(def.id);
      if (shouldReveal) this.revealedUpgrades.add(def.id);
      if (!this.revealedUpgrades.has(def.id)) continue;
      const cost = this.game.currentCost(def);
      const can = this.game.state.fragments >= cost;
      const el = document.createElement('div');
      el.className = 'upgrade';
      el.innerHTML = `
        <div class="row">
          <div class="icon">${def.icon || '⬜'}</div>
          <div class="meta">
            <div class="title">${def.title}</div>
            <div class="owned">Owned: ${owned}</div>
            <div class="desc">${def.desc || ''}</div>
          </div>
        </div>
        <div class="side">
          <div class="cost">Cost: ${this.format(cost)}</div>
          <button ${can ? '' : 'disabled'} data-id="${def.id}">Buy</button>
        </div>
      `;
      el.querySelector('button').addEventListener('click', () => this.onBuy(def.id));
      this.upgradesRoot.appendChild(el);
    }
    this.renderPerks();
    if (this.game.state.inVoid) this.renderFUs(); else this.toggleFUs(false);
  }

  renderPerks() {
    if (!this.perksRoot) return;
    this.perksRoot.innerHTML = '';
    for (const def of this.game.perkDefs) {
      const owned = !!this.game.state.perks[def.id];
      const cost = def.cost;
      const meetsReveal = owned || (this.game.state.fragments >= cost * 0.1) || this.revealedPerks.has(def.id);
      if (meetsReveal) this.revealedPerks.add(def.id);
      if (!this.revealedPerks.has(def.id)) continue;
      const canBuy = this.game.state.fragments >= cost && !owned;
      const el = document.createElement('div');
      el.className = 'upgrade';
      el.innerHTML = `
        <div class="row">
          <div class="icon">${def.icon || '⭐'}</div>
          <div class="meta">
            <div class="title">${def.title}</div>
            <div class="desc">${def.desc || ''}</div>
          </div>
        </div>
        <div class="side">
          <div class="cost">Cost: ${this.format(cost)}</div>
          <button ${canBuy ? '' : 'disabled'} data-id="${def.id}">${owned ? 'Owned' : 'Buy'}</button>
        </div>
      `;
      el.querySelector('button').addEventListener('click', () => this.onBuyPerk(def.id));
      this.perksRoot.appendChild(el);
    }
  }

  renderFUs() {
    this.toggleFUs(true);
    this.fusRoot.innerHTML = '';
    for (const def of this.game.fuDefs) {
      const owned = !!this.game.state.fus[def.id];
      const canBuy = (this.game.state.shards || 0) >= def.cost && !owned;
      const el = document.createElement('div');
      el.className = 'upgrade';
      el.innerHTML = `
        <div class="row">
          <div class="icon">⟡</div>
          <div class="meta">
            <div class="title">${def.title}</div>
          </div>
        </div>
        <div class="side">
          <div class="cost">Cost: ${this.format(def.cost)} Shards</div>
          <button ${canBuy ? '' : 'disabled'} data-id="${def.id}">${owned ? 'Owned' : 'Buy'}</button>
        </div>
      `;
      el.querySelector('button').addEventListener('click', () => this.onBuyFU(def.id));
      this.fusRoot.appendChild(el);
    }
  }

  toggleFUs(show) {
    if (this.fuHeader) this.fuHeader.style.display = show ? '' : 'none';
    if (this.fusRoot) this.fusRoot.style.display = show ? '' : 'none';
  }

  updateAffordability() {
    const fr = this.game.state.fragments, shards = this.game.state.shards || 0;
    for (const d of this.game.upgradeDefs) { if (!this.revealedUpgrades.has(d.id)) continue; const b = this.upgradesRoot.querySelector(`button[data-id="${d.id}"]`); if (b) b.disabled = fr < this.game.currentCost(d); }
    for (const d of this.game.perkDefs) { if (!this.revealedPerks.has(d.id)) continue; const b = this.perksRoot.querySelector(`button[data-id="${d.id}"]`); if (b) { const owned = !!this.game.state.perks[d.id]; b.textContent = owned ? 'Owned' : 'Buy'; b.disabled = owned || fr < d.cost; } }
    if (this.game.state.inVoid) for (const d of this.game.fuDefs) { const b = this.fusRoot.querySelector(`button[data-id="${d.id}"]`); if (b) { const owned = !!this.game.state.fus[d.id]; b.textContent = owned ? 'Owned' : 'Buy'; b.disabled = owned || shards < d.cost; } }
  }

  showFloater(text, ndcX, ndcY) {
    const el = document.createElement('div');
    el.className = 'floater';
    el.textContent = text;
    const rect = this.floaters.getBoundingClientRect();
    el.style.left = `${ndcX * rect.width}px`;
    el.style.top = `${ndcY * rect.height}px`;
    this.floaters.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  showTooltip(text) {
    if (!this.tooltip) return;
    this.tooltip.textContent = text;
    this.tooltip.style.display = 'block';
  }

  hideTooltip() {
    if (this.tooltip) this.tooltip.style.display = 'none';
  }
}
/* ...existing code... */
