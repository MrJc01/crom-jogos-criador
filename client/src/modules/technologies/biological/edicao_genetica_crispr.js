export default {
    id: 'edicao_genetica_crispr',
    type: 'technology',
    root: 'biological',
    name: 'Edição Genética CRISPR',
    desc: 'Permite selecionar as características do feto. Zera as falhas na fila de gestação.',
    baseCost: 1000,
    requires: ['antibioticos'],
    modifiers: {
        global_r_boost: 2.0
    }
};
