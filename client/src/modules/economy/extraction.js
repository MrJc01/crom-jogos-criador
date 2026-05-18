export default {
    id: 'resource_extraction',
    type: 'economy',
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        
        const workers = Math.floor(node.demographics.total * node.demographics.dist.age.adult);
        if (workers === 0) return;

        // Fator de Rendimentos Decrescentes (Task 13)
        // Quanto mais perto do esgotamento, mais difícil extrair o recurso
        let mineralYield = Math.max(0.05, node.resources.minerals / 50000);
        let woodYield = Math.max(0.05, node.resources.wood / 50000);

        // 1. Extração de Minérios
        if (node.resources.minerals > 0) {
            let extractMin = Math.floor((workers * mineralYield) / 10000);
            if (extractMin < 1 && Math.random() < 0.1) extractMin = 1; 
            extractMin = Math.min(extractMin, node.resources.minerals);
            node.resources.minerals -= extractMin;
            engine.inventory.minerals += extractMin;
        }

        // 2. Extração de Madeira
        if (node.resources.wood > 0) {
            let extractWood = Math.floor((workers * woodYield) / 5000);
            if (extractWood < 1 && Math.random() < 0.2) extractWood = 1; 
            extractWood = Math.min(extractWood, node.resources.wood);
            node.resources.wood -= extractWood;
            engine.inventory.wood += extractWood;
        }

        // Transformação Biológica por Desmatamento (Task 10)
        if (node.resources.wood <= 0 && node.biome) {
            if (node.biome.id === 'jungle') {
                node.biome = { id: 'plains', name: 'Planície Desmatada' };
                node.resources.wood = 5000; // Vira capim e arbustos
            } else if (node.biome.id === 'plains') {
                node.biome = { id: 'desert', name: 'Deserto Antropogênico' };
                node.resources.wood = 0;
            }
        }

        // 3. Extração de Água e Estresse Hídrico (Task 11)
        // A natureza repõe um pouco (chuva), mas o excesso esgota o aquífero
        node.resources.water += 5; // Chuva básica por tick
        if (node.resources.water > 100000) node.resources.water = 100000;

        if (node.resources.water > 0) {
            let extractWater = Math.floor(workers / 2000);
            if (extractWater < 1 && Math.random() < 0.3) extractWater = 1; 
            
            // Cap físico diário para extração (limite de canos/bombas tribais)
            let dailyCap = engine.unlockedTechs.has("tech_sanitation") ? 5000 : 500;
            extractWater = Math.min(extractWater, dailyCap);
            
            extractWater = Math.min(extractWater, node.resources.water);
            node.resources.water -= extractWater;
            engine.inventory.water += extractWater;
        }
    }
};
