/**
 * N04. CropRotation — Rotação de culturas. Monocultura degrada solo.
 * 
 * Hex que planta o mesmo crop 3+ anos perde 10% yield/ano.
 * Rotação entre 2+ crops recupera solo ×2.
 * Requer tech: agriculture.
 */
export default {
    id: 'crop_rotation',
    type: 'economy',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || !node.crops || node.crops.length === 0) return;
        if (engine.day !== 1 || engine.year % 1 !== 0) return; // Anual
        
        if (!node.cropHistory) node.cropHistory = [];
        
        // Registra crop principal do ano
        const mainCrop = node.crops[0];
        node.cropHistory.push(mainCrop);
        if (node.cropHistory.length > 10) node.cropHistory.shift();
        
        // ========================================
        // PENALIDADE DE MONOCULTURA
        // ========================================
        const last3 = node.cropHistory.slice(-3);
        const isMonoculture = last3.length >= 3 && last3.every(c => c === last3[0]);
        
        if (isMonoculture) {
            // Degrada solo 10%/ano
            node.soil = Math.max(0, (node.soil || 50) * 0.90);
            node.monoculturePenalty = (node.monoculturePenalty || 0) + 0.10;
            node.monoculturePenalty = Math.min(0.50, node.monoculturePenalty); // Cap 50%
        } else if (node.crops.length >= 2) {
            // Rotação ativa: recupera solo ×2
            const maxSoil = 100;
            const gap = maxSoil - (node.soil || 50);
            node.soil = Math.min(maxSoil, (node.soil || 50) + gap * 0.002); // 2× recovery normal
            node.monoculturePenalty = Math.max(0, (node.monoculturePenalty || 0) - 0.05);
        }
        
        // ========================================
        // AUTO-ROTAÇÃO (Zero-Player)
        // ========================================
        if (isMonoculture && node.monoculturePenalty > 0.20) {
            // AI decide rodar crops
            const allCrops = { plains: ['wheat', 'potato', 'corn'], jungle: ['rice', 'corn', 'berries'], tundra: ['potato', 'berries'], desert: ['dates'] };
            const available = allCrops[node.biome?.id || 'plains'] || ['wheat'];
            const newCrop = available.find(c => c !== mainCrop);
            if (newCrop) {
                node.crops = [newCrop, mainCrop];
                if (engine.onEvent && node.monoculturePenalty > 0.30) {
                    engine.onEvent({
                        message: `🌱 ROTAÇÃO: ${node.name} começou rotação de culturas (${mainCrop} → ${newCrop}). Solo se recuperando.`,
                        nodeId: node.id, type: 'milestone', color: '#27ae60'
                    }, 'milestone');
                }
            }
        }
    }
};
