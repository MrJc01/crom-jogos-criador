import { FactionsData } from '../../core/FactionsData.js';
import { Config } from '../../config/ConfigLoader.js';

export default {
    id: 'sociology_civilization_dynamics',
    name: 'Dinâmicas Civilizacionais de Adaptação, Osmose e Dispersão',
    type: 'sociology',
    
    // Função executada a cada tick diário nas regiões infectadas
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        
        const deltaDays = globalRules.deltaDays || 1;
        const currentYear = engine.year;
        
        // Carrega configurações dinâmicas para evitar constantes mágicas
        const dynamicsCfg = Config.get('civilizationDynamics') || {
            rebelMigrationRate: 0.80,
            overpopulationNomadChance: 0.05,
            overpopulationThreshold: 0.80,
            acclimatizationSpeedPerYear: 0.02,
            technologyOsmoseChance: 0.015,
            mutualFoodAssistanceThreshold: 5000,
            mutualFoodAssistanceAmount: 1000
        };
        
        const K = Math.floor(node.capacity * globalRules.global_K_boost * globalRules.globalKPenalty);
        const capacityRatio = node.demographics.total / Math.max(1, K);
        
        // ==========================================
        // 1. Deriva Cultural e Aclimatação Acelerada
        // ==========================================
        // Se a facção dominante possuir traits de resiliência ecológica, a aclimatação do nó ao bioma acelera.
        if (node.biomeAdaptation) {
            const biomeId = node.biome?.id || 'plains';
            let dominantFaction = 'tribal';
            let maxPct = 0;
            if (node.demographics.dist?.factions) {
                for (const [fac, pct] of Object.entries(node.demographics.dist.factions)) {
                    if (pct > maxPct) { maxPct = pct; dominantFaction = fac; }
                }
            }
            
            const facInfo = FactionsData.getFaction(dominantFaction);
            const hasEcoTrait = facInfo && facInfo.traits && (facInfo.traits.includes('ecological') || facInfo.traits.includes('survivalist'));
            
            // Fatores de aceleração adaptativa baseados em traits
            const speedBoost = hasEcoTrait ? 1.5 : 1.0;
            const adaptationRate = dynamicsCfg.acclimatizationSpeedPerYear * speedBoost;
            
            if (node.biomeAdaptation[biomeId] < 100) {
                node.biomeAdaptation[biomeId] = Math.min(100, node.biomeAdaptation[biomeId] + (adaptationRate / 365) * deltaDays);
            }
        }
        
        // As demais lógicas civilizacionais rodam no fechamento do ano para evitar sobrecarga de CPU
        if (engine.day !== 365) return;
        
        // ==========================================
        // 2. Cismas Geográficos (Parando de ficar juntos)
        // ==========================================
        // Encontra facções dissidentes locais. Se elas representarem mais de 15% e o nó estiver sob tensão, migram.
        if (node.demographics.dist?.factions && node.neighbors.length > 0) {
            const factions = Object.entries(node.demographics.dist.factions);
            for (const [facId, pct] of factions) {
                if (facId.includes('_dissidentes') && pct > 0.15 && capacityRatio > 0.60) {
                    
                    // Procura vizinhos terrestres desocupados
                    let targetNeighborId = node.neighbors.find(nId => {
                        const neighbor = engine.nodes.get(nId);
                        return neighbor && !neighbor.infected;
                    });
                    
                    // Se não encontrar desocupado, procura o vizinho habitado mais vazio (densidade < 15%)
                    if (!targetNeighborId) {
                        let minPop = Infinity;
                        node.neighbors.forEach(nId => {
                            const neighbor = engine.nodes.get(nId);
                            if (neighbor && neighbor.infected) {
                                const neighK = Math.floor(neighbor.capacity * globalRules.global_K_boost * globalRules.globalKPenalty);
                                const neighDensity = neighbor.demographics.total / Math.max(1, neighK);
                                if (neighDensity < 0.15 && neighbor.demographics.total < minPop) {
                                    minPop = neighbor.demographics.total;
                                    targetNeighborId = nId;
                                }
                            }
                        });
                    }
                    
                    if (targetNeighborId) {
                        const targetNode = engine.nodes.get(targetNeighborId);
                        const rebelsTotal = Math.floor(node.demographics.total * pct);
                        const migratingRebels = Math.floor(rebelsTotal * dynamicsCfg.rebelMigrationRate);
                        
                        if (migratingRebels > 10 && node.demographics.total > migratingRebels) {
                            // Subtrai do nó original
                            node.demographics.kill(migratingRebels);
                            
                            // Se o nó original ficou com resíduo irrelevante da facção, remove
                            const remainingPct = (rebelsTotal - migratingRebels) / node.demographics.total;
                            if (remainingPct < 0.01) {
                                delete node.demographics.dist.factions[facId];
                            } else {
                                node.demographics.dist.factions[facId] = remainingPct;
                            }
                            
                            // Coloniza ou enriquece o vizinho
                            const wasInfected = targetNode.infected;
                            targetNode.infect(0);
                            targetNode.demographics.addBirths(migratingRebels);
                            
                            // A facção rebelde vira dominante na colônia
                            if (!wasInfected) {
                                targetNode.demographics.dist.factions = { [facId]: 1.0 };
                            } else {
                                const existingTotal = targetNode.demographics.total - migratingRebels;
                                const existingPct = existingTotal / targetNode.demographics.total;
                                const addedPct = migratingRebels / targetNode.demographics.total;
                                
                                for (const fid in targetNode.demographics.dist.factions) {
                                    targetNode.demographics.dist.factions[fid] *= existingPct;
                                }
                                targetNode.demographics.dist.factions[facId] = (targetNode.demographics.dist.factions[facId] || 0) + addedPct;
                            }
                            
                            // Dispara crônica visual de dispersão
                            const cleanFacName = FactionsData.getFaction(facId).name || "Dissidentes";
                            if (engine.onEvent) {
                                engine.onEvent({
                                    message: `🏔️ DISPERSÃO GEOGRÁFICA: Os dissidentes '${cleanFacName}' saíram da região e fundaram assentamento autônomo em ${targetNode.name}!`,
                                    nodeId: targetNode.id, type: 'migration', color: '#3498db'
                                }, 'migration');
                            }
                            
                            break; // Processa apenas um cisma migratório por ano por nó
                        }
                    }
                }
            }
        }
        
        // ==========================================
        // 3. Nomadismo Ativo por Sobrecarga (Expansão)
        // ==========================================
        // Se o hexágono está superlotação (>80%), há chance anual de colonizar vizinhos vagos.
        if (capacityRatio > dynamicsCfg.overpopulationThreshold && Math.random() < dynamicsCfg.overpopulationNomadChance && node.neighbors.length > 0) {
            const freeNeighborId = node.neighbors.find(nId => {
                const neighbor = engine.nodes.get(nId);
                return neighbor && !neighbor.infected;
            });
            
            if (freeNeighborId) {
                const freeNode = engine.nodes.get(freeNeighborId);
                // 15% a 25% da população migra como bando pioneiro
                const nomadRatio = 0.15 + (Math.random() * 0.10);
                const nomadsCount = Math.floor(node.demographics.total * nomadRatio);
                
                if (nomadsCount > 10 && node.demographics.total > nomadsCount) {
                    node.demographics.kill(nomadsCount);
                    
                    // Copia a distribuição cultural
                    const originalDist = { ...node.demographics.dist.factions };
                    
                    freeNode.infect(0);
                    freeNode.demographics.addBirths(nomadsCount);
                    freeNode.demographics.dist.factions = originalDist;
                    
                    // Evento de expansão
                    if (engine.onEvent) {
                        engine.onEvent({
                            message: `🏹 EXPANSÃO TERRITORIAL: Superlotação em ${node.name} forçou clãs pioneiros a expandirem para a região virgem de ${freeNode.name}!`,
                            nodeId: freeNode.id, type: 'migration', color: '#2ecc71'
                        }, 'migration');
                    }
                }
            }
        }
        
        // ==========================================
        // 4. Osmose Tecnológica e Comercial (Trocas)
        // ==========================================
        // Vizinhos trocam ativamente informações (vazamento passivo) e comida emergencial
        node.neighbors.forEach(nId => {
            const neighbor = engine.nodes.get(nId);
            if (!neighbor || !neighbor.infected) return;
            
            // A) Osmose Tecnológica: Se o vizinho tem mais tecnologias desbloqueadas de eras avançadas
            // Há uma chance de dar 2 a 8 pontos de adaptação de "Eureka" extra ao nó atrasado
            if (Math.random() < dynamicsCfg.technologyOsmoseChance) {
                // Como tecnologias são globais por enquanto, simulamos a difusão intelectual acelerando o DNA global
                // de acordo com a proximidade geográfica de nós densos.
                const popBonus = Math.floor(neighbor.demographics.total / 1000);
                if (popBonus > 0) {
                    engine.adaptationPoints += Math.min(5, popBonus);
                    if (Math.random() < 0.05 && engine.onEvent) {
                        engine.onEvent({
                            message: `💡 TROCA DE INFORMAÇÕES: Ideias inovadoras de ${neighbor.name} vazaram para ${node.name}, gerando ideias adaptativas.`,
                            nodeId: node.id, type: 'milestone', color: '#f1c40f'
                        }, 'milestone');
                    }
                }
            }
            
            // B) Solidariedade Comercial emergencial de subsistência:
            // Se o nó atual estiver zerado de comida com fome persistente e o vizinho estiver estocado com comida excedente, envia ajuda.
            if ((node.food || 0) <= 0 && (node.famineDays || 0) > 30 && (neighbor.food || 0) > dynamicsCfg.mutualFoodAssistanceThreshold) {
                const aid = dynamicsCfg.mutualFoodAssistanceAmount;
                neighbor.food -= aid;
                node.food = (node.food || 0) + aid;
                node.famineDays = 0; // Alivia a fome emergencial
                
                if (engine.onEvent) {
                    engine.onEvent({
                        message: `🌾 SOLIDARIEDADE COMERCIAL: O vizinho ${neighbor.name} enviou suprimentos de emergência para aliviar a fome extrema em ${node.name}!`,
                        nodeId: node.id, type: 'warning', color: '#e67e22'
                    }, 'warning');
                }
            }
        });
    }
};
