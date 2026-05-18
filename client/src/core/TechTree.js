export class TechTree {
    constructor() {
        this.technologies = new Map(); // id -> Módulo da Tecnologia
        this.unlocked = new Set();
    }
    
    register(techModule) {
        this.technologies.set(techModule.id, techModule);
    }
    
    getAvailable() {
        const available = [];
        this.technologies.forEach(tech => {
            if (this.unlocked.has(tech.id)) return;
            
            let canUnlock = true;
            if (tech.requires) {
                for (const req of tech.requires) {
                    if (!this.unlocked.has(req)) canUnlock = false;
                }
            }
            if (canUnlock) available.push(tech);
        });
        return available;
    }
    
    getModifiedCost(tech, engine) {
        let affinitySum = 0;
        let totalFactionsWeighted = 0;
        
        const factions = engine.plugins.filter(p => p.type === 'faction');
        
        if (factions.length > 0 && engine.globalPop > 0) {
            engine.nodes.forEach(node => {
                if (!node.infected) return;
                
                factions.forEach(f => {
                    const frac = node.demographics.dist.factions[f.id] || 0;
                    if (frac > 0) {
                        const aff = f.affinities[tech.root] || 1.0;
                        affinitySum += frac * aff * node.demographics.total;
                        totalFactionsWeighted += frac * node.demographics.total;
                    }
                });
                
                // Os 'tribal' (base) têm afinidade 1.0 para tudo
                const tribalFrac = node.demographics.dist.factions['tribal'] || 0;
                if (tribalFrac > 0) {
                    affinitySum += tribalFrac * 1.0 * node.demographics.total;
                    totalFactionsWeighted += tribalFrac * node.demographics.total;
                }
            });
        }
        
        let avgAffinity = totalFactionsWeighted > 0 ? (affinitySum / totalFactionsWeighted) : 1.0;
        if (avgAffinity === 0) avgAffinity = 1.0;
        
        let cost = tech.baseCost / avgAffinity;
        
        // Aplica desconto da Rede Neural (Conhecimento Passivo)
        if (tech.knowledgeBonus && engine.knowledge) {
            for (const [kId, discountMax] of Object.entries(tech.knowledgeBonus)) {
                const mastery = engine.knowledge.getMastery(kId); // 0.0 a 1.0
                // Exemplo: discountMax de 0.5 significa que 100% de maestria reduz o custo pela metade
                cost = cost * (1 - (mastery * discountMax));
            }
        }
        
        return Math.max(1, Math.floor(cost));
    }
    
    buy(techId, engine) {
        const tech = this.technologies.get(techId);
        if (!tech) return false;
        
        const cost = this.getModifiedCost(tech, engine);
        if (engine.adaptationPoints >= cost) {
            engine.adaptationPoints -= cost;
            this.unlocked.add(techId);
            if (tech.onUnlock) tech.onUnlock(engine);
            return true;
        }
        return false;
    }
    
    processAutonomousEvolution(engine) {
        // Rola 5% de chance de analisar por dia (para não pesar a CPU com cálculos desnecessários diários)
        if (Math.random() > 0.05) return;
        
        const available = this.getAvailable();
        if (available.length === 0) return;
        
        const candidates = [];
        let totalWeight = 0;
        
        for (const tech of available) {
            const cost = this.getModifiedCost(tech, engine);
            if (engine.adaptationPoints >= cost) {
                // Peso base estocástico (inverso do custo)
                let weight = (1000 / cost);
                
                // Contexto (LLM-like approach)
                if (engine.severity > 50 && tech.root === 'biology') weight *= 3.0; // Urgência médica
                if ((engine.inventory.wood > 50000 || engine.inventory.minerals > 50000) && tech.root === 'industry') weight *= 2.0; // Pressão industrial
                
                // Variável de Caos (0.1 a 2.0)
                const chaos = 0.1 + (Math.random() * 1.9);
                weight *= chaos;
                
                candidates.push({ tech, cost, weight });
                totalWeight += weight;
            }
        }
        
        if (candidates.length === 0) return;
        
        // Rola o dado probabilístico
        let roll = Math.random() * totalWeight;
        let selected = null;
        for (const cand of candidates) {
            roll -= cand.weight;
            if (roll <= 0) {
                selected = cand;
                break;
            }
        }
        
        if (selected) {
            this.buy(selected.tech.id, engine);
            if (engine.onEvent) {
                engine.onEvent(selected.tech.name, "tech_auto");
            }
        }
    }
}
