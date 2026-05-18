export default {
    id: 'imortalidade_celular',
    type: 'technology',
    root: 'biological',
    name: 'Imortalidade Celular',
    desc: 'A coorte de Idosos deixa de existir. Mortalidade natural cai a zero.',
    baseCost: 50000,
    requires: ['simbiose_fungica', 'hibernacao_criogenica'],
    modifiers: {
        global_r_boost: 10.0,
        global_K_boost: 5.0
    }
};
