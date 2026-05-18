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

async function run() {
    const engine = new GameEngine();
    await loadPluginsForNode(engine);
    const mapPath = path.join(__dirname, '../client/public/hex_map.json');
    const hexMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    engine.initWorld(hexMap);
    const startNode = Array.from(engine.nodes.values())[0];
    engine.startInfection(startNode.id);
    startNode.demographics.dist.factions = { tribal: 1.0 };
    
    for (let i = 0; i < 100; i++) {
        console.log("Tick: " + i);
        try {
            engine.processTick();
        } catch(e) {
            console.error(e);
            break;
        }
    }
    console.log("Done");
}
run();
