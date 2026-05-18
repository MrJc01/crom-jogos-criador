export default {
    id: 'corporatist',
    type: 'faction',
    name: 'Corporativistas',
    description: 'Foco implacável em manufatura e tecnologia. Aceleram a pesquisa nestas raízes, mas poluem mais.',
    affinities: {
        technological: 1.5,
        physical: 1.2,
        spiritual: 0.5
    },
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        
        // As pessoas abandonam a mentalidade tribal se existirem tecnologias avançadas
        if (engine.unlockedTechs.has('industry_basic')) {
            node.demographics.shiftDistribution('factions', 'corporatist', 'tribal', 0.0005);
        }
    }
};
