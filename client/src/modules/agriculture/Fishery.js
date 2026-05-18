/**
 * N05. Fishery — Pesca costeira e de alto-mar.
 * 
 * Hexes costeiros (<6 vizinhos) ganham food bonus.
 * Sobrepesca depleta estoque (recovery 5 anos).
 * Baleação na Era Industrial: high yield mas extinção.
 */
export default {
    id: 'fishery_engine',
    type: 'economy',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        if (engine.day % 7 !== 0) return; // Semanal
        
        // Apenas hexes costeiros (menos de 6 vizinhos)
        const isCoastal = (node.neighbors?.length || 0) < 6 && (node.neighbors?.length || 0) > 0;
        if (!isCoastal) return;
        
        if (node.fishStock === undefined) node.fishStock = 100; // 0-100
        if (node.food === undefined) node.food = 0;
        
        const pop = node.demographics.total;
        const fishers = Math.min(Math.floor(pop * 0.1), 200); // Max 10% da pop ou 200
        
        // ========================================
        // PESCA
        // ========================================
        if (node.fishStock > 10) {
            const catchRate = fishers * 0.5 * (node.fishStock / 100);
            const weeklyFish = Math.floor(catchRate);
            node.food += weeklyFish;
            
            // Depleta estoque
            const depletionRate = fishers * 0.001;
            node.fishStock = Math.max(0, node.fishStock - depletionRate);
            
            // Baleação industrial (alta yield mas destrutiva)
            if ((engine.unlockedTechs?.size || 0) >= 15 && node.fishStock > 30) {
                const whaleBonus = Math.floor(fishers * 2);
                node.food += whaleBonus;
                node.fishStock -= 0.05; // Depleção acelerada
            }
        }
        
        // ========================================
        // REGENERAÇÃO NATURAL
        // ========================================
        // Peixes se reproduzem se stock > 20
        if (node.fishStock > 20 && node.fishStock < 100) {
            const regenRate = (node.fishStock / 100) * 0.02; // Logistic growth
            node.fishStock = Math.min(100, node.fishStock + regenRate);
        }
        
        // Recovery muito lenta se quase extinto
        if (node.fishStock <= 20 && node.fishStock > 0) {
            node.fishStock += 0.001; // ~5 anos para voltar a 20
        }
        
        // ========================================
        // COLAPSO DA PESCA
        // ========================================
        if (node.fishStock <= 5 && !node._fishCollapseWarned) {
            node._fishCollapseWarned = true;
            if (engine.onEvent) {
                engine.onEvent({
                    message: `🐟 COLAPSO PESQUEIRO: ${node.name} esgotou seus cardumes! Pesca praticamente impossível por anos.`,
                    nodeId: node.id, type: 'warning', color: '#2980b9'
                }, 'warning');
            }
        }
        if (node.fishStock > 30) node._fishCollapseWarned = false;
    }
};
