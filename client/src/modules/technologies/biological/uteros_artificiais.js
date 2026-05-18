export default {
    id: 'uteros_artificiais',
    type: 'technology',
    root: 'biological',
    name: 'Úteros Artificiais',
    desc: 'Remove o peso da reprodução natural. Crescimento explosivo ignorando limites de gênero.',
    baseCost: 5000,
    requires: ['clonagem_orgaos'],
    modifiers: {
        global_r_boost: 5.0
    }
};
