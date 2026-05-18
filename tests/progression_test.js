/**
 * progression_test.js — Análise de progressão civilizatória em 1000 anos.
 * 
 * Verifica: crescimento populacional, desbloqueio de techs, food balance,
 * literacy, morale, governo, religião, cultura, economia.
 * 
 * Uso: node tests/progression_test.js
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

const YEARS = [100, 500, 1000, 3000, 6000, 10000];
const FACTIONS = ['sino_tibetanos', 'indo_europeus', 'bantu'];

console.log("╔═══════════════════════════════════════════════════════════════════╗");
console.log("║      CROM PROGRESSION TEST — Análise de Longa Duração           ║");
console.log("╚═══════════════════════════════════════════════════════════════════╝\n");

for (const faction of FACTIONS) {
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`  FACÇÃO: ${faction.toUpperCase()}`);
    console.log(`${'═'.repeat(65)}`);
    
    const engine = new GameEngine();
    await loadPlugins(engine);
    
    const mockHexes = [];
    const biomes = ['plains', 'tundra', 'desert', 'jungle', 'plains', 'tundra', 'desert'];
    for (let i = 0; i < 7; i++) {
        const neighbors = [];
        if (i > 0) neighbors.push(`hex_${i-1}`);
        if (i < 6) neighbors.push(`hex_${i+1}`);
        mockHexes.push({ id: `hex_${i}`, col: i, row: 0, lat: i * 10, neighbors, biome: { id: biomes[i] } });
    }
    engine.initWorld(mockHexes);
    
    const startNode = Array.from(engine.nodes.values())[0];
    engine.startInfection(startNode.id);
    startNode.demographics.dist.factions = { [faction]: 1.0 };
    
    const startTime = Date.now();
    let lastPop = 0;
    let yearData = {};
    
    while (engine.year <= 10000) {
        engine.processTick();
        
        if (YEARS.includes(engine.year) && !yearData[engine.year]) {
            yearData[engine.year] = true;
            const elapsed = Date.now() - startTime;
            
            // Conta hexes infectados
            let infHexes = 0;
            let totalFood = 0;
            let avgMorale = 0;
            let moraleCt = 0;
            let religionHexes = 0;
            let totalBuildings = 0;
            
            engine.nodes.forEach(n => {
                if (n.infected) {
                    infHexes++;
                    totalFood += (n.food || 0);
                    if (n.morale !== undefined) { avgMorale += n.morale; moraleCt++; }
                    if (n.religion?.active) religionHexes++;
                    if (n.buildings) {
                        for (const [k, v] of Object.entries(n.buildings)) totalBuildings += v;
                    }
                }
            });
            avgMorale = moraleCt > 0 ? Math.floor(avgMorale / moraleCt) : 0;
            
            const popGrowth = lastPop > 0 ? ((engine.globalPop - lastPop) / lastPop * 100).toFixed(1) : '∞';
            lastPop = engine.globalPop;
            
            console.log(`\n  ── Ano ${engine.year} (${(elapsed/1000).toFixed(1)}s) ──`);
            console.log(`  📊 Pop: ${Math.floor(engine.globalPop).toLocaleString()} (${popGrowth}% desde último marco)`);
            console.log(`  🗺️ Hexes infectados: ${infHexes}/${engine.nodes.size}`);
            console.log(`  🧬 Techs: ${engine.unlockedTechs.size} | DNA: ${Math.floor(engine.adaptationPoints)}`);
            console.log(`  🌾 Food: ${Math.floor(totalFood).toLocaleString()} | 📦 Wood: ${Math.floor(engine.inventory.wood)} | ⛏️ Min: ${Math.floor(engine.inventory.minerals)}`);
            console.log(`  📚 Literacy: ${Math.floor(engine.literacy || 0)}% | 😊 Morale: ${avgMorale}`);
            console.log(`  🏛️ Governo: ${engine.currentGovernment?.type || 'nenhum'} | 🕌 Religião: ${religionHexes} hexes`);
            console.log(`  🏗️ Buildings: ${totalBuildings} | 🏛️ Wonders: ${Object.keys(engine.wonders || {}).length}`);
            console.log(`  📈 Severity: ${Math.floor(engine.severity)} | 🤝 Trust: ${Math.floor(engine.globalTrust)} | ⚡ Pressão: ${engine.pressures.social.toFixed(1)}`);
            console.log(`  🏆 Score: ${engine.civScore || 0} | Vitória: ${engine._victoryAchieved || 'nenhuma'}`);
            
            if (engine.market) {
                console.log(`  💰 GDP: ${Math.floor(engine.market.gdp)} | Inflação: ${engine.market.inflation.toFixed(2)}× | Trade Vol: ${Math.floor(engine.market.tradeVolume)}`);
            }
            if (engine.philosophy?.current) {
                console.log(`  📚 Filosofia: ${engine.philosophy.current}`);
            }
            if (engine.ideology) {
                console.log(`  📕 Ideologia: ${engine.ideology}`);
            }
            
            // Contagem de events no chronicle
            const chronicleSize = engine.chronicle?.length || 0;
            console.log(`  📜 Chronicle: ${chronicleSize} eventos registrados`);
        }
    }
    
    // Resumo final
    console.log(`\n  ── RESUMO FINAL (10000 anos) ──`);
    const alive = engine.globalPop > 0;
    console.log(`  ${alive ? '✅ CIVILIZAÇÃO SOBREVIVEU' : '❌ CIVILIZAÇÃO EXTINTA'}`);
    console.log(`  Pop final: ${Math.floor(engine.globalPop).toLocaleString()}`);
    console.log(`  Techs: ${engine.unlockedTechs.size}`);
    console.log(`  Tempo real: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    
    // Safety break to prevent infinite loop if simulation crashes early
    if (engine.globalPop <= 0) break;
}

console.log(`\n${'═'.repeat(65)}`);
console.log("  ANÁLISE COMPLETA");
console.log(`${'═'.repeat(65)}`);
