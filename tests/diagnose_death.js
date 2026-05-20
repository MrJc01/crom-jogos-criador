/**
 * tests/diagnose_death.js
 * 
 * Script de diagnóstico forense: roda 10 anos com 1 nó e loga CADA fonte de morte.
 * Objetivo: entender EXATAMENTE onde a pop está vazando.
 * 
 * Uso: node tests/diagnose_death.js
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

async function run() {
    console.log("🔬 DIAGNÓSTICO FORENSE DE MORTALIDADE\n");

    const engine = new GameEngine();
    await loadPlugins(engine);

    // 1 nó, plains (melhor bioma)
    const hexes = [
        { id: 'hex_0', col: 0, row: 0, lat: 35, neighbors: [] }
    ];
    engine.initWorld(hexes);

    const node = engine.nodes.get('hex_0');
    engine.startInfection('hex_0');

    // Forçar bioma plains e condições ideais
    node.biome = { id: 'plains', name: 'Planície', capacityBase: 500000 };
    node.food = 100000;
    node.wildGame = 5000;
    node.crops = ['wheat', 'potato'];
    node.morale = 80;
    node.resources = { wood: 50000, water: 100000, minerals: 50000 };
    node.soil = 100;

    engine.inventory.wood = 50000;
    engine.inventory.water = 50000;
    engine.inventory.minerals = 50000;
    engine.globalTrust = 100;

    // Monkey-patch Demographics.kill para rastrear CADA morte
    const origKill = node.demographics.kill.bind(node.demographics);
    const origKillByAge = node.demographics.killByAge.bind(node.demographics);
    let deathLog = {};

    node.demographics.kill = function(amount) {
        if (amount <= 0) return;
        // Stack trace para saber QUEM chamou
        const stack = new Error().stack;
        const callerLine = stack.split('\n')[2]?.trim() || 'unknown';
        // Extrair nome do arquivo
        const match = callerLine.match(/at.*?([^\/]+\.js):(\d+)/);
        const source = match ? `${match[1]}:${match[2]}` : callerLine.substring(0, 60);
        
        deathLog[source] = (deathLog[source] || 0) + amount;
        origKill(amount);
    };

    node.demographics.killByAge = function(ageGroup, amount) {
        if (amount <= 0) return;
        const stack = new Error().stack;
        const callerLine = stack.split('\n')[2]?.trim() || 'unknown';
        const match = callerLine.match(/at.*?([^\/]+\.js):(\d+)/);
        const source = match ? `${match[1]}:${match[2]}:${ageGroup}` : callerLine.substring(0, 60);
        
        deathLog[source] = (deathLog[source] || 0) + amount;
        origKillByAge(ageGroup, amount);
    };

    // Monkey-patch addBirths para rastrear nascimentos
    const origAddBirths = node.demographics.addBirths.bind(node.demographics);
    let totalBirths = 0;
    node.demographics.addBirths = function(amount) {
        if (amount > 0) totalBirths += amount;
        origAddBirths(amount);
    };

    console.log(`Pop Inicial: ${node.demographics.total}`);
    console.log(`Bioma: ${node.biome.id}`);
    console.log(`Capacity: ${node.capacity}`);
    console.log(`Food: ${node.food}`);
    console.log(`Era: ${engine.currentEra.name} (mult=${engine.currentEra.mult})`);
    console.log("");

    // Rodar 10 anos dia a dia
    const YEARS = 10;
    for (let year = 0; year < YEARS; year++) {
        const yearStartPop = node.demographics.total;
        const yearStartDeaths = { ...deathLog };
        const yearStartBirths = totalBirths;

        for (let day = 0; day < 365; day++) {
            engine.processTick(1);
        }

        // Recalcular globalPop
        let gp = 0;
        engine.nodes.forEach(n => { if (n.infected) gp += n.demographics.total; });
        engine.globalPop = gp;

        const yearEndPop = node.demographics.total;
        const yearBirths = totalBirths - yearStartBirths;
        
        // Mortes deste ano
        let yearDeaths = {};
        for (const [k, v] of Object.entries(deathLog)) {
            const prev = yearStartDeaths[k] || 0;
            if (v - prev > 0) yearDeaths[k] = v - prev;
        }

        const totalYearDeaths = Object.values(yearDeaths).reduce((a, b) => a + b, 0);

        console.log(`─── ANO ${year + 1} ───────────────────────────────`);
        console.log(`  Pop: ${yearStartPop} → ${yearEndPop} (Δ${yearEndPop - yearStartPop})`);
        console.log(`  Nascimentos: +${yearBirths}`);
        console.log(`  Mortes totais: -${totalYearDeaths}`);
        console.log(`  Food: ${Math.floor(node.food)} | K-Pen: ${(engine.globalKPenalty||1).toFixed(3)} | Techs: ${engine.unlockedTechs.size}`);
        
        if (Object.keys(yearDeaths).length > 0) {
            console.log(`  📊 Fontes de Morte:`);
            const sorted = Object.entries(yearDeaths).sort((a, b) => b[1] - a[1]);
            for (const [source, count] of sorted) {
                const pct = (count / Math.max(1, totalYearDeaths) * 100).toFixed(1);
                console.log(`     ${pct.padStart(5)}% │ ${count.toString().padStart(5)} mortos │ ${source}`);
            }
        }
        console.log("");
    }

    // Resumo total
    console.log("═══════════════════════════════════════════════════");
    console.log("📊 RESUMO TOTAL (10 anos):");
    console.log(`  Pop Final: ${node.demographics.total}`);
    console.log(`  Nascimentos Totais: ${totalBirths}`);
    const totalDeaths = Object.values(deathLog).reduce((a, b) => a + b, 0);
    console.log(`  Mortes Totais: ${totalDeaths}`);
    console.log(`  Ratio Morte/Nascimento: ${(totalDeaths / Math.max(1, totalBirths)).toFixed(2)}`);
    console.log("");
    console.log("  📊 Ranking de Assassinos:");
    const sorted = Object.entries(deathLog).sort((a, b) => b[1] - a[1]);
    for (const [source, count] of sorted) {
        const pct = (count / Math.max(1, totalDeaths) * 100).toFixed(1);
        console.log(`     ${pct.padStart(5)}% │ ${count.toString().padStart(6)} │ ${source}`);
    }
}

run().catch(console.error);
