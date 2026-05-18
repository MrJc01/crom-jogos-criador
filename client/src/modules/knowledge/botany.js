export default {
    id: 'botany',
    type: 'knowledge',
    name: 'Botânica Avançada',
    description: 'Compreensão profunda das plantas. Barateia Medicina e Agricultura.',
    calculateDailyXP(engine) {
        let xp = 0;
        engine.nodes.forEach(node => {
            if (!node.infected || node.demographics.total === 0) return;
            
            // Aprende muito rápido se mora na floresta
            if (node.biome.id === 'jungle') {
                xp += (node.demographics.total * 0.00000001); 
            }
            // Facções espirituais e anarco-primitivistas estudam mais a natureza
            const spiritFrac = node.demographics.dist.factions['spiritualist'] || 0;
            const anarcoFrac = node.demographics.dist.factions['anarco_primitivistas'] || 0;
            
            xp += ((spiritFrac + anarcoFrac) * node.demographics.total * 0.00000002);
        });
        return xp;
    },
    onMastery(engine) {
        if (engine.onEvent) {
            engine.onEvent("A civilização atingiu 100% de maestria em Botânica!", "global");
        }
    }
};
