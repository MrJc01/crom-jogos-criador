/**
 * Biome Tech: Pesca no Gelo
 * Permite que populações prosperem na Tundra, eliminando a mortalidade massiva por choque de bioma.
 */
export default {
    id: 'ice_fishing',
    type: 'technology',
    category: 'survival',
    name: 'Pesca no Gelo',
    desc: 'Técnicas de sobrevivência no frio extremo. Evita morte na Tundra.',
    baseCost: 200,
    era: 1,
    requires: [],
    modifiers: { K: 1.2, r: 1, deathMod: 1 },
    onUnlock(engine) {
        // Boost instantâneo de comida em hexes de tundra
        engine.nodes.forEach(n => {
            if (n.infected && n.biome?.id === 'tundra') {
                n.food = (n.food || 0) + 1000;
            }
        });
    }
};
