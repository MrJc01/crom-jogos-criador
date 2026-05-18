export default {
    id: 'events_cosmic_anomalies',
    name: 'Desastres Cósmicos Exógenos',
    type: 'event',
    
    // Probabilidade muito baixa a cada tick, independente de Severidade
    triggerProbability(engine) {
        // Ex: 0.1% de chance a cada tick de algo cósmico cair no planeta
        return 0.001; 
    },
    
    applyEvent(engine) {
        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length === 0) return null;
        
        // Rolar o tipo de anomalia cósmica (Meteoro ou Tempestade Solar)
        const roll = Math.random();
        
        if (roll < 0.2) {
            // Tempestade Solar (Danifica toda a reserva digital, mas não mata gente)
            if ((engine.inventory.chips && engine.inventory.chips > 0) || (engine.inventory.computers && engine.inventory.computers > 0)) {
                const chipsLost = engine.inventory.chips || 0;
                const compLost = engine.inventory.computers || 0;
                
                engine.inventory.chips = 0;
                engine.inventory.computers = 0;
                
                return { 
                    message: `☀️ TEMPESTADE SOLAR! O planeta foi atingido por um pulso eletromagnético (EMP). Toda a infraestrutura eletrônica fritou. Perda de ${chipsLost} Chips e ${compLost} Computadores.`,
                    type: 'cosmic',
                    color: '#f39c12'
                };
            }
        } else {
            // Impacto de Meteoro (Dizima um alvo aleatório, mas deixa riqueza)
            const targetNode = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            
            // Só cai meteoro em populações consideráveis
            if (targetNode.demographics.total < 50000) return null;
            
            const victims = Math.floor(targetNode.demographics.total * 0.4); // 40% de mortalidade
            targetNode.demographics.kill(victims);
            
            // Tarefa 29: Refugiados (10% dos sobreviventes fogem)
            const survivors = targetNode.demographics.total;
            const refugees = Math.floor(survivors * 0.1);
            let refugeeMsg = "";
            
            if (refugees > 0 && targetNode.neighbors.length > 0) {
                targetNode.demographics.kill(refugees);
                const neighborId = targetNode.neighbors[Math.floor(Math.random() * targetNode.neighbors.length)];
                const nNode = engine.nodes.get(neighborId);
                if (nNode) {
                    nNode.infect(0);
                    nNode.demographics.addBirths(refugees);
                    refugeeMsg = ` Cerca de ${refugees.toLocaleString('pt-BR')} refugiados fugiram para ${nNode.name}.`;
                }
            }

            // A bênção: 50.000 Minérios injetados na cratera
            if (!targetNode.resources.minerals) targetNode.resources.minerals = 0;
            targetNode.resources.minerals += 50000;
            
            return { 
                message: `☄️ IMPACTO DE METEORO em ${targetNode.name}! A cratera dizimou ${victims.toLocaleString('pt-BR')} seres, mas expôs um veio massivo de 50.000 Minérios no subsolo!${refugeeMsg}`,
                nodeId: targetNode.id,
                type: 'cosmic',
                color: '#9b59b6' // Roxo
            };
        }
        
        return null;
    }
};
