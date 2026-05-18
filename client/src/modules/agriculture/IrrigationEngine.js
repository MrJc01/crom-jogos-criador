/**
 * N02. IrrigationEngine — Canais de irrigação e aquedutos entre hexes.
 * 
 * Transfere água entre hexes vizinhos com infraestrutura.
 * Boost de yield agrícola ×1.5 (canal) a ×2.5 (aqueduto).
 */
export default {
    id: 'irrigation_engine',
    type: 'economy',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        if (engine.day % 30 !== 0) return; // Mensal
        
        if (node.irrigation === undefined) node.irrigation = { level: 0, canals: [] };
        
        const pop = node.demographics.total;
        
        // ========================================
        // AUTO-CONSTRUÇÃO DE IRRIGAÇÃO
        // ========================================
        if (engine.unlockedTechs?.has('agriculture') && pop > 1000) {
            // Nível 1: Canais básicos
            if (node.irrigation.level === 0 && (node.resources?.water || 0) > 2000) {
                if (engine.inventory.wood >= 30 && Math.random() < 0.005) {
                    node.irrigation.level = 1;
                    engine.inventory.wood -= 30;
                    if (engine.onEvent) {
                        engine.onEvent({
                            message: `💧 IRRIGAÇÃO: ${node.name} construiu canais de irrigação! Yield agrícola ×1.5.`,
                            nodeId: node.id, type: 'milestone', color: '#3498db'
                        }, 'milestone');
                    }
                }
            }
            
            // Nível 2: Aqueduto (requer saneamento)
            if (node.irrigation.level === 1 && engine.unlockedTechs?.has('saneamento_basico')) {
                if (engine.inventory.minerals >= 200 && Math.random() < 0.003) {
                    node.irrigation.level = 2;
                    engine.inventory.minerals -= 200;
                    if (engine.onEvent) {
                        engine.onEvent({
                            message: `🏗️ AQUEDUTO: ${node.name} construiu um aqueduto! Yield agrícola ×2.0. Água importada.`,
                            nodeId: node.id, type: 'milestone', color: '#2980b9'
                        }, 'milestone');
                    }
                }
            }
            
            // Nível 3: Irrigação moderna (gotejamento)
            if (node.irrigation.level === 2 && (engine.unlockedTechs?.size || 0) >= 20) {
                if (engine.inventory.chips >= 5 && Math.random() < 0.002) {
                    node.irrigation.level = 3;
                    engine.inventory.chips -= 5;
                    if (engine.onEvent) {
                        engine.onEvent({
                            message: `🔧 IRRIGAÇÃO MODERNA: ${node.name} implementou gotejamento! Yield ×2.5, consumo de água -50%.`,
                            nodeId: node.id, type: 'milestone', color: '#1abc9c'
                        }, 'milestone');
                    }
                }
            }
        }
        
        // ========================================
        // TRANSFERÊNCIA DE ÁGUA ENTRE HEXES
        // ========================================
        if (node.irrigation.level >= 2) {
            const neighbors = node.neighbors || [];
            for (const nId of neighbors) {
                const neighbor = engine.nodes.get(nId);
                if (!neighbor?.infected) continue;
                
                const myWater = node.resources?.water || 0;
                const theirWater = neighbor.resources?.water || 0;
                
                // Transfere se vizinho tem mais água
                if (theirWater > myWater + 2000) {
                    const transfer = Math.floor((theirWater - myWater) * 0.05);
                    if (neighbor.resources) neighbor.resources.water -= transfer;
                    if (node.resources) node.resources.water += transfer;
                }
            }
        }
        
        // ========================================
        // APLICAR BOOST DE IRRIGAÇÃO
        // ========================================
        const irrigBoosts = [1.0, 1.5, 2.0, 2.5];
        node.irrigationBoost = irrigBoosts[node.irrigation.level] || 1.0;
        
        // Water conservation com nível 3
        if (node.irrigation.level >= 3) {
            node.waterConservation = 0.5; // -50% consumo de água para farming
        }
    }
};
