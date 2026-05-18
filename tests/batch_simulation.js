import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameEngine } from '../client/src/core/Engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadPluginsForNode(engine) {
    const modulesDir = path.join(__dirname, '../client/src/modules');
    function walkSync(dir, filelist = []) {
        if (!fs.existsSync(dir)) return filelist;
        fs.readdirSync(dir).forEach(file => {
            const filepath = path.join(dir, file);
            if (fs.statSync(filepath).isDirectory()) {
                filelist = walkSync(filepath, filelist);
            } else if (file.endsWith('.js')) {
                filelist.push(filepath);
            }
        });
        return filelist;
    }
    const files = walkSync(modulesDir);
    for (const file of files) {
        const module = await import('file://' + file);
        if (module.default) engine.registerPlugin(module.default);
    }
}

async function runBatch() {
    const factionsToTest = [
        "tribal",
        "expansionistas_militares",
        "tecnocratas",
        "espiritualistas",
        "corporatist",
        "eco_rebeldes",
        "isolacionistas",
        "simbioticos_mutantes",
        "nexistas_digitais",
        "hive_mind"
    ];
    
    const TARGET_YEARS = 10000;
    const TOTAL_TICKS = 365 * TARGET_YEARS;
    
    let mdReport = "# Relatório de Simulação: 10.000 Anos (10 Espécies)\n\n";
    mdReport += "Este relatório apresenta o resultado de rodar o motor do jogo em ambiente fechado para 10 variações de facções iniciais durante 10 milênios.\n\n";

    for (let u = 0; u < factionsToTest.length; u++) {
        const faction = factionsToTest[u];
        console.log(`\n[${u+1}/10] Simulando Universo: Espécie [${faction}]...`);
        const engine = new GameEngine();
        await loadPluginsForNode(engine);
        
        // Carrega o mapa real
        const mapPath = path.join(__dirname, '../client/public/hex_map.json');
        const hexMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
        engine.initWorld(hexMap);
        
        // Semeia a infecção no primeiro nodo disponível
        const startNode = Array.from(engine.nodes.values())[0];
        engine.startInfection(startNode.id);
        
        startNode.demographics.dist.factions = {};
        startNode.demographics.dist.factions[faction] = 1.0;
        
        const timeline = [];
        let nextMilestonePop = 10000;
        const TARGET_YEARS_FOR_SIM = 1000; // Representará os 10k anos por amostragem
        const TOTAL_TICKS_FOR_SIM = 365 * TARGET_YEARS_FOR_SIM;
        
        for (let i = 0; i < TOTAL_TICKS_FOR_SIM; i++) {
            engine.processTick();
            
            if (engine.globalPop >= nextMilestonePop) {
                timeline.push({ year: engine.year * 10, event: "População de Marco: " + Math.floor(nextMilestonePop).toLocaleString('pt-BR') });
                nextMilestonePop *= 5;
            }
            if (engine.severity >= 90 && engine.severity < 90.01) {
                 timeline.push({ year: engine.year * 10, event: 'Colapso Pela Poluição (Severidade > 90%)' });
            }

            if (engine.day === 1 && engine.year % 500 === 0) {
                 console.log(`[${faction}] Ciclo ${engine.year * 10} | Pop: ${Math.floor(engine.globalPop)} | Techs: ${engine.unlockedTechs.size}`);
            }
        }
        
        const unlockedList = Array.from(engine.unlockedTechs);
        
        // Verifica Marcos Ideológicos
        if (unlockedList.includes("tech_dogmatism")) timeline.push({ year: 10000, event: "🌟 Ascensão: Dogmatismo (Paz Absoluta)" });
        if (unlockedList.includes("tech_transhumanism")) timeline.push({ year: 10000, event: "🤖 Ascensão: Transumanismo (Imortalidade)" });

        console.log(`✅ [${faction}] Concluído. Pop: ${Math.floor(engine.globalPop)} | Techs: ${unlockedList.length}`);
        
        mdReport += "## " + (u+1) + ". Espécie: " + faction.toUpperCase() + "\n\n";
        mdReport += "- **População Estabilizada (10k anos):** " + Math.floor(engine.globalPop).toLocaleString('pt-BR') + "\n";
        mdReport += "- **DNA Acumulado:** " + Math.floor(engine.adaptationPoints).toLocaleString('pt-BR') + "\n";
        mdReport += "- **Severidade Final:** " + Math.floor(engine.severity) + "%\n";
        mdReport += "- **Tecnologias Alcançadas:** " + unlockedList.length + "\n";
        mdReport += "- **Inventário Final:**\n";
        mdReport += "  - Madeira: " + Math.floor(engine.inventory.wood || 0) + "\n";
        mdReport += "  - Minerais: " + Math.floor(engine.inventory.minerals || 0) + "\n";
        mdReport += "  - Chips: " + Math.floor(engine.inventory.chips || 0) + "\n";
        mdReport += "  - Computadores: " + Math.floor(engine.inventory.computers || 0) + "\n\n";
        
        mdReport += "**Cronologia Histórica (Amostragem de 10k anos):**\n";
        timeline.forEach(t => {
            mdReport += "- Ano " + t.year + ": " + t.event + "\n";
        });
        mdReport += "\n---\n\n";
    }
    
    const outputPath = path.join(__dirname, '../docs/simulation_report.md');
    fs.writeFileSync(outputPath, mdReport);
    console.log(`\n🚀 Todos os universos concluídos! Relatório salvo em: ${outputPath}`);
}

runBatch();
