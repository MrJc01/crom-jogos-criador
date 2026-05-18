export default {
    id: 'sindicatos_operarios',
    type: 'faction',
    name: 'Sindicatos Operários',
    description: 'Foco na coletivização da força de trabalho. Reduzem o tempo de crafting no complexo industrial.',
    affinities: {
        physical: 1.5,
        social: 1.5,
        technological: 1.0
    },
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        if (engine.unlockedTechs.has('industry_basic')) {
            node.demographics.shiftDistribution('factions', 'sindicatos_operarios', 'corporatist', 0.002);
        }
    }
};
