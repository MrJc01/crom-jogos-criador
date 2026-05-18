export default {
    id: 'animism',
    type: 'sociology',
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        
        // A proporção de animistas no país
        const animistPop = node.demographics.total * (node.demographics.dist.religion.animism || 0);
        
        if (animistPop > 0) {
            // Exemplo de regra sociológica:
            // Animistas aprendem a conviver com a Floresta (Jungle), aumentando lentamente
            // a capacidade (K) do país até um limite, sem precisar de tecnologia.
            if (node.biome.id === 'jungle' && node.capacity < node.biome.capacityBase * 1.5) {
                // Aumenta 1 vaga de capacidade para cada 100 mil animistas por dia
                const natureHarmony = Math.floor(animistPop / 100000);
                if (natureHarmony > 0) {
                    node.capacity += natureHarmony;
                }
            }
        }
    }
};
