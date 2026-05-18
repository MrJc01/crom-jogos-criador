export default {
    id: 'culto_do_apocalipse',
    type: 'faction',
    name: 'Culto do Apocalipse',
    description: 'Adoradores do caos. Aderem quando a severidade do planeta dispara. Reduzem a produção artificial.',
    affinities: {
        spiritual: 1.8,
        technological: 0.1, // Odeiam tecnologia
        physical: 0.5
    },
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        
        // Crescem agressivamente quando o mundo está acabando
        if (engine.severity > 70) {
            node.demographics.shiftDistribution('factions', 'culto_do_apocalipse', 'tribal', 0.005);
            node.demographics.shiftDistribution('factions', 'culto_do_apocalipse', 'corporatist', 0.002);
        }
    }
};
