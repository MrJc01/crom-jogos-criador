/**
 * ConfigLoader — Carregador universal de configuração do CROM.
 * 
 * Uso:
 *   import { Config } from '../config/ConfigLoader.js';
 *   const val = Config.get('severity.disasterThreshold'); // 95
 *   const biome = Config.get('biomes.DESERT');
 *   const allEvents = Config.events();
 * 
 * Todas as constantes mágicas vivem nos JSONs.
 * Nenhuma probabilidade, %, ou threshold deve ser hardcoded nos scripts.
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

let GameConfig, EventsConfig, TechTreeConfig, FactionsConfig, RecipesConfig, DemographicsConfig, EconomyConfig;

// Compatível com Node.js (testes) E Vite (browser)
try {
    // Vite bundler: suporta import direto de JSON
    if (typeof import.meta.glob === 'function' || (typeof process === 'undefined')) {
        // Browser/Vite path — dynamic import não funciona aqui, usa fallback inline
        GameConfig = null;
        EventsConfig = null;
    }
} catch (e) {
    // Fallback silencioso
}

// Node.js path: usa createRequire para carregar JSON sem assertion
if (!GameConfig) {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const require = createRequire(import.meta.url);
        GameConfig = require(join(__dirname, 'GameConfig.json'));
        EventsConfig = require(join(__dirname, 'EventsConfig.json'));
        try { TechTreeConfig = require(join(__dirname, 'TechTreeConfig.json')); } catch(e) { TechTreeConfig = {}; }
        try { FactionsConfig = require(join(__dirname, 'FactionsConfig.json')); } catch(e) { FactionsConfig = {}; }
        try { RecipesConfig = require(join(__dirname, 'RecipesConfig.json')); } catch(e) { RecipesConfig = {}; }
        try { DemographicsConfig = require(join(__dirname, 'DemographicsConfig.json')); } catch(e) { DemographicsConfig = {}; }
        try { EconomyConfig = require(join(__dirname, 'EconomyConfig.json')); } catch(e) { EconomyConfig = {}; }
    } catch (e) {
        // Fallback para hardcoded mínimo se tudo falhar
        console.warn('[ConfigLoader] Falha ao carregar JSONs, usando defaults mínimos:', e.message);
        GameConfig = {
            engine: { tickRate: 2465, baseTrustDecayPerYear: 0.95, initialTrust: 100, bubbleSpawnChance: 0.02, bubbleCrisisThreshold: 0.8, bubbleCrisisChance: 0.7 },
            severity: { logMultiplier: 15, logOffset: -30, maxSeverity: 100, disasterThreshold: 95 },
            demographics: { baseGrowthRate: 0.02, migrationThreshold: 0.95, geneticWinter: { popThreshold: 5000, yearThreshold: 50, dailyChance: 0.01, kPenaltyMultiplier: 0.85, kPenaltyRecoveryRate: 1.002, kPenaltyMinimum: 0.05 }, darkAge: { peakPopThreshold: 100000, popCollapseRatio: 0.30, dailyTechLossChance: 0.05, peakResetMultiplier: 1.5 } },
            biomes: { DESERT: { id: 'desert', name: 'Deserto', difficulty: 1.0, capacityBase: 10000 }, TUNDRA: { id: 'tundra', name: 'Tundra', difficulty: 0.9, capacityBase: 20000 }, PLAINS: { id: 'plains', name: 'Planície Temperada', difficulty: 0.2, capacityBase: 500000 }, JUNGLE: { id: 'jungle', name: 'Floresta Tropical', difficulty: 0.5, capacityBase: 100000 } },
            biomeResources: { jungle: { wood: 8000, water: 6000, mineralsMin: 1000, mineralsMax: 6000 }, plains: { wood: 4000, water: 6000, mineralsMin: 1000, mineralsMax: 6000 }, tundra: { wood: 1000, water: 6000, mineralsMin: 1000, mineralsMax: 6000 }, desert: { wood: 1000, water: 500, mineralsMin: 1000, mineralsMax: 6000 } },
            capacityDivisor: 20,
            seasons: { winterStart: 271, summerStart: 91, summerEnd: 180, winterModifier: 0.70, summerModifier: 1.20, winterWoodBurnDivisor: 1000 },
            climate: { emissionThresholdMinerals: 100000, emissionThresholdWood: 50000, dailyEmissionRate: 0.001, permafrostTriggerTemp: 5.0, permafrostTempJump: 2.0, permafrostKPenalty: 0.80, climatePenaltyMultiplier: 0.05, climatePenaltyFloor: 0.10, policyForestSeasonPenalty: 0.80, policyForestWoodGainDivisor: 5000, policyForestTempRecovery: 0.005, policyWaterSocialPressureRate: 0.01 },
            stockDecay: { wood: 0.999, water: 0.995, minerals: 0.9999 },
            eras: [ { name: 'Idade da Pedra', minTechs: 0, mult: 1 }, { name: 'Idade do Cobre', minTechs: 5, mult: 3 }, { name: 'Idade do Bronze', minTechs: 12, mult: 10 }, { name: 'Idade do Ferro', minTechs: 20, mult: 50 }, { name: 'Era Industrial', minTechs: 30, mult: 200 }, { name: 'Era da Informação', minTechs: 40, mult: 1000 }, { name: 'Era Espacial', minTechs: 50, mult: 5000 } ],
            greatFilter: { nuclear: { techRequired: 'tech_nuclear', trustThreshold: 20, socialPressureThreshold: 0.80, dailyChance: 0.005 }, kessler: { eraMultThreshold: 5000, dailyDebrisRate: 0.01, debrisThreshold: 10.0 } },
            pressures: { tectonic: { highMineralThreshold: 50000, highRate: 0.0001, lowRate: 0.00001 }, climatic: { lowWoodThreshold: 100000, highRate: 0.0005, lowRate: 0.00005 }, biological: { highPopThreshold: 1000000, highRate: 0.0002, lowRate: 0.00002 }, social: { highPopThreshold: 500000, lowTrustThreshold: 80, highRate: 0.001, lowRate: 0.0001 } },
            dnaGeneration: { popPerPoint: 100000, computerBonusBase: 1 },
            warConfig: { warChance: 0.05, techCostMultiplier: 1.0 }
        };
        EventsConfig = {};
    }
}

class ConfigManager {
    constructor() {
        this._game = GameConfig;
        this._events = EventsConfig;
        this._techs = TechTreeConfig || {};
        this._factions = FactionsConfig || {};
        this._recipes = RecipesConfig || {};
        this._demographics = DemographicsConfig || {};
        this._economy = EconomyConfig || {};
    }

    /**
     * Acessa qualquer valor do GameConfig via dot-notation.
     */
    get(path, defaultValue = undefined) {
        const keys = path.split('.');
        let current = this._game;
        for (const key of keys) {
            if (current === undefined || current === null) return defaultValue;
            current = current[key];
        }
        return current !== undefined ? current : defaultValue;
    }

    /**
     * Acessa config de eventos via dot-notation.
     */
    event(path, defaultValue = undefined) {
        const keys = path.split('.');
        let current = this._events;
        for (const key of keys) {
            if (current === undefined || current === null) return defaultValue;
            current = current[key];
        }
        return current !== undefined ? current : defaultValue;
    }

    events() { return this._events; }
    game() { return this._game; }
    
    /** Acessa config de techs. */
    tech(id) { return this._techs[id]; }
    techs() { return this._techs; }
    
    /** Acessa config de facções. */
    faction(id) { return this._factions[id]; }
    factions() { return this._factions; }
    
    /** Acessa config de receitas. */
    recipe(id) { return this._recipes[id]; }
    recipes() { return this._recipes; }
    
    /** Acessa config demográfica. */
    demographics() { return this._demographics; }
    
    /** Acessa config econômica. */
    economy() { return this._economy; }

    /**
     * Calcula severidade logarítmica (FIX P0).
     * log10(5M) * 15 - 30 = 70.5 (sobrevivível!)
     * Antes: 5M / 50000 = 100 (wipe instantâneo)
     */
    calculateSeverity(globalPop, severityIncrease = 0) {
        const cfg = this._game.severity;
        if (globalPop <= 0) return 0;
        const logPop = Math.log10(Math.max(1, globalPop));
        const raw = (logPop * cfg.logMultiplier) + cfg.logOffset + severityIncrease;
        return Math.min(cfg.maxSeverity, Math.max(0, Math.floor(raw)));
    }

    /**
     * Determina a era atual baseada no número de techs.
     */
    getCurrentEra(unlockedTechCount) {
        const eras = this._game.eras;
        for (let i = eras.length - 1; i >= 0; i--) {
            if (unlockedTechCount >= eras[i].minTechs) return eras[i];
        }
        return eras[0];
    }

    /**
     * Recuperação gradual do globalKPenalty (FIX P0).
     */
    recoverKPenalty(currentK) {
        const cfg = this._game.demographics.geneticWinter;
        if (currentK >= 1.0) return 1.0;
        return Math.min(1.0, currentK * cfg.kPenaltyRecoveryRate);
    }
}

export const Config = new ConfigManager();
