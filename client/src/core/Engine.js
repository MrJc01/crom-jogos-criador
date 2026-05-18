import { RegionNode } from './RegionNode.js';
import { TechTree } from './TechTree.js';
import { Economy } from './Economy.js';
import { KnowledgeBase } from './KnowledgeBase.js';
import { SpeciesGenerator } from '../modules/generation/SpeciesGenerator.js';
import { FactionsData } from './FactionsData.js';
export const Biomes = {
  DESERT: { id: 'desert', name: 'Deserto', difficulty: 1.0, capacityBase: 10000 },
  TUNDRA: { id: 'tundra', name: 'Tundra', difficulty: 0.9, capacityBase: 20000 },
  PLAINS: { id: 'plains', name: 'Planície Temperada', difficulty: 0.2, capacityBase: 500000 },
  JUNGLE: { id: 'jungle', name: 'Floresta Tropical', difficulty: 0.5, capacityBase: 100000 }
};

export class GameEngine {
  constructor(customConfig = {}) {
    this.config = Object.assign({
        warChance: 0.05,
        disasterThreshold: 95,
        techCostMultiplier: 1.0,
        baseGrowth: 1.0
    }, customConfig);

    this.nodes = new Map();
    this.globalPop = 0;
    this.day = 0;
    this.year = 1;
    this.tickRate = 2465; 
    this.isRunning = false;
    this.speedMultiplier = 1;
    this.intervalId = null;
    
    this.adaptationPoints = 0;
    this.severity = 0; 
    this.globalKPenalty = 1.0;
    this.tradeRoutes = [
      { sourceId: 'BR', targetId: 'AO', type: 'sea' },
      { sourceId: 'US', targetId: 'GB', type: 'air' },
      { sourceId: 'RU', targetId: 'CN', type: 'rail' },
      { sourceId: 'IN', targetId: 'ZA', type: 'sea' },
      { sourceId: 'AU', targetId: 'ID', type: 'sea' },
      { sourceId: 'BR', targetId: 'US', type: 'air' },
      { sourceId: 'FR', targetId: 'DZ', type: 'sea' },
      { sourceId: 'CN', targetId: 'JP', type: 'sea' }
    ];
    
    this.inventory = { wood: 0, water: 0, minerals: 0, silicon: 0, chips: 0, computers: 0 };
    this.globalTrust = 100.0; // Confiança Global inicia em 100%
    
    this.techTree = new TechTree();
    this.economy = new Economy();
    this.knowledge = new KnowledgeBase();
    
    this.onTick = null;
    this.onEvent = null; 

    this.plugins = [];
    this.loadPlugins();
  }

  loadPlugins() {
      if (typeof import.meta === 'undefined' || !import.meta.glob) {
          console.warn("[Engine] import.meta.glob indisponível. Plugins devem ser injetados manualmente.");
          return;
      }
      
      const biologyModules = import.meta.glob('../modules/biology/*.js', { eager: true });
      const sociologyModules = import.meta.glob('../modules/sociology/**/*.js', { eager: true });
      const economyModules = import.meta.glob('../modules/economy/*.js', { eager: true });
      const recipesModules = import.meta.glob('../modules/economy/recipes/*.js', { eager: true });
      const techModules = import.meta.glob('../modules/technologies/**/*.js', { eager: true });
      const eventModules = import.meta.glob('../modules/events/**/*.js', { eager: true });
      const knowledgeModules = import.meta.glob('../modules/knowledge/**/*.js', { eager: true });
      
      this.injectModules(biologyModules);
      this.injectModules(sociologyModules);
      this.injectModules(economyModules);
      this.injectModules(recipesModules);
      this.injectModules(techModules);
      this.injectModules(eventModules);
      this.injectModules(knowledgeModules);
  }

  injectModules(modulesMap) {
      for (const path in modulesMap) {
          const plugin = modulesMap[path].default;
          if (!plugin) continue;
          this.registerPlugin(plugin);
      }
  }

  registerPlugin(plugin) {
      if (plugin.type === 'technology') {
          this.techTree.register(plugin);
      } else if (plugin.type === 'recipe') {
          this.economy.register(plugin);
      } else if (plugin.type === 'knowledge') {
          this.knowledge.register(plugin);
      } else {
          this.plugins.push(plugin);
      }
  }


