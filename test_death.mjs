import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GameEngine } from './client/src/core/Engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    for (const f of files) {
        try {
            const m = await import('file://' + f);
            if (m.default) engine.registerPlugin(m.default); 
        } catch (e) {}
    }
}

async function run() {
    const engine = new GameEngine();
    await loadPlugins(engine);
    
    const mockHexes = [];
    const biomes = ['plains', 'tundra', 'desert', 'jungle', 'plains'];
    for (let i = 0; i < 5; i++) {
        mockHexes.push({ id: `hex_${i}`, col: i, row: 0, lat: i * 15, neighbors: [], biome: { id: biomes[i] } });
    }
    engine.initWorld(mockHexes);

    const startNode = engine.nodes.get('hex_0');
    startNode.infect(0);
    startNode.demographics.dist.factions = { 'sino_tibetanos': 1.0 };
    startNode.demographics.addBirths(55); 
    engine.globalPop = 55;

    engine.onEvent = (ev, type) => {
        if (ev && ev.message) {
            console.log(`[Ano ${engine.year}] EVENTO: ${ev.message}`);
        }
    };
    
    // Override kill to trace who calls it!
    const origKill = startNode.demographics.kill.bind(startNode.demographics);
    startNode.demographics.kill = function(amount) {
        if (amount > 0) {
            const stack = new Error().stack.split('\n')[2]; // caller
            console.log(`[Ano ${engine.year}] kill(${amount}) called by ${stack.trim()}`);
        }
        origKill(amount);
    };

    while (engine.year < 100) {
        for (let w = 0; w < 52; w++) {
            engine.processTick(7);
            if (engine.globalPop <= 0) break;
        }
        if (engine.globalPop <= 0) {
            console.log("EXTINCT at Year " + engine.year);
            break;
        }
    }
    console.log("Final Pop: " + engine.globalPop);
}

run().catch(console.error);
