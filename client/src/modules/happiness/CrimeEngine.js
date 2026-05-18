/**
 * N06. CrimeEngine — Crime emergente baseado em morale e overcrowding.
 * 
 * Tipos: furto (perde resources), homicídio (mata pop), 
 *        corrupção (perde DNA), tráfico (drena trust).
 * Policiamento consome resources mas reduz crime.
 */
export default {
    id: 'crime_engine',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        if (engine.day % 7 !== 0) return;
        
        if (node.crime === undefined) node.crime = 0;
        if (node.policing === undefined) node.policing = 0;
        
        const pop = node.demographics.total;
        const cap = node.capacity || 50000;
        const morale = node.morale || 50;
        
        // ========================================
        // CÁLCULO DE CRIME
        // ========================================
        let crimeChange = 0;
        
        // Baixa morale = mais crime
        crimeChange += Math.max(0, (40 - morale) * 0.005);
        
        // Overcrowding
        const crowdRatio = pop / cap;
        if (crowdRatio > 0.8) crimeChange += (crowdRatio - 0.8) * 0.1;
        
        // Pobreza (sem food)
        if ((node.food || 0) <= 0) crimeChange += 0.05;
        
        // Desigualdade (literacy baixa + pop alta)
        if ((engine.literacy || 5) < 20 && pop > 10000) crimeChange += 0.02;
        
        // Policiamento reduz crime
        crimeChange -= node.policing * 0.05;
        
        // Decaimento natural
        crimeChange -= 0.01;
        
        node.crime = Math.max(0, Math.min(10, node.crime + crimeChange));
        
        // ========================================
        // EFEITOS DO CRIME
        // ========================================
        if (node.crime > 1) {
            // Furto: perde resources
            engine.inventory.wood = Math.max(0, engine.inventory.wood - Math.floor(node.crime * 0.5));
            engine.inventory.minerals = Math.max(0, engine.inventory.minerals - Math.floor(node.crime * 0.2));
        }
        
        if (node.crime > 3) {
            // Homicídio
            const murders = Math.max(0, Math.floor(pop * node.crime * 0.00005));
            if (murders > 0) node.demographics.kill(murders);
        }
        
        if (node.crime > 5) {
            // Corrupção: perde DNA
            engine.adaptationPoints = Math.max(0, engine.adaptationPoints - Math.floor(node.crime));
        }
        
        if (node.crime > 7) {
            // Organizações criminosas
            engine.globalTrust = Math.max(5, engine.globalTrust - 0.1);
        }
        
        // ========================================
        // AUTO-POLICIAMENTO (Zero-Player)
        // ========================================
        if (node.crime > 3 && node.policing < 5) {
            if (engine.inventory.minerals >= 10 && pop > 5000) {
                node.policing = Math.min(5, node.policing + 1);
                engine.inventory.minerals -= 10;
                if (node.crime > 5 && engine.onEvent) {
                    engine.onEvent({
                        message: `🚔 POLICIAMENTO: ${node.name} reforçou a segurança contra onda de crime.`,
                        nodeId: node.id, type: 'milestone', color: '#2c3e50'
                    }, 'milestone');
                }
            }
        }
        
        // Policiamento tem custo de manutenção anual
        if (engine.day === 1 && node.policing > 0) {
            const cost = node.policing * 5;
            if (engine.inventory.minerals >= cost) {
                engine.inventory.minerals -= cost;
            } else {
                node.policing = Math.max(0, node.policing - 1);
            }
        }
        
        // Atualiza morale factor
        if (!node.moraleFactors) node.moraleFactors = {};
        node.moraleFactors.crime = -Math.floor(node.crime * 2);
    }
};
