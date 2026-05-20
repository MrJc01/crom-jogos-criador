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

const SAVE_PATH = path.join(SAVES_DIR, 'year_zero_start.json');
const SCALE_FACTOR = 100; // 1 unidade = 100 indivíduos reais
const START_YEAR = 0;
const END_YEAR = 3000;
const TICK_YEARS = 10; // 10 anos por tick
const TIME_SCALE = TICK_YEARS * 365;

const HISTORICAL_REGIONS = [
    { name: "Mesopotâmia",        biome: "plains",  lat: 33,  pop: 150000 },
    { name: "Delta do Nilo",      biome: "desert",  lat: 30,  pop: 80000  },
    { name: "Vale do Indus",      biome: "plains",  lat: 25,  pop: 300000 },
    { name: "Huang He (Rio Am.)", biome: "plains",  lat: 35,  pop: 350000 },
    { name: "Yangtze",            biome: "jungle",  lat: 30,  pop: 250000 },
    { name: "Roma (Lácio)",       biome: "plains",  lat: 42,  pop: 300000 },
    { name: "Grécia (Ática)",     biome: "plains",  lat: 38,  pop: 80000  },
    { name: "Pérsia",             biome: "desert",  lat: 32,  pop: 150000 },
    { name: "Germânia",           biome: "plains",  lat: 51,  pop: 40000  },
    { name: "Britânia",           biome: "plains",  lat: 52,  pop: 10000  },
    { name: "Etiópia (Axum)",     biome: "plains",  lat: 9,   pop: 40000  },
    { name: "Nigéria",            biome: "jungle",  lat: 9,   pop: 30000  },
    { name: "Mesoamérica",        biome: "jungle",  lat: 19,  pop: 50000  },
    { name: "Andes",              biome: "tundra",  lat: -13, pop: 60000  },
    { name: "Indonésia",          biome: "jungle",  lat: -5,  pop: 40000  }
];

