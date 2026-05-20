import { FactionsData } from '../../core/FactionsData.js';

/**
 * StateEngine — A Formação do Estado Civilizacional
 * 
 * Transição de Chefatura (Tribal) para Estado Centralizado.
 * O Estado concentra o poder em um "Hex Capital", multiplicando a
 * Capacidade de Suporte (K) local ao custo de taxar todos os
 * hexágonos adjacentes ou sob influência.
 */
export default {
    id: 'sociology_state_formation',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        // Checagens apenas anuais
        if (engine.day !== 365 || !node.infected) return;
        
        // 1. Condições para o Nascimento do Estado
        // Precisa ter Agricultura (ou mais de 10 mil pessoas) e não ser Estado ainda
        if (!engine.stateEntities) engine.stateEntities = {};
        
        // 2. A facção majoritária do Hex pode formar um Estado?
        let majorityFac = null;
        let majorityPct = 0;
        
        for (const [fac, pct] of Object.entries(node.demographics.dist.factions)) {
            if (pct > majorityPct) {
                majorityPct = pct;
                majorityFac = fac;
            }
        }
        
        if (majorityPct > 0.6 && node.demographics.total > 15000 && !engine.stateEntities[majorityFac]) {
            // Nasce um Estado!
            engine.stateEntities[majorityFac] = {
                capitalId: node.id,
                foundedYear: engine.year,
                taxRate: 0.1,
                armySize: 0
            };
            
            const data = FactionsData.getFaction(majorityFac);
            node.isCapital = true;
            
            if (engine.onEvent) {
                engine.onEvent({
                    message: `🏛️ O NASCIMENTO DO ESTADO: A facção ${data.name} ultrapassou o limite tribal e fundou um Estado Centralizado em ${node.name}!`,
                    nodeId: node.id, type: 'milestone', color: '#f1c40f'
                }, 'milestone');
            }
        }
        
        // 3. Efeitos de ser Capital (Megacidades)
        if (node.isCapital) {
            // A Capital tem limite K multiplicado por 5
            node.K = (node.K || 1000) * 5;
            
            // Mas consome recursos extras (Burocracia/Exército)
            const bureaucracyCost = Math.floor(node.demographics.total * 0.005);
            node.food = Math.max(0, (node.food || 0) - (bureaucracyCost * engine.deltaDays));
            
            // Manutenção do Exército do Estado
            const state = engine.stateEntities[majorityFac];
            if (state) {
                // Tenta recrutar 1% da população
                const desiredArmy = Math.floor(node.demographics.total * 0.01);
                state.armySize = desiredArmy;
                // Exército reduz os riscos de Cisma/Rebeliões locais (buff veterano)
                node.veteranBuff = Math.max(node.veteranBuff || 0, 1.0);
            }
        }
    }
};
