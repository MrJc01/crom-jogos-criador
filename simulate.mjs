import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GameEngine } from './client/src/core/Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Função para carregar plugins automaticamente
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
    let loaded = 0;
    for (const f of files) {
        try {
            const m = await import('file://' + f);
            if (m.default) { 
                engine.registerPlugin(m.default); 
                loaded++; 
            }
        } catch (e) {
            // ignora erros de arquivos que não são plugins
        }
    }
    return loaded;
}

// Pega argumentos do CLI
const args = process.argv.slice(2);
let targetYears = 1000;
let logInterval = 100;
let selectedFaction = 'sino_tibetanos';

args.forEach(arg => {
    if (arg.startsWith('--years=')) targetYears = parseInt(arg.split('=')[1]);
    if (arg.startsWith('--interval=')) logInterval = parseInt(arg.split('=')[1]);
    if (arg.startsWith('--faction=')) selectedFaction = arg.split('=')[1];
    if (arg === '--help' || arg === '-h') {
        console.log(`
Uso: node simulate.mjs [opções]

Opções:
  --years=N       Total de anos para simular (padrão: 1000)
  --interval=N    De quantos em quantos anos mostrar o log (padrão: 100)
  --faction=ID    Facção inicial (ex: sino_tibetanos, indo_europeus) (padrão: sino_tibetanos)
  --help, -h      Mostra esta ajuda
        `);
        process.exit(0);
    }
});

