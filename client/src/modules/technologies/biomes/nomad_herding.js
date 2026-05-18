/**
 * Biome Tech: Pastoreio Nômade
 * Bônus de movimento comercial e acesso a laticínios em áreas áridas e frias.
 */
export default {
    id: 'nomad_herding',
    type: 'technology',
    category: 'survival',
    name: 'Pastoreio Nômade',
    desc: 'Estilo de vida focado em rebanhos. +50% de produção de comida por animais.',
    baseCost: 400,
    era: 1,
    requires: [],
    modifiers: { K: 1.1, r: 1, deathMod: 1 },
    onUnlock(engine) {
        engine.nodes.forEach(n => {
            if (n.infected && n.livestock === 0 && Math.random() < 0.5) {
                n.livestock = 10; // Instancia alguns animais automaticamente
            }
        });
    }
};
