/**
 * N03. FamineEngine — Motor de fome como pressão sistêmica global.
 * 
 * Calcula food deficit global e dispara eventos em cascata:
 * Deficit leve → migração forçada
 * Deficit grave → guerras por comida
 * Deficit extremo → canibalismo
 */
export default {
    id: 'famine_engine',
    type: 'event',
    
    triggerProbability(engine) {
        if (engine.day % 30 !== 0) return 0;
        
        // Calcula deficit global
        let totalFood = 0;
        let totalNeed = 0;
        engine.nodes.forEach(n => {
            if (!n.infected) return;
            totalFood += (n.food || 0);
            totalNeed += n.demographics.total * 0.003; // Need diário
        });
        
        engine._foodDeficit = totalNeed > 0 ? Math.max(0, 1 - (totalFood / (totalNeed * 30))) : 0;
        
        // Probabilidade baseada em deficit
        if (engine._foodDeficit > 0.5) return 0.05; // 5% se deficit > 50%
        if (engine._foodDeficit > 0.3) return 0.01;
        return 0;
    },
    
    applyEvent(engine) {
        const deficit = engine._foodDeficit || 0;
        
        if (deficit > 0.7) {
            // CRISE EXTREMA — Guerras por comida
            engine.pressures.social += 2.0;
            engine.globalTrust = Math.max(5, engine.globalTrust - 30);
            
            // Hexes com menos food perdem pop
            engine.nodes.forEach(n => {
                if (!n.infected || (n.food || 0) > 0) return;
                let deathRate = 0.03;
                if (n.demographics.total < 500) deathRate = 0.005; // Cradle Shield
                const deaths = Math.floor(n.demographics.total * deathRate);
                n.demographics.kill(deaths);
            });
            
            engine.logEvent?.({ message: '🍞 Crise de fome extrema' }, 'disaster');
            return {
                message: `🍞 CRISE DE FOME GLOBAL: O deficit alimentar atingiu ${Math.floor(deficit * 100)}%! Guerras por comida eclodem. Trust -30.`,
                type: 'disaster', color: '#8b0000'
            };
        } else if (deficit > 0.3) {
            // FOME MODERADA — Migração forçada
            engine.pressures.social += 0.5;
            
            // Hexes famintos empurram pop para vizinhos
            engine.nodes.forEach(n => {
                if (!n.infected || (n.food || 0) > n.demographics.total) return;
                const migrants = Math.floor(n.demographics.total * 0.05);
                if (migrants < 10) return;
                
                const neighbors = n.neighbors || [];
                for (const nId of neighbors) {
                    const neighbor = engine.nodes.get(nId);
                    if (neighbor?.infected && (neighbor.food || 0) > neighbor.demographics.total) {
                        n.demographics.kill(Math.floor(migrants / neighbors.length));
                        neighbor.demographics.addBirths(Math.floor(migrants / neighbors.length));
                        break;
                    }
                }
            });
            
            engine.logEvent?.({ message: '🍞 Fome moderada: migração forçada' }, 'disaster');
            return {
                message: `🍞 FOME: Deficit alimentar de ${Math.floor(deficit * 100)}%. Populações migram em busca de comida.`,
                type: 'warning', color: '#d35400'
            };
        }
        return null;
    }
};
