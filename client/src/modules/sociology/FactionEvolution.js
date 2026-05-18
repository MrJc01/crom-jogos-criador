import { FactionsData } from '../../core/FactionsData.js';

export default {
    id: 'sociology_faction_evolution',
    name: 'Evolução e Dinâmica de Facções',
    type: 'sociology',
    
    // Função chamada a cada 'tick' (dia) em todas as regiões infectadas
    applyTick(node, globalRules, engine) {
        // A evolução sociológica opera em macro-escala, checando as condições apenas uma vez por ano (no último dia)
        if (engine.day !== 365) return;
        
        const capacityRatio = node.demographics.total / node.capacity;
        
        // --- 1. MECÂNICA DE CISMA (DIVISÃO / SPLIT) ---
        // Se a região está superlotada (>90%) e a severidade global está alta (>50%), 
        // a tensão social causa uma fratura na facção dominante.
        if (capacityRatio > 0.90 && engine.severity > 50) {
            // Encontra a facção dominante
            let dominantFaction = null;
            let maxPct = 0;
            
            for (const [fac, pct] of Object.entries(node.demographics.dist.factions)) {
                if (pct > maxPct) {
                    maxPct = pct;
                    dominantFaction = fac;
                }
            }
            
            // Só divide se a facção dominante tiver mais de 60% da população local
            if (dominantFaction && maxPct > 0.6) {
                // Cria o ID da facção rebelde/dissidente
                const rebelId = dominantFaction + "_dissidentes";
                
                // 20% da facção dominante quebra e se torna dissidente
                node.demographics.splitFaction(dominantFaction, rebelId, 0.2);
                
                // Dispara um evento global de Cisma
                if (engine.onEvent) {
                    engine.onEvent({ 
                        message: `Cisma Social! A tensão em ${node.name} gerou a facção ${FactionsData.getFaction(rebelId).name}.` 
                    }, "faction_split");
                }
            }
        }
        
        // --- 2. MECÂNICA DE HIBRIDIZAÇÃO (MISTURA) ---
        // Se duas facções convivem pacificamente com boa representatividade (>20% cada) e a Severidade está baixa (<30%)
        // ou a Confiança Global está alta, elas podem hibridizar.
        const factionsPresent = Object.keys(node.demographics.dist.factions);
        if (factionsPresent.length >= 2 && engine.severity < 30) {
            // Pega as duas maiores
            factionsPresent.sort((a, b) => node.demographics.dist.factions[b] - node.demographics.dist.factions[a]);
            const facA = factionsPresent[0];
            const facB = factionsPresent[1];
            
            if (node.demographics.dist.factions[facA] > 0.2 && node.demographics.dist.factions[facB] > 0.2) {
                // Chance anual de 5% de ocorrer uma fusão cultural local
                if (Math.random() < 0.05) {
                    const hybridId = FactionsData.generateHybridFactionId(facA, facB);
                    
                    // Se o híbrido gerado já não for o pai (fallback)
                    if (hybridId !== facA && hybridId !== facB) {
                        // Assimila 10% de cada pai para a nova facção híbrida
                        node.demographics.splitFaction(facA, hybridId, 0.1);
                        node.demographics.splitFaction(facB, hybridId, 0.1);
                        
                        if (engine.onEvent) {
                            engine.onEvent({ 
                                message: `Fusão Cultural em ${node.name}! O encontro de filosofias gerou os ${FactionsData.getFaction(hybridId).name}.` 
                            }, "faction_hybrid");
                        }
                    }
                }
            }
        }
    }
};
