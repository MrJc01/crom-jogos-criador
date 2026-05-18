import { FactionsData } from '../../core/FactionsData.js';

export default {
    id: 'sociology_combat_engine',
    name: 'Conflito e Atrito',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        // Combates rolam a cada 10 dias para não engolir o processamento
        if (engine.day % 10 !== 0) return;
        
        const factionsPresent = Object.keys(node.demographics.dist.factions);
        if (factionsPresent.length < 2) return; // Precisa de pelo menos 2 facções para brigar
        
        const capacityRatio = node.demographics.total / node.capacity;
        
        // Avalia quem é o agressor
        for (const agressorId of factionsPresent) {
            const data = FactionsData.getFaction(agressorId);
            
            // Só ataca se for agressivo ou se a região estiver com mais de 80% de capacidade (luta por sobrevivência)
            let willAttack = data.traits.includes("militarist") || data.traits.includes("chaotic");
            if (capacityRatio > 0.8 && data.traits.includes("survivalist")) willAttack = true;
            
            if (willAttack) {
                // Sorteia um alvo que não seja ele mesmo
                const targets = factionsPresent.filter(f => f !== agressorId);
                if (targets.length === 0) continue;
                const targetId = targets[Math.floor(Math.random() * targets.length)];
                
                // Checa a economia de Confiança (Diplomacia Zero-Player)
                // Se a relação mutua for > 300, eles têm um Tratado de Paz informal, bloqueia a guerra
                const relKey = `${agressorId}-${targetId}`;
                if (engine.economy.relations && engine.economy.relations[relKey] > 300) {
                    continue; // Pula o combate por causa do comércio
                }
                
                // Rola chance da guerra realmente estourar naquele mês
                if (Math.random() < engine.config.warChance) {
                    // CÁLCULO DE PODER MILITAR
                    // 1. Baseado nas tecnologias atuais
                    const techBonus = 1 + (engine.techTree.unlocked.size * 0.1); 
                    // 2. Baseado no aço global
                    const steelBonus = 1 + ((engine.inventory.steel || 0) / 10000);
                    
                    const power = 1.0 * techBonus * steelBonus;
                    
                    // Se o alvo for pacifista, não tem defesa. Se for militar, tem resistência.
                    const targetData = FactionsData.getFaction(targetId);
                    const defense = (targetData.traits.includes("militarist") || targetData.traits.includes("survivalist")) ? 0.5 : 1.0;
                    
                    // Atrito: O agressor mata um percentual da população do alvo no nó
                    const casualtiesPercent = 0.05 * power * defense; // Até 5% ao mês modificado pelo poder
                    const casualties = Math.floor((node.demographics.dist.factions[targetId] * node.demographics.total) * casualtiesPercent);
                    
                    if (casualties > 10) {
                        node.demographics.kill(casualties);
                        
                        // Atualiza a pizza
                        const newTotal = node.demographics.total;
                        // A porcentagem do alvo cai, a do agressor sobe indiretamente porque o total caiu
                        node.demographics.dist.factions[targetId] = Math.max(0, (node.demographics.dist.factions[targetId] * (newTotal + casualties) - casualties) / newTotal);
                        
                        // Roubo de Confiança Global
                        const stolenTrust = engine.economy.stealTrust(targetId, agressorId, 0.1); // Rouba 10% da confiança
                        
                        if (engine.onEvent && casualties > 50000) {
                            engine.onEvent({
                                message: `⚔️ GUERRA em ${node.name}! A facção ${data.name} massacrou ${casualties.toLocaleString('pt-BR')} membros da facção ${targetData.name}.`,
                                nodeId: node.id
                            }, "war");
                        }
                    }
                }
            }
        }
    }
};
