import { FactionsData } from './FactionsData.js';

export class Economy {
    constructor() {
        this.recipes = new Map();
        this.activeCrafts = [];
        this.trustWallet = {}; // Saldo global de Confiança (Moeda Inter-Facções)
    }
    
    register(recipeModule) {
        this.recipes.set(recipeModule.id, recipeModule);
    }

    getTrust(factionId) {
        return this.trustWallet[factionId] || 0;
    }
    
    addTrust(factionId, amount) {
        if (!this.trustWallet[factionId]) this.trustWallet[factionId] = 0;
        this.trustWallet[factionId] += amount;
    }
    
    spendTrust(factionId, amount) {
        if (this.getTrust(factionId) >= amount) {
            this.trustWallet[factionId] -= amount;
            return true;
        }
        return false;
    }
    
    startCraft(recipeId, engine) {
        const recipe = this.recipes.get(recipeId);
        if (!recipe) return false;
        
        // Verifica requisitos de tecnologia
        if (recipe.requirements) {
            for (const req of recipe.requirements) {
                if (!engine.unlockedTechs.has(req)) return false;
            }
        }
        
        // Verifica inputs
        for (const [res, amount] of Object.entries(recipe.inputs)) {
            if (res === 'adaptationPoints') {
                if (engine.adaptationPoints < amount) return false;
            } else {
                if ((engine.inventory[res] || 0) < amount) return false;
            }
        }
        
        // Consome inputs
        for (const [res, amount] of Object.entries(recipe.inputs)) {
            if (res === 'adaptationPoints') engine.adaptationPoints -= amount;
            else engine.inventory[res] -= amount;
        }
        
        this.activeCrafts.push({
            recipeId,
            ticksRemaining: recipe.craftTimeTicks
        });
        
        return true;
    }
    
    processTick(engine) {
        for (let i = this.activeCrafts.length - 1; i >= 0; i--) {
            const craft = this.activeCrafts[i];
            craft.ticksRemaining--;
            
            if (craft.ticksRemaining <= 0) {
                const recipe = this.recipes.get(craft.recipeId);
                for (const [res, amount] of Object.entries(recipe.outputs)) {
                    engine.inventory[res] = (engine.inventory[res] || 0) + amount;
                }
                if (recipe.onComplete) recipe.onComplete(engine);
                this.activeCrafts.splice(i, 1);
            }
        }

        // --- Geração Passiva de Confiança Anual (Yield) ---
        if (engine.day === 365) {
            const factionPops = {};
            engine.nodes.forEach(node => {
                if (!node.infected) return;
                for (const [fac, pct] of Object.entries(node.demographics.dist.factions)) {
                    factionPops[fac] = (factionPops[fac] || 0) + (pct * node.demographics.total);
                }
            });
            
            for (const [fac, pop] of Object.entries(factionPops)) {
                if (pop < 10) continue; 
                
                const data = FactionsData.getFaction(fac);
                let trustYield = 1.0; // Ganho base
                
                // Modificadores de Alinhamento
                if (data.traits.includes("spiritual")) trustYield += 3.0;
                if (data.traits.includes("pacifist")) trustYield += 2.0;
                if (data.traits.includes("ecological")) trustYield += 1.0;
                if (data.traits.includes("militarist")) trustYield -= 1.5;
                if (data.traits.includes("expansionist")) trustYield -= 0.5;
                
                // A severidade global corrói a geração de confiança (desespero global)
                if (engine.severity > 50) trustYield -= (engine.severity - 50) * 0.05;

                // Gera baseado no tamanho da população vs rendimento (mínimo de 1)
                const generated = Math.floor((pop / 10000) * trustYield) + Math.max(0, Math.floor(trustYield));
                
                if (generated > 0) {
                    this.addTrust(fac, generated);
                } else if (generated < 0) {
                    // Queima de confiança por má conduta
                    this.trustWallet[fac] = Math.max(0, this.getTrust(fac) + generated);
                }
            }
        }
    }
}
