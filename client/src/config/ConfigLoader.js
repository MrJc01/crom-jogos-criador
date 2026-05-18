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

import GameConfigData from './GameConfig.json' assert { type: 'json' };
import EventsConfigData from './EventsConfig.json' assert { type: 'json' };

// Tenta importar as outras (como já existem, a importação estática funciona)
import TechTreeConfigData from './TechTreeConfig.json' assert { type: 'json' };
import FactionsConfigData from './FactionsConfig.json' assert { type: 'json' };
import RecipesConfigData from './RecipesConfig.json' assert { type: 'json' };
import DemographicsConfigData from './DemographicsConfig.json' assert { type: 'json' };
import EconomyConfigData from './EconomyConfig.json' assert { type: 'json' };

let GameConfig = GameConfigData;
let EventsConfig = EventsConfigData;
let TechTreeConfig = TechTreeConfigData;
let FactionsConfig = FactionsConfigData;
let RecipesConfig = RecipesConfigData;
let DemographicsConfig = DemographicsConfigData;
let EconomyConfig = EconomyConfigData;

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
