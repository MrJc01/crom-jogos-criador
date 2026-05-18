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
    let loaded = 0;
    for (const file of files) {
        const module = await import('file://' + file);
        if (module.default) {
            engine.registerPlugin(module.default);
            loaded++;
        }
    }
    console.log(`> ${loaded} plugins carregados com sucesso.`);
}

async function run() {
    console.log("==========================================");
    console.log("=== SIMULADOR CROM (TESTE DE GARGALOS) ===");
    console.log("==========================================\n");
    
    const engine = new GameEngine();
    
    console.log("[1] Carregando Motor de Regras...");
    await loadPluginsForNode(engine);
    
    console.log("[2] Gerando Multiverso de Bolso (3 Países)...");
    const mockHexes = [
        { id: 'hex_0_0', col: 0, row: 0, lat: 0, neighbors: ['hex_1_0'] },
        { id: 'hex_1_0', col: 1, row: 0, lat: 10, neighbors: ['hex_0_0', 'hex_2_0'] },
        { id: 'hex_2_0', col: 2, row: 0, lat: 50, neighbors: ['hex_1_0'] }
    ];

    engine.initWorld(mockHexes);
    console.log(`[Teste] Mundo inicializado com ${engine.nodes.size} hexágonos.`);

    console.log("[3] Semeando a primeira Tribo...");
    engine.startInfection('hex_1_0');
    
    console.log("[4] Fast-Forward: Rodando 1.000 Anos...\n");
    const TOTAL_YEARS = 1000;
    const TOTAL_TICKS = 365 * TOTAL_YEARS;
    
    const startTime = Date.now();
    let nextLogPop = 10000;
    let oldTechSize = 0;
    
    for (let i = 0; i < TOTAL_TICKS; i++) {
        engine.processTick();
        
        // Logs de Crescimento
        if (engine.globalPop >= nextLogPop) {
            console.log(`[Ano ${engine.year}] População atingiu: ${Math.floor(engine.globalPop).toLocaleString('pt-BR')} habitantes.`);
            nextLogPop *= 10;
        }
        
        // Logs de Pesquisa Automática (Se houver tecnologias novas)
        if (engine.unlockedTechs.size > oldTechSize) {
            console.log(`[Ano ${engine.year}] A civilização atingiu um novo marco evolutivo! Total de Techs: ${engine.unlockedTechs.size}`);
            oldTechSize = engine.unlockedTechs.size;
        }
    }
    const endTime = Date.now();
    
    console.log("\n==========================================");
    console.log("===       RESULTADOS DA SIMULAÇÃO      ===");
    console.log("==========================================");
    console.log(`Duração do Processamento: ${(endTime - startTime)}ms`);
    console.log(`Tempo Simulado: ${TOTAL_YEARS} anos (${TOTAL_TICKS} ticks)`);
    console.log(`\n👥 População Final: ${Math.floor(engine.globalPop).toLocaleString('pt-BR')}`);
    console.log(`🧬 DNA Acumulado: ${engine.adaptationPoints.toLocaleString('pt-BR')}`);
    console.log(`⚠️ Severidade Final: ${Math.floor(engine.severity)}%`);
    console.log(`📚 Tecnologias Desbloqueadas: ${engine.unlockedTechs.size}`);
    
    console.log("\n📦 Inventário Físico Final:");
    console.log(`  - 🌲 Madeira: ${Math.floor(engine.inventory.wood || 0).toLocaleString('pt-BR')}`);
    console.log(`  - 🪨 Minerais: ${Math.floor(engine.inventory.minerals || 0).toLocaleString('pt-BR')}`);
    console.log(`  - ⛓️ Aço Refinado: ${Math.floor(engine.inventory.steel || 0).toLocaleString('pt-BR')}`);
    console.log(`  - 💻 Microchips: ${Math.floor(engine.inventory.chips || 0).toLocaleString('pt-BR')}`);
    console.log("==========================================");
}

run();
