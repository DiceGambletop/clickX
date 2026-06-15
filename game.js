/* ...existing code... */
export class Game {
  constructor() {
    this.state = {
      fragments: 0,
      perClickBase: 1,
      perClickMult: 1,
      perSec: 0,
      upgrades: {}, // id -> owned count
      perks: {},
      critChance: 0,
      costDiscount: 0,
      lastSave: 0,
      shards: 0,
      fus: {},
      inVoid: false
    };
    this.upgradeDefs = [
      {
        id: 'cursor',
        title: 'Auto-Forge Cursor',
        desc: '+0.1 fragments/sec',
        baseCost: 15,
        costMult: 1.15,
        type: 'passive',
        amount: 0.1
      },
      {
        id: 'pick',
        title: 'Shard Pick',
        desc: '+1 fragment per click',
        baseCost: 50,
        costMult: 1.2,
        type: 'click',
        amount: 1
      },
      {
        id: 'polish',
        title: 'Crystal Polish',
        desc: 'Click x2 multiplier',
        baseCost: 200,
        costMult: 2.5,
        type: 'mult',
        amount: 2
      },
      {
        id: 'drone',
        title: 'Forge Drone',
        desc: '+2 fragments/sec',
        baseCost: 400,
        costMult: 1.22,
        type: 'passive',
        amount: 2
      },
      {
        id: 'overclock',
        title: 'Overclock',
        desc: 'Click x1.5 multiplier',
        baseCost: 1200,
        costMult: 2.2,
        type: 'mult',
        amount: 1.5
      },
      { id:'ricochet', title:'Ricochet Logic', desc:'+2% crit chance (2x click)', baseCost: 800, costMult: 1.3, type:'crit', amount:0.02, icon:'🎯' },
      { id:'harmonics', title:'Forge Harmonics', desc:'+5% passive efficiency', baseCost: 1200, costMult:1.22, type:'efficiency', amount:0.05, icon:'🎵' },
      { id:'time', title:'Time Dilation', desc:'+0.8/sec × √owned', baseCost: 1800, costMult:1.28, type:'rootSec', amount:0.8, icon:'⏳' },
      { id:'nanobots', title:'Nanobot Brokers', desc:'-1% upgrade costs (cap 50%)', baseCost: 2200, costMult:1.35, type:'discount', amount:0.01, icon:'🤖' },
      { id:'prism', title:'Prismatic Core', desc:'Amplifies visuals', baseCost: 900, costMult:1.25, type:'visual', amount:0.15, icon:'🔷' }
    ];
    this.perkDefs = [
      { id:'precision', title:'Precision Touch', desc:'Clicks x1.25 (one-time)', cost: 3000, icon:'🛠️' },
      { id:'quantum', title:'Quantum Core', desc:'Passive income x1.20 (one-time)', cost: 4500, icon:'💠' },
      { id:'overdrive', title:'Overdrive', desc:'+2 per click (one-time)', cost: 6000, icon:'⚡' },
      { id:'singularity', title:'Mini Singularity', desc:'Everything x2 (one-time)', cost: 20000, icon:'🌀' }
    ];
    this.fuDefs = [
      { id:'fu_echo', title:'Echo Core', desc:'Clicks x2 (one-time)', cost: 5 },
      { id:'fu_flux', title:'Flux Matrix', desc:'Passive income x1.5 (one-time)', cost: 7 },
      { id:'fu_omega', title:'Omega Singularity', desc:'Everything x2 (one-time)', cost: 20 }
    ];
    this.load();
    this.recompute();
    this.saveInterval = setInterval(() => this.save(), 4000);
    this.visualEnergy = 0; // for subtle cube feedback
    this.visualVibe = 0.25;
  }