async function loadPlugins(engine) {
    function walkSync(dir, files = []) {
        if (!fs.existsSync(dir)) return files;
        fs.readdirSync(dir).forEach(f => {
            const p = path.join(dir, f);
            if (fs.statSync(p).isDirectory()) walkSync(p, files);
            else if (f.endsWith('.js')) {
                const normPath = p.replace(/\\/g, '/');
                // Ignorar os motores paleolíticos específicos
                const isEvolutionary = 
                    normPath.includes('GeneticsEngine.js') ||
                    normPath.includes('IceAgeEngine.js') ||
                    normPath.includes('HominidCompetitionEngine.js');
                
                if (!isEvolutionary) {
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
    if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(n);
}

function ensureInitialSave(engine) {
    if (fs.existsSync(SAVE_PATH)) {
        console.log(`💾 Save de ponto de partida encontrado: ${SAVE_PATH}`);
        return;
    }

    console.log(`🆕 Save de ponto de partida não encontrado. Gerando novo: ${SAVE_PATH}`);
    
    // 1. Inicializar Nós do Mapa
    const hexNodes = HISTORICAL_REGIONS.map((region, idx) => ({
        id: `hex_${idx}`,
        col: idx % 10,
        row: Math.floor(idx / 10),
        lat: region.lat,
        neighbors: [] // Conexões serão criadas dinamicamente
    }));
    
    engine.initWorld(hexNodes);
    
    // 2. Configurar Nós com dados do Ano 0 d.C.
    const biomesCfg = Config.get('biomes') || {};
    engine.nodes.forEach((node, id) => {
        const idx = parseInt(id.replace('hex_', ''));
        const regInfo = HISTORICAL_REGIONS[idx];
        const biomeData = biomesCfg[regInfo.biome.toUpperCase()] || { id: regInfo.biome, capacityBase: 100000 };
        
        node.name = regInfo.name;
        node.biome = biomeData;
        node.infected = true; // Povoado
        
        // População Histórica
        node.demographics.total = Math.floor(regInfo.pop / SCALE_FACTOR);
        node.demographics.dist.age = { child: 0.25, young: 0.35, adult: 0.30, elder: 0.10 };
        node.demographics.dist.sex = { M: 0.50, F: 0.50 };
        node.demographics.dist.religion = { animism: 1.0 };
        node.demographics.dist.factions = { tribal: 1.0 };
        
        // Recursos Abundantes
        node.resources = {
            wood: 80000,
            water: 120000,
            minerals: 30000
        };
        node.food = 200000;
        node.soil = 100;
    });

    // 3. Destravar tecnologias base da Antiguidade
    const baseTechs = [
        'medicine', 'agriculture', 'ferramentas_pedra', 'animismo',
        'saneamento_basico', 'metalurgia_bronze', 'codigo_de_leis',
        'determinismo', 'existencialismo'
    ];
    baseTechs.forEach(t => engine.techTree.unlocked.add(t));
    
    // Configurações globais
    engine.year = START_YEAR;
    engine.day = 1;
    engine.timeScale = TIME_SCALE;
    engine.adaptationPoints = 1000; // DNA inicial de reserva
    engine.inventory = { wood: 50000, water: 100000, minerals: 20000, silicon: 0, chips: 0, computers: 0 };
    engine.globalTrust = 100;

    // Salvar JSON
    const serialized = SaveSystem.save(engine);
    fs.writeFileSync(SAVE_PATH, JSON.stringify(serialized, null, 2));
    console.log(`✅ Novo save do Ano 0 d.C. gerado com sucesso.`);
}

async function runYearZeroSimulation() {
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║           INICIANDO SIMULAÇÃO DO ANO 0 AO 3000               ║");
    console.log("║              CENÁRIO HISTÓRICO COM SAVE MODIFICADO           ║");
    console.log("╚══════════════════════════════════════════════════════════════╝\n");

    const engine = new GameEngine();
    
    // Carregar a árvore padrão do jogo
    engine.techTree.syncWithConfig();
    
    // Garantir save inicial
    ensureInitialSave(engine);
    
    // Carregar do save
    const saveData = JSON.parse(fs.readFileSync(SAVE_PATH, 'utf-8'));
    SaveSystem.load(saveData, engine);
    
    // Configurar escala temporal de 10 anos por tick
    engine.timeScale = TIME_SCALE;
    
    // Sobrescrever manipulador de eventos do jogo
    engine.onEvent = (event, type) => {
        if (!event) return;
        const msg = typeof event === 'string' ? event : event.message;
        if (msg && !msg.includes('FAUNA') && !msg.includes('GÊNIO')) {
            console.log(`  🧬 [EVENTO - ${engine.year} d.C.] ${msg}`);
        }
    };

    // Carregar plugins padrão
    const pluginsLoaded = await loadPlugins(engine);
    console.log(`✅ Módulos de simulação carregados: ${pluginsLoaded}`);
    console.log(`🌎 População mundial inicial: ${formatPop(engine.globalPop * SCALE_FACTOR)}`);
    console.log(`⏱️ Escala de tempo: ${TICK_YEARS} anos por iteração.\n`);

    const logHistory = [];
    const startTime = Date.now();

    // Loop de Simulação
    while (engine.year < END_YEAR) {
        const currentYear = engine.year;
        
        // Processar 1 tick computacional (10 anos)
        engine.processTick(1);

        // Auto-compra de Tecnologias Históricas
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

        // Coleta de Estatísticas Globais
        let totalPop = 0;
        let activeRegions = 0;
        engine.nodes.forEach(node => {
            if (node.infected && node.demographics.total > 0) {
                totalPop += node.demographics.total;
                activeRegions++;
            }
        });

        const realPop = totalPop * SCALE_FACTOR;

        if (currentYear % 100 === 0 || currentYear === START_YEAR) {
            const unlockedCount = engine.techTree.unlocked.size;
            console.log(`📅 Ano: ${String(currentYear).padEnd(6)} d.C. | Pop: ${formatPop(realPop).padEnd(8)} | DNA: ${formatPop(engine.adaptationPoints).padEnd(6)} | Techs: ${unlockedCount} | Regiões: ${activeRegions}/15`);
            console.log("   " + "─".repeat(80));

            logHistory.push({
                year: currentYear,
                pop: realPop,
                techs: unlockedCount,
                activeRegions,
                dna: engine.adaptationPoints
            });
        }

        if (totalPop <= 0) {
            console.log("💀 COLAPSO HISTÓRICO: A humanidade foi totalmente extinta!");
            break;
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🏁 SIMULAÇÃO CONCLUÍDA EM ${elapsed}s`);

    // Gerar relatório de execução
    const reportPath = path.join(SAVES_DIR, 'year_zero_report.md');
    
    let finalPop = 0;
    engine.nodes.forEach(node => {
        if (node.infected && node.demographics.total > 0) {
            finalPop += node.demographics.total;
        }
    });

    const reportContent = `# Relatório de Simulação Histórica (0 d.C. a 3000 d.C.)

- **Período Simulado**: Ano 0 d.C. a Ano 3000 d.C.
- **Tempo de Execução**: ${elapsed} segundos
- **População Final Total**: ${formatPop(finalPop * SCALE_FACTOR)} indivíduos
- **Tecnologias Desbloqueadas**: ${engine.techTree.unlocked.size} inovações

## Trajetória de Crescimento Populacional e Tecnológico

| Ano | População Global | DNA Acumulado | Regiões Ativas | Tecnologias Unlocked |
| --- | --- | --- | --- | --- |
${logHistory.map(h => `| ${h.year} d.C. | ${formatPop(h.pop)} | ${formatPop(h.dna)} | ${h.activeRegions} | ${h.techs} |`).join('\n')}

## Conclusões da Evolução Civilizacional
A simulação partiu do Ano 0 d.C. com os grandes impérios clássicos estabelecidos e progrediu através das eras de tecnologia e saneamento até o limiar da Era da Informação e Espacial.
`;

    fs.writeFileSync(reportPath, reportContent);
    console.log(`📝 Relatório final salvo em: ${reportPath}`);
}

runYearZeroSimulation().catch(err => {
    console.error("❌ Erro na simulação do Ano 0:", err);
});
