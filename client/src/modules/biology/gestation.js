export default {
    id: 'gestation',
    type: 'biology',
    applyTick(node, globalRules, engine) {
        if (node.demographics.total === 0) return;

        const demo = node.demographics;
        
        // 1. O Motor DTM (Demographics.js) já cuida de Nascimentos, Mortes e Gestação!
        // Este plugin agora foca estritamente na mecânica de Solo e Capacidade Logística
        
        // O limite de capacidade real do bioma no dia de hoje
        let K = Math.floor(node.capacity * globalRules.global_K_boost * globalRules.globalKPenalty);
        const P = node.demographics.total;
        
        // --- DEGRADAÇÃO E RECUPERAÇÃO DO SOLO ---
        const deltaDays = globalRules.deltaDays || 1;
        
        if (P > K * 0.9) {
            node.soil -= 0.005 * deltaDays; // Perde solo se quase superlotado
            if (node.soil < 0) node.soil = 0;
        } else if (P < K * 0.5 && node.soil < 100) {
            node.soil += 0.001 * deltaDays; // Natureza se recupera se abandonado
            if (node.soil > 100) node.soil = 100;
        }

    }
};
