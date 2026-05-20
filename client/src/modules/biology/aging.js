import { Config } from '../../config/ConfigLoader.js';

export default {
    id: 'aging',
    type: 'biology',
    applyTick(node, globalRules, engine) {
        if (node.demographics.total === 0) return;
        
        const demo = node.demographics;
        const deltaDays = globalRules.deltaDays || 1;
        
        // 1. TRANSIÇÃO DE COORTES (Envelhecimento contínuo por % diária escalada por deltaDays)
        const childToYoung = Math.min(demo.dist.age.child, demo.dist.age.child * 0.00018 * deltaDays);
        const youngToAdult = Math.min(demo.dist.age.young, demo.dist.age.young * 0.00027 * deltaDays); 
        const adultToElder = Math.min(demo.dist.age.adult, demo.dist.age.adult * 0.00007 * deltaDays); 
        
        demo.shiftDistribution('age', 'young', 'child', childToYoung);
        demo.shiftDistribution('age', 'adult', 'young', youngToAdult);
        demo.shiftDistribution('age', 'elder', 'adult', adultToElder);
        
        // 2. MORTALIDADE EXTRAORDINÁRIA E DE PRESSÃO BIOLÓGICA
        // GUARD: Pop < 500 só envelhece — não empilha mortes extras
        if (demo.total < 500) return;
        
        // Importação imperial de água potável se o hexágono secar
        if (node.resources && node.resources.water <= 0 && engine.inventory.water > 0) {
            const drinkWaterNeeded = Math.max(1, Math.floor(demo.total * 0.01 * deltaDays));
            const imported = Math.min(drinkWaterNeeded, engine.inventory.water);
            node.resources.water = (node.resources.water || 0) + imported;
            engine.inventory.water -= imported;
        }
        
        // Fator de Mortalidade Infantil atrelado à falta de água (mortalidade integrada)
        let childExtraDeaths = 0;
        if (node.resources && node.resources.water <= 0) {
            const dailyLethality = 0.005;
            const survivalProb = Math.pow(1 - dailyLethality, deltaDays);
            childExtraDeaths = Math.floor(demo.total * demo.dist.age.child * (1 - survivalProb)); 
        }
        
        // Impacto do Saneamento Básico em Megacidades (mortalidade integrada)
        let sanitationDeaths = 0;
        if (demo.total > 50000 && !engine.unlockedTechs.has('saneamento_basico')) {
            const dailyLethality = 0.002;
            const survivalProb = Math.pow(1 - dailyLethality, deltaDays);
            sanitationDeaths = Math.floor(demo.total * (1 - survivalProb)); 
        }
        
        // Expectativa de Vida e Penalidades Situacionais de Bioma (mortalidade integrada)
        let biomeDeaths = 0;
        if (node.biome) {
            if (node.biome.id === 'tundra' && (!node.resources?.wood || node.resources.wood <= 0)) {
                // Modificador de sobrevivência ao frio gerado pelo GeneticsEngine
                const coldSurvivalModifier = node.coldSurvivalModifier !== undefined ? node.coldSurvivalModifier : 1.0;
                const dailyLethality = 0.01 * coldSurvivalModifier;
                const survivalProb = Math.pow(1 - Math.min(0.9, dailyLethality), deltaDays);
                biomeDeaths = Math.floor(demo.total * demo.dist.age.elder * (1 - survivalProb)); 
            }
            if (node.biome.id === 'jungle' && !engine.unlockedTechs.has('medicine')) {
                const dailyLethality = 0.005;
                const survivalProb = Math.pow(1 - dailyLethality, deltaDays);
                biomeDeaths = Math.floor(demo.total * demo.dist.age.elder * (1 - survivalProb)); 
            }
        }
        
        const totalExtraDeaths = childExtraDeaths + sanitationDeaths + biomeDeaths;
        
        if (totalExtraDeaths > 0) {
            demo.kill(Math.min(demo.total - 1, totalExtraDeaths));
        }
        
        // 3. MORTE POR CAPACIDADE (Inanição / Overpopulation - multiplicada por deltaDays)
        const K = Math.floor(node.capacity * globalRules.global_K_boost * globalRules.globalKPenalty);
        if (demo.total > K) {
            // Morte de excesso malthusiano integrada ao deltaDays usando probabilidade integrada
            const overpopDeaths = Math.floor((demo.total - K) * (1 - Math.pow(0.99, deltaDays)));
            demo.kill(Math.min(demo.total - 1, Math.max(1, overpopDeaths)));
        }
    }
};
