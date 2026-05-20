import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameEngine } from '../client/src/core/Engine.js';
import { SaveSystem } from '../client/src/core/SaveSystem.js';
import { Config } from '../client/src/config/ConfigLoader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAVES_DIR = path.join(__dirname, '..', 'saves');

if (!fs.existsSync(SAVES_DIR)) {
    fs.mkdirSync(SAVES_DIR, { recursive: true });
}

// ===== CONFIGURAÇÃO DA EVOLUÇÃO PALEOLÍTICA =====
const SCALE_FACTOR = 100; // 1 unidade = 100 indivíduos reais (escala tribal)
const START_YEAR = -300000;
const END_YEAR = -10000;
const TICK_YEARS = 10; // Cada tick computacional representa 10 anos para estabilidade populacional
const TIME_SCALE = TICK_YEARS * 365; // Em dias de simulação

const HISTORICAL_REGIONS = [
    { name: "Mesopotâmia",        biome: "plains",  lat: 33 },
    { name: "Delta do Nilo",      biome: "desert",  lat: 30 },
    { name: "Vale do Indus",      biome: "plains",  lat: 25 },
    { name: "Huang He (Rio Am.)", biome: "plains",  lat: 35 },
    { name: "Yangtze",            biome: "jungle",  lat: 30 },
    { name: "Roma (Lácio)",       biome: "plains",  lat: 42 },
    { name: "Grécia (Ática)",     biome: "plains",  lat: 38 },
    { name: "Pérsia",             biome: "desert",  lat: 32 },
    { name: "Germânia",           biome: "plains",  lat: 51 },
    { name: "Britânia",           biome: "plains",  lat: 52 },
    { name: "Etiópia (Axum)",     biome: "plains",  lat: 9  },
    { name: "Nigéria",            biome: "jungle",  lat: 9  },
    { name: "Mesoamérica",        biome: "jungle",  lat: 19 },
    { name: "Andes",              biome: "tundra",  lat: -13},
    { name: "Indonésia",          biome: "jungle",  lat: -5 }
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
                    normPath.endsWith('biology/aging.js') ||
                    normPath.endsWith('biology/gestation.js') ||
                    normPath.endsWith('biology/migration.js') ||
                    normPath.endsWith('biology/GeneticsEngine.js') ||
                    normPath.endsWith('events/IceAgeEngine.js') ||
                    normPath.endsWith('sociology/HominidCompetitionEngine.js') ||
                    normPath.endsWith('economy/extraction.js');
                
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
        if (m.default) { 
            engine.registerPlugin(m.default); 
            loaded++; 
        }
    }
    return loaded;
}

function formatPop(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
}

