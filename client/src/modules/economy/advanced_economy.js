import { Config } from '../../config/ConfigLoader.js';

/**
 * 021. Terras Raras — Hexágonos específicos contêm lítio/silício para chips.
 * 022. Custo Quadrático de Aquíferos — Água funda = mais caro.
 * 031. Oferta e Demanda — Preços mudam com escassez local.
 */
export default {
    id: 'advanced_economy',
    type: 'economy',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total < 50) return;
        if (engine.day % 30 !== 0) return; // Mensal
        
        const ecoCfg = Config.economy() || {};
        
        // ============================================
        // 021. Terras Raras — Silício só em certos hexes
        // ============================================
        if (!node.rareEarths && node.rareEarths !== 0) {
            // 20% dos hexes têm terras raras (gerado no init)
            node.rareEarths = (Math.random() < 0.2) ? Math.floor(1000 + Math.random() * 5000) : 0;
        }
        
        if (node.rareEarths > 0 && engine.currentEra.mult >= 200) {
            // Mineração de terras raras — requer Idade do Ferro+
            const extract = Math.min(10, node.rareEarths);
            node.rareEarths -= extract;
            engine.inventory.silicon = (engine.inventory.silicon || 0) + extract;
            
            // Consome energia para refinar
            engine.inventory.wood = Math.max(0, engine.inventory.wood - extract * 2);
        }
        
        // Fabricação de chips (silício → chips)
        if ((engine.inventory.silicon || 0) >= 100 && engine.unlockedTechs.has('metodo_cientifico')) {
            engine.inventory.silicon -= 100;
            engine.inventory.chips = (engine.inventory.chips || 0) + 1;
        }
        
        // Fabricação de computadores (chips → computadores)
        if ((engine.inventory.chips || 0) >= 10) {
            engine.inventory.chips -= 10;
            engine.inventory.computers = (engine.inventory.computers || 0) + 1;
        }
        
        // ============================================
        // 022. Custo Quadrático de Aquíferos
        // ============================================
        if (!node.aquiferDepth) node.aquiferDepth = 1.0;
        
        // Quanto mais água extraída, mais fundo o aquífero
        if (node.resources.water < 30000) {
            node.aquiferDepth = Math.min(5.0, node.aquiferDepth * 1.001);
        } else if (node.resources.water > 80000) {
            node.aquiferDepth = Math.max(1.0, node.aquiferDepth * 0.999);
        }
        
        // Custo quadrático: madeira necessária para bombear água funda
        const pumpCost = Math.floor(node.aquiferDepth * node.aquiferDepth * 0.5);
        if (pumpCost > 0 && node.demographics.total > 10000) {
            engine.inventory.wood = Math.max(0, engine.inventory.wood - pumpCost);
        }
        
        // ============================================
        // 031. Oferta e Demanda Dinâmica
        // ============================================
        // Escassez local aumenta "preço" (custo de extração)
        if (!engine.marketPrices) {
            engine.marketPrices = { wood: 1.0, minerals: 1.0, water: 1.0 };
        }
        
        // Atualiza preços mensalmente baseado em inventário global
        const woodSupply = engine.inventory.wood;
        const mineralSupply = engine.inventory.minerals;
        
        // Preço inversamente proporcional à oferta (lei da escassez)
        engine.marketPrices.wood = Math.max(0.1, Math.min(10.0, 1000 / Math.max(1, woodSupply)));
        engine.marketPrices.minerals = Math.max(0.1, Math.min(10.0, 5000 / Math.max(1, mineralSupply)));
        engine.marketPrices.water = Math.max(0.1, Math.min(10.0, 3000 / Math.max(1, engine.inventory.water || 1)));
    }
};
