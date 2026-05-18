/**
 * N01. LivestockEngine — Pecuária autônoma com domesticação emergente.
 * 
 * Animais: gado, ovelhas, galinhas, cavalos, porcos.
 * Domesticação emerge quando pop > 500 e tem agricultura.
 * Animais consomem food mas geram proteína ×2.5.
 * Rebanhos crescem e podem morrer de doença.
 */
export default {
    id: 'livestock_engine',
    type: 'economy',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        if (engine.day % 7 !== 0) return; // Semanal
        
        if (!node.herds) node.herds = {};
        const pop = node.demographics.total;
        const biome = node.biome?.id || 'plains';
        
        // Animais disponíveis por bioma
        const biomeAnimals = {
            plains: ['cattle', 'sheep', 'chicken', 'horse', 'pig'],
            jungle: ['chicken', 'pig'],
            tundra: ['sheep', 'horse'],
            desert: ['sheep', 'chicken']
        };
        
        const animalStats = {
            cattle:  { foodCost: 3.0, foodYield: 8.0, maxPer1k: 20, growthRate: 0.002, diseaseRate: 0.001 },
            sheep:   { foodCost: 1.5, foodYield: 4.0, maxPer1k: 40, growthRate: 0.003, diseaseRate: 0.001 },
            chicken: { foodCost: 0.5, foodYield: 2.5, maxPer1k: 100, growthRate: 0.005, diseaseRate: 0.002 },
            horse:   { foodCost: 4.0, foodYield: 1.0, maxPer1k: 5,  growthRate: 0.001, diseaseRate: 0.0005, militaryBonus: 0.15 },
            pig:     { foodCost: 2.0, foodYield: 6.0, maxPer1k: 30, growthRate: 0.004, diseaseRate: 0.003 }
        };
        
        const available = biomeAnimals[biome] || ['chicken'];
        
        // ========================================
        // DOMESTICAÇÃO EMERGENTE
        // ========================================
        if (pop > 500 && engine.unlockedTechs?.has('agriculture')) {
            for (const animal of available) {
                if (node.herds[animal]) continue;
                // 0.1% chance semanal de domesticar
                if (Math.random() < 0.001) {
                    node.herds[animal] = 2; // Começa com 2 animais
                    if (engine.onEvent) {
                        const names = { cattle: 'gado', sheep: 'ovelhas', chicken: 'galinhas', horse: 'cavalos', pig: 'porcos' };
                        engine.onEvent({
                            message: `🐄 DOMESTICAÇÃO: ${node.name} domesticou ${names[animal]}!`,
                            nodeId: node.id, type: 'milestone', color: '#8b4513'
                        }, 'milestone');
                    }
                    break; // Uma domesticação por vez
                }
            }
        }
        
        // ========================================
        // CICLO DE VIDA DO REBANHO
        // ========================================
        let totalFoodProduced = 0;
        let totalFoodConsumed = 0;
        
        for (const [animal, count] of Object.entries(node.herds)) {
            if (count <= 0) continue;
            const stats = animalStats[animal];
            if (!stats) continue;
            
            const maxHerd = Math.floor(pop / 1000 * stats.maxPer1k);
            
            // Produção de food
            const weeklyYield = Math.floor(count * stats.foodYield / 52);
            totalFoodProduced += weeklyYield;
            
            // Consumo de food pelo rebanho
            const weeklyCost = Math.floor(count * stats.foodCost / 52);
            totalFoodConsumed += weeklyCost;
            
            // Crescimento natural
            if (count < maxHerd && (node.food || 0) > pop) {
                if (Math.random() < stats.growthRate) {
                    node.herds[animal] = Math.min(maxHerd, count + Math.max(1, Math.floor(count * 0.05)));
                }
            }
            
            // Doenças do rebanho
            if (Math.random() < stats.diseaseRate) {
                const lost = Math.max(1, Math.floor(count * 0.1));
                node.herds[animal] = Math.max(0, count - lost);
            }
            
            // Fome do rebanho (sem food = animais morrem)
            if ((node.food || 0) <= 0) {
                node.herds[animal] = Math.max(0, Math.floor(count * 0.9)); // Perde 10%/semana
            }
            
            // Bonus militar de cavalos
            if (animal === 'horse' && stats.militaryBonus && count > 5) {
                node.cavalryBonus = Math.min(1.0, count * 0.01);
            }
        }
        
        // Aplica food
        if (node.food !== undefined) {
            node.food += (totalFoodProduced - totalFoodConsumed);
        }
        
        // Morale bonus por variedade de carne
        const herdTypes = Object.values(node.herds).filter(c => c > 0).length;
        if (!node.moraleFactors) node.moraleFactors = {};
        node.moraleFactors.livestock = herdTypes * 2; // +2 morale por tipo
    }
};
