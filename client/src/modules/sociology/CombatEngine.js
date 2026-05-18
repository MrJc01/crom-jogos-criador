import { FactionsData } from '../../core/FactionsData.js';

export default {
    id: 'sociology_combat_engine',
    name: 'Conflito e Atrito',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        // Combates rolam a cada 10 dias para não engolir o processamento
        if (engine.day % 10 !== 0) return;
        
        const factionsPresent = Object.keys(node.demographics.dist.factions);
        if (factionsPresent.length < 2) return;
        
        const capacityRatio = node.demographics.total / node.capacity;
        
        // 043. Cerco e Atrito — Nós sobrecarregados perdem pop gradualmente
        if (capacityRatio > 1.2) {
            const siegeDeaths = Math.floor(node.demographics.total * 0.001 * (capacityRatio - 1.0));
            if (siegeDeaths > 0) {
                node.demographics.kill(siegeDeaths);
            }
        }
        
        // Avalia quem é o agressor
        for (const agressorId of factionsPresent) {
            const data = FactionsData.getFaction(agressorId);
            
            let willAttack = data.traits.includes("militarist") || data.traits.includes("chaotic");
            if (capacityRatio > 0.8 && data.traits.includes("survivalist")) willAttack = true;
            
            if (willAttack) {
                const targets = factionsPresent.filter(f => f !== agressorId);
                if (targets.length === 0) continue;
                const targetId = targets[Math.floor(Math.random() * targets.length)];
                
                // Diplomacia
                const relKey = `${agressorId}-${targetId}`;
                if (engine.economy.relations && engine.economy.relations[relKey] > 300) {
                    continue;
                }
                
                if (Math.random() < engine.config.warChance) {
                    const techBonus = 1 + (engine.techTree.unlocked.size * 0.1); 
                    const steelBonus = 1 + ((engine.inventory.steel || 0) / 10000);
                    
                    // 044. Veteranos de Guerra — buff acumulado
                    const veteranBonus = 1 + ((node.veteranBuff || 0) * 0.1);
                    const power = 1.0 * techBonus * steelBonus * veteranBonus;
                    
                    const targetData = FactionsData.getFaction(targetId);
                    const defense = (targetData.traits.includes("militarist") || targetData.traits.includes("survivalist")) ? 0.5 : 1.0;
                    
                    const casualtiesPercent = 0.05 * power * defense;
                    const casualties = Math.floor((node.demographics.dist.factions[targetId] * node.demographics.total) * casualtiesPercent);
                    
                    if (casualties > 10) {
                        node.demographics.kill(casualties);
                        
                        // 044. Veteranos — sobreviventes ganham buff permanente
                        if (!node.veteranBuff) node.veteranBuff = 0;
                        node.veteranBuff = Math.min(5, node.veteranBuff + 0.01); // Cap em 5
                        
                        const newTotal = node.demographics.total;
                        node.demographics.dist.factions[targetId] = Math.max(0, (node.demographics.dist.factions[targetId] * (newTotal + casualties) - casualties) / newTotal);
                        
                        const stolenTrust = engine.economy.stealTrust(targetId, agressorId, 0.1);
                        
                        if (engine.onEvent && casualties > 50000) {
                            engine.onEvent({
                                message: `⚔️ GUERRA em ${node.name}! ${data.name} massacrou ${casualties.toLocaleString('pt-BR')} da facção ${targetData.name}.`,
                                nodeId: node.id
                            }, "war");
                            engine.logEvent?.({ message: `⚔️ Guerra: ${data.name} vs ${targetData.name}` }, "war");
                        }
                    }
                    
                    // 045. Genocídio e Crime de Guerra — Facções extremistas
                    if (data.traits.includes("chaotic") && casualties > 100000) {
                        // Chance de extermínio total do nó (war crime)
                        if (Math.random() < 0.01) {
                            const genocideVictims = Math.floor(node.demographics.total * (node.demographics.dist.factions[targetId] || 0));
                            node.demographics.kill(genocideVictims);
                            delete node.demographics.dist.factions[targetId];
                            
                            // Trust global despenca
                            engine.globalTrust = Math.max(0, engine.globalTrust - 50);
                            engine.pressures.social += 5.0;
                            
                            if (engine.onEvent) {
                                engine.onEvent({
                                    message: `💀 GENOCÍDIO: ${data.name} exterminou ${genocideVictims.toLocaleString('pt-BR')} membros da ${targetData.name} em ${node.name}. Trust global -50!`,
                                    nodeId: node.id, type: "nemesis", color: "#440000"
                                }, "nemesis");
                                engine.logEvent?.({ message: `💀 Genocídio: ${data.name} vs ${targetData.name}` }, "genocide");
                            }
                        }
                    }
                }
            }
        }
    }
};
