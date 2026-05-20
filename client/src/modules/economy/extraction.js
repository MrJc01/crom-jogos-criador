import { Config } from '../../config/ConfigLoader.js';

export default {
    id: 'resource_extraction',
    type: 'economy',
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        const deltaDays = globalRules.deltaDays || 1;
        
        // 007: Apenas trabalhadores (young+adult) extraem
        const workers = node.demographics.workingPopulation || 
            Math.floor(node.demographics.total * (node.demographics.dist.age.adult + node.demographics.dist.age.young));
        if (workers === 0) return;

        const ecoCfg = Config.economy() || {};
        const eroiCfg = ecoCfg.eroi?.mining || { woodCostPerMineral: 0.5 };
        const soilCfg = ecoCfg.soilRecovery || { recoveryRatePerYear: 0.10, maxSoil: 100 };
        const waterCfg = ecoCfg.waterStress || { maxExtractionPerTick: 500, aquiferRechargeRate: 100 };
        const dimCfg = ecoCfg.diminishingReturns || { extractionDepthMultiplier: 1.01, maxDepthPenalty: 5.0 };

        // 020. Rendimentos Decrescentes — extractionDepth aumenta custo
        if (!node.extractionDepth) node.extractionDepth = 1.0;
        let mineralYield = Math.max(0.05, node.resources.minerals / 50000) / node.extractionDepth;
        let woodYield = Math.max(0.05, node.resources.wood / 50000);

        // 016. Solo Logarítmico — recuperação lenta
        if (node.soil === undefined) node.soil = soilCfg.maxSoil || 100;
        const popPressure = node.demographics.total / (node.biome.capacityBase || 50000);
        if (popPressure > 0.5) {
            node.soil -= (popPressure * 0.1); // Agricultura intensiva degrada
        } else {
            // FIX BALANCE: Recovery proporcional (quanto mais degradado, mais rápido recupera)
            const maxSoil = soilCfg.maxSoil || 100;
            const soilGap = maxSoil - node.soil;
            node.soil += (soilGap * 0.001); // 0.1% da distância por dia (pousio regenera)
        }
        node.soil = Math.max(0, Math.min(soilCfg.maxSoil || 100, node.soil));
        
        // Atualiza capacidade com base no solo e techs (com piso mínimo de sobrevivência de 15% da capacidade base do bioma)
        const techCapBoost = engine.unlockedTechs.has("saneamento_basico") ? 2 : 1;
        const baseCapacity = node.biome.capacityBase || 50000;
        const minCapacity = Math.floor(baseCapacity * 0.15);
        node.capacity = Math.max(minCapacity, Math.floor(baseCapacity * (node.soil / 100) * techCapBoost * globalRules.global_K_boost));

        // 015. Lei de EROI — mineração requer energia (madeira/petróleo)
        if (node.resources.minerals > 0) {
            let eroiPenalty = 1.0;
            const woodCost = eroiCfg.woodCostPerMineral || 0.5;
            
            if (engine.inventory.wood < 500) {
                eroiPenalty = 0.1; // Sem energia = quase nada extraído
            }

            let extractMin = Math.floor((workers * mineralYield * eroiPenalty * deltaDays) / 10000);
            if (extractMin < 1 && Math.random() < 0.1 * eroiPenalty * deltaDays) extractMin = 1; 
            extractMin = Math.min(extractMin, node.resources.minerals);
            node.resources.minerals -= extractMin;
            engine.inventory.minerals += extractMin;
            
            // 015. Consome energia proporcional à extração
            if (extractMin > 0) {
                engine.inventory.wood = Math.max(0, engine.inventory.wood - Math.floor(extractMin * woodCost));
                // 020. Aumenta profundidade de extração
                node.extractionDepth = Math.min(dimCfg.maxDepthPenalty, node.extractionDepth * Math.pow(dimCfg.extractionDepthMultiplier, extractMin));
            }
        }

        // 017. Lenha como Gargalo — extração de madeira
        if (node.resources.wood > 0) {
            let extractWood = Math.floor((workers * woodYield * deltaDays) / 5000);
            if (extractWood < 1 && Math.random() < 0.2 * deltaDays) extractWood = 1; 
            extractWood = Math.min(extractWood, node.resources.wood);
            node.resources.wood -= extractWood;
            engine.inventory.wood += extractWood;
        }

        // Transformação Biológica por Desmatamento
        if (node.resources.wood <= 0 && node.biome) {
            if (node.biome.id === 'jungle') {
                node.biome = { id: 'plains', name: 'Planície Desmatada', capacityBase: (node.biome.capacityBase || 100000) * 0.5 };
                node.resources.wood = 5000;
            } else if (node.biome.id === 'plains') {
                node.biome = { id: 'desert', name: 'Deserto Antropogênico', capacityBase: (node.biome.capacityBase || 50000) * 0.2 };
                node.resources.wood = 0;
            }
        }

        // 018. Estresse Hídrico — cap de extração + recharge POR BIOMA
        // FIX SRE: Aumentamos a recarga anual de água para evitar a dessecação perpétua
        // que causava colapso biológico imediato em baixas populações.
        const biomeRecharge = {
            'desert': 200, 'tundra': 1000, 'plains': 3000, 'jungle': 6000
        };
        const kBoost = globalRules.global_K_boost || 1.0;
        const maxWater = 100000 * kBoost;
        const recharge = (biomeRecharge[node.biome?.id] || (waterCfg.aquiferRechargeRate || 3000)) * kBoost;
        node.resources.water = Math.min(maxWater, (node.resources.water || 0) + (recharge / 365) * deltaDays);

        if (node.resources.water > 0) {
            let extractWater = Math.floor(workers / 2000);
            if (extractWater < 1 && Math.random() < 0.3) extractWater = 1;
            
            // 018. Cap físico diário
            let dailyCap = engine.unlockedTechs.has("saneamento_basico") 
                ? (waterCfg.maxExtractionPerTick * 10 || 5000) 
                : (waterCfg.maxExtractionPerTick || 500);
            extractWater = Math.min(extractWater, dailyCap);
            extractWater = Math.min(extractWater, node.resources.water);
            node.resources.water -= extractWater;
            engine.inventory.water = (engine.inventory.water || 0) + extractWater;
        }

        // 019. Decaimento de Estoque (comida apodrece mais rápido sem tech)
        const stockCfg = ecoCfg.stockDecay || {};
        if (stockCfg.food && engine.inventory.food) {
            const hasPreservation = engine.unlockedTechs.has("agriculture");
            const decayRate = hasPreservation ? stockCfg.food.withPreservation : stockCfg.food.baseDecay;
            engine.inventory.food = Math.max(0, engine.inventory.food * (1 - decayRate / 365));
        }
    }
};
