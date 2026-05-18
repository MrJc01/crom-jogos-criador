export default {
    id: 'expansionistas_militares',
    type: 'faction',
    name: 'Expansionistas Militares',
    description: 'Foco no controle de território. Aumentam massivamente a taxa de migração e ignoram fronteiras hostis.',
    affinities: {
        social: 1.5,
        physical: 1.3,
        philosophical: 0.5
    },
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        
        // Convertem população se o limite de capacidade estiver alto (precisam de espaço)
        if (node.demographics.total > node.capacity * 0.8) {
            node.demographics.shiftDistribution('factions', 'expansionistas_militares', 'tribal', 0.001);
        }
        
        // Modificador: Aumenta a agressividade de migração (simulado via bônus local)
        // Como a migração ocorre no core, a facção pode dar um bônus num campo customizado
        node.migrationAggression = (node.migrationAggression || 1.0) * 1.01;
    }
};
