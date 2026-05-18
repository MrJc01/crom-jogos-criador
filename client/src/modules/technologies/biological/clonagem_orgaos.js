export default {
    id: 'clonagem_orgaos',
    type: 'technology',
    root: 'biological',
    name: 'Clonagem de Órgãos',
    desc: 'Reduz severamente as mortes na coorte de Adultos. Aumenta o teto global.',
    baseCost: 2000,
    requires: ['edicao_genetica_crispr'],
    modifiers: {
        global_r_boost: 1.5,
        global_K_boost: 1.2
    }
};