  initWorld(hexNodes) {
    // 1. Gera 5 espécies mundiais base
    const startingSpeciesMap = SpeciesGenerator.generateSpecies(5);
    FactionsData.injectSpeciesMap(startingSpeciesMap);
    this.startingSpeciesIds = Object.keys(startingSpeciesMap);

    const biomeKeys = Object.keys(Biomes);
    hexNodes.forEach(hex => {
      const id = hex.id;
      // Latitude baseada no Y do SVG para decidir o bioma
      // Vamos inferir que o equador fica no meio
      const absLat = Math.abs(hex.lat || 0);
      let biomeKey = 'PLAINS';
      if (absLat < 20) biomeKey = 'JUNGLE';
      else if (absLat > 60) biomeKey = 'TUNDRA';
      else if (Math.random() < 0.2) biomeKey = 'DESERT'; // Desertos aleatórios em latitudes médias
      
      const biome = Biomes[biomeKey];
      // Escalar capacidade para baixo porque temos centenas de hexágonos
      const capacity = biome.capacityBase / 20; 
      
      const resources = {
          wood: biome.id === 'jungle' ? 8000 : (biome.id === 'plains' ? 4000 : 1000),
          water: biome.id === 'desert' ? 500 : 6000,
          minerals: Math.floor(Math.random() * 5000) + 1000
      };
      
      this.nodes.set(id, new RegionNode(id, `Região ${id}`, capacity, biome, resources, hex.neighbors));
    });

    // Criar rotas multimodais aleatórias entre hexágonos costeiros (menos de 6 vizinhos)
    const coastals = hexNodes.filter(h => h.neighbors.length > 0 && h.neighbors.length < 6);
    this.tradeRoutes = [];
    if (coastals.length > 10) {
        for (let i = 0; i < 15; i++) {
            const h1 = coastals[Math.floor(Math.random() * coastals.length)];
            const h2 = coastals[Math.floor(Math.random() * coastals.length)];
            if (h1.id !== h2.id) {
                const types = ['sea', 'air', 'rail'];
                this.tradeRoutes.push({
                    sourceId: h1.id, targetId: h2.id,
                    type: types[Math.floor(Math.random() * types.length)]
                });
            }
        }
    }
  }

  startInfection(regionId, speciesId = null) {
    const region = this.nodes.get(regionId);
    if (region && !region.infected) {
      if (speciesId) {
          region.demographics.dist.factions = { [speciesId]: 1.0 };
      } else if (this.startingSpeciesIds && this.startingSpeciesIds.length > 0) {
          // Pega uma espécie aleatória baseada no bioma ou puramente aleatória
          const randomSp = this.startingSpeciesIds[Math.floor(Math.random() * this.startingSpeciesIds.length)];
          region.demographics.dist.factions = { [randomSp]: 1.0 };
      }
      
      region.infect(100);
      this.globalPop += 100;
      return true;
    }
    return false;
  }

  get unlockedTechs() { return this.techTree.unlocked; }
  
  buyTechnology(techId) { return this.techTree.buy(techId, this); }

  craftItem(recipeId) { return this.economy.startCraft(recipeId, this); }

  play() { if (!this.isRunning) { this.isRunning = true; this.scheduleNextTick(); } }
  pause() { this.isRunning = false; if (this.intervalId) { clearTimeout(this.intervalId); this.intervalId = null; } }
  setSpeed(mult) { this.speedMultiplier = mult; if (this.isRunning) { this.pause(); this.play(); } }

  scheduleNextTick() {
    this.intervalId = setTimeout(() => {
      this.processTick();
      if (this.isRunning) this.scheduleNextTick();
    }, this.tickRate / this.speedMultiplier);
  }

  get currentEra() {
      const size = this.unlockedTechs.size;
      if (size < 5) return { name: 'Idade da Pedra', mult: 1 };
      if (size < 12) return { name: 'Idade do Cobre', mult: 3 };
      if (size < 20) return { name: 'Idade do Bronze', mult: 10 };
      if (size < 30) return { name: 'Idade do Ferro', mult: 50 };
      if (size < 40) return { name: 'Era Industrial', mult: 200 };
      if (size < 50) return { name: 'Era da Informação', mult: 1000 };
      return { name: 'Era Espacial', mult: 5000 };
  }

