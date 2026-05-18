/**
 * N18. TransportEngine — Estradas, portos, ferrovias, aeroportos.
 * N19. EnergyEngine — Grid energético progressivo.
 * N20. SanitationEngine — Saneamento e saúde pública.
 * N21. CommunicationEngine — Meios de comunicação progressivos.
 */
export default {
    id: 'infrastructure_expansion',
    type: 'economy',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        if (engine.day % 30 !== 0) return;
        
        const pop = node.demographics.total;
        const techs = engine.unlockedTechs?.size || 0;
        
        // ========================================
        // N18: TRANSPORTE
        // ========================================
        if (!node.transport) node.transport = { level: 0 };
        
        const transportTiers = [
            { level: 1, name: 'Trilha', minPop: 500, cost: { wood: 20 }, tradeMult: 1.5, migMult: 1.3 },
            { level: 2, name: 'Estrada', minPop: 5000, cost: { wood: 50 }, tradeMult: 2.0, migMult: 2.0 },
            { level: 3, name: 'Estrada Pavimentada', minPop: 20000, cost: { minerals: 100 }, tradeMult: 3.0, migMult: 2.5, minTechs: 10 },
            { level: 4, name: 'Ferrovia', minPop: 50000, cost: { minerals: 300 }, tradeMult: 10.0, migMult: 3.0, minTechs: 15 },
            { level: 5, name: 'Rodovia', minPop: 100000, cost: { minerals: 500 }, tradeMult: 5.0, migMult: 5.0, minTechs: 20 },
            { level: 6, name: 'Aeroporto', minPop: 200000, cost: { minerals: 1000, chips: 10 }, tradeMult: 20.0, migMult: 10.0, minTechs: 25 }
        ];
        
        const nextTier = transportTiers.find(t => t.level === node.transport.level + 1);
        if (nextTier && pop >= nextTier.minPop && techs >= (nextTier.minTechs || 0)) {
            let canBuild = true;
            for (const [res, amount] of Object.entries(nextTier.cost)) {
                if ((engine.inventory[res] || 0) < amount) { canBuild = false; break; }
            }
            if (canBuild && Math.random() < 0.005) {
                for (const [res, amount] of Object.entries(nextTier.cost)) {
                    engine.inventory[res] -= amount;
                }
                node.transport.level = nextTier.level;
                node.transport.tradeMult = nextTier.tradeMult;
                node.transport.migMult = nextTier.migMult;
                if (engine.onEvent) {
                    engine.onEvent({
                        message: `🛤️ TRANSPORTE: ${node.name} construiu "${nextTier.name}"! Comércio ×${nextTier.tradeMult}.`,
                        nodeId: node.id, type: 'milestone', color: '#7f8c8d'
                    }, 'milestone');
                }
            }
        }
        
        // ========================================
        // N19: ENERGIA
        // ========================================
        if (!node.energy) node.energy = { source: 'biomass', output: 1 };
        
        const energyTiers = [
            { source: 'biomass', output: 1, pollution: 0.1, minTechs: 0 },
            { source: 'coal', output: 5, pollution: 0.5, minTechs: 10 },
            { source: 'oil', output: 20, pollution: 0.8, minTechs: 15 },
            { source: 'nuclear', output: 100, pollution: 0.1, minTechs: 25, tech: 'fissao_nuclear' },
            { source: 'solar', output: 50, pollution: 0, minTechs: 20 },
            { source: 'fusion', output: 500, pollution: 0, minTechs: 35, tech: 'fusao_nuclear' }
        ];
        
        for (const tier of energyTiers.reverse()) {
            if (techs >= tier.minTechs && (!tier.tech || engine.unlockedTechs?.has(tier.tech))) {
                if (node.energy.source !== tier.source) {
                    node.energy = { source: tier.source, output: tier.output, pollution: tier.pollution };
                    if (tier.output > 5 && engine.onEvent) {
                        engine.onEvent({
                            message: `⚡ ENERGIA: ${node.name} transicionou para ${tier.source}! Output: ${tier.output}W.`,
                            nodeId: node.id, type: 'milestone', color: '#f1c40f'
                        }, 'milestone');
                    }
                }
                break;
            }
        }
        
        // Poluição gera aquecimento
        if (node.energy.pollution > 0 && engine.globalTemperatureOffset !== undefined) {
            engine.globalTemperatureOffset += node.energy.pollution * 0.00001;
        }
        
        // ========================================
        // N20: SANEAMENTO
        // ========================================
        if (node.sanitation === undefined) node.sanitation = 0; // 0-100
        
        if (engine.unlockedTechs?.has('saneamento_basico')) {
            node.sanitation = Math.min(100, node.sanitation + 0.1);
        }
        if (node.buildings?.hospital > 0) {
            node.sanitation = Math.min(100, node.sanitation + node.buildings.hospital * 0.5);
        }
        
        // Saneamento afeta mortalidade
        if (node.sanitation > 50) {
            // Reduz mortalidade
            node.sanitationEffect = 1 - (node.sanitation / 200); // 0.5-1.0
        } else {
            node.sanitationEffect = 1.0;
        }
        
        // ========================================
        // N21: COMUNICAÇÃO
        // ========================================
        if (!engine.commLevel) engine.commLevel = 0;
        
        const commTiers = [
            { level: 1, name: 'Sinais de Fumaça', minPop: 1000, awareness: 0.1 },
            { level: 2, name: 'Correio', minPop: 10000, awareness: 0.3, minTechs: 5 },
            { level: 3, name: 'Imprensa', minPop: 50000, awareness: 0.5, minTechs: 15, tech: 'imprensa' },
            { level: 4, name: 'Telégrafo', minPop: 100000, awareness: 0.7, minTechs: 18 },
            { level: 5, name: 'Rádio', minPop: 200000, awareness: 0.8, minTechs: 22 },
            { level: 6, name: 'Televisão', minPop: 500000, awareness: 0.9, minTechs: 28 },
            { level: 7, name: 'Internet', minPop: 1000000, awareness: 1.0, minTechs: 32, tech: 'internet' }
        ];
        
        for (const tier of commTiers.reverse()) {
            if (engine.globalPop >= tier.minPop && techs >= (tier.minTechs || 0)) {
                if (tier.tech && !engine.unlockedTechs?.has(tier.tech)) continue;
                if (engine.commLevel < tier.level) {
                    engine.commLevel = tier.level;
                    engine.awareness = tier.awareness;
                    if (engine.onEvent) {
                        engine.onEvent({
                            message: `📡 COMUNICAÇÃO: "${tier.name}" inaugurado! Awareness: ${Math.floor(tier.awareness * 100)}%.`,
                            type: 'milestone', color: '#1abc9c'
                        }, 'milestone');
                    }
                }
                break;
            }
        }
    }
};
