/**
 * profiling_test.js — Mede ms/tick e alerta se > 16ms.
 * Testa 1000 ticks e reporta estatísticas.
 * 
 * Uso: node tests/profiling_test.js
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

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║  CROM PROFILING — Performance Analysis (107)               ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

const engine = new GameEngine();
await loadPlugins(engine);

const mockHexes = Array.from({ length: 10 }, (_, i) => ({
    id: `hex_${i}`, col: i, row: 0, lat: i * 5,
    neighbors: [i > 0 ? `hex_${i-1}` : null, i < 9 ? `hex_${i+1}` : null].filter(Boolean)
}));
engine.initWorld(mockHexes);
engine.startInfection('hex_0');

const TICKS = 36500; // 100 anos
const tickTimes = [];
let maxTick = 0;
let minTick = Infinity;
let over16 = 0;

for (let i = 0; i < TICKS; i++) {
    const start = performance.now();
    engine.processTick();
    const elapsed = performance.now() - start;
    tickTimes.push(elapsed);
    if (elapsed > maxTick) maxTick = elapsed;
    if (elapsed < minTick) minTick = elapsed;
    if (elapsed > 16) over16++;
}

const avgTick = tickTimes.reduce((a, b) => a + b, 0) / tickTimes.length;
const p95 = tickTimes.sort((a, b) => a - b)[Math.floor(TICKS * 0.95)];
const p99 = tickTimes.sort((a, b) => a - b)[Math.floor(TICKS * 0.99)];

console.log(`📊 Resultados (${TICKS} ticks, ${mockHexes.length} hexes):`);
console.log(`  Média:  ${avgTick.toFixed(3)}ms/tick`);
console.log(`  Min:    ${minTick.toFixed(3)}ms`);
console.log(`  Max:    ${maxTick.toFixed(3)}ms`);
console.log(`  P95:    ${p95.toFixed(3)}ms`);
console.log(`  P99:    ${p99.toFixed(3)}ms`);
console.log(`  > 16ms: ${over16} ticks (${(over16/TICKS*100).toFixed(2)}%)`);
console.log(`  Pop:    ${engine.globalPop}`);
console.log(`  Techs:  ${engine.unlockedTechs.size}`);

const PASS = avgTick < 1.0 && p99 < 16.0;
console.log(`\n${PASS ? '✅' : '❌'} ${PASS ? 'PERFORMANCE OK' : 'PERFORMANCE DEGRADADA'} (target: avg<1ms, P99<16ms)`);
process.exit(PASS ? 0 : 1);
