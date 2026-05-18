// DEPRECATED: Redirecionado para space_dyson no TechTreeConfig.json
// Este arquivo mantém retrocompat com plugins que possam referenciá-lo.
export default {
    id: 'esfera_de_dyson',
    type: 'technology',
    root: 'physical',
    name: 'Esfera de Dyson (Legacy)',
    desc: 'Redirecionado para space_dyson. Este ID não deve ser usado.',
    baseCost: 500000,
    requires: ['elevador_espacial', 'fusao_nuclear'],
    modifiers: { global_K_boost: 5.0, severity_flat_increase: 15 }
};