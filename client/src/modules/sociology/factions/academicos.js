export default {
    id: 'academicos',
    type: 'faction',
    name: 'Acadêmicos e Cientistas',
    description: 'Foco absoluto no avanço intelectual. Barateiam drasticamente todas as tecnologias, mas exigem alta infraestrutura.',
    affinities: {
        biological: 1.5,
        physical: 1.5,
        social: 1.5,
        technological: 1.5,
        philosophical: 1.5,
        spiritual: 0.8
    },
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        
        // Crescem apenas se houver tecnologias filosóficas ou sociais pesquisadas
        if (engine.unlockedTechs.has('metodo_cientifico') || engine.unlockedTechs.has('educacao_universal')) {
            node.demographics.shiftDistribution('factions', 'academicos', 'tribal', 0.002);
            node.demographics.shiftDistribution('factions', 'academicos', 'corporatist', 0.0005);
        }
    }
};
