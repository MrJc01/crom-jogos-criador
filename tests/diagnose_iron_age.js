/**
 * tests/diagnose_iron_age.js — Diagnóstico de por que 14 techs causa colapso
 */
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GameEngine } from '../client/src/core/Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const IRON_TECHS = [
    'ferramentas_pedra', 'agriculture', 'qanat_irrigation', 'animismo',
    'metalurgia_bronze', 'codigo_de_leis', 'industry_basic', 'medicine',
    'saneamento_basico', 'nomad_herding', 'ice_fishing', 'jungle_herbalism',
    'determinismo', 'metodo_cientifico'
];

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
    console.log("🔬 DIAGNÓSTICO: 14 techs pré-desbloqueadas (Idade do Ferro)\n");

    const engine = new GameEngine();
    await loadPlugins(engine);

    // 1 nó, plains
    const hexes = [{ id: 'hex_0', col: 0, row: 0, lat: 35, neighbors: [] }];
    engine.initWorld(hexes);

    const node = engine.nodes.get('hex_0');
    node.biome = { id: 'plains', name: 'Planície', capacityBase: 500000 };
    
    // Infectar com 3000 (como no teste histórico)
    engine.startInfection('hex_0');
    // Adicionar mais pop manualmente  
    node.demographics.addBirths(2900);
    engine.globalPop = node.demographics.total;

    // Condições ideais
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
    engine.adaptationPoints = 500;

    // Pré-desbloquear techs
    let techsOK = 0;
    for (const t of IRON_TECHS) {
        if (engine.techTree.technologies.has(t)) {
            engine.techTree.unlocked.add(t);
            techsOK++;
        }
    }
    console.log(`Techs: ${techsOK}/${IRON_TECHS.length} | Era: ${engine.currentEra.name} (mult=${engine.currentEra.mult})`);
    console.log(`Pop: ${node.demographics.total} | Food: ${node.food} | Capacity: ${node.capacity}`);

    // Monkey-patch kill
    const origKill = node.demographics.kill.bind(node.demographics);
    let deathLog = {};
    node.demographics.kill = function(amount) {
        if (amount <= 0) return;
        const stack = new Error().stack;
        const callerLine = stack.split('\n')[2]?.trim() || 'unknown';
        const match = callerLine.match(/at.*?([^\/]+\.js):(\d+)/);
        const source = match ? `${match[1]}:${match[2]}` : callerLine.substring(0, 80);
        deathLog[source] = (deathLog[source] || 0) + amount;
        origKill(amount);
    };

    const origKillByAge = node.demographics.killByAge.bind(node.demographics);
    node.demographics.killByAge = function(ageGroup, amount) {
        if (amount <= 0) return;
        const stack = new Error().stack;
        const callerLine = stack.split('\n')[2]?.trim() || 'unknown';
        const match = callerLine.match(/at.*?([^\/]+\.js):(\d+)/);
        const source = match ? `${match[1]}:${match[2]}:${ageGroup}` : callerLine.substring(0, 80);
        deathLog[source] = (deathLog[source] || 0) + amount;
        origKillByAge(ageGroup, amount);
    };

    const origAddBirths = node.demographics.addBirths.bind(node.demographics);
    let totalBirths = 0;
    node.demographics.addBirths = function(amount) {
        if (amount > 0) totalBirths += amount;
        origAddBirths(amount);
    };

    // Rodar 5 anos
    for (let year = 0; year < 5; year++) {
        const yearStartPop = node.demographics.total;
        const yearStartDeaths = { ...deathLog };
        const yearStartBirths = totalBirths;

        for (let day = 0; day < 365; day++) {
            engine.processTick(1);
        }

        let gp = 0;
        engine.nodes.forEach(n => { if (n.infected) gp += n.demographics.total; });
        engine.globalPop = gp;

        const yearEndPop = node.demographics.total;
        const yearBirths = totalBirths - yearStartBirths;

        let yearDeaths = {};
        for (const [k, v] of Object.entries(deathLog)) {
            const prev = yearStartDeaths[k] || 0;
            if (v - prev > 0) yearDeaths[k] = v - prev;
        }
        const totalYearDeaths = Object.values(yearDeaths).reduce((a, b) => a + b, 0);

        console.log(`\n─── ANO ${year + 1} ───────────────────────────────`);
        console.log(`  Pop: ${yearStartPop} → ${yearEndPop} (Δ${yearEndPop - yearStartPop})`);
        console.log(`  Nascimentos: +${yearBirths} | Mortes: -${totalYearDeaths}`);
        console.log(`  Food: ${Math.floor(node.food)} | K-Pen: ${(engine.globalKPenalty||1).toFixed(3)} | Trust: ${Math.floor(engine.globalTrust)} | Techs: ${engine.unlockedTechs.size}`);
        console.log(`  Era: ${engine.currentEra.name} (mult=${engine.currentEra.mult})`);

        if (Object.keys(yearDeaths).length > 0) {
            console.log(`  📊 Fontes de Morte:`);
            const sorted = Object.entries(yearDeaths).sort((a, b) => b[1] - a[1]);
            for (const [source, count] of sorted.slice(0, 10)) {
                const pct = (count / Math.max(1, totalYearDeaths) * 100).toFixed(1);
                console.log(`     ${pct.padStart(5)}% │ ${count.toString().padStart(6)} mortos │ ${source}`);
            }
        }
    }
}

run().catch(console.error);
