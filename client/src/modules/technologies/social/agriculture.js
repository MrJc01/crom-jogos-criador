export default {
    id: 'agriculture',
    type: 'technology',
    root: 'social', // Organização social para plantar
    name: 'Agricultura Sedentária',
    desc: 'Muda a tribo de nômade para assentada. Aumenta a Capacidade de todos os Biomas em +50%.',
    baseCost: 50,
    requires: [],
    modifiers: {
        global_K_boost: 1.5
    }
};
