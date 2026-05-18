export default {
    id: 'antibioticos',
    type: 'technology',
    root: 'biological',
    name: 'Antibióticos',
    desc: 'Bactérias sintéticas que curam doenças agressivas. Aumenta a taxa de natalidade efetiva.',
    baseCost: 350,
    requires: ['saneamento_basico'],
    modifiers: {
        global_r_boost: 1.4
    }
};
