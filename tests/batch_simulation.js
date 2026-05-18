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
    return loaded;
}

async function runBatch() {
    const factionsToTest = [
        "tribal",
        "tecnocratas",
        "eco_rebeldes"
    ];
    
    const TARGET_YEARS = 200;
    
    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║  CROM HUMANITY SIMULATOR v2 — BATCH REPORT (Pós-Fix P0)    ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");
    console.log(`  Facções: ${factionsToTest.length} | Anos: ${TARGET_YEARS} | Ticks/Facção: ${365*TARGET_YEARS}\n`);
    
    let mdReport = `# Relatório de Simulação: ${TARGET_YEARS} Anos (${factionsToTest.length} Espécies)\n\n`;
    mdReport += `> Gerado em: ${new Date().toISOString()}\n\n`;
    mdReport += `Motor CROM v2 (pós-fix P0). ${factionsToTest.length} facções × ${TARGET_YEARS} anos (${(365*TARGET_YEARS).toLocaleString()} ticks cada).\n\n`;

    const globalStartTime = Date.now();
    const summaryTable = [];

    for (let u = 0; u < factionsToTest.length; u++) {
        const faction = factionsToTest[u];
        console.log(`\n┌─── [${u+1}/${factionsToTest.length}] FACÇÃO: ${faction.toUpperCase()} ───────────────────────`);
        
        const engine = new GameEngine();
        const pluginCount = await loadPluginsForNode(engine);
        console.log(`│  ${pluginCount} plugins carregados`);
        
        // Mapa compacto (5 hexes com biomas variados)
        const mockHexes = [
            { id: 'hex_0', col: 0, row: 0, lat: 0, neighbors: ['hex_1'] },
            { id: 'hex_1', col: 1, row: 0, lat: 15, neighbors: ['hex_0', 'hex_2', 'hex_3'] },
            { id: 'hex_2', col: 2, row: 0, lat: 35, neighbors: ['hex_1', 'hex_4'] },
            { id: 'hex_3', col: 0, row: 1, lat: 50, neighbors: ['hex_1', 'hex_4'] },
            { id: 'hex_4', col: 1, row: 1, lat: 65, neighbors: ['hex_2', 'hex_3'] }
        ];
        engine.initWorld(mockHexes);
        console.log(`│  Mundo: ${engine.nodes.size} hexágonos`);
        
        const startNode = Array.from(engine.nodes.values())[0];
        engine.startInfection(startNode.id);
        startNode.demographics.dist.factions = {};
        startNode.demographics.dist.factions[faction] = 1.0;
        
        const timeline = [];
        let nextMilestonePop = 10000;
        const TOTAL_TICKS_FOR_SIM = 365 * TARGET_YEARS;
        let peakPop = 0;
        let collapseCount = 0;
        let eventCount = 0;
        let lastEra = 'Idade da Pedra';
        let lastTechCount = 0;
        const startTime = Date.now();
        
        // Captura eventos do engine para logging detalhado
        const originalOnEvent = engine.onEvent;
        engine.onEvent = (eventData, eventType) => {
            eventCount++;
            if (eventData && eventData.message) {
                // Log compacto de cada evento
                const emoji = eventData.message.substring(0, 2);
                const shortMsg = eventData.message.substring(0, 80);
                timeline.push({ year: engine.year, event: shortMsg });
                
                // Só imprime desastres e milestones no console
                if (eventType === 'disaster' || eventType === 'nemesis' || eventType === 'milestone') {
                    console.log(`│  📅 Ano ${engine.year.toString().padStart(4)} │ ${shortMsg}`);
                }
            }
            if (originalOnEvent) originalOnEvent(eventData, eventType);
        };
        
        // Header da tabela de checkpoints
        console.log(`│`);
        console.log(`│  ${'Ano'.padStart(5)} │ ${'Pop'.padStart(10)} │ ${'Peak'.padStart(10)} │ ${'Techs'.padStart(5)} │ ${'Era'.padEnd(18)} │ ${'Sev'.padStart(4)} │ ${'K'.padStart(6)} │ ${'Trust'.padStart(5)} │ ${'Wood'.padStart(8)} │ ${'Min'.padStart(8)}`);
        console.log(`│  ${'─'.repeat(5)} │ ${'─'.repeat(10)} │ ${'─'.repeat(10)} │ ${'─'.repeat(5)} │ ${'─'.repeat(18)} │ ${'─'.repeat(4)} │ ${'─'.repeat(6)} │ ${'─'.repeat(5)} │ ${'─'.repeat(8)} │ ${'─'.repeat(8)}`);
        
        for (let i = 0; i < TOTAL_TICKS_FOR_SIM; i++) {
            engine.processTick();
            
            if (engine.globalPop > peakPop) peakPop = engine.globalPop;
            
            if (engine.globalPop >= nextMilestonePop) {
                nextMilestonePop *= 5;
            }
            if (engine.severity >= 90 && engine.day === 1) {
                collapseCount++;
            }
            
            // Detecta mudança de era
            if (engine.currentEra.name !== lastEra) {
                console.log(`│  🏛️  ERA: ${lastEra} → ${engine.currentEra.name} (Ano ${engine.year})`);
                lastEra = engine.currentEra.name;
            }
            
            // Detecta novas techs
            if (engine.unlockedTechs.size > lastTechCount) {
                const diff = engine.unlockedTechs.size - lastTechCount;
                lastTechCount = engine.unlockedTechs.size;
            }

            // Checkpoint a cada 25 anos
            if (engine.day === 1 && engine.year % 25 === 0) {
                const pop = Math.floor(engine.globalPop);
                const pk = Math.floor(peakPop);
                const techs = engine.unlockedTechs.size;
                const era = engine.currentEra.name;
                const sev = Math.floor(engine.severity);
                const kp = (engine.globalKPenalty || 1.0).toFixed(3);
                const trust = Math.floor(engine.globalTrust);
                const wood = Math.floor(engine.inventory.wood || 0);
                const min = Math.floor(engine.inventory.minerals || 0);
                console.log(`│  ${engine.year.toString().padStart(5)} │ ${pop.toLocaleString('pt-BR').padStart(10)} │ ${pk.toLocaleString('pt-BR').padStart(10)} │ ${techs.toString().padStart(5)} │ ${era.padEnd(18)} │ ${(sev+'%').padStart(4)} │ ${kp.padStart(6)} │ ${trust.toString().padStart(5)} │ ${wood.toLocaleString('pt-BR').padStart(8)} │ ${min.toLocaleString('pt-BR').padStart(8)}`);
            }
        }
        
        const elapsed = Date.now() - startTime;
        const unlockedList = Array.from(engine.unlockedTechs);
        const status = engine.globalPop > 0 ? '✅ SOBREVIVEU' : '💀 EXTINTA';
        const infectedCount = Array.from(engine.nodes.values()).filter(n => n.infected).length;
        
        console.log(`│`);
        console.log(`├─── RESULTADO: ${status}`);
        console.log(`│  Pop Final: ${Math.floor(engine.globalPop).toLocaleString('pt-BR')} │ Peak: ${Math.floor(peakPop).toLocaleString('pt-BR')} │ Hex Infectados: ${infectedCount}/${engine.nodes.size}`);
        console.log(`│  Techs: ${unlockedList.length} │ Era: ${engine.currentEra.name} │ Eventos: ${eventCount} │ Colapsos: ${collapseCount}`);
        console.log(`│  K-Penalty: ${(engine.globalKPenalty || 1.0).toFixed(4)} │ Trust: ${Math.floor(engine.globalTrust)} │ Temp: ${engine.globalTemperatureOffset?.toFixed(2) || '0.00'}°C`);
        console.log(`│  Inventário: 🌲${Math.floor(engine.inventory.wood||0)} 🪨${Math.floor(engine.inventory.minerals||0)} 💻${Math.floor(engine.inventory.chips||0)} 🖥️${Math.floor(engine.inventory.computers||0)}`);
        console.log(`│  Techs: [${unlockedList.join(', ')}]`);
        console.log(`│  Tempo: ${elapsed}ms (${(elapsed/1000).toFixed(1)}s)`);
        console.log(`└──────────────────────────────────────────────────────────────`);
        
        summaryTable.push({ faction, status, pop: Math.floor(engine.globalPop), peak: Math.floor(peakPop), techs: unlockedList.length, era: engine.currentEra.name, events: eventCount, collapses: collapseCount, elapsed });

        // Markdown report
        mdReport += `## ${u+1}. Espécie: ${faction.toUpperCase()} ${status}\n\n`;
        mdReport += "| Métrica | Valor |\n|---|---|\n";
        mdReport += `| População Final | ${Math.floor(engine.globalPop).toLocaleString('pt-BR')} |\n`;
        mdReport += `| População Pico | ${Math.floor(peakPop).toLocaleString('pt-BR')} |\n`;
        mdReport += `| DNA Acumulado | ${Math.floor(engine.adaptationPoints).toLocaleString('pt-BR')} |\n`;
        mdReport += `| Severidade Final | ${Math.floor(engine.severity)}% |\n`;
        mdReport += `| Tecnologias | ${unlockedList.length} |\n`;
        mdReport += `| Eventos Totais | ${eventCount} |\n`;
        mdReport += `| Colapsos | ${collapseCount} |\n`;
        mdReport += `| Era Final | ${engine.currentEra.name} |\n`;
        mdReport += `| K-Penalty | ${(engine.globalKPenalty || 1.0).toFixed(4)} |\n`;
        mdReport += `| Trust Global | ${Math.floor(engine.globalTrust)} |\n`;
        mdReport += `| Hex Infectados | ${infectedCount}/${engine.nodes.size} |\n`;
        mdReport += `| Tempo Real | ${elapsed}ms |\n\n`;
        mdReport += `**Inventário:** 🌲${Math.floor(engine.inventory.wood||0)} | 🪨${Math.floor(engine.inventory.minerals||0)} | 💻${Math.floor(engine.inventory.chips||0)} | 🖥️${Math.floor(engine.inventory.computers||0)}\n\n`;
        mdReport += `**Techs:** ${unlockedList.join(', ') || 'Nenhuma'}\n\n`;
        
        if (timeline.length > 0) {
            mdReport += "**Cronologia (Últimos 20 eventos):**\n";
            const lastEvents = timeline.slice(-20);
            lastEvents.forEach(t => {
                mdReport += `- Ano ${t.year}: ${t.event}\n`;
            });
        }
        mdReport += "\n---\n\n";
    }
    
    // Tabela resumo final
    const totalTime = Date.now() - globalStartTime;
    console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║  RESUMO COMPARATIVO — ${factionsToTest.length} Facções × ${TARGET_YEARS} anos                   ║`);
    console.log(`╚══════════════════════════════════════════════════════════════╝`);
    console.log(`  ${'Facção'.padEnd(25)} │ ${'Status'.padEnd(13)} │ ${'Pop'.padStart(8)} │ ${'Peak'.padStart(8)} │ ${'Techs'.padStart(5)} │ ${'Era'.padEnd(18)} │ ${'Eventos'.padStart(7)}`);
    console.log(`  ${'─'.repeat(25)} │ ${'─'.repeat(13)} │ ${'─'.repeat(8)} │ ${'─'.repeat(8)} │ ${'─'.repeat(5)} │ ${'─'.repeat(18)} │ ${'─'.repeat(7)}`);
    summaryTable.forEach(s => {
        console.log(`  ${s.faction.padEnd(25)} │ ${s.status.padEnd(13)} │ ${s.pop.toLocaleString('pt-BR').padStart(8)} │ ${s.peak.toLocaleString('pt-BR').padStart(8)} │ ${s.techs.toString().padStart(5)} │ ${s.era.padEnd(18)} │ ${s.events.toString().padStart(7)}`);
    });
    console.log(`\n  ⏱️ Tempo total: ${totalTime}ms (${(totalTime/1000).toFixed(1)}s)`);
    
    mdReport += `## Resumo Comparativo\n\n`;
    mdReport += "| Facção | Status | Pop Final | Peak | Techs | Era | Eventos | Tempo |\n";
    mdReport += "|---|---|---|---|---|---|---|---|\n";
    summaryTable.forEach(s => {
        mdReport += `| ${s.faction} | ${s.status} | ${s.pop.toLocaleString('pt-BR')} | ${s.peak.toLocaleString('pt-BR')} | ${s.techs} | ${s.era} | ${s.events} | ${s.elapsed}ms |\n`;
    });
    
    const outputPath = path.join(__dirname, '../docs/simulation_report.md');
    fs.writeFileSync(outputPath, mdReport);
    console.log(`\n🚀 Relatório salvo em: ${outputPath}`);
}

runBatch();
