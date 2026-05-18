export default {
    id: 'spiritualist',
    type: 'faction',
    name: 'Espiritualistas',
    description: 'Buscam harmonia com o Cosmos. Bônus gigantesco em Filosofia e Espiritualidade. Reduzem o consumo.',
    affinities: {
        spiritual: 1.8,
        philosophical: 1.5,
        technological: 0.8
    },
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        
        // Desastres ou alta severidade planetária fazem as pessoas buscarem a religião/espiritualidade
        if (engine.severity > 30) {
            node.demographics.shiftDistribution('factions', 'spiritualist', 'tribal', 0.0005);
            // Também podem converter corporativistas em tempos de crise
            node.demographics.shiftDistribution('factions', 'spiritualist', 'corporatist', 0.0001);
        }
    }
};
