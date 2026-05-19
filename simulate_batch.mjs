import { GameEngine } from './client/src/core/Engine.js';
import fs from 'fs';

const TARGET_YEARS = 500;
const BATCH_SIZE = 10;
const FACTION = 'sino_tibetanos';

console.log(`======================================================`);
console.log(`🧪 CROM BATCH SIMULATOR - ${BATCH_SIZE} RODADAS PARALELAS`);
console.log(`Configuração: ${TARGET_YEARS} anos | Facção: ${FACTION}`);
console.log(`======================================================\n`);

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const files = walkSync(path.join(__dirname, 'client/src/modules'));
    for (const f of files) {
        try {
            const m = await import('file://' + f);
            if (m.default) engine.registerPlugin(m.default); 
        } catch (e) {}
    }
}

async function runSimulation(id) {
    const engine = new GameEngine();
    await loadPlugins(engine);
    
    const mockHexes = [];
    const biomes = ['plains', 'tundra', 'desert', 'jungle', 'plains'];
    for (let i = 0; i < 5; i++) {
        const neighbors = [];
        if (i > 0) neighbors.push(`hex_${i-1}`);
        if (i < 4) neighbors.push(`hex_${i+1}`);
        mockHexes.push({ id: `hex_${i}`, col: i, row: 0, lat: i * 15, neighbors, biome: { id: biomes[i] } });
    }
    engine.initWorld(mockHexes);

    const nodesArray = Array.from(engine.nodes.values());
    const startNode = nodesArray[Math.floor(Math.random() * nodesArray.length)];
    startNode.infect(0);
    const initialPop = 55; // start with 55
    startNode.demographics.dist.factions = { [FACTION]: 1.0 };
    startNode.demographics.addBirths(initialPop); 
    engine.globalPop = initialPop;

    const recentEvents = [];
    engine.onEvent = (ev) => {
        recentEvents.push(`[Ano ${engine.year}] ${ev.message}`);
        if (recentEvents.length > 5) recentEvents.shift();
    };
    engine.logEvent = () => {};

    const startTime = Date.now();
    let extinctionYear = -1;

    while (engine.year < TARGET_YEARS) {
        for (let w = 0; w < 52; w++) {
            engine.processTick(7);
        }
        if (engine.globalPop <= 0) {
            extinctionYear = engine.year;
            break;
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const success = extinctionYear === -1;
    const finalYear = success ? TARGET_YEARS : extinctionYear;
    const finalPop = Math.floor(engine.globalPop).toLocaleString('pt-BR');

    let maxPop = 0;
    engine.nodes.forEach(n => {
        if (n.demographics.total > maxPop) maxPop = n.demographics.total;
    });

    const result = {
        id,
        success,
        finalYear,
        finalPop,
        elapsed,
        techs: engine.unlockedTechs?.size || 0
    };
    
    const status = success ? '✅ SUCESSO' : '💀 EXTINTO';
    const logsStr = success ? '' : `\n    └─ Causa Mortis (Últimos Eventos):\n      ${recentEvents.join('\n      ')}`;
    console.log(`Simulação #${id}: ${status} no Ano ${finalYear} | População Final: ${finalPop} | Techs: ${result.techs} | Tempo: ${elapsed}s${logsStr}`);
    
    return result;
}

async function runBatch() {
    const promises = [];
    for (let i = 1; i <= BATCH_SIZE; i++) {
        promises.push(runSimulation(i));
    }

    const results = await Promise.all(promises);
    
    let successes = 0;
    results.forEach(res => {
        if (res.success) successes++;
    });

    console.log(`\n📊 TAXA DE SOBREVIVÊNCIA: ${(successes / BATCH_SIZE * 100).toFixed(1)}% (${successes}/${BATCH_SIZE})`);
}

runBatch().catch(err => {
    console.error("Erro fatal no batch:", err);
});
