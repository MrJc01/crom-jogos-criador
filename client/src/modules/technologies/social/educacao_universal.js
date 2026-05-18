export default {
    id: 'educacao_universal',
    type: 'technology',
    root: 'social',
    name: 'Educação Universal',
    desc: 'Todo cidadão tem direito à educação básica. Literacy cap → 90%.',
    baseCost: 15000,
    era: 5,
    requires: ['imprensa'],
    modifiers: { K: 1, r: 1, deathMod: 1 },
    onUnlock(engine) { engine.literacy = Math.min(90, (engine.literacy || 5) + 20); }
};