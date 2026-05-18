export default {
    id: 'fotossintese_humana',
    type: 'technology',
    root: 'biological',
    name: 'Fotossíntese Humana',
    desc: 'Humanos passam a consumir luz. Aumenta K imensamente em biomas ensolarados.',
    baseCost: 10000,
    requires: ['edicao_genetica_crispr'],
    modifiers: {
        global_K_boost: 3.0
    }
};