async function run() {
    console.log('\n======================================================');
    console.log('🌍 CROM - SIMULADOR ZERO-PLAYER INTERATIVO');
    console.log('======================================================');
    console.log(`Configuração: ${targetYears} anos | Print a cada ${logInterval} anos | Facção: ${selectedFaction}`);
    console.log('Inicializando Motor...\n');

    const engine = new GameEngine();
    await loadPlugins(engine);

    // Inicializa Hexágonos Simples (Um pequeno continente)
    const mockHexes = [];
    const biomes = ['plains', 'tundra', 'desert', 'jungle', 'plains'];
    for (let i = 0; i < 5; i++) {
        const neighbors = [];
        if (i > 0) neighbors.push(`hex_${i-1}`);
        if (i < 4) neighbors.push(`hex_${i+1}`);
        mockHexes.push({ id: `hex_${i}`, col: i, row: 0, lat: i * 15, neighbors, biome: { id: biomes[i] } });
    }
    engine.initWorld(mockHexes);

    // Infecta um nó aleatório (Roleta Geográfica)
    const nodesArray = Array.from(engine.nodes.values());
    const startNode = nodesArray[Math.floor(Math.random() * nodesArray.length)];
    startNode.infect(0);
    
    // Semente Fundadora Aleatória (Founder Effect) - Pode ser de 10 sobreviventes a 500 nômades
    const initialPop = Math.floor(Math.random() * 490) + 10;
    
    // Configura a facção inicial com os fundadores
    startNode.demographics.dist.factions = { [selectedFaction]: 1.0 };
    startNode.demographics.addBirths(initialPop); 
    engine.globalPop = initialPop;

    // Configura listeners para Crônicas (Avisos de Genocídio, Cisma, Estado, etc)
    const recentEvents = [];
    const reportData = [
        `# Relatório de Simulação CROM`,
        `**Facção Inicial:** ${selectedFaction}`,
        `**Duração Alvo:** ${targetYears} anos`,
        `**Data da Simulação:** ${new Date().toISOString()}\n`,
        `## Linha do Tempo\n`
    ];

    let lastYearEvents = new Set();
    let lastYearTracker = -1;

    engine.onEvent = (event, type) => {
        if (engine.year !== lastYearTracker) {
            lastYearEvents.clear();
            lastYearTracker = engine.year;
        }

        const rawMsg = event.message || event;
        const msgStr = typeof rawMsg === 'object' ? JSON.stringify(rawMsg) : String(rawMsg);

        // Previne spam idêntico no mesmo ano
        if (lastYearEvents.has(msgStr)) return;
        
        // Reduz o spam de eventos contínuos a apenas 1 vez por milênio ou século (ex: Saber Médico e Inverno Genético)
        if ((msgStr.includes("SABER MÉDICO") || msgStr.includes("INVERNO GENÉTICO")) && engine.year % 1000 !== 0) {
            return;
        }

        lastYearEvents.add(msgStr);

        const msg = `[Ano ${engine.year}] ${msgStr}`;
        recentEvents.push(msg);
        reportData.push(`- **${engine.year}**: ${msgStr}`);
    };

    let startTime = Date.now();
    let nextLogYear = logInterval;

    console.log("🚀 Iniciando o fluxo do tempo...\n");

    // Loop de simulação
    while (engine.year < targetYears) {
        engine.processTick(); // Avança o tempo do motor

        // Se todo mundo morrer, termina cedo
        if (engine.globalPop <= 0) {
            console.log(`\n💀 EXTINÇÃO TOTAL NO ANO ${engine.year}. A vida sucumbiu à natureza.`);
            break;
        }

        // Print no intervalo
        if (engine.year >= nextLogYear) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            
            // Descobre quem tá vivo
            const factions = engine.globalDemographics?.factions || {};
            const activeFactions = Object.entries(factions).filter(([k,v]) => v > 1);
            const factionList = activeFactions.map(([k,v]) => `${k} (${Math.floor(v)})`).join(', ');
            const factionCount = activeFactions.length;

            // Tenta pegar a temperatura (Pode não existir logo no ano 1)
            const temp = engine.globalTemperature || 0;
            let clima = 'Temperado';
            if (temp > 0.8) clima = '🔥 Seca Extrema';
            else if (temp < -0.8) clima = '❄️ Era do Gelo';

            console.log(`\n── Ano ${engine.year} (${elapsed}s) ──`);
            console.log(`👥 População Global: ${Math.floor(engine.globalPop).toLocaleString('pt-BR')}`);
            console.log(`🌍 Clima: ${clima}`);
            console.log(`🗺️ Culturas Vivas: ${factionCount} -> ${factionList || 'Nenhuma'}`);
            console.log(`🧬 Tecnologias Desbloqueadas: ${engine.unlockedTechs?.size || 0}`);
            
            // Grava os dados detalhados no Relatório por Século / Intervalo
            reportData.push(`\n### 📊 Registro do Ano ${engine.year} (Século ${Math.floor(engine.year / 100)})`);
            reportData.push(`- **População Global**: ${Math.floor(engine.globalPop).toLocaleString('pt-BR')}`);
            reportData.push(`- **Facções Vivas**: ${factionCount} detalhadas: *${factionList || 'Nenhuma'}*`);
            reportData.push(`- **Clima Atual**: ${clima}`);
            reportData.push(`- **Tecnologias**: ${engine.unlockedTechs?.size || 0}\n`);

            if (recentEvents.length > 0) {
                console.log(`📜 Últimos Eventos:`);
                recentEvents.slice(-3).forEach(msg => console.log(`   > ${msg}`));
                recentEvents.length = 0; // Limpa eventos lidos
            }
            
            nextLogYear += logInterval;
        }
    }

    console.log('\n======================================================');
    console.log(`🏁 SIMULAÇÃO CONCLUÍDA EM ${((Date.now() - startTime) / 1000).toFixed(2)} SEGUNDOS`);
    console.log(`População Final: ${Math.floor(engine.globalPop).toLocaleString('pt-BR')}`);
    
    // Gera o Relatório
    reportData.push(`\n## Resumo Final`);
    reportData.push(`- **População Global**: ${Math.floor(engine.globalPop).toLocaleString('pt-BR')}`);
    reportData.push(`- **Extinção**: ${engine.globalPop <= 0 ? 'Sim' : 'Não'}`);
    reportData.push(`- **Tecnologias Descobertas**: ${engine.unlockedTechs?.size || 0}`);
    
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir);
    }
    const reportPath = path.join(reportsDir, `crom_report_${Date.now()}.md`);
    fs.writeFileSync(reportPath, reportData.join('\n'));
    
    console.log(`\n📄 Relatório detalhado salvo em: ${reportPath}`);
    console.log('======================================================\n');
}

run().catch(console.error);
