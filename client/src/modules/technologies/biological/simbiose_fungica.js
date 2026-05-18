export default {
    id: 'simbiose_fungica',
    type: 'technology',
    root: 'biological',
    name: 'Simbiose Fúngica',
    desc: 'Humanos sobrevivem em biomas destruídos e com radiação. Corta o dano de Eventos pela metade.',
    baseCost: 100000,
    requires: ["fotossintese_humana"],
    modifiers: {
        global_K_boost: 2.0
    }
};
