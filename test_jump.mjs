import { Engine } from './client/src/core/Engine.js';
import fs from 'fs';
import path from 'path';

// Carregar plugins (mock simplificado do loader)
async function loadPlugins(engine) {
    const __dirname = path.dirname(new URL(import.meta.url).pathname);
    const getFiles = (dir) => {
        const dirents = fs.readdirSync(dir, { withFileTypes: true });
        const files = dirents.map((dirent) => {
            const res = path.resolve(dir, dirent.name);
            return dirent.isDirectory() ? getFiles(res) : res;
        });
        return Array.prototype.concat(...files);
    };

    const modulesPath = path.join(__dirname, 'client/src/modules');
    const files = getFiles(modulesPath).filter(f => f.endsWith('.js'));
    for (const file of files) {
        try {
            const mod = await import('file://' + file);
            if (mod.default) engine.registerPlugin(mod.default);
        } catch (e) {
            // ignore
        }
    }
}

async function run() {
    const engine = new Engine();
    engine.tickRate = 1000;
    
    // We need config to be loaded properly. It's synchronous if using ConfigLoader, but the sandbox failed with "with { type: 'json' }".
    // I will just use node 22 which is the default node.
}

run();
