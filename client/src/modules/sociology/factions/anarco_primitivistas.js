export default {
    id: 'anarco_primitivistas',
    type: 'faction',
    name: 'Anarco-Primitivistas',
    description: 'Rejeitam a modernidade. Sobrevivem excepcionalmente bem em biomas devastados.',
    affinities: {
        social: 0.2,
        technological: 0.1,
        philosophical: 1.5
    },
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        if (engine.severity > 80) {
            node.demographics.shiftDistribution('factions', 'anarco_primitivistas', 'tribal', 0.005);
        }
    }
};
