export default {
    id: 'transumanistas',
    type: 'faction',
    name: 'Transumanistas',
    description: 'Ignoram os limites físicos do planeta. Preparando o terreno para a Imortalidade Celular.',
    affinities: {
        biological: 1.8,
        technological: 1.5,
        social: 0.5
    },
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        if (engine.unlockedTechs.has('supercomputer')) {
            node.demographics.shiftDistribution('factions', 'transumanistas', 'corporatist', 0.001);
        }
    }
};
