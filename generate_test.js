import fs from 'fs';
import path from 'path';

// Gerar imports para todos os módulos
const getFiles = (dir, ext) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(filePath, ext));
        } else if (file.endsWith(ext)) {
            results.push(filePath);
        }
    });
    return results;
};

const srcDir = path.join(process.cwd(), 'client/src');
const biologyMods = getFiles(path.join(srcDir, 'modules/biology'), '.js');
const economyMods = getFiles(path.join(srcDir, 'modules/economy'), '.js').filter(f => !f.includes('recipes/'));
const recipeMods = getFiles(path.join(srcDir, 'modules/economy/recipes'), '.js');
const sociologyMods = getFiles(path.join(srcDir, 'modules/sociology'), '.js');
const eventsMods = getFiles(path.join(srcDir, 'modules/events'), '.js');
const techMods = getFiles(path.join(srcDir, 'modules/technologies'), '.js');

let imports = `
import { Engine } from './client/src/core/Engine.js';
import fs from 'fs';

// Helper to manually inject modules
const modules = [];
`;

const addMods = (files, label) => {
    files.forEach((f, i) => {
        const relative = './' + path.relative(process.cwd(), f).replace(/\\/g, '/');
        imports += `import ${label}_${i} from '${relative}';\n`;
        imports += `modules.push(${label}_${i});\n`;
    });
};

addMods(biologyMods, 'bio');
addMods(economyMods, 'eco');
addMods(recipeMods, 'rec');
addMods(sociologyMods, 'soc');
addMods(eventsMods, 'eve');
addMods(techMods, 'tech');

imports += `
async function runTests() {
    const mapData = JSON.parse(fs.readFileSync('./client/public/hex_map.json', 'utf8'));
    
    console.log("Iniciando 10 simulações de 10.000 anos...");
    let results = [];
    
    for(let sim = 1; sim <= 10; sim++) {
        console.log(\`\\n--- SIMULAÇÃO \${sim} ---\`);
        const engine = new Engine();
        
        // Inject manually
        modules.forEach(mod => {
            if(mod && mod.id) engine.plugins.push(mod);
        });
        
        engine.initWorld(mapData);
        
        // Start infection at a random land node
        const landNodes = Array.from(engine.nodes.values()).filter(n => n.type === 'land');
        const startNode = landNodes[Math.floor(Math.random() * landNodes.length)];
        engine.startInfection(startNode.id);
        
        let simStatus = "Sobreviveu";
        let endYear = 10000;
        
        // Simulate 10,000 years
        for(let year = 1; year <= 10000; year++) {
            for(let day = 0; day < 365; day++) {
                engine.tick();
            }
            
            if (engine.globalPop === 0) {
                simStatus = "Extinta";
                endYear = year;
                break;
            }
            if (engine.gameWon) {
                simStatus = "Vitória (Arca)";
                endYear = year;
                break;
            }
        }
        
        const fEntries = Object.entries(engine.globalDemographics.factions).sort((a, b) => b[1] - a[1]);
        const domFac = fEntries.length > 0 ? fEntries[0][0] : 'Nenhuma';
        
        results.push({
            Sim: sim,
            Status: simStatus,
            Anos: endYear,
            Pop: Math.floor(engine.globalPop),
            Severidade: Math.floor(engine.severity),
            Era: engine.currentEra.name,
            FacaoDominante: domFac
        });
        
        console.log(\`Resultado: \${simStatus} | Anos: \${endYear} | Pop: \${Math.floor(engine.globalPop)} | Era: \${engine.currentEra.name}\`);
    }
    
    console.table(results);
    fs.writeFileSync('./simulation_results.json', JSON.stringify(results, null, 2));
}

runTests();
`;

fs.writeFileSync('./run_batch.js', imports);
console.log("Script run_batch.js gerado com sucesso.");
