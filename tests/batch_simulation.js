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
        
        // Carrega um mundo maior mockado
        const mockHexes = [];
        for(let x=0; x<10; x++) {
            mockHexes.push({ id: "hex_" + x + "_0", col: x, row: 0, lat: 10, neighbors: ["hex_" + (x+1) + "_0"] });
        }
        engine.initWorld(mockHexes);
        
        // Semeia a infecção e altera a facção raiz
        engine.startInfection('hex_0_0'); 
        const cradle = engine.nodes.get('hex_0_0');
        cradle.demographics.dist.factions = {};
        cradle.demographics.dist.factions[faction] = 1.0;
        
        const timeline = [];
        let nextMilestonePop = 10000;
        const TARGET_YEARS_FOR_SIM = 1000;
        const TOTAL_TICKS_FOR_SIM = 365 * TARGET_YEARS_FOR_SIM;
        
        for (let i = 0; i < TOTAL_TICKS_FOR_SIM; i++) {
            engine.processTick();
            
            if (engine.globalPop >= nextMilestonePop) {
                timeline.push({ year: engine.year, event: "População: " + Math.floor(nextMilestonePop).toLocaleString('pt-BR') });
                nextMilestonePop *= 5;
            }
            if (engine.severity >= 90 && engine.severity < 90.01) {
                 timeline.push({ year: engine.year, event: 'Colapso de Recursos (Severidade > 90%)' });
            }

            if (engine.day === 1 && engine.year % 500 === 0) {
                 console.log(`[${faction}] Ano ${engine.year} | Pop: ${Math.floor(engine.globalPop)} | Techs: ${engine.unlockedTechs.size}`);
            }
        }
        
        const unlockedList = Array.from(engine.unlockedTechs);
        
        console.log(`✅ [${faction}] Concluído. Pop: ${Math.floor(engine.globalPop)} | Techs: ${unlockedList.length}`);
        
        mdReport += "## " + (u+1) + ". Espécie: " + faction.toUpperCase() + "\n\n";
        mdReport += "- **População Final (Projeção 10k anos):** " + Math.floor(engine.globalPop).toLocaleString('pt-BR') + "\n";
        mdReport += "- **DNA Acumulado (Projeção):** " + Math.floor(engine.adaptationPoints).toLocaleString('pt-BR') + "\n";
        mdReport += "- **Severidade Final:** " + Math.floor(engine.severity) + "%\n";
        mdReport += "- **Tecnologias Alcançadas:** " + unlockedList.length + "\n";
        mdReport += "- **Inventário Final:**\n";
        mdReport += "  - Madeira: " + Math.floor(engine.inventory.wood || 0) + "\n";
        mdReport += "  - Minerais: " + Math.floor(engine.inventory.minerals || 0) + "\n";
        mdReport += "  - Aço: " + Math.floor(engine.inventory.steel || 0) + "\n";
        mdReport += "  - Chips: " + Math.floor(engine.inventory.chips || 0) + "\n\n";
        
        mdReport += "**Marcos Históricos (Primeiro Milênio):**\n";
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
