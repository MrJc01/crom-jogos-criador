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
        
        // 2. MORTALIDADE NATURAL DIÁRIA
        const elderDeathRate = 0.0005; // 0.05% dos idosos morrem por dia
        const adultDeathRate = 0.00001; // Adultos morrem bem menos
        
        const elderDeaths = demo.total * demo.dist.age.elder * elderDeathRate;
        const adultDeaths = demo.total * demo.dist.age.adult * adultDeathRate;
        
        const totalDeaths = Math.floor(elderDeaths + adultDeaths);
        
        if (totalDeaths > 0) {
            demo.kill(totalDeaths);
            // Reduzir puramente da coorte de idosos faria a matriz perder o 100%, 
            // precisaria rebalancear. No MVP matricial, kill abaixa o total absoluto.
        }
        
        // 3. MORTE POR CAPACIDADE (Inanição / Overpopulation)
        const K = Math.floor(node.capacity * globalRules.global_K_boost * globalRules.globalKPenalty);
        if (demo.total > K) {
            const overpopDeaths = Math.floor((demo.total - K) * 0.01); // Morre 1% do excesso por dia
            demo.kill(Math.max(1, overpopDeaths));
        }
    }
};
