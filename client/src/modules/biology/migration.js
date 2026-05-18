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
                        
                        // Tarefa 25: Infraestrutura Naval (Exige 5 Madeira ou Aço)
                        if (r.type === 'sea' && engine.currentEra.mult >= 10) {
                            if (engine.inventory.wood > 5 || engine.inventory.steel > 1) {
                                engine.inventory.wood -= Math.min(5, engine.inventory.wood); // Frotas de Madeira
                                unlocked = true; bandwidth = 0.15; 
                            }
                        }
                        // Era Industrial (mult >= 200) desbloqueia Trem (30%)
                        if (r.type === 'rail' && engine.currentEra.mult >= 200) { unlocked = true; bandwidth = 0.30; }
                        // Tarefa 26: Infraestrutura Aérea (Exige 5 Aço e Chips)
                        if (r.type === 'air' && engine.currentEra.mult >= 1000) {
                            if (engine.inventory.steel > 5 && engine.inventory.chips > 1) {
                                unlocked = true; bandwidth = 0.60;
                            }
                        }
                        
                        if (unlocked) options.push({ id: dest, bandwidth, type: r.type });
                    }
                });
            }
            
            if (options.length > 0) {
                const choice = options[Math.floor(Math.random() * options.length)];
                let target = engine.nodes.get(choice.id);
                
                // Tarefa 23 e 24: Checagem de Clima e Atrito
                if (target && target.biome) {
                    if (target.biome.id === 'tundra' && engine.currentEra.mult < 10) {
                        // Tundra fria impede migração massiva sem roupas da era de Bronze
                        choice.bandwidth *= 0.1;
                    } else if (target.biome.id === 'desert') {
                        // Atrito geográfico no deserto
                        choice.bandwidth *= 0.5;
                    }
                }
                
                const migrators = Math.floor(mobilePop * choice.bandwidth);
                
                if (migrators > 0) {
                    const target = engine.nodes.get(choice.id);
                    if (target) {
                        node.demographics.kill(migrators);
                        
                        // Tarefa 15: Atrito Logístico e de Transporte
                        let attritionRate = 0.05; // 5% morre a pé (doença, fome)
                        if (choice.type === 'sea') attritionRate = 0.10; // Naufrágios/escorbuto
                        if (choice.type === 'rail') attritionRate = 0.02; // Trens
                        if (choice.type === 'air') attritionRate = 0.005; // Aviões são seguros
                        
                        if (target.biome && target.biome.id === 'tundra') attritionRate += 0.10; // Frio mata na estrada
                        if (target.biome && target.biome.id === 'desert') attritionRate += 0.15; // Sede
                        
                        const survivors = Math.floor(migrators * (1.0 - attritionRate));
                        
                        target.infect(0); 
                        target.demographics.addBirths(survivors); 
                        
                        // Tarefa 37: Refugiados como Arma (Atrito logístico de vizinho)
                        // A imigração repentina de famintos destrói parte da infraestrutura/solo do vizinho
                        if (survivors > 1000) {
                            const refugeePressure = survivors / Math.max(1, target.capacity);
                            if (refugeePressure > 0.1) {
                                target.soil = Math.max(0, target.soil - (refugeePressure * 5));
                            }
                        }
                        
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
