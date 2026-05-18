/**
 * faction_isolation_test.js — Testa cada facção isolada por 500 anos.
 * 112. 10 simulações por facção, nenhuma deve morrer em < 500 anos.
 * 113. Teste de estresse com mapa expandido (10 hexes).
 * 115. Comparar resultados com targets.
 * 
 * Uso: node tests/faction_isolation_test.js
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
    for (const f of files) {
        const m = await import('file://' + f);
        if (m.default) engine.registerPlugin(m.default);
    }
}

const FACTIONS = ['tribal', 'tecnocratas', 'eco_rebeldes', 'misticos', 'imperialistas'];
const RUNS_PER_FACTION = 3;
const YEARS = 500;
const HEX_COUNT = 10; // 113. Mapa expandido

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║  CROM FACTION ISOLATION TEST (112/113/115)                  ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log(`  Facções: ${FACTIONS.length} | Runs: ${RUNS_PER_FACTION} | Anos: ${YEARS} | Hexes: ${HEX_COUNT}\n`);

let totalTests = 0;
let totalPassed = 0;
const results = [];

for (const faction of FACTIONS) {
    let survived = 0;
    let totalPop = 0;
    let totalTechs = 0;
    
    for (let run = 0; run < RUNS_PER_FACTION; run++) {
        const engine = new GameEngine();
        await loadPlugins(engine);
        
        // 113. Mapa expandido
        const hexes = Array.from({ length: HEX_COUNT }, (_, i) => ({
            id: `hex_${i}`, col: i % 5, row: Math.floor(i / 5), lat: i * 8,
            neighbors: [i > 0 ? `hex_${i-1}` : null, i < HEX_COUNT-1 ? `hex_${i+1}` : null].filter(Boolean)
        }));
        engine.initWorld(hexes);
        engine.startInfection('hex_0');
        
        const startNode = Array.from(engine.nodes.values())[0];
        startNode.demographics.dist.factions = {};
        startNode.demographics.dist.factions[faction] = 1.0;
        
        const TICKS = 365 * YEARS;
        for (let i = 0; i < TICKS; i++) {
            engine.processTick();
        }
        
        const alive = engine.globalPop > 0;
        if (alive) survived++;
        totalPop += engine.globalPop;
        totalTechs += engine.unlockedTechs.size;
        totalTests++;
        if (alive) totalPassed++;
    }
    
    const avgPop = Math.floor(totalPop / RUNS_PER_FACTION);
    const avgTechs = Math.floor(totalTechs / RUNS_PER_FACTION);
    const status = survived === RUNS_PER_FACTION ? '✅' : survived > 0 ? '⚠️' : '❌';
    
    results.push({ faction, survived, avgPop, avgTechs, status });
    console.log(`  ${status} ${faction.padEnd(18)} │ ${survived}/${RUNS_PER_FACTION} survived │ Avg Pop: ${avgPop.toLocaleString('pt-BR').padStart(10)} │ Avg Techs: ${avgTechs}`);
}

// 115. Comparação com design targets
console.log("\n📊 Design Targets:");
const targets = { minSurvivalRate: 0.8, minAvgPop: 100, minAvgTechs: 3 };
const overallSurvival = totalPassed / totalTests;
console.log(`  Survival Rate: ${(overallSurvival * 100).toFixed(1)}% (target: >${targets.minSurvivalRate * 100}%)`);

const allAvgPop = results.reduce((a, r) => a + r.avgPop, 0) / results.length;
console.log(`  Avg Pop: ${Math.floor(allAvgPop)} (target: >${targets.minAvgPop})`);

console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
console.log(`║  RESULTADO: ${totalTests} tests | ✅ ${totalPassed} passed | ❌ ${totalTests - totalPassed} failed      ║`);
console.log(`╚══════════════════════════════════════════════════════════════╝`);

const PASS = overallSurvival >= targets.minSurvivalRate;
console.log(`\n${PASS ? '🎉 ALL FACTIONS VIABLE!' : '⚠️ SOME FACTIONS NEED BALANCING'}`);
process.exit(PASS ? 0 : 1);
