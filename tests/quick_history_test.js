/**
 * tests/quick_history_test.js
 * 
 * Teste rápido de 500 anos (0 → 500 d.C.) com 10 regiões.
 * Valida que as correções de gargalo permitem crescimento populacional.
 * Deve completar em < 5 minutos.
 * 
 * Uso: node tests/quick_history_test.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameEngine } from '../client/src/core/Engine.js';
import { SaveSystem } from '../client/src/core/SaveSystem.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAVES_DIR = path.join(__dirname, '..', 'saves');

const SCALE = 10000;

// 10 Regiões-Chave do Ano 0 a.C.
const REGIONS = [
    { name: "Mesopotâmia",   biome: "plains", lat: 33, pop: 3000 },
    { name: "Nilo",          biome: "desert", lat: 30, pop: 3000 },
    { name: "Indus",         biome: "plains", lat: 25, pop: 2500 },
    { name: "Huang He",      biome: "plains", lat: 35, pop: 3000 },
    { name: "Roma",          biome: "plains", lat: 42, pop: 1500 },
    { name: "Grécia",        biome: "plains", lat: 38, pop: 1200 },
    { name: "Pérsia",        biome: "desert", lat: 32, pop: 1000 },
    { name: "Etiópia",       biome: "plains", lat: 9,  pop: 500 },
    { name: "Mesoamérica",   biome: "jungle", lat: 19, pop: 400 },
    { name: "Decão (Índia)", biome: "jungle", lat: 15, pop: 900 }
];

// Techs reais que a humanidade teria no ano 0 a.C. (IDs do TechTree)
const IRON_TECHS = [
    'ferramentas_pedra',     // Idade da Pedra
    'agriculture',           // Neolítico
    'qanat_irrigation',      // Irrigação (permite farming no deserto)
    'animismo',              // Religião primitiva
    'metalurgia_bronze',     // Idade do Bronze
    'codigo_de_leis',        // Código de Hammurabi
    'industry_basic',        // Indústria primitiva
    'medicine',              // Medicina básica
    'saneamento_basico',     // Saneamento romano
    'nomad_herding',         // Pastorício nômade
    'ice_fishing',           // Pesca no gelo
    'jungle_herbalism',      // Herbalismo tropical
    'determinismo',          // Filosofia grega
    'metodo_cientifico'      // Filosofia natural
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

function fmt(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
}

async function run() {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║  TESTE RÁPIDO: 0 → 500 d.C. (10 regiões)                  ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");

    const t0 = Date.now();
    const engine = new GameEngine();
    const loaded = await loadPlugins(engine);
    console.log(`✅ ${loaded} plugins`);

    // Montar hexes
    const hexes = REGIONS.map((r, i) => ({
        id: `hex_${i}`,
        col: i % 5,
        row: Math.floor(i / 5),
        lat: r.lat,
        neighbors: [
            ...(i > 0 ? [`hex_${i-1}`] : []),
            ...(i < REGIONS.length - 1 ? [`hex_${i+1}`] : [])
        ]
    }));

    engine.initWorld(hexes);

    // FORÇAR biomas corretos (initWorld randomiza por latitude, sobrescrevendo os históricos)
    const BIOME_MAP = {
        plains: { id: 'plains', name: 'Planície', capacityBase: 500000 },
        desert: { id: 'desert', name: 'Deserto', capacityBase: 200000 },
        jungle: { id: 'jungle', name: 'Selva', capacityBase: 350000 },
        tundra: { id: 'tundra', name: 'Tundra', capacityBase: 100000 }
    };
    REGIONS.forEach((r, i) => {
        const node = engine.nodes.get(`hex_${i}`);
        if (!node) return;
        node.biome = BIOME_MAP[r.biome];
    });

    // Injetar populações
    let totalPop = 0;
    REGIONS.forEach((r, i) => {
        const node = engine.nodes.get(`hex_${i}`);
        if (!node) return;
        node.name = r.name;
        node.infect(r.pop);
        node.food = r.pop * 10;
        node.wildGame = 5000;
        node.crops = r.biome === 'desert' ? ['dates'] :
                     r.biome === 'jungle' ? ['rice', 'corn'] : ['wheat', 'potato'];
        node.morale = 60;
        totalPop += r.pop;
    });
    engine.globalPop = totalPop;
    console.log(`✅ Pop inicial: ${fmt(totalPop)} unidades (≈ ${fmt(totalPop * SCALE)} real)`);

    // Pre-unlock Iron Age techs
    let techsOK = 0;
    for (const t of IRON_TECHS) {
        if (engine.techTree.technologies.has(t)) {
            engine.techTree.unlocked.add(t);
            techsOK++;
        }
    }
    console.log(`✅ ${techsOK} techs pré-desbloqueadas`);

    // Estado inicial
    engine.year = 0;
    engine.day = 0;
    engine.adaptationPoints = 500;
    engine.globalKPenalty = 1.0;
    engine.globalTrust = 100;
    engine.inventory.wood = 50000;
    engine.inventory.water = 100000;
    engine.inventory.minerals = 30000;

    console.log("\n─────────────────────────────────────────────────────────────");
    console.log("  ANO   │ Pop (units)│ Pop (real)   │ Era           │ Techs │ K-Pen  │ Nós ");
    console.log("─────────────────────────────────────────────────────────────");

    // Log year 0
    let infectedNodes = 0;
    engine.nodes.forEach(n => { if (n.infected) infectedNodes++; });
    console.log(`  ${String(0).padStart(5)} │ ${String(totalPop).padStart(10)} │ ${fmt(totalPop * SCALE).padStart(12)} │ ${engine.currentEra.name.padEnd(14)}│ ${String(engine.unlockedTechs.size).padStart(5)} │ ${(engine.globalKPenalty||1).toFixed(3)} │ ${infectedNodes}`);

    // SIMULAÇÃO: 500 anos em blocos semanais (7 dias)
    const TARGET = 500;
    const BATCH = 7; // dias por tick
    const TICKS_PER_YEAR = Math.ceil(365 / BATCH);

    for (let year = 1; year <= TARGET; year++) {
        for (let w = 0; w < TICKS_PER_YEAR; w++) {
            engine.processTick(BATCH);
        }

        // Recalcular globalPop
        let gp = 0;
        let activeNodes = 0;
        engine.nodes.forEach(n => {
            if (n.infected) {
                gp += n.demographics.total;
                activeNodes++;
            }
        });
        engine.globalPop = gp;

        // Log a cada 50 anos
        if (year % 50 === 0 || year === TARGET) {
            console.log(`  ${String(year).padStart(5)} │ ${String(Math.floor(gp)).padStart(10)} │ ${fmt(gp * SCALE).padStart(12)} │ ${engine.currentEra.name.padEnd(14)}│ ${String(engine.unlockedTechs.size).padStart(5)} │ ${(engine.globalKPenalty||1).toFixed(3)} │ ${activeNodes}`);
        }
    }

    console.log("─────────────────────────────────────────────────────────────\n");

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const finalPop = engine.globalPop;
    const finalReal = finalPop * SCALE;

    console.log(`⏱️ Concluído em ${elapsed}s`);
    console.log(`📊 Pop Final: ${fmt(finalPop)} unidades (≈ ${fmt(finalReal)} real)`);
    console.log(`📊 Pop Real ano 500: ~310M`);
    console.log(`📊 Ratio: ${(finalReal / 310_000_000 * 100).toFixed(1)}%`);
    console.log(`📊 Era: ${engine.currentEra.name}`);
    console.log(`📊 Techs: ${engine.unlockedTechs.size}`);
    console.log(`📊 K-Penalty: ${(engine.globalKPenalty || 1).toFixed(4)}`);

    // Salvar checkpoint
    if (!fs.existsSync(SAVES_DIR)) fs.mkdirSync(SAVES_DIR, { recursive: true });
    const save = SaveSystem.save(engine);
    save._label = `Teste Rápido — Ano ${engine.year}`;
    save._scaleFactor = SCALE;
    const savePath = path.join(SAVES_DIR, `quick_test_year_${engine.year}.json`);
    fs.writeFileSync(savePath, JSON.stringify(save, null, 2));
    console.log(`\n💾 Save: ${savePath}`);

    // Detalhes por nó
    console.log("\n📊 DETALHES POR REGIÃO:");
    console.log("─────────────────────────────────────────────────────");
    engine.nodes.forEach((node, id) => {
        if (!node.infected) return;
        const pop = node.demographics.total;
        console.log(`  ${node.name.padEnd(20)} │ Pop: ${fmt(pop * SCALE).padStart(10)} │ Food: ${Math.floor(node.food || 0).toString().padStart(8)} │ Soil: ${(node.soil || 0).toFixed(1)}%`);
    });

    // Validação
    console.log("\n📋 VALIDAÇÃO:");
    const grew = finalPop > totalPop;
    console.log(`  ${grew ? '✅' : '❌'} População cresceu? ${grew ? 'SIM' : 'NÃO'} (${fmt(totalPop)} → ${fmt(finalPop)})`);
    console.log(`  ${engine.globalKPenalty > 0.5 ? '✅' : '❌'} K-Penalty estável? ${(engine.globalKPenalty||1).toFixed(4)}`);
    console.log(`  ${engine.unlockedTechs.size >= 13 ? '✅' : '⚠️'} Techs mantidas? ${engine.unlockedTechs.size}`);

    if (!grew) {
        console.log("\n⚠️ POPULAÇÃO NÃO CRESCEU — Mais ajustes são necessários.");
        process.exit(1);
    } else {
        console.log("\n🎉 SUCESSO! A população está crescendo.");
    }
}

run().catch(err => {
    console.error("❌ ERRO:", err);
    process.exit(1);
});
