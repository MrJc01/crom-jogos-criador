import { RegionNode } from './RegionNode.js';
import { TechTree } from './TechTree.js';
import { Economy } from './Economy.js';
import { KnowledgeBase } from './KnowledgeBase.js';
import { SpeciesGenerator } from '../modules/generation/SpeciesGenerator.js';
import { FactionsData } from './FactionsData.js';
import { Config } from '../config/ConfigLoader.js';

// Biomas carregados do GameConfig.json (Etapa 0.5: R02)
export const Biomes = Config.get('biomes');

export class GameEngine {
  constructor(customConfig = {}) {
    this.config = Object.assign({
        warChance: Config.get('warConfig.warChance'),
        disasterThreshold: Config.get('severity.disasterThreshold'),
        techCostMultiplier: Config.get('warConfig.techCostMultiplier'),
        baseGrowth: Config.get('demographics.baseGrowthRate')
    }, customConfig);

    this.nodes = new Map();
    this.globalPop = 0;
    this.day = 0;
    this.year = 1;
    this.tickRate = Config.get('engine.tickRate');
    this.isRunning = false;
    this.speedMultiplier = 1;
    this.intervalId = null;
    
    this.adaptationPoints = 0;
    this.severity = 0; 
    
    // Sistema de Cliodinâmica e Estocástica (Tarefas 52 e 53)
    this.pressures = { social: 0.0, climatic: 0.0, tectonic: 0.0, biological: 0.0 };
    this.cooldowns = {};
    
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
    this.globalTrust = Config.get('engine.initialTrust');
    
    this.techTree = new TechTree();
    this.economy = new Economy();
    this.knowledge = new KnowledgeBase();
    
    this.onTick = null;
    this.onEvent = null; 
    
    // 065. Log de História Natural (Chronicle) — Timeline persistente dos eventos
    this.chronicle = [];
    this.chronicleMaxSize = 500;
    
    // 064. Cadeias de Eventos (Efeito Borboleta) — Eventos podem disparar outros
    this.eventChains = {
        'drought':   { triggers: 'famine',  chance: 0.3, delay: 30 },
        'famine':    { triggers: 'revolt',   chance: 0.4, delay: 60 },
        'earthquake': { triggers: 'tsunami', chance: 0.5, delay: 1 },
        'volcanic':  { triggers: 'famine',   chance: 0.2, delay: 90 }
    };
    this.pendingChainedEvents = [];

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
      const agricultureModules = import.meta.glob('../modules/agriculture/*.js', { eager: true });
      const happinessModules = import.meta.glob('../modules/happiness/*.js', { eager: true });
      const governanceModules = import.meta.glob('../modules/governance/*.js', { eager: true });
      const cultureModules = import.meta.glob('../modules/culture/*.js', { eager: true });
      const educationModules = import.meta.glob('../modules/education/*.js', { eager: true });
      const infraModules = import.meta.glob('../modules/infrastructure/*.js', { eager: true });
      const tradeModules = import.meta.glob('../modules/trade/*.js', { eager: true });
      const victoryModules = import.meta.glob('../modules/victory/*.js', { eager: true });
      
      this.injectModules(biologyModules);
      this.injectModules(sociologyModules);
      this.injectModules(economyModules);
      this.injectModules(recipesModules);
      this.injectModules(techModules);
      this.injectModules(eventModules);
      this.injectModules(knowledgeModules);
      this.injectModules(agricultureModules);
      this.injectModules(happinessModules);
      this.injectModules(governanceModules);
      this.injectModules(cultureModules);
      this.injectModules(educationModules);
      this.injectModules(infraModules);
      this.injectModules(tradeModules);
      this.injectModules(victoryModules);
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

  /**
   * 065. Log de História Natural — Grava evento no chronicle persistente.
   */
  logEvent(eventData, eventType) {
      const entry = {
          year: this.year,
          day: this.day,
          tick: (this.year * 365) + this.day,
          type: eventType || 'unknown',
          message: typeof eventData === 'string' ? eventData : (eventData?.message || ''),
          pop: Math.floor(this.globalPop),
          severity: Math.floor(this.severity)
      };
      this.chronicle.push(entry);
      if (this.chronicle.length > this.chronicleMaxSize) {
          this.chronicle.shift(); // Remove o mais antigo
      }
  }

  getChronicle() { return this.chronicle; }


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
      const capacity = biome.capacityBase / Config.get('capacityDivisor');
      
      const biomeRes = Config.get(`biomeResources.${biome.id}`) || { wood: 1000, water: 6000, mineralsMin: 1000, mineralsMax: 6000 };
      const resources = {
          wood: biomeRes.wood,
          water: biomeRes.water,
          minerals: Math.floor(Math.random() * (biomeRes.mineralsMax - biomeRes.mineralsMin)) + biomeRes.mineralsMin
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
      
      // Inicializa sistemas de expansão v3
      const eraInfo = this.currentEra;
      const initialDilation = eraInfo?.timeDilation || 1;
      region.food = 10000 * initialDilation; // Boost de sobrevivência inicial maciço
      region.morale = 50; // Estável
      region.wildGame = 5000; // Fauna abundante disponível para caça
      region.famineDays = 0;
      region.crops = [];
      region.moraleFactors = {};
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
      return Config.getCurrentEra(this.unlockedTechs.size);
  }

  processTick() {
    const eraInfo = this.currentEra;
    this.deltaDays = eraInfo.timeDilation || 1;
    this.day += this.deltaDays;
    
    while (this.day > 365) {
        this.day -= 365;
        this.year++;
        // Tarefa 22: Trust decai por ano (config) — FIX: Floor para não ficar em 0 eterno
        const trustFloor = Config.get('engine.trustFloor', 5);
        this.globalTrust = Math.max(trustFloor, this.globalTrust * Config.get('engine.baseTrustDecayPerYear'));
        
        // 007/011: Aging da pirâmide etária (1x por ano)
        this.nodes.forEach(node => {
            if (node.infected && node.demographics.ageOneYear) {
                node.demographics.ageOneYear();
            }
            // FIX BALANCE: VeteranBuff decai — veteranos envelhecem/morrem
            if (node.veteranBuff > 0) {
                node.veteranBuff = Math.max(0, node.veteranBuff - 0.1); // -0.1/ano
            }
        });
        
        // FIX BALANCE: Trust regenera com estabilidade (pop crescendo = sociedade estável)
        if (this.globalPop > 1000 && this.pressures.social < 1.0) {
            this.globalTrust = Math.min(200, this.globalTrust + 0.5); // +0.5/ano se estável
        }
        
        // FIX BALANCE: Computadores obsoletam (1 por ano)
        if ((this.inventory.computers || 0) > 0) {
            this.inventory.computers = Math.max(0, this.inventory.computers - 1);
        }
    }
    
    // Multiplicador da Era Atual (declarado acima)
    
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

    // FIX BALANCE: Cap global de K_boost para evitar capacidades absurdas
    global_K_boost = Math.min(500, global_K_boost);

    // Tarefa 28: Ciclo de Estações Reais (Config: seasons)
    const seasons = Config.get('seasons');
    let seasonModifier = 1.0;
    if (this.day >= seasons.winterStart) { // Inverno
        seasonModifier = seasons.winterModifier;
        this.inventory.wood = Math.max(0, this.inventory.wood - Math.floor(this.globalPop / seasons.winterWoodBurnDivisor));
    } else if (this.day >= seasons.summerStart && this.day <= seasons.summerEnd) { // Verão
        seasonModifier = seasons.summerModifier;
    }
    
    // Tarefa 30 e 31: Aquecimento Cumulativo (Estufa e Permafrost)
    if (this.globalTemperatureOffset === undefined) this.globalTemperatureOffset = 0;
    const climate = Config.get('climate');
    if (this.inventory.minerals > climate.emissionThresholdMinerals && this.inventory.wood < climate.emissionThresholdWood) {
        this.globalTemperatureOffset += climate.dailyEmissionRate;
    }
    if (this.globalTemperatureOffset > climate.permafrostTriggerTemp && !this.permafrostMelted) {
        this.permafrostMelted = true;
        this.globalTemperatureOffset += climate.permafrostTempJump;
        this.globalKPenalty = (this.globalKPenalty || 1.0) * climate.permafrostKPenalty;
        if (this.onEvent) this.onEvent({ message: `🌡️ DERRETIMENTO DO PERMAFROST: O aquecimento global atingiu ponto crítico. O metano liberado fritou a atmosfera!`, type: "disaster", color: "#ff4400" }, "disaster");
    }
    
    // FIX Balance: Limitar temperatura ao floor configurado (evita -74°C)
    const tempFloor = climate.temperatureFloor || -10.0;
    this.globalTemperatureOffset = Math.max(tempFloor, this.globalTemperatureOffset);
    
    // Temperatura afeta brutalmente a capacidade e resiliência (se esquentar demais, a K_boost cai)
    const climatePenalty = Math.max(climate.climatePenaltyFloor, 1.0 - (this.globalTemperatureOffset * climate.climatePenaltyMultiplier));
    
    // TAREFA: Políticas Públicas
    if (!this.policies) this.policies = { forest: false, water: false };
    
    if (this.policies.forest) {
        seasonModifier *= climate.policyForestSeasonPenalty;
        this.inventory.wood += Math.floor(this.globalPop / climate.policyForestWoodGainDivisor);
        this.globalTemperatureOffset = Math.max(0, this.globalTemperatureOffset - climate.policyForestTempRecovery);
    }
    if (this.policies.water) {
        this.pressures.social = Math.min(1.0, (this.pressures.social || 0) + climate.policyWaterSocialPressureRate);
    }

    const globalRules = {
        base_r: Config.get('demographics.baseGrowthRate'),
        migrationThreshold: Config.get('demographics.migrationThreshold'),
        global_K_boost: global_K_boost * seasonModifier * climatePenalty,
        global_r_boost,
        globalKPenalty: this.globalKPenalty,
        policyWater: this.policies.water,
        deltaDays: this.deltaDays || 1
    };

    let newGlobalPop = 0;
    
    // Roda os plugins de lógica em cada nó
    this.nodes.forEach(node => {
        if (!node.infected) return;
        this.plugins.forEach(plugin => {
            if (plugin.type !== 'event' && typeof plugin.applyTick === 'function') {
                plugin.applyTick(node, globalRules, this);
            }
        });
        
        // 006/009/011: Processar DTM (nascimentos, mortalidade infantil, mortes naturais)
        if (node.demographics.processDTM) {
            const hasSanitation = this.unlockedTechs.has('saneamento_basico');
            node.demographics.processDTM(eraInfo.mult, hasSanitation, node.biome?.id || 'plains', this.deltaDays || 1);
        }
        
        // TAREFA 34 e 35: Limites Urbanos (Verticalização e Ilha de Calor)
        // Megacidades (mais de 100 mil habitantes) sofrem com atrito físico extremo
        if (node.demographics.total > 100000) {
            // TAREFA 35: Ilha de Calor (Asfalto/concreto destrói o solo permanentemente e eleva temperatura local)
            node.soil = Math.max(0, (node.soil || 0) - 0.1);
            
            // TAREFA 34: Verticalização de Espaço
            // Para manter prédios funcionando é preciso minérios (Aço/Concreto). Se não houver, o Cap colapsa.
            if (this.inventory.minerals < 1000) {
                node.capacity = Math.min(node.capacity, 100000); // Teto de vidro, forçando migração
            } else {
                this.inventory.minerals -= 1; // Custo de manutenção invisível da malha urbana
            }
        }
        
        newGlobalPop += node.demographics.total;
    });
    this.globalPop = newGlobalPop;
    
    // Tarefa 12 e 14: Decaimento de Estoque (Config: stockDecay)
    const decay = Config.get('stockDecay');
    this.inventory.wood = Math.max(0, this.inventory.wood * decay.wood);
    this.inventory.water = Math.max(0, this.inventory.water * decay.water);
    this.inventory.minerals = Math.max(0, this.inventory.minerals * decay.minerals);
    
    // TAREFA 23: Idade das Trevas (Perda de Techs se a civilização rui)
    if (!this.peakGlobalPop) this.peakGlobalPop = 0;
    if (this.globalPop > this.peakGlobalPop) this.peakGlobalPop = this.globalPop;
    
    const darkAge = Config.get('demographics.darkAge');
    if (this.peakGlobalPop > darkAge.peakPopThreshold && this.globalPop < this.peakGlobalPop * darkAge.popCollapseRatio) {
        if (Math.random() < darkAge.dailyTechLossChance && this.techTree.unlocked.size > 1) {
            const unlockedArr = Array.from(this.techTree.unlocked);
            const lostTech = unlockedArr[Math.floor(Math.random() * unlockedArr.length)];
            this.techTree.unlocked.delete(lostTech);
            if (this.onEvent) this.onEvent({ message: `📜 IDADE DAS TREVAS: O apocalipse demográfico e a morte dos sábios fez a humanidade esquecer do conhecimento da tecnologia "${lostTech}"!`, type: "disaster", color: "#555555" }, "disaster");
            this.peakGlobalPop = this.globalPop * darkAge.peakResetMultiplier;
        }
    }
    
    // 030. Custo de Manutenção de Techs (Lei de Tainter)
    // Cada tech desbloqueada custa DNA/dia para manter. Complexidade escala quadraticamente.
    if (this.day % 30 === 0 && this.techTree.unlocked.size > 3) { // Mensal, após 3 techs
        const techCount = this.techTree.unlocked.size;
        const maintenanceCost = Math.floor(techCount * techCount * 0.01); // Custo quadrático
        if (this.adaptationPoints >= maintenanceCost) {
            this.adaptationPoints -= maintenanceCost;
        } else if (Math.random() < 0.1 && techCount > 5) {
            // Sem DNA para manter → esquece uma tech aleatória
            const arr = Array.from(this.techTree.unlocked);
            const lost = arr[Math.floor(Math.random() * arr.length)];
            this.techTree.unlocked.delete(lost);
            if (this.onEvent) this.onEvent({ message: `📉 COLAPSO DE COMPLEXIDADE (Tainter): Sem recursos intelectuais para manter "${lost}". Conhecimento perdido!`, type: "warning", color: "#aa5500" }, "warning");
        }
    }
    
    // TAREFA 27: Gênios Históricos
    this.techTree.checkGeniusSpawn(this);
    
    // ==========================================
    // TAREFAS 38 a 41: O GRANDE FILTRO (ENDGAME)
    // ==========================================
    
    // TAREFA 40: Paradoxo de Fermi Silencioso (Config: greatFilter.nuclear)
    const nuke = Config.get('greatFilter.nuclear');
    if (this.techTree.unlocked.has(nuke.techRequired) && this.globalTrust < nuke.trustThreshold && this.pressures.social > nuke.socialPressureThreshold) {
        if (Math.random() < nuke.dailyChance) {
            this.nodes.forEach(n => { n.demographics.kill(n.demographics.total); n.soil = 0; n.resources.water = 0; });
            this.inventory.wood = 0; this.inventory.minerals = 0; this.globalPop = 0;
            if (this.onEvent) this.onEvent({ message: `☢️ O GRANDE FILTRO (PARADOXO DE FERMI): Uma Guerra Nuclear total aniquilou 100% da vida no planeta. A civilização falhou o teste da maturidade.`, type: "disaster", color: "#ff0000" }, "disaster");
            this.pause();
        }
    }
    
    // TAREFA 39: Inverno Genético — FIX: Penalidade aliviada na Idade da Pedra
    const genWinter = Config.get('demographics.geneticWinter');
    if (this.globalPop < genWinter.popThreshold && this.globalPop > 0 && this.year > genWinter.yearThreshold) {
        // Reduz a chance brutalmente se a humanidade mal começou
        const eraDiscount = this.currentEra.mult === 1 ? 0.1 : 1.0; 
        if (Math.random() < (genWinter.dailyChance * eraDiscount)) {
            // A penalidade é muito menor na Era 1 (0.85 ao invés de 0.5)
            const actualMultiplier = this.currentEra.mult === 1 ? 0.95 : genWinter.kPenaltyMultiplier;
            this.globalKPenalty = Math.max(genWinter.kPenaltyMinimum, this.globalKPenalty * actualMultiplier);
            if (this.onEvent) this.onEvent({ message: `🧬 INVERNO GENÉTICO: A endogamia causou falhas genéticas. Resiliência caiu!`, type: "nemesis", color: "#8800ff" }, "nemesis");
        }
    }
    
    // TAREFA 38 e 41: Síndrome de Kessler e Limites de Órbita
    // TAREFA 38+41: Síndrome de Kessler (Config: greatFilter.kessler)
    const kessler = Config.get('greatFilter.kessler');
    if (this.currentEra.mult >= kessler.eraMultThreshold) {
        if (!this.kesslerSyndrome) this.kesslerSyndrome = 0;
        this.kesslerSyndrome += kessler.dailyDebrisRate;
        if (this.kesslerSyndrome > kessler.debrisThreshold) {
            if (this.onEvent && !this.kesslerTriggered) {
                this.kesslerTriggered = true;
                this.onEvent({ message: `🛰️ SÍNDROME DE KESSLER: A órbita está selada por lixo espacial. Fugas planetárias (Arca) estão permanentemente bloqueadas!`, type: "warning", color: "#ffaa00" }, "warning");
                this.logEvent({ message: `🛰️ Kessler: órbita bloqueada` }, "kessler");
            }
        }
    }
    
    // 056. Exaustão de Metais Raros — Limite de chips quando minerais escasseiam
    if (this.day % 90 === 0) { // Trimestral
        let totalMinerals = 0;
        this.nodes.forEach(n => { totalMinerals += (n.resources?.minerals || 0); });
        if (totalMinerals < 1000 && this.currentEra.mult >= 200) {
            // Sem metais raros, não fabrica chips
            this.inventory.chips = Math.max(0, (this.inventory.chips || 0) - 1);
            if (!this._rareEarthWarned && this.onEvent) {
                this._rareEarthWarned = true;
                this.onEvent({ message: `⛏️ EXAUSTÃO DE METAIS RAROS: Minas de lítio/silício esgotaram! Produção de chips estancou. Progresso espacial comprometido.`, type: "warning", color: "#ff8800" }, "warning");
                this.logEvent({ message: `⛏️ Metais raros esgotados` }, "exhaustion");
            }
        }
    }
    
    // 061. Múltiplos Grandes Filtros — Sequência: Nuclear → Kessler → Singularidade → Heat Death
    if (this.currentEra.mult >= 1000 && this.day % 365 === 0) {
        // Filtro: Singularidade de IA — Se computadores > pop e trust < 30
        if ((this.inventory.computers || 0) > this.globalPop / 1000 && this.globalTrust < 30) {
            if (Math.random() < 0.01) {
                this.globalPop = Math.floor(this.globalPop * 0.5);
                this.nodes.forEach(n => { if (n.infected) n.demographics.kill(Math.floor(n.demographics.total * 0.5)); });
                if (this.onEvent) this.onEvent({ message: `🤖 SINGULARIDADE HOSTIL: A IA autônoma considerou humanos ineficientes e eliminou 50% da população. O Grande Filtro III foi disparado!`, type: "nemesis", color: "#ff00ff" }, "nemesis");
                this.logEvent({ message: `🤖 Singularidade Hostil` }, "singularity");
            }
        }
    }
    
    // 062. Simplificação Voluntária (Tainter) — Civilização pode regredir para sobreviver
    if (this.day % 180 === 0 && this.techTree.unlocked.size > 15) {
        // Se pressão social alta + recursos baixos → civilização "simplifica" automaticamente
        if (this.pressures.social > 3.0 && this.inventory.minerals < 500 && this.inventory.wood < 500) {
            const techsToLose = Math.min(5, Math.floor(this.techTree.unlocked.size * 0.3));
            const arr = Array.from(this.techTree.unlocked);
            for (let i = 0; i < techsToLose; i++) {
                const idx = Math.floor(Math.random() * arr.length);
                this.techTree.unlocked.delete(arr[idx]);
                arr.splice(idx, 1);
            }
            this.pressures.social = Math.max(0, this.pressures.social - 2.0);
            if (this.onEvent) this.onEvent({ message: `🏚️ SIMPLIFICAÇÃO VOLUNTÁRIA: A civilização abandonou ${techsToLose} tecnologias para reduzir complexidade e sobreviver! Pressão social aliviada.`, type: "warning", color: "#888800" }, "warning");
            this.logEvent({ message: `🏚️ Simplificação: -${techsToLose} techs` }, "simplification");
        }
    }
    
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
    const dnaGen = Config.get('dnaGeneration');
    const computerBonus = dnaGen.computerBonusBase + (this.inventory.computers || 0);
    let ptsGenerated = Math.floor(this.globalPop / dnaGen.popPerPoint);
    if (Math.random() < (this.globalPop % dnaGen.popPerPoint) / dnaGen.popPerPoint) {
        ptsGenerated += 1;
    }
    
    // FIX P0: "Renda Básica" de Sobrevivência na Idade da Pedra para evitar Soft-Lock.
    if (this.currentEra.mult === 1 && ptsGenerated === 0 && Math.random() < 0.1) {
        ptsGenerated = 1; // 10% de chance de ganhar 1 ponto a cada Tick mesmo com 10 habitantes
    }
    
    this.adaptationPoints += (ptsGenerated * computerBonus);
    
    // Sistema de Pressão Estocástica (Config: pressures)
    const pCfg = Config.get('pressures');
    this.pressures.tectonic += (this.inventory.minerals > pCfg.tectonic.highMineralThreshold) ? pCfg.tectonic.highRate : pCfg.tectonic.lowRate;
    this.pressures.climatic += (this.inventory.wood < pCfg.climatic.lowWoodThreshold) ? pCfg.climatic.highRate : pCfg.climatic.lowRate;
    this.pressures.biological += (this.globalPop > pCfg.biological.highPopThreshold) ? pCfg.biological.highRate : pCfg.biological.lowRate;
    this.pressures.social += (this.globalPop > pCfg.social.highPopThreshold && this.globalTrust < pCfg.social.lowTrustThreshold) ? pCfg.social.highRate : pCfg.social.lowRate;

    // Resfriamento de Cooldowns / Trauma (Tarefa 53)
    for (const key in this.cooldowns) {
        if (this.cooldowns[key] > 0) this.cooldowns[key] -= 1;
    }
    
    // FIX BALANCE: Pressões decaem naturalmente (entropia, adaptação social)
    this.pressures.tectonic *= 0.9995;
    this.pressures.climatic *= 0.9995;
    this.pressures.biological *= 0.9995;
    this.pressures.social *= 0.9990; // Social decai mais rápido (sociedades se adaptam)
    
    // Severidade e Eventos — FIX P0: Fórmula logarítmica em vez de linear
    this.severity = Config.calculateSeverity(this.globalPop, severity_increase);
    
    // FIX P0: Recuperação gradual do globalKPenalty (evita Inverno Genético irreversível)
    this.globalKPenalty = Config.recoverKPenalty(this.globalKPenalty);
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
    if (Math.random() < Config.get('engine.bubbleSpawnChance') && this.globalPop > 0) {
        const nodesArray = Array.from(this.nodes.values()).filter(n => n.infected);
        if (nodesArray.length > 0) {
            const randomNode = nodesArray[Math.floor(Math.random() * nodesArray.length)];
            const isCrisis = (randomNode.demographics.total / randomNode.capacity) > Config.get('engine.bubbleCrisisThreshold') && Math.random() < Config.get('engine.bubbleCrisisChance');
            const bType = isCrisis ? 'crisis' : 'dna';
            
            if (this.onEvent) {
                this.onEvent({ nodeId: randomNode.id, type: bType }, "bubble_spawn");
            }
        }
    }

    if (this.onTick) this.onTick(this);
  }
}
