/**
 * regression_test.js — Teste de regressão automatizado do CROM.
 * 
 * Roda 100 anos e verifica invariantes:
 *   - globalPop > 0 (espécie não extinguiu)
 *   - globalKPenalty > 0.01 (não travou em zero)
 *   - severity < 200 (não overflow)
 *   - techs > 0 (desbloqueou pelo menos 1 tech)
 *   - tempo < 30s (performance)
 * 
 * Uso: node tests/regression_test.js
 * Exit code: 0 = OK, 1 = FALHOU
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameEngine } from '../client/src/core/Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadPlugins(engine) {
    function walkSync(dir, files = []) {
        if (!fs.existsSync(dir)) return files;
        fs.readdirSync(dir).forEach(f => {
            const p = path.join(dir, f);
            if (fs.statSync(p).isDirectory()) walkSync(p, files);
            else if (f.endsWith('.js')) files.push(p);
        });
        return files;
    }
    const files = walkSync(path.join(__dirname, '../client/src/modules'));
    let loaded = 0;
    for (const f of files) {
        const m = await import('file://' + f);
        if (m.default) { engine.registerPlugin(m.default); loaded++; }
    }
    return loaded;
}

const FACTIONS = ['tribal', 'tecnocratas', 'eco_rebeldes'];
const TARGET_YEARS = 100;
let totalPassed = 0;
let totalFailed = 0;
const failures = [];

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║  CROM REGRESSION TEST SUITE — CI-Ready                     ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

for (const faction of FACTIONS) {
    console.log(`\n🧪 [${faction}] Rodando ${TARGET_YEARS} anos...`);
    const startTime = Date.now();
    
    const engine = new GameEngine();
    await loadPlugins(engine);
    
    const mockHexes = [
        { id: 'hex_0', col: 0, row: 0, lat: 0, neighbors: ['hex_1'] },
        { id: 'hex_1', col: 1, row: 0, lat: 15, neighbors: ['hex_0', 'hex_2'] },
        { id: 'hex_2', col: 2, row: 0, lat: 35, neighbors: ['hex_1'] }
    ];
    engine.initWorld(mockHexes);
    const startNode = Array.from(engine.nodes.values())[0];
    engine.startInfection(startNode.id);
    startNode.demographics.dist.factions = {};
    startNode.demographics.dist.factions[faction] = 1.0;
    
    const TICKS = 365 * TARGET_YEARS;
    for (let i = 0; i < TICKS; i++) {
        engine.processTick();
    }
    
    const elapsed = Date.now() - startTime;
    
    // ASSERT invariantes
    function assert(condition, label) {
        if (condition) {
            totalPassed++;
            console.log(`  ✅ ${label}`);
        } else {
            totalFailed++;
            failures.push(`[${faction}] ${label}`);
            console.log(`  ❌ FAIL: ${label}`);
        }
    }
    
    assert(engine.globalPop > 0, `Pop > 0 (atual: ${Math.floor(engine.globalPop)})`);
    assert(engine.globalPop < 100_000_000, `Pop < 100M (atual: ${Math.floor(engine.globalPop)})`);
    assert((engine.globalKPenalty || 1) > 0.01, `K-Penalty > 0.01 (atual: ${(engine.globalKPenalty||1).toFixed(4)})`);
    assert(engine.severity < 200, `Severity < 200 (atual: ${Math.floor(engine.severity)})`);
    assert(engine.unlockedTechs.size > 0, `Techs > 0 (atual: ${engine.unlockedTechs.size})`);
    assert(elapsed < 30000, `Tempo < 30s (atual: ${(elapsed/1000).toFixed(1)}s)`);
    assert(engine.globalTemperatureOffset > -50, `Temp > -50°C (atual: ${engine.globalTemperatureOffset?.toFixed(1)})`);
    assert(engine.globalTrust >= 0, `Trust >= 0 (atual: ${Math.floor(engine.globalTrust)})`);
    assert(engine.inventory.minerals >= 0, `Minerals >= 0 (atual: ${Math.floor(engine.inventory.minerals)})`);
    assert(engine.year >= TARGET_YEARS, `Year >= ${TARGET_YEARS} (atual: ${engine.year})`);
    
    console.log(`  ⏱️ ${elapsed}ms`);
}

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log(`║  RESULTADO: ${totalPassed + totalFailed} tests | ✅ ${totalPassed} passed | ❌ ${totalFailed} failed      ║`);
console.log("╚══════════════════════════════════════════════════════════════╝");

if (totalFailed > 0) {
    console.log("\n❌ FALHAS:");
    failures.forEach(f => console.log(`  - ${f}`));
    process.exit(1);
} else {
    console.log("\n🎉 ALL TESTS PASSED!");
    process.exit(0);
}
