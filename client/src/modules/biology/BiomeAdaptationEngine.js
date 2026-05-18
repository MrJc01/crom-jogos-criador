/**
 * BiomeAdaptationEngine — Simula o "Choque de Bioma" e adaptação genética/cultural.
 * 
 * Humanos nascem não-adaptados a biomas extremos. Morar neles sem a tecnologia certa
 * causa mortalidade até que a população se adapte (gerações/cultura).
 * 
 * Inspirado na Regra de Bergmann, tolerância à malária e aclimatação.
 */
export default {
    id: 'biome_adaptation_engine',
    type: 'biology',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        
        const deltaDays = globalRules.deltaDays || 1;
        
        // Inicializa estado de adaptação
        if (!node.biomeAdaptation) {
            node.biomeAdaptation = {
                desert: 0,
                tundra: 0,
                plains: 100, // Berço da humanidade
                jungle: 50
            };
        }
        
        const biomeId = node.biome?.id || 'plains';
        const currentAdaptation = node.biomeAdaptation[biomeId] || 0;
        
        // Regras do bioma atual
        const biomeConfig = engine.config?.biomes?.[biomeId.toUpperCase()] || { difficulty: 0.2, diseasePressure: 0.5 };
        const reqTech = biomeConfig.adaptationReq;
        
        const hasTech = reqTech ? engine.unlockedTechs?.has(reqTech) : true;
        
        // ==========================================
        // 1. Ganho de Adaptação (Lento sem tech)
        // ==========================================
        let adaptationRate = (1 / 365) * deltaDays; // 1% por ano
        if (hasTech) adaptationRate *= 5; // Tech acelera muito a aclimatação
        
        if (currentAdaptation < 100) {
            node.biomeAdaptation[biomeId] = Math.min(100, currentAdaptation + adaptationRate);
        }
        
        // Perdendo adaptação para outros biomas lentamente
        for (const [key, val] of Object.entries(node.biomeAdaptation)) {
            if (key !== biomeId && val > 0) {
                node.biomeAdaptation[key] = Math.max(0, val - (0.1 / 365) * deltaDays);
            }
        }
        
        // ==========================================
        // 2. Choque de Bioma (Mortalidade)
        // ==========================================
        // Se a adaptação for baixa e o bioma for difícil, há mortes.
        if (currentAdaptation < 80) {
            const shockSeverity = (100 - currentAdaptation) / 100; // 0.0 a 1.0
            
            // Dificuldade e pressão de doenças multiplicam o choque
            const mortalityRate = (biomeConfig.diseasePressure || 1.0) * (biomeConfig.difficulty || 1.0) * 0.05; // Base 5% ao ano max
            
            // Só mata se não tiver tech, ou mesmo com tech se a adaptação for MUITO baixa
            if (!hasTech || currentAdaptation < 30) {
                const dailyMortality = (mortalityRate / 365) * shockSeverity * deltaDays;
                
                // Cap mortality at 50% per tick
                const deaths = Math.min(Math.floor(node.demographics.total * 0.5), Math.floor(node.demographics.total * dailyMortality));
                
                if (deaths > 0) {
                    node.demographics.kill(deaths);
                    
                    // Alerta apenas quando é expressivo
                    if (deaths > 100 && Math.random() < 0.05 && engine.onEvent) {
                        engine.onEvent({
                            message: `🦠 CHOQUE DE BIOMA: Habitantes de ${node.name} estão sofrendo gravemente para se adaptar ao bioma ${biomeConfig.name}.`,
                            nodeId: node.id, type: 'disaster', color: '#8e44ad'
                        }, 'disaster');
                    }
                }
            }
        }
    }
};
