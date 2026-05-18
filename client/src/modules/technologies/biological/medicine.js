export default {
    id: 'medicine',
    type: 'technology',
    root: 'biological',
    name: 'Medicina Básica',
    desc: 'Ervas rudimentares e curativos. Aumenta a Taxa de Reprodução Global em +50%.',
    baseCost: 50,
    requires: [],
    knowledgeBonus: { botany: 0.5 }, // Botânica diminui custo em até 50%
    modifiers: {
        global_r_boost: 1.5
    }
};
