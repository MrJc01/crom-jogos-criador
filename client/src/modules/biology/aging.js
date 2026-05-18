export default {
    id: 'aging',
    type: 'biology',
    applyTick(node, globalRules, engine) {
        if (node.demographics.total === 0) return;
        
        const demo = node.demographics;
        
        // 1. TRANSIÇÃO DE COORTES (Envelhecimento contínuo por % diária)
        // Se 1 ano = 365 ticks. Transição de Child (0-15) -> Young (15-25) leva 15 anos.
        // Taxa de fluxo diário = 1 / (15 * 365) = 0.00018
        
        const childToYoung = demo.dist.age.child * 0.00018;
        const youngToAdult = demo.dist.age.young * 0.00027; // 10 anos (25-35)
        const adultToElder = demo.dist.age.adult * 0.00007; // 40 anos (35-75)
        
        demo.shiftDistribution('age', 'young', 'child', childToYoung);
        demo.shiftDistribution('age', 'adult', 'young', youngToAdult);
        demo.shiftDistribution('age', 'elder', 'adult', adultToElder);
        
        // 2. MORTALIDADE NATURAL DIÁRIA (Tarefas 01, 03, 04)
        
        // Fator de Mortalidade Infantil atrelado à água (Task 01)
        let childDeathRate = 0.001; // Alta mortalidade pré-medicina
        if (node.resources && node.resources.water <= 0) {
            childDeathRate = 0.005; // 5x mais letal sem água potável
        }
        
        // Impacto Logarítmico do Saneamento Básico (Task 04)
        let sanitationPenalty = 1.0;
        if (demo.total > 50000 && !engine.unlockedTechs.has('tech_sanitation')) {
            // Em metrópoles precárias, a densidade mata (cólera, febre tifoide)
            sanitationPenalty = Math.max(1, Math.log10(demo.total) / 3); 
        } else if (engine.unlockedTechs.has('tech_sanitation')) {
            childDeathRate *= 0.2; // Esgoto reduz a mortalidade infantil em 80%
        }
        
        // Expectativa de Vida Baseada em Bioma (Task 03)
        let biomeElderPenalty = 1.0;
        if (node.biome) {
            if (node.biome.id === 'tundra' && (!engine.inventory.wood || engine.inventory.wood <= 0)) {
                biomeElderPenalty = 3.0; // Sem lenha no frio, idosos morrem de hipotermia
            }
            if (node.biome.id === 'jungle' && !engine.unlockedTechs.has('tech_medicine')) {
                biomeElderPenalty = 2.0; // Selvas matam via doenças tropicais (malária)
            }
        }
        
        const elderDeathRate = 0.0005 * sanitationPenalty * biomeElderPenalty;
        const adultDeathRate = 0.00001 * sanitationPenalty;
        
        const childDeaths = demo.total * demo.dist.age.child * childDeathRate;
        const elderDeaths = demo.total * demo.dist.age.elder * elderDeathRate;
        const adultDeaths = demo.total * demo.dist.age.adult * adultDeathRate;
        
        const totalDeaths = Math.floor(childDeaths + elderDeaths + adultDeaths);
        
        if (totalDeaths > 0) {
            demo.kill(totalDeaths);
            // Reajusta a distribuição para não distorcer muito a longo prazo se só crianças morrerem (abstração)
        }
        
        // 3. MORTE POR CAPACIDADE (Inanição / Overpopulation)
        const K = Math.floor(node.capacity * globalRules.global_K_boost * globalRules.globalKPenalty);
        if (demo.total > K) {
            const overpopDeaths = Math.floor((demo.total - K) * 0.01); // Morre 1% do excesso por dia
            demo.kill(Math.max(1, overpopDeaths));
        }
    }
};