  processTick() {
    this.day++;
    if (this.day > 365) {
        this.day = 1;
        this.year++;
        // Tarefa 22: Trust decai 5% ao ano
        this.globalTrust = Math.max(0, this.globalTrust * 0.95);
    }
    
    // Multiplicador da Era Atual
    const eraInfo = this.currentEra;
    
    // Calcula Modificadores Globais dinamicamente através da Tech Tree
    let global_K_boost = 1.0 * eraInfo.mult;
    let global_r_boost = 1.0;
    let severity_increase = 0;
    
    this.techTree.unlocked.forEach(techId => {
        const tech = this.techTree.technologies.get(techId);
        if (tech && tech.modifiers) {
            if (tech.modifiers.global_K_boost) global_K_boost *= tech.modifiers.global_K_boost;
            if (tech.modifiers.global_r_boost) global_r_boost *= tech.modifiers.global_r_boost;
            if (tech.modifiers.severity_flat_increase) severity_increase += tech.modifiers.severity_flat_increase;
        }
    });

    const globalRules = {
        base_r: 0.02,
        migrationThreshold: 0.95,
        global_K_boost,
        global_r_boost,
        globalKPenalty: this.globalKPenalty
    };

    let newGlobalPop = 0;
    
    // Roda os plugins de lógica em cada nó
    this.nodes.forEach(node => {
        if (!node.infected) return;
        this.plugins.forEach(plugin => {
            if (plugin.type !== 'event') {
                plugin.applyTick(node, globalRules, this);
            }
        });
        newGlobalPop += node.demographics.total;
    });
    
    this.globalPop = newGlobalPop;
    
    // Agregação demográfica global (para a UI de Facções)
    this.globalDemographics = { factions: {} };
    this.nodes.forEach(node => {
        if (!node.infected) return;
        for (const [fac, percentage] of Object.entries(node.demographics.dist.factions)) {
            const count = percentage * node.demographics.total;
            this.globalDemographics.factions[fac] = (this.globalDemographics.factions[fac] || 0) + count;
        }
    });

    // Processa a Sabedoria (Aprendizado Passivo)
    this.knowledge.processTick(this);
    
    // Processa a Economia Orgânica
    this.economy.processTick(this);

    // Evolução Autônoma (Zero-Player Mode)
    this.techTree.processAutonomousEvolution(this);

    // Geração passiva de DNA (Adaptação) com suporte a fracionário probabilístico
    const computerBonus = 1 + (this.inventory.computers || 0);
    let ptsGenerated = Math.floor(this.globalPop / 100000);
    if (Math.random() < (this.globalPop % 100000) / 100000) {
        ptsGenerated += 1;
    }
    this.adaptationPoints += (ptsGenerated * computerBonus);
    
    // Severidade e Eventos (Anticorpos)
    this.severity = Math.min(100, Math.floor(this.globalPop / 50000) + severity_increase);
    
    this.plugins.forEach(plugin => {
        if (plugin.type === 'event') {
            let shouldTrigger = false;
            if (typeof plugin.triggerProbability === 'function') {
                shouldTrigger = Math.random() < plugin.triggerProbability(this);
            } else if (typeof plugin.triggerCondition === 'function') {
                shouldTrigger = plugin.triggerCondition(this);
            }
            
            if (shouldTrigger) {
                const result = plugin.applyEvent(this);
                if (result && this.onEvent) {
                    // result é agora um objeto { message, nodeId, type, color }
                    this.onEvent(result, result.type || "disaster");
                }
            }
        }
    });

    // Bubble Spawner (Interação do Jogador)
    // 2% de chance por dia de gerar uma bolha (Laranja de DNA ou Vermelha de Crise)
    if (Math.random() < 0.02 && this.globalPop > 0) {
        const nodesArray = Array.from(this.nodes.values()).filter(n => n.infected);
        if (nodesArray.length > 0) {
            const randomNode = nodesArray[Math.floor(Math.random() * nodesArray.length)];
            // Se o nó estiver superlotado (> 80%), grande chance de ser bolha de Crise
            const isCrisis = (randomNode.demographics.total / randomNode.capacity) > 0.8 && Math.random() < 0.7;
            const bType = isCrisis ? 'crisis' : 'dna';
            
            if (this.onEvent) {
                this.onEvent({ nodeId: randomNode.id, type: bType }, "bubble_spawn");
            }
        }
    }

    if (this.onTick) this.onTick(this);
  }
}
