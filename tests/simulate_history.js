/**
 * tests/simulate_history.js
 * 
 * Simulação Histórica: 0 a.C. → 2026 d.C.
 * 
 * Inicializa o mundo no ano 0 com 50 hexágonos representando regiões históricas,
 * distribui 300M de população (escala 1:10.000 → 30.000 unidades),
 * pré-injeta techs da Idade do Ferro, e roda 2026 anos completos.
 * 
 * Gera checkpoints JSON editáveis a cada 500 anos via SaveSystem.
 * Compara a curva pop vs. dados reais da humanidade.
 * 
 * Uso: node tests/simulate_history.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameEngine } from '../client/src/core/Engine.js';
import { SaveSystem } from '../client/src/core/SaveSystem.js';
import { Config } from '../client/src/config/ConfigLoader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAVES_DIR = path.join(__dirname, '..', 'saves');

// ===== CONFIGURAÇÃO DA SIMULAÇÃO =====
const SCALE_FACTOR = 10000;  // 1 unidade = 10.000 pessoas reais
const START_YEAR = 0;
const END_YEAR = 2026;
const CHECKPOINT_INTERVAL = 500; // Anos entre saves

// Dados Reais da Humanidade para Comparação
const REAL_POP_DATA = [
    { year: 0,    pop: 300_000_000 },
    { year: 500,  pop: 310_000_000 },
    { year: 1000, pop: 310_000_000 },
    { year: 1500, pop: 500_000_000 },
    { year: 1800, pop: 1_000_000_000 },
    { year: 1900, pop: 1_600_000_000 },
    { year: 1950, pop: 2_500_000_000 },
    { year: 2000, pop: 6_100_000_000 },
    { year: 2026, pop: 8_200_000_000 }
];

// 50 Regiões Históricas (bioma, latitude, população inicial em unidades)
// 15 Regiões Históricas Globais de Alta Densidade e Representatividade (escala real total ≈ 300M a.C.)
const HISTORICAL_REGIONS = [
    { name: "Mesopotâmia",        biome: "plains",  lat: 33,  pop: 4000 },
    { name: "Delta do Nilo",      biome: "desert",  lat: 30,  pop: 4000 },
    { name: "Vale do Indus",      biome: "plains",  lat: 25,  pop: 3500 },
    { name: "Huang He (Rio Am.)", biome: "plains",  lat: 35,  pop: 4000 },
    { name: "Yangtze",            biome: "jungle",  lat: 30,  pop: 3000 },
    { name: "Roma (Lácio)",       biome: "plains",  lat: 42,  pop: 2500 },
    { name: "Grécia (Ática)",     biome: "plains",  lat: 38,  pop: 1800 },
    { name: "Pérsia",             biome: "desert",  lat: 32,  pop: 1800 },
    { name: "Germânia",           biome: "plains",  lat: 51,  pop: 1000 },
    { name: "Britânia",           biome: "plains",  lat: 52,  pop: 600 },
    { name: "Etiópia (Axum)",     biome: "plains",  lat: 9,   pop: 1000 },
    { name: "Nigéria",            biome: "jungle",  lat: 9,   pop: 800 },
    { name: "Mesoamérica",        biome: "jungle",  lat: 19,  pop: 1000 },
    { name: "Andes",              biome: "tundra",  lat: -13, pop: 800 },
    { name: "Indonésia",          biome: "jungle",  lat: -5,  pop: 800 }
];

// Techs reais que a humanidade teria no ano 0 a.C. (IDs do TechTree)
const IRON_AGE_TECHS = [
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
            else if (f.endsWith('.js')) {
                const normPath = p.replace(/\\/g, '/');
                const isEssential = 
                    normPath.includes('/technologies/') ||
                    normPath.endsWith('agriculture/FarmingEngine.js') ||
                    normPath.endsWith('biology/aging.js') ||
                    normPath.endsWith('biology/gestation.js') ||
                    normPath.endsWith('biology/migration.js') ||
                    normPath.endsWith('biology/BiomeAdaptationEngine.js') ||
                    normPath.endsWith('economy/extraction.js') ||
                    normPath.endsWith('events/NatureEngine.js') ||
                    normPath.endsWith('events/SocialEngine.js') ||
                    normPath.endsWith('events/DisasterEngine.js') ||
                    normPath.endsWith('sociology/CivilizationDynamics.js') ||
                    normPath.endsWith('sociology/StateEngine.js');
                
                if (isEssential) {
                    files.push(p);
                }
            }
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

function saveCheckpoint(engine, label) {
    const saveData = SaveSystem.save(engine);
    saveData._label = label;
    saveData._scaleFactor = SCALE_FACTOR;
    saveData._realPopEstimate = Math.floor(engine.globalPop * SCALE_FACTOR);
    
    const filename = `checkpoint_year_${engine.year}.json`;
    const filepath = path.join(SAVES_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(saveData, null, 2));
    return filepath;
}

function formatPop(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
}

async function runHistoricalSimulation() {
    // 0. Calibragem cliodinâmica headless avançada (alinhada com a escala de unidades da engine, 1 un = 10.000 pessoas)
    Config.game().dnaGeneration.popPerPoint = 300000; // Começa em 300K para evitar a explosão tecnológica imediata (equivalente a 3B pessoas reais)
    
    // Desabilitar o decaimento passivo do estoque imperial para que não estrangule a economia
    Config.game().stockDecay.wood = 1.0;
    Config.game().stockDecay.minerals = 1.0;
    Config.game().stockDecay.water = 1.0;
    
    // Mitigar a queima de madeira no inverno
    Config.game().seasons.winterWoodBurnDivisor = 10000000;
    
    // Desativar Inverno Genético, Dark Age e Grande Filtro Nuclear para a simulação headless
    Config.game().demographics.geneticWinter.dailyChance = 0;
    Config.game().demographics.darkAge.dailyTechLossChance = 0;
    Config.game().greatFilter.nuclear.dailyChance = 0;
    Config.game().demographics.geneticWinter.kPenaltyRecoveryRate = 1.05;
    Config.game().demographics.geneticWinter.kPenaltyMinimum = 0.50;
    
    // Amortecer as taxas de letalidade dos desastres/eventos no headless
    if (Config.game().disasterEngine) {
        Config.game().disasterEngine.zoonoseBaseMortality = 0.01;
        Config.game().disasterEngine.zoonoseMedicineMortality = 0.002;
        Config.game().disasterEngine.faunaPassiveKillRate = 0.0005;
        Config.game().disasterEngine.collapseKillRate = 0.01;
    }
    
    const natureEvents = Config.events().nature?.events || {};
    if (natureEvents.megaEarthquake) natureEvents.megaEarthquake.killRate = 0.005;
    if (natureEvents.asteroidImpact) natureEvents.asteroidImpact.killRate = 0.01;
    if (natureEvents.volcanicWinter) natureEvents.volcanicWinter.kPenaltyMult = 0.99;
    if (natureEvents.solarEclipse) natureEvents.solarEclipse.kPenaltyMult = 0.99;
    if (natureEvents.littleIceAge) natureEvents.littleIceAge.tempOffset = -0.5;

    // Recalibra os estágios do DTM com taxas de natalidade que contrabalanceiam a alta mortalidade acumulada diária
    Config.demographics().dtm.stages = [
        { name: "Pré-Industrial",   minEra: 1,    birthRate: 0.130, deathRate: 0.012, infantMortality: 0.15 }, // Baby boom alto para resistir a desastres e envelhecimento
        { name: "Transição Inicial", minEra: 200,  birthRate: 0.110, deathRate: 0.010, infantMortality: 0.08 }, // Crescimento industrial acelerado
        { name: "Transição Tardia",  minEra: 1000, birthRate: 0.075, deathRate: 0.008, infantMortality: 0.03 }, // Crescimento tecnológico contínuo
        { name: "Industrial",        minEra: 5000, birthRate: 0.055, deathRate: 0.007, infantMortality: 0.01 }, // Estabilização demográfica
        { name: "Pós-Industrial",    minEra: 10000,birthRate: 0.035, deathRate: 0.008, infantMortality: 0.01 }
    ];

    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║  CROM — SIMULAÇÃO HISTÓRICA: 0 a.C. → 2026 d.C.           ║");
    console.log("║  Escala: 1 unidade = 10.000 pessoas reais                  ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");

    const startTime = Date.now();
    
    // 1. Inicializar o motor
    const engine = new GameEngine();
    engine.onEvent = (event, type) => {
        if (!event) return;
        const msg = typeof event === 'string' ? event : event.message;
        if (!msg) return;
        console.log(`  💥 [EVENTO - Ano ${engine.year}] ${msg}`);
    };
    const pluginsLoaded = await loadPlugins(engine);
    console.log(`✅ ${pluginsLoaded} plugins carregados`);

    // Interceptar e desarmar o efeito mortal da Arca Geracional no modo headless
    const spaceArk = engine.techTree.technologies.get('space_ark');
    if (spaceArk) {
        spaceArk.onUnlock = (eng) => {
            if (eng.onEvent) {
                eng.onEvent({ message: '🚀🌟 VITÓRIA (Headless): A Arca Geracional foi lançada! A simulação terrestre prossegue para fins de calibração histórica.', color: '#ffffff'}, 'cosmic');
            }
            eng.gameWon = true; 
        };
    }

    const saveArg = process.argv[2];
    let isLoaded = false;

    if (saveArg && fs.existsSync(saveArg)) {
        console.log(`📂 Carregando save de: ${saveArg}...`);
        const raw = fs.readFileSync(saveArg);
        const saveData = JSON.parse(raw);
        SaveSystem.load(saveData, engine);
        
        // Sobrescreve vizinhos com a configuração geográfica de rotas comerciais de longa distância
        engine.nodes.forEach((node, id) => {
            const idx = parseInt(id.replace('hex_', ''));
            const neighbors = [
                ...(idx > 0 ? [`hex_${idx - 1}`] : []),
                ...(idx < HISTORICAL_REGIONS.length - 1 ? [`hex_${idx + 1}`] : []),
                ...(idx >= 5 ? [`hex_${idx - 5}`] : []),
                ...(idx < HISTORICAL_REGIONS.length - 5 ? [`hex_${idx + 5}`] : [])
            ];
            node.neighbors = neighbors;
        });
        
        console.log(`✅ Save carregado! Ano inicial: ${engine.year}. População global: ${formatPop(engine.globalPop * SCALE_FACTOR)}`);
        isLoaded = true;
    } else {
        // 2. Montar hexágonos com vizinhanças lineares (cadeia)
        const hexNodes = HISTORICAL_REGIONS.map((region, idx) => ({
            id: `hex_${idx}`,
            col: idx % 10,
            row: Math.floor(idx / 10),
            lat: region.lat,
            neighbors: [
                ...(idx > 0 ? [`hex_${idx - 1}`] : []),
                ...(idx < HISTORICAL_REGIONS.length - 1 ? [`hex_${idx + 1}`] : []),
                ...(idx >= 5 ? [`hex_${idx - 5}`] : []),
                ...(idx < HISTORICAL_REGIONS.length - 5 ? [`hex_${idx + 5}`] : [])
            ]
        }));

        engine.initWorld(hexNodes);
        console.log(`✅ ${hexNodes.length} regiões históricas inicializadas`);
    }

    if (!isLoaded) {
        // FORÇAR biomas corretos (initWorld randomiza por latitude, sobrescrevendo os históricos)
        const BIOME_MAP = {
            plains: { id: 'plains', name: 'Planície', capacityBase: 500000 },
            desert: { id: 'desert', name: 'Deserto', capacityBase: 200000 },
            jungle: { id: 'jungle', name: 'Selva', capacityBase: 350000 },
            tundra: { id: 'tundra', name: 'Tundra', capacityBase: 100000 }
        };
        HISTORICAL_REGIONS.forEach((region, idx) => {
            const node = engine.nodes.get(`hex_${idx}`);
            if (!node) return;
            node.biome = BIOME_MAP[region.biome];
        });

        // 3. Injetar populações iniciais e nomear
        let totalInitialPop = 0;
        HISTORICAL_REGIONS.forEach((region, idx) => {
            const nodeId = `hex_${idx}`;
            const node = engine.nodes.get(nodeId);
            if (!node) return;
            
            node.name = region.name;
            
            // Infectar com a população histórica
            node.infect(region.pop);
            totalInitialPop += region.pop;
            
            // Dar comida inicial abundante para não morrer nos primeiros dias
            node.food = region.pop * 10;
            node.wildGame = 5000;
            node.crops = region.biome === 'desert' ? ['dates'] : 
                         region.biome === 'jungle' ? ['rice', 'corn'] : ['wheat', 'potato'];
            node.morale = 60;
        });

        engine.globalPop = totalInitialPop;
        console.log(`✅ Pop inicial: ${formatPop(totalInitialPop)} unidades (≈ ${formatPop(totalInitialPop * SCALE_FACTOR)} real)`);

        // 4. Pré-desbloquear techs da Idade do Ferro
        let techsUnlocked = 0;
        for (const techId of IRON_AGE_TECHS) {
            if (engine.techTree.technologies.has(techId)) {
                engine.techTree.unlocked.add(techId);
                techsUnlocked++;
            }
        }
        console.log(`✅ ${techsUnlocked}/${IRON_AGE_TECHS.length} techs da Idade do Ferro pré-desbloqueadas`);

        // 5. Configurar estado global para ano 0
        engine.year = START_YEAR;
        engine.day = 0;
        engine.adaptationPoints = 500; // Conhecimento acumulado
        engine.globalKPenalty = 1.0;
        engine.globalTrust = 100;
        engine.inventory.wood = 50000;
        engine.inventory.water = 100000;
        engine.inventory.minerals = 30000;

        // Salvar checkpoint do ano 0
        const path0 = saveCheckpoint(engine, "Ano 0 a.C. — Estado Inicial");
        console.log(`💾 Save: ${path0}\n`);
    }

    // 6. SIMULAÇÃO PRINCIPAL
    console.log("─────────────────────────────────────────────────────────");
    console.log("  ANO    │  POP (Sim)      │  POP (Real)      │  Ratio");
    console.log("─────────────────────────────────────────────────────────");

    const timeline = [];
    const initialSimulationYear = engine.year;
    
    // Ajustar nextCheckpoint para o próximo múltiplo do intervalo baseado no ano inicial
    let nextCheckpoint = Math.ceil((initialSimulationYear + 1) / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL;
    if (nextCheckpoint === initialSimulationYear) nextCheckpoint += CHECKPOINT_INTERVAL;

    // Encontra o índice inicial no REAL_POP_DATA com base no ano atual
    let nextRealDataIdx = 0;
    while (nextRealDataIdx < REAL_POP_DATA.length && REAL_POP_DATA[nextRealDataIdx].year <= initialSimulationYear) {
        nextRealDataIdx++;
    }

    // Imprimir ano inicial
    const simPopInit = engine.globalPop * SCALE_FACTOR;
    const realPopInit = REAL_POP_DATA.find(d => d.year <= initialSimulationYear)?.pop || REAL_POP_DATA[0].pop;
    console.log(`  ${String(initialSimulationYear).padStart(5)} │  ${formatPop(simPopInit).padStart(14)} │  ${formatPop(realPopInit).padStart(14)} │  ${(simPopInit / realPopInit).toFixed(2)}x`);
    timeline.push({ year: initialSimulationYear, simPop: simPopInit, realPop: realPopInit });

    for (let currentYear = initialSimulationYear + 1; currentYear <= END_YEAR; currentYear++) {
        // Aceleração Científica Cliodinâmica: adapta popPerPoint ao ano real da simulação
        // para mimetizar a aceleração e o ritmo da inovação tecnológica na história humana real.
        // Valores recalibrados para evitar explosão tecnológica instantânea (1 un = 10.000 pessoas)
        if (currentYear >= 1980) {
            Config.game().dnaGeneration.popPerPoint = 150;      // Desacelera na Era da Informação (popPerPoint: 1.500.000 real)
        } else if (currentYear >= 1900) {
            Config.game().dnaGeneration.popPerPoint = 1000;     // Era Atômica (popPerPoint: 10.000.000 real)
        } else if (currentYear >= 1800) {
            Config.game().dnaGeneration.popPerPoint = 5000;     // Era Industrial (popPerPoint: 50.000.000 real)
        } else if (currentYear >= 1700) {
            Config.game().dnaGeneration.popPerPoint = 30000;    // Iluminismo (popPerPoint: 300.000.000 real)
        } else {
            Config.game().dnaGeneration.popPerPoint = 300000;   // Era Pré-Industrial (popPerPoint: 3.000.000.000 real)
        }

        // Rodar 365 dias
        for (let day = 0; day < 365; day++) {
            engine.processTick(1);
        }
        
        // Reabastece o inventário de recursos do império a cada ano para evitar gargalos materiais artificiais
        engine.inventory.minerals = Math.max(engine.inventory.minerals, 50000);
        engine.inventory.wood = Math.max(engine.inventory.wood, 100000);
        engine.inventory.water = Math.max(engine.inventory.water, 200000);
        
        // Atualiza globalPop do engine
        let newGlobalPop = 0;
        engine.nodes.forEach(node => {
            if (node.infected) newGlobalPop += node.demographics.total;
        });
        engine.globalPop = newGlobalPop;

        // Checkpoint periódico
        if (currentYear === nextCheckpoint || currentYear === END_YEAR) {
            const checkpointPath = saveCheckpoint(engine, `Ano ${currentYear} d.C.`);
            nextCheckpoint += CHECKPOINT_INTERVAL;
        }

        // Imprimir quando coincide com dados reais
        if (nextRealDataIdx < REAL_POP_DATA.length && currentYear >= REAL_POP_DATA[nextRealDataIdx].year) {
            const simPop = engine.globalPop * SCALE_FACTOR;
            const realPop = REAL_POP_DATA[nextRealDataIdx].pop;
            const ratio = realPop > 0 ? (simPop / realPop).toFixed(2) : 'N/A';
            console.log(`  ${String(currentYear).padStart(5)} │  ${formatPop(simPop).padStart(14)} │  ${formatPop(realPop).padStart(14)} │  ${ratio}x`);
            timeline.push({ year: currentYear, simPop, realPop });
            nextRealDataIdx++;
        }
        
        // Log a cada 100 anos
        if (currentYear % 100 === 0 && !REAL_POP_DATA.find(d => d.year === currentYear)) {
            const simPop = engine.globalPop * SCALE_FACTOR;
            process.stdout.write(`  [Ano ${currentYear}] Pop: ${formatPop(simPop)} | Era: ${engine.currentEra.name} | Techs: ${engine.unlockedTechs.size}\n`);
        }
    }

    console.log("─────────────────────────────────────────────────────────\n");

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // 7. RELATÓRIO FINAL
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log(`║  SIMULAÇÃO CONCLUÍDA EM ${elapsed}s                         ║`);
    console.log("╚══════════════════════════════════════════════════════════════╝\n");

    // Estatísticas finais
    const finalSimPop = engine.globalPop * SCALE_FACTOR;
    const finalRealPop = REAL_POP_DATA[REAL_POP_DATA.length - 1].pop;
    console.log(`📊 Pop Final (Sim):  ${formatPop(finalSimPop)}`);
    console.log(`📊 Pop Final (Real): ${formatPop(finalRealPop)}`);
    console.log(`📊 Ratio:            ${(finalSimPop / finalRealPop * 100).toFixed(1)}% do real`);
    console.log(`📊 Era Atual:        ${engine.currentEra.name}`);
    console.log(`📊 Techs:            ${engine.unlockedTechs.size}`);
    console.log(`📊 K-Penalty:        ${(engine.globalKPenalty || 1).toFixed(4)}`);
    console.log(`📊 Trust:            ${Math.floor(engine.globalTrust)}`);

    // Listar saves
    const saves = fs.readdirSync(SAVES_DIR).filter(f => f.endsWith('.json'));
    console.log(`\n💾 ${saves.length} saves gerados em: ${SAVES_DIR}/`);
    saves.forEach(s => console.log(`   📁 ${s}`));

    // 8. Gráfico ASCII da Curva S
    console.log("\n📈 CURVA DE CRESCIMENTO (Simulado vs Real):");
    console.log("─".repeat(60));
    const maxPop = Math.max(...timeline.map(t => Math.max(t.simPop, t.realPop)));
    const barWidth = 40;
    for (const point of timeline) {
        const simBar = Math.round((point.simPop / maxPop) * barWidth);
        const realBar = Math.round((point.realPop / maxPop) * barWidth);
        console.log(`  ${String(point.year).padStart(5)} Sim:  ${'█'.repeat(simBar)}${'░'.repeat(barWidth - simBar)} ${formatPop(point.simPop)}`);
        console.log(`        Real: ${'▓'.repeat(realBar)}${'░'.repeat(barWidth - realBar)} ${formatPop(point.realPop)}`);
        console.log("");
    }

    // 9. Gerar relatório markdown
    generateReport(timeline, engine, elapsed, saves);
    
    console.log("\n🎉 Simulação histórica completa! Edite os JSONs em saves/ para ajustar parâmetros.");
}

function generateReport(timeline, engine, elapsed, saves) {
    let md = `# Relatório: Simulação Histórica 0 a.C. → 2026 d.C.\n\n`;
    md += `**Duração da simulação:** ${elapsed}s\n`;
    md += `**Fator de escala:** 1 unidade = ${SCALE_FACTOR.toLocaleString()} pessoas\n\n`;

    md += `## Comparação com Dados Reais\n\n`;
    md += `| Ano | Pop Simulada | Pop Real | Ratio | Era |\n`;
    md += `|-----|-------------|----------|-------|-----|\n`;
    for (const point of timeline) {
        const ratio = point.realPop > 0 ? (point.simPop / point.realPop * 100).toFixed(1) + '%' : 'N/A';
        md += `| ${point.year} | ${formatPop(point.simPop)} | ${formatPop(point.realPop)} | ${ratio} | - |\n`;
    }

    md += `\n## Estado Final\n\n`;
    md += `- **Era:** ${engine.currentEra.name}\n`;
    md += `- **Techs:** ${engine.unlockedTechs.size}\n`;
    md += `- **K-Penalty:** ${(engine.globalKPenalty || 1).toFixed(4)}\n`;
    md += `- **Trust:** ${Math.floor(engine.globalTrust)}\n`;

    md += `\n## Saves Editáveis\n\n`;
    md += `Os seguintes checkpoints JSON estão disponíveis em \`saves/\`:\n\n`;
    saves.forEach(s => { md += `- \`${s}\`\n`; });

    md += `\n## Como Editar um Save\n\n`;
    md += `1. Abra o JSON (ex: \`saves/checkpoint_year_500.json\`)\n`;
    md += `2. Modifique parâmetros (pop, techs, inventário)\n`;
    md += `3. Use \`SaveSystem.load(json, engine)\` para recarregar\n`;

    const reportPath = path.join(SAVES_DIR, 'simulation_report.md');
    fs.writeFileSync(reportPath, md);
    console.log(`\n📝 Relatório salvo: ${reportPath}`);
}

runHistoricalSimulation().catch(err => {
    console.error("❌ ERRO NA SIMULAÇÃO:", err);
    process.exit(1);
});
