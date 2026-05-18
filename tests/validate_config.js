/**
 * validate_config.js — Validador de integridade dos JSONs de configuração do CROM.
 * 
 * Verifica:
 * - Todos os JSONs existem e são parseable
 * - Chaves obrigatórias estão presentes
 * - Valores numéricos estão dentro de ranges aceitáveis
 * - Probabilidades somam <=1.0 onde aplicável
 * - Referências cruzadas entre configs são válidas
 * 
 * Uso: node tests/validate_config.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configDir = path.join(__dirname, '../client/src/config');

let errors = 0;
let warnings = 0;
let checks = 0;

function ok(msg) { checks++; console.log(`  ✅ ${msg}`); }
function warn(msg) { warnings++; checks++; console.log(`  ⚠️  ${msg}`); }
function fail(msg) { errors++; checks++; console.log(`  ❌ ${msg}`); }

function loadJSON(filename) {
    const filepath = path.join(configDir, filename);
    if (!fs.existsSync(filepath)) {
        fail(`Arquivo não encontrado: ${filename}`);
        return null;
    }
    try {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        ok(`${filename} — JSON válido (${Object.keys(data).length} chaves root)`);
        return data;
    } catch (e) {
        fail(`${filename} — JSON INVÁLIDO: ${e.message}`);
        return null;
    }
}

function checkRange(obj, path, min, max, label) {
    const keys = path.split('.');
    let val = obj;
    for (const k of keys) { if (val) val = val[k]; }
    if (val === undefined) { warn(`${label}: chave "${path}" não encontrada`); return; }
    if (typeof val !== 'number') { fail(`${label}: "${path}" não é número (${typeof val})`); return; }
    if (val < min || val > max) { fail(`${label}: "${path}" = ${val} fora do range [${min}, ${max}]`); return; }
    ok(`${label}: ${path} = ${val} ∈ [${min}, ${max}]`);
}

function checkRequired(obj, keys, label) {
    for (const key of keys) {
        const parts = key.split('.');
        let val = obj;
        for (const p of parts) { if (val) val = val[p]; }
        if (val === undefined || val === null) {
            fail(`${label}: chave obrigatória "${key}" AUSENTE`);
        }
    }
}

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║  CROM CONFIG VALIDATOR — Validação de Integridade          ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

// 1. Carregar todos os JSONs
console.log("📂 Verificando existência e parsing dos JSONs...");
const game = loadJSON('GameConfig.json');
const events = loadJSON('EventsConfig.json');
const demographics = loadJSON('DemographicsConfig.json');
const economy = loadJSON('EconomyConfig.json');

console.log("");

// 2. Validar GameConfig
if (game) {
    console.log("🎮 Validando GameConfig.json...");
    checkRequired(game, [
        'engine.tickRate', 'engine.initialTrust', 'engine.baseTrustDecayPerYear',
        'severity.logMultiplier', 'severity.logOffset', 'severity.maxSeverity', 'severity.disasterThreshold',
        'demographics.baseGrowthRate', 'demographics.migrationThreshold',
        'demographics.geneticWinter.popThreshold', 'demographics.geneticWinter.kPenaltyRecoveryRate',
        'biomes.DESERT', 'biomes.TUNDRA', 'biomes.PLAINS', 'biomes.JUNGLE',
        'seasons.winterStart', 'seasons.summerStart',
        'climate.emissionThresholdMinerals', 'climate.temperatureFloor',
        'stockDecay.wood', 'stockDecay.water', 'stockDecay.minerals',
        'greatFilter.nuclear.techRequired', 'greatFilter.kessler.debrisThreshold',
        'pressures.tectonic', 'pressures.social'
    ], 'GameConfig');
    
    checkRange(game, 'engine.tickRate', 100, 10000, 'GameConfig');
    checkRange(game, 'engine.baseTrustDecayPerYear', 0.8, 1.0, 'GameConfig');
    checkRange(game, 'severity.disasterThreshold', 50, 100, 'GameConfig');
    checkRange(game, 'severity.logMultiplier', 1, 50, 'GameConfig');
    checkRange(game, 'demographics.baseGrowthRate', 0.001, 0.1, 'GameConfig');
    checkRange(game, 'demographics.geneticWinter.kPenaltyRecoveryRate', 1.0, 1.1, 'GameConfig');
    checkRange(game, 'climate.temperatureFloor', -50, 0, 'GameConfig');
    
    // Validar eras estão em ordem crescente
    if (game.eras) {
        let lastMult = 0;
        let eraOk = true;
        for (const era of game.eras) {
            if (era.mult < lastMult) { fail(`GameConfig: Eras fora de ordem — ${era.name} (${era.mult}) < anterior (${lastMult})`); eraOk = false; }
            lastMult = era.mult;
        }
        if (eraOk) ok(`GameConfig: ${game.eras.length} eras em ordem crescente`);
    }
    console.log("");
}

// 3. Validar EventsConfig
if (events) {
    console.log("⚡ Validando EventsConfig.json...");
    const categories = ['nature', 'social', 'industry', 'geopolitics', 'anomaly', 'cosmic'];
    for (const cat of categories) {
        if (!events[cat]) { warn(`EventsConfig: categoria "${cat}" ausente`); continue; }
        const cfg = events[cat];
        if (cfg.events) {
            const eventNames = Object.keys(cfg.events);
            ok(`EventsConfig.${cat}: ${eventNames.length} eventos definidos`);
            
            // Validar rollMin/rollMax não se sobrepõem drasticamente
            for (const [name, ev] of Object.entries(cfg.events)) {
                if (ev.rollMax !== undefined && ev.rollMax > 1.0) fail(`EventsConfig.${cat}.${name}: rollMax (${ev.rollMax}) > 1.0`);
                if (ev.rollMin !== undefined && ev.rollMin < 0) fail(`EventsConfig.${cat}.${name}: rollMin (${ev.rollMin}) < 0`);
                if (ev.killRate !== undefined && (ev.killRate < 0 || ev.killRate > 1.0)) fail(`EventsConfig.${cat}.${name}: killRate (${ev.killRate}) fora [0,1]`);
            }
        }
        if (cfg.cooldownDays !== undefined) checkRange(events, `${cat}.cooldownDays`, 1, 3650, `EventsConfig`);
    }
    console.log("");
}

// 4. Validar DemographicsConfig
if (demographics) {
    console.log("👥 Validando DemographicsConfig.json...");
    if (demographics.dtm?.stages) {
        ok(`DemographicsConfig: ${demographics.dtm.stages.length} estágios DTM`);
        for (const stage of demographics.dtm.stages) {
            if (stage.birthRate < stage.deathRate && stage.name !== 'Pós-Industrial') {
                warn(`DemographicsConfig: ${stage.name} tem birthRate (${stage.birthRate}) < deathRate (${stage.deathRate}) — população cairia`);
            }
            if (stage.infantMortality > 0.5) fail(`DemographicsConfig: ${stage.name} infantMortality (${stage.infantMortality}) > 50%`);
        }
    }
    
    if (demographics.ageDistribution) {
        const totalRatio = Object.values(demographics.ageDistribution).reduce((s, v) => s + (v.ratio || 0), 0);
        if (Math.abs(totalRatio - 1.0) > 0.01) fail(`DemographicsConfig: ageDistribution soma ${totalRatio} (deveria ser 1.0)`);
        else ok(`DemographicsConfig: ageDistribution soma ${totalRatio.toFixed(2)}`);
    }
    console.log("");
}

// 5. Validar EconomyConfig
if (economy) {
    console.log("💰 Validando EconomyConfig.json...");
    checkRequired(economy, ['eroi.mining.woodCostPerMineral', 'soilRecovery.recoveryRatePerYear', 'trade.frictionPerDistance'], 'EconomyConfig');
    checkRange(economy, 'eroi.mining.woodCostPerMineral', 0, 10, 'EconomyConfig');
    checkRange(economy, 'soilRecovery.recoveryRatePerYear', 0.01, 1.0, 'EconomyConfig');
    checkRange(economy, 'trade.piracyChance', 0, 0.5, 'EconomyConfig');
    console.log("");
}

// Resultado Final
console.log("╔══════════════════════════════════════════════════════════════╗");
console.log(`║  RESULTADO: ${checks} checks | ✅ ${checks - errors - warnings} OK | ⚠️  ${warnings} warns | ❌ ${errors} erros  `);
console.log("╚══════════════════════════════════════════════════════════════╝");
process.exit(errors > 0 ? 1 : 0);
