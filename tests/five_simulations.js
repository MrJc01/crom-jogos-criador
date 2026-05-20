/**
 * tests/five_simulations.js
 * 
 * Executa 5 simulações assíncronas paralelas do CROM por 500 anos.
 * Coleta a telemetria demográfica de 50 em 50 anos para registrar
 * e analisar a curva de crescimento (Curva S Sigmóide).
 * 
 * Uso: node tests/five_simulations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameEngine } from '../client/src/core/Engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_YEARS = 500;
const SIMULATION_COUNT = 5;
const INTERV = 50;

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
        try {
            const m = await import('file://' + f);
            if (m.default) engine.registerPlugin(m.default); 
        } catch (e) {}
    }
}

async function runSingleSim(simId) {
    const engine = new GameEngine();
    await loadPlugins(engine);
    
    // Cria um mapa real de 7 hexágonos de biomas mistos
    const mockHexes = [];
    const biomes = ['plains', 'jungle', 'desert', 'tundra', 'plains', 'jungle', 'plains'];
    for (let i = 0; i < 7; i++) {
        const neighbors = [];
        if (i > 0) neighbors.push(`hex_${i-1}`);
        if (i < 6) neighbors.push(`hex_${i+1}`);
        mockHexes.push({ id: `hex_${i}`, col: i, row: 0, lat: i * 12, neighbors, biome: { id: biomes[i] } });
    }
    engine.initWorld(mockHexes);
    
    const startNode = Array.from(engine.nodes.values())[0];
    engine.startInfection(startNode.id);
    startNode.demographics.dist.factions = { tribal: 1.0 };
    
    const popHistory = [];
    popHistory.push({ year: 0, pop: Math.floor(engine.globalPop), techs: 0 });
    
    const startTime = Date.now();
    let isExtinct = false;
    
    for (let year = 1; year <= TARGET_YEARS; year++) {
        if (isExtinct) break;
        
        // Simulação dia a dia com ticks reais diários
        for (let day = 1; day <= 365; day++) {
            engine.processTick(1);
            if (engine.globalPop <= 0) {
                isExtinct = true;
                break;
            }
        }
        
        if (year % INTERV === 0 || year === TARGET_YEARS) {
            popHistory.push({
                year,
                pop: Math.floor(engine.globalPop),
                techs: engine.unlockedTechs.size,
                water: Math.floor(startNode.resources.water || 0)
            });
            console.log(`[Simulação #${simId}] Ano ${year}: Pop = ${Math.floor(engine.globalPop)} | Techs = ${engine.unlockedTechs.size}`);
        }
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    return {
        simId,
        extinct: isExtinct,
        elapsed,
        popHistory,
        finalPop: Math.floor(engine.globalPop),
        finalTechs: engine.unlockedTechs.size,
        government: engine.currentGovernment?.type || 'tribal'
    };
}

async function startAll() {
    console.log("==================================================================");
    console.log(`🚀 INICIANDO ${SIMULATION_COUNT} SIMULAÇÕES ASSÍNCRONAS PARALELAS`);
    console.log(`Cada simulação rodará por ${TARGET_YEARS} anos sob ticks diários unitários.`);
    console.log("==================================================================\n");
    
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 1; i <= SIMULATION_COUNT; i++) {
        promises.push(runSingleSim(i));
    }
    
    const results = await Promise.all(promises);
    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log("\n==================================================================");
    console.log(`🎉 TODAS AS SIMULAÇÕES CONCLUÍDAS COM SUCESSO EM ${totalElapsed}s`);
    console.log("==================================================================\n");
    
    // Salva os relatórios estruturados no disco
    if (!fs.existsSync('./reports')) fs.mkdirSync('./reports');
    fs.writeFileSync('./reports/five_simulations_results.json', JSON.stringify(results, null, 2));
    console.log("Relatório salvo em reports/five_simulations_results.json\n");
}

startAll().catch(console.error);
