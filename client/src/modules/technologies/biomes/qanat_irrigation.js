/**
 * Biome Tech: Irrigação Qanat
 * Permite que populações prosperem no Deserto e habilita a agricultura em áreas secas.
 */
export default {
    id: 'qanat_irrigation',
    type: 'technology',
    category: 'survival',
    name: 'Irrigação Qanat',
    desc: 'Canais subterrâneos para evitar evaporação. Evita morte e libera agricultura no Deserto.',
    baseCost: 500,
    era: 2,
    requires: ['agriculture'],
    modifiers: { K: 1.5, r: 1, deathMod: 1 },
    onUnlock(engine) {
        engine.nodes.forEach(n => {
            if (n.infected && n.biome?.id === 'desert') {
                n.soil = Math.min(100, (n.soil || 0) + 20); // Melhora o solo
            }
        });
    }
};