  recompute() {
    let perClickBase = 1;
    let perClickMult = 1;
    let perSec = 0;
    let critChance = 0;
    let passiveMult = 1;
    let costDiscount = 0;
    let visualBoost = 0;

    for (const u of this.upgradeDefs) {
      const owned = this.state.upgrades[u.id] || 0;
      if (!owned) continue;
      if (u.type === 'passive') perSec += u.amount * owned;
      if (u.type === 'click') perClickBase += u.amount * owned;
      if (u.type === 'mult') perClickMult *= Math.pow(u.amount, owned);
      if (u.type === 'crit') critChance += u.amount * owned;
      if (u.type === 'efficiency') passiveMult *= (1 + u.amount * owned);
      if (u.type === 'rootSec') perSec += u.amount * Math.sqrt(owned);
      if (u.type === 'discount') costDiscount = Math.min(0.5, (costDiscount + u.amount * owned));
      if (u.type === 'visual') visualBoost += u.amount * owned;
    }

    // apply perks (one-time)
    const perks = this.state.perks || {};
    if (perks.precision) perClickMult *= 1.25;
    if (perks.quantum) passiveMult *= 1.20;
    if (perks.overdrive) perClickBase += 2;
    if (perks.singularity) { perClickMult *= 2; passiveMult *= 2; perSec *= 2; }

    // apply FUs (one-time shards purchases)
    const fus = this.state.fus || {};
    if (fus.fu_echo) perClickMult *= 2;
    if (fus.fu_flux) perSec *= 1.5;
    if (fus.fu_omega) { perClickMult *= 2; perSec *= 2; }

    this.state.perClickBase = perClickBase;
    this.state.perClickMult = perClickMult;
    this.state.perSec = perSec * passiveMult;
    this.state.critChance = critChance;
    this.state.costDiscount = costDiscount;
    this.visualVibe = 0.25 + 0.03 * Object.values(this.state.upgrades).reduce((a,b)=>a+b,0) + 0.06 * Object.keys(perks).length + visualBoost;
  }

  currentCost(def) {
    const owned = this.state.upgrades[def.id] || 0;
    const base = def.baseCost * Math.pow(def.costMult, owned);
    return Math.max(1, Math.floor(base * (1 - (this.state.costDiscount || 0))));
  }

  click() {
    let gained = this.getPerClick();
    if (Math.random() < (this.state.critChance || 0)) gained *= 2;
    this.state.fragments += gained;
    this.visualEnergy = Math.min(1, this.visualEnergy + 0.25);
    return gained;
  }

  getPerClick() {
    return Math.max(1, Math.floor(this.state.perClickBase * this.state.perClickMult));
  }

  buy(id) {
    const def = this.upgradeDefs.find(u => u.id === id);
    if (!def) return false;
    const cost = this.currentCost(def);
    if (this.state.fragments < cost) return false;
    this.state.fragments -= cost;
    this.state.upgrades[id] = (this.state.upgrades[id] || 0) + 1;
    this.recompute();
    return true;
  }

  buyPerk(id) {
    const def = this.perkDefs.find(p => p.id === id);
    if (!def || this.state.perks[id]) return false;
    if (this.state.fragments < def.cost) return false;
    this.state.fragments -= def.cost;
    this.state.perks[id] = true;
    this.recompute();
    return true;
  }

  buyFU(id) {
    const def = this.fuDefs.find(f => f.id === id);
    if (!def || this.state.fus[id]) return false;
    if ((this.state.shards||0) < def.cost) return false;
    this.state.shards -= def.cost; this.state.fus[id] = true;
    this.recompute(); this.save(); return true;
  }

  update(dt) {
    if (this.state.perSec > 0) {
      this.state.fragments += this.state.perSec * dt;
    }
    // decay visual energy
    this.visualEnergy = Math.max(0, this.visualEnergy - dt * 0.6);
  }

  serialize() {
    const s = { ...this.state };
    return JSON.stringify(s);
  }

  save() {
    try {
      localStorage.setItem('fragment-forge-save', this.serialize());
      this.state.lastSave = Date.now();
    } catch {}
  }

  load() {
    try {
      const raw = localStorage.getItem('fragment-forge-save');
      if (raw) {
        const s = JSON.parse(raw);
        // defensive load
        this.state.fragments = s.fragments || 0;
        this.state.upgrades = s.upgrades || {};
        this.state.perks = s.perks || {};
        this.state.shards = s.shards || 0;
        this.state.fus = s.fus || {};
        this.state.inVoid = s.inVoid || false;
      }
    } catch {}
  }

  reset() {
    this.state.fragments = 0;
    this.state.upgrades = {};
    this.state.perks = {};
    this.recompute();
    this.save();
  }

  canPrestige() { return this.state.fragments >= 1_000_000_000; }
  shardsForPrestige() { return Math.floor(this.state.fragments / 1_000_000_000); }
  prestige() {
    const gain = this.shardsForPrestige();
    if (gain <= 0) return false;
    this.state.shards = (this.state.shards || 0) + gain;
    this.state.fragments = 0; this.state.upgrades = {}; this.state.perks = {};
    this.state.inVoid = true;
    this.recompute(); this.save();
    return true;
  }

  get visualEnergyOut() {
    return this.visualEnergy * (0.6 + this.visualVibe);
  }
}
/* ...existing code... */
