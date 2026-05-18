/**
 * Biome Tech: Herborismo de Selva
 * Permite que populações resistam às altas pressões de doenças nas Florestas Tropicais.
 */
export default {
    id: 'jungle_herbalism',
    type: 'technology',
    category: 'survival',
    name: 'Herborismo de Selva',
    desc: 'Uso de plantas locais para combater doenças endêmicas. Evita morte na Floresta Tropical.',
    baseCost: 300,
    era: 1,
    requires: [],
    modifiers: { K: 1.2, r: 1, deathMod: 0.9 },
    onUnlock(engine) {
        engine.nodes.forEach(n => {
            if (n.infected && n.biome?.id === 'jungle') {
                n.diseaseVulnerability = Math.max(0.1, (n.diseaseVulnerability || 1.0) - 0.5);
            }
        });
    }
};
