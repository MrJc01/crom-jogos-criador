export default {
    id: 'migration',
    type: 'biology',
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        
        const K = Math.floor(node.capacity * globalRules.global_K_boost * globalRules.globalKPenalty);
        
        // Se a população estourar o limite de estresse (ex: 95%)
        if (node.demographics.total > K * globalRules.migrationThreshold) {
            
            // Apenas Jovens e Adultos têm força para cruzar fronteiras
            const mobilePop = node.demographics.total * (node.demographics.dist.age.young + node.demographics.dist.age.adult);
            
            const options = [];
            // Fronteiras Terrestres (sempre disponíveis, mas banda baixa)
            node.neighbors.forEach(n => options.push({ id: n, bandwidth: 0.05, type: 'land' }));
            
            // Rotas Multimodais baseadas na Era
            if (engine.tradeRoutes) {
                engine.tradeRoutes.forEach(r => {
                    if (r.sourceId === node.id || r.targetId === node.id) {
                        const dest = r.sourceId === node.id ? r.targetId : r.sourceId;
                        let bandwidth = 0;
                        let unlocked = false;
                        
                        // Bronze Age (mult >= 10) desbloqueia Mar (15%)
                        if (r.type === 'sea' && engine.currentEra.mult >= 10) { unlocked = true; bandwidth = 0.15; }
                        // Era Industrial (mult >= 200) desbloqueia Trem (30%)
                        if (r.type === 'rail' && engine.currentEra.mult >= 200) { unlocked = true; bandwidth = 0.30; }
                        // Era Informação (mult >= 1000) desbloqueia Ar (60%)
                        if (r.type === 'air' && engine.currentEra.mult >= 1000) { unlocked = true; bandwidth = 0.60; }
                        
                        if (unlocked) options.push({ id: dest, bandwidth, type: r.type });
                    }
                });
            }
            
            if (options.length > 0) {
                const choice = options[Math.floor(Math.random() * options.length)];
                const migrators = Math.floor(mobilePop * choice.bandwidth);
                
                if (migrators > 0) {
                    const target = engine.nodes.get(choice.id);
                    if (target) {
                        node.demographics.kill(migrators);
                        target.infect(0); 
                        target.demographics.addBirths(migrators); 
                        
                        // Emite evento visual para rotas modais (não terrestres simples)
                        if (choice.type !== 'land' && engine.onEvent) {
                            engine.onEvent({ sourceId: node.id, targetId: choice.id, type: choice.type }, 'migration_event');
                        }
                    }
                }
            }
        }
    }
};
