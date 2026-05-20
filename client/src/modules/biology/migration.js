export default {
    id: 'migration',
    type: 'biology',
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        
        const deltaDays = globalRules.deltaDays || 1;
        const K = Math.floor(node.capacity * globalRules.global_K_boost * globalRules.globalKPenalty);
        
        let willMigrate = false;
        let bandwidthMult = 1.0;
        
        // Flag: identifica tribos fundadoras pequenas que precisam de boost de dispersão
        const isSmallFounder = node.demographics.total < 500;

        // Gatilho 1: Superlotação
        if (node.demographics.total > K * globalRules.migrationThreshold) {
            willMigrate = true;
        } 
        // Gatilho 2: Fome Forçada (Fuga para sobrevivência)
        else if ((node.food || 0) <= 0 && (node.famineDays || 0) > 30) {
            willMigrate = true;
            bandwidthMult = 2.0; // Desespero dobra a quantidade de migrantes
        }
        // Gatilho 3: Nomadismo Natural / Expansão Cultural (Probabilidade acumulada ao longo de deltaDays)
        // FIX: Tribos pequenas (<500) têm 50x mais chance de migrar (0.5%/dia vs 0.01%/dia)
        // Isso simula o comportamento nômade real de bandos de caçadores-coletores
        else if (node.demographics.total > 20) {
            const dailyChance = isSmallFounder ? 0.005 : 0.0001;
            if (Math.random() < (1 - Math.pow(1 - dailyChance, deltaDays))) {
                willMigrate = true;
                // Tribos pequenas enviam uma proporção maior (40% vs 20%) — bandos pioneiros viáveis
                bandwidthMult = isSmallFounder ? 0.4 : 0.2;
            }
        }
        
        if (willMigrate) {
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
                
                let migrators = Math.max(1, Math.floor(mobilePop * choice.bandwidth * bandwidthMult));
                
                // FIX: Bando mínimo viável para tribos fundadoras
                // Garante que o grupo pioneiro tenha pelo menos 30 pessoas para sobreviver
                // mas nunca drena mais do que (total - 10) para não matar a colônia mãe
                if (isSmallFounder && migrators < 30) {
                    migrators = Math.min(Math.max(0, node.demographics.total - 10), 30);
                }
                
                if (migrators > 0 && node.demographics.total > migrators) {
                    const target = engine.nodes.get(choice.id);
                    if (target) {
                        node.demographics.kill(migrators);
                        
                        // Tarefa 15: Atrito Logístico e de Transporte
                        let attritionRate = 0.05; // 5% morre a pé (doença, fome)
                        
                        // FIX: Nômades pequenos (<150) em rotas terrestres curtas não sofrem atrito
                        // Simula que bandos pequenos são ágeis e conhecem o terreno local
                        if (migrators < 150 && choice.type === 'land') {
                            attritionRate = 0.0;
                        }
                        
                        if (choice.type === 'sea') attritionRate = 0.10; // Naufrágios/escorbuto
                        if (choice.type === 'rail') attritionRate = 0.02; // Trens
                        if (choice.type === 'air') attritionRate = 0.005; // Aviões são seguros
                        
                        // FIX: Atrito de bioma NÃO se aplica a bandos pequenos terrestres
                        if (!(migrators < 150 && choice.type === 'land')) {
                            if (target.biome && target.biome.id === 'tundra') attritionRate += 0.10; // Frio mata na estrada
                            if (target.biome && target.biome.id === 'desert') attritionRate += 0.15; // Sede
                        }
                        
                        const survivors = Math.max(1, Math.floor(migrators * (1.0 - attritionRate)));
                        
                        const isNewColonization = !target.infected;
                        if (isNewColonization) {
                            target.infect(survivors, node.demographics);
                            // Sincroniza genes e espécies na nova colonização
                            target.genes = { ...node.genes };
                            target.species = { ...node.species };
                        } else {
                            // Se já está habitado, integra a população e mistura ponderadamente as culturas/facções
                            target.demographics.addMigrants(survivors, node.demographics.dist.factions, node.demographics.dist.religion);
                        } 
                        
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