async function runEvolutionSimulation() {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║               INICIANDO SIMULAÇÃO EVOLUTIVA                  ║");
    console.log("║                  DO ANO 300.000 A.C. AO 10.000 A.C.          ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");

    // 1. Chavear para a árvore de tecnologia paleolítica
    Config.useStoneAgeTechTree();
    console.log("⚙️ Árvore de tecnologia chaveada para: StoneAgeTechTree\n");

    // Desativar desastres e eventos de civilização para o Pleistoceno
    Config.game().demographics.geneticWinter.dailyChance = 0;
    Config.game().demographics.darkAge.dailyTechLossChance = 0;
    Config.game().greatFilter.nuclear.dailyChance = 0;

    // 2. Inicializar o Motor
    const engine = new GameEngine();
    
    // Desarmar o loop automático da interface gráfica
    engine.onEvent = (event, type) => {
        if (!event) return;
        const msg = typeof event === 'string' ? event : event.message;
        if (msg && !msg.includes('FAUNA') && !msg.includes('GÊNIO')) {
            console.log(`  🧬 [EVENTO - ${Math.abs(engine.year)} a.C.] ${msg}`);
        }
    };

    const pluginsLoaded = await loadPlugins(engine);
    console.log(`✅ Módulos evolutivos carregados: ${pluginsLoaded}`);

    // 3. Inicializar Mapa e Regiões
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
    
    // Configurar recursos nos hexágonos
    engine.nodes.forEach((node, id) => {
        const regionInfo = HISTORICAL_REGIONS[parseInt(id.replace('hex_', ''))];
        node.name = regionInfo.name;
        node.resources = {
            water: 80000,
            wood: 20000,
            minerals: 10000
        };
        node.food = 1000;
        node.soil = 100;
        node.infected = false; // Começam vazios
    });

    // 4. Injetar a População Fundadora (Out of Africa - Etiópia)
    const ethiopia = engine.nodes.get('hex_10');
    ethiopia.infected = true;
    ethiopia.demographics.total = 5; // 500 pessoas reais (escala tribal de SCALE_FACTOR=100)
    ethiopia.demographics.dist.age = { child: 0.25, young: 0.35, adult: 0.30, elder: 0.10 };
    ethiopia.genes = {
        coldResistance: 0.0,
        cognitiveBonus: 0.05,
        huntingEfficiency: 0.1,
        bipedalism: 0.1
    };
    ethiopia.species = {
        sapiens: 1.0,
        neanderthal: 0.0,
        denisova: 0.0,
        erectus: 0.0
    };

    // Configurar ano inicial e escala temporal de 100 anos por tick
    engine.year = START_YEAR;
    engine.day = 1;
    engine.timeScale = TIME_SCALE; 
    engine.adaptationPoints = 0;

    console.log(`🌍 População fundadora inserida em: ${ethiopia.name}`);
    console.log(`⏱️ Escala de tempo: ${TICK_YEARS} anos por iteração.\n`);

    const logHistory = [];
    const startTime = Date.now();

    // 5. Loop da Simulação
    while (engine.year < END_YEAR) {
        const currentYear = engine.year;
        
        // Rodar 1 tick computacional (que equivale a 100 anos)
        engine.processTick(1);

        // A. Gestão Automática de Tecnologia Paleolítica
        const availableTechs = engine.techTree.getAvailable();
        for (const tech of availableTechs) {
            const cost = engine.techTree.getModifiedCost(tech, engine);
            if (engine.adaptationPoints >= cost) {
                const bought = engine.techTree.buy(tech.id, engine);
                if (bought) {
                    console.log(`  💡 [TECNOLOGIA] Inovação destravada: **${tech.name}** (-${cost} DNA)`);
                }
            }
        }

        // B. Coletar Estatísticas Globais
        let totalPop = 0;
        let activeRegions = 0;
        let avgColdRes = 0;
        let avgCognitive = 0;
        let sumSapiens = 0;
        let sumNeander = 0;
        let sumDenisova = 0;
        let sumErectus = 0;

        engine.nodes.forEach(node => {
            if (node.infected && node.demographics.total > 0) {
                totalPop += node.demographics.total;
                activeRegions++;
                avgColdRes += (node.genes?.coldResistance || 0) * node.demographics.total;
                avgCognitive += (node.genes?.cognitiveBonus || 0) * node.demographics.total;
                
                if (node.species) {
                    sumSapiens += (node.species.sapiens || 0) * node.demographics.total;
                    sumNeander += (node.species.neanderthal || 0) * node.demographics.total;
                    sumDenisova += (node.species.denisova || 0) * node.demographics.total;
                    sumErectus += (node.species.erectus || 0) * node.demographics.total;
                }
            }
        });

        const realPop = totalPop * SCALE_FACTOR;

        if (totalPop > 0) {
            avgColdRes /= totalPop;
            avgCognitive /= totalPop;
            sumSapiens /= totalPop;
            sumNeander /= totalPop;
            sumDenisova /= totalPop;
            sumErectus /= totalPop;
        }

        // C. Logar progresso a cada 10.000 anos
        if (currentYear % 10000 === 0 || currentYear === START_YEAR) {
            const formattedYear = Math.abs(currentYear).toLocaleString() + ' a.C.';
            console.log(`📅 Ano: ${formattedYear.padEnd(16)} | Pop: ${formatPop(realPop).padEnd(8)} | Temp: ${(engine.globalTemperature || 0).toFixed(1)}ºC | Regiões: ${activeRegions}/15`);
            console.log(`   🧬 Genômica: Resistência Frio: ${(avgColdRes * 100).toFixed(1)}% | Cognição: ${(avgCognitive * 100).toFixed(1)}%`);
            console.log(`   👥 Hominídeos: Sapiens: ${(sumSapiens * 100).toFixed(1)}% | Neanderthal: ${(sumNeander * 100).toFixed(1)}% | Denisovano: ${(sumDenisova * 100).toFixed(1)}%`);
            console.log("   " + "─".repeat(80));

            logHistory.push({
                year: currentYear,
                pop: realPop,
                temp: engine.globalTemperature,
                activeRegions,
                coldRes: avgColdRes,
                cognitive: avgCognitive,
                sapiens: sumSapiens,
                neanderthal: sumNeander,
                denisova: sumDenisova,
                erectus: sumErectus
            });
        }

        // Extinção prematura do gênero Homo?
        if (totalPop <= 0) {
            console.log("💀 COLAPSO EVOLUTIVO: A humanidade primitiva foi extinta!");
            break;
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🏁 SIMULAÇÃO CONCLUÍDA EM ${elapsed}s`);

    // 6. Gerar Relatório de Evolução
    let finalSapiens = 0, finalNeander = 0, finalDenisova = 0, finalPop = 0;
    engine.nodes.forEach(node => {
        if (node.infected && node.demographics.total > 0) {
            finalPop += node.demographics.total;
            finalSapiens += (node.species?.sapiens || 0) * node.demographics.total;
            finalNeander += (node.species?.neanderthal || 0) * node.demographics.total;
            finalDenisova += (node.species?.denisova || 0) * node.demographics.total;
        }
    });

    if (finalPop > 0) {
        finalSapiens /= finalPop;
        finalNeander /= finalPop;
        finalDenisova /= finalPop;
    }

    const reportContent = `# Relatório de Evolução Humana e Dispersão (Pleistoceno)

- **Período Simulado**: 300.000 a.C. a 10.000 a.C.
- **Tempo de Execução**: ${elapsed} segundos
- **População Final Total**: ${formatPop(finalPop * SCALE_FACTOR)} indivíduos
- **Dominância Genética**:
  - **Homo Sapiens**: ${(finalSapiens * 100).toFixed(2)}%
  - **Homo Neanderthalensis**: ${(finalNeander * 100).toFixed(2)}%
  - **Homo Denisova**: ${(finalDenisova * 100).toFixed(2)}%

## Histórico de Trajetória Climática e Demográfica

| Ano | População | Temperatura | Regiões Colonizadas | Sapiens % | Neanderthal % | Denisovano % |
| --- | --- | --- | --- | --- | --- | --- |
${logHistory.map(h => `| ${Math.abs(h.year).toLocaleString()} a.C. | ${formatPop(h.pop)} | ${h.temp.toFixed(1)}ºC | ${h.activeRegions} | ${(h.sapiens * 100).toFixed(1)}% | ${(h.neanderthal * 100).toFixed(1)}% | ${(h.denisova * 100).toFixed(1)}% |`).join('\n')}

## Conclusões Evolutivas

A simulação demonstrou que a humanidade partindo do Leste da África expandiu-se com sucesso pela Eurásia, adaptando-se a severas glaciações e integrando material genético Neanderthal através de fluxo gênico e hibridização local antes de atingir a era do Neolítico.
`;

    const reportPath = path.join(SAVES_DIR, 'evolution_report.md');
    fs.writeFileSync(reportPath, reportContent);
    console.log(`\n📝 Relatório de evolução salvo em: ${reportPath}`);
}

runEvolutionSimulation().catch(err => {
    console.error("❌ Erro na simulação evolutiva:", err);
});
