import { GameEngine } from '../src/core/Engine.js';
import fs from 'fs';

console.log("=========================================");
console.log("🛰️ INICIALIZANDO SIMULAÇÃO CLI DO CROM 🛰️");
console.log("=========================================");

// 1. Carrega o mapa pré-gerado
const hexMapRaw = fs.readFileSync('public/hex_map.json', 'utf8');
const hexNodes = JSON.parse(hexMapRaw);
console.log(`🗺️ Mapa carregado com sucesso: ${hexNodes.length} hexágonos.`);

// 2. Instancia o motor da simulação
const engine = new GameEngine({
    warChance: 0.05,
    disasterThreshold: 95,
    techCostMultiplier: 1.0
});

// Inicializa o mundo
engine.initWorld(hexNodes);
console.log("✨ Mundo inicializado. Espécies geradas proceduralmente:");

// Exibe informações das espécies geradas
const speciesList = Array.from(engine.startingSpeciesIds);
speciesList.forEach((spId, idx) => {
    console.log(`  [Espécie ${idx+1}] ID: ${spId}`);
});

// 3. Escolhe a região continental inicial para autostart (Zero-Player Mode)
const landNodes = Array.from(engine.nodes.values()).filter(n => n.biome && n.biome.id !== 'desert' && n.biome.id !== 'mountain');
const startNode = landNodes.length > 0 ? landNodes[Math.floor(Math.random() * landNodes.length)] : Array.from(engine.nodes.values())[0];
console.log(`\n🌱 Berço da Civilização Escolhido: ${startNode.name} (Bioma: ${startNode.biome.name})`);

// Deposita a Tribo Primordial
engine.startInfection(startNode.id);
console.log(`🔥 Invasão e povoamento iniciados no Hexágono ${startNode.id}!`);

// Event logger síncrono para capturar desastres e avanços
engine.onEvent = (data, type) => {
    const msg = data.message || data;
    if (type === "disaster") {
        console.log(`💥 [DIA ${engine.day} | ANO ${engine.year}] [DESASTRE] \x1b[31m${msg}\x1b[0m`);
    } else if (type === "war") {
        console.log(`⚔️ [DIA ${engine.day} | ANO ${engine.year}] [GUERRA] \x1b[33m${msg}\x1b[0m`);
    } else if (type === "tech_auto") {
        console.log(`💡 [DIA ${engine.day} | ANO ${engine.year}] [EVOLUÇÃO] \x1b[36mEvolução Tecnológica: ${msg}\x1b[0m`);
    } else if (type === "cosmic") {
        console.log(`☄️ [DIA ${engine.day} | ANO ${engine.year}] [CÓSMICO] \x1b[35m${msg}\x1b[0m`);
    }
};

// Histórico de logs de evolução
const history = [];

// 4. Executa a simulação por 200 anos
const TOTAL_YEARS = 200;
console.log(`\n🚀 Iniciando loop de simulação temporal para os próximos ${TOTAL_YEARS} anos...`);

for (let y = 1; y <= TOTAL_YEARS; y++) {
    // Executa 365 dias para avançar um ano inteiro
    engine.processTick(365);
    
    // Registra dados anuais
    const currentPop = engine.globalPop;
    const currentEra = engine.currentEra.name;
    const factions = { ...engine.globalDemographics.factions };
    const unlockedTechsCount = engine.unlockedTechs.size;
    
    history.push({
        year: y,
        pop: currentPop,
        era: currentEra,
        techs: unlockedTechsCount,
        factions: factions
    });

    // Imprime resumo a cada 10 anos ou em anos críticos
    if (y === 1 || y === 10 || y === 25 || y === 50 || y === 75 || y === 100 || y === 150 || y === 200) {
        console.log(`\n📈 --- STATUS DO ANO ${y} ---`);
        console.log(`  👥 População Global: ${currentPop.toLocaleString()}`);
        console.log(`  🏛️ Era Atual: ${currentEra}`);
        console.log(`  💡 Tecnologias Desbloqueadas: ${unlockedTechsCount}`);
        console.log(`  🎭 Facções/Espécies Ativas:`);
        Object.entries(factions).forEach(([facId, count]) => {
            if (count > 0) {
                console.log(`    - ${facId}: ${Math.floor(count).toLocaleString()} seres`);
            }
        });
    }

    // Se toda a população for extinta, encerra a simulação antes do tempo
    if (currentPop === 0) {
        console.log(`\n💀 --- EXTINÇÃO TOTAL NO ANO ${y} ---`);
        console.log("A humanidade e suas espécies derivadas não resistiram aos rigorosos filtros ambientais.");
        break;
    }
}

// 5. Gera relatório estruturado em JSON para exportação
fs.writeFileSync('scratch/simulation_report.json', JSON.stringify({
    finalYear: engine.year,
    extinct: engine.globalPop === 0,
    history: history
}, null, 2));

console.log("\n💾 Relatório de simulação gravado com sucesso em 'scratch/simulation_report.json'.");
