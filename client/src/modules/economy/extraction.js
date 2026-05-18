export default {
    id: 'resource_extraction',
    type: 'economy',
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        
        const workers = Math.floor(node.demographics.total * node.demographics.dist.age.adult);
        if (workers === 0) return;

        // 1. Extração de Minérios (1 a cada 10k)
        if (node.resources.minerals > 0) {
            let extractMin = Math.floor(workers / 10000);
            if (extractMin < 1 && Math.random() < 0.1) extractMin = 1; 
            extractMin = Math.min(extractMin, node.resources.minerals);
            node.resources.minerals -= extractMin;
            engine.inventory.minerals += extractMin;
        }

        // 2. Extração de Madeira (1 a cada 5k)
        if (node.resources.wood > 0) {
            let extractWood = Math.floor(workers / 5000);
            if (extractWood < 1 && Math.random() < 0.2) extractWood = 1; 
            extractWood = Math.min(extractWood, node.resources.wood);
            node.resources.wood -= extractWood;
            engine.inventory.wood += extractWood;
        }

        // 3. Extração de Água (1 a cada 2k)
        if (node.resources.water > 0) {
            let extractWater = Math.floor(workers / 2000);
            if (extractWater < 1 && Math.random() < 0.3) extractWater = 1; 
            extractWater = Math.min(extractWater, node.resources.water);
            node.resources.water -= extractWater;
            engine.inventory.water += extractWater;
        }
    }
};
