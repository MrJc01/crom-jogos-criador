export default {
    id: 'events_nature_exogenous',
    name: 'Natureza Exógena (Nature Engine)',
    type: 'event',
    
    triggerProbability(engine) {
        // Natureza usa pressão climática, tectônica, ou sorte aleatória
        const pressure = Math.max(engine.pressures.climatic || 0, engine.pressures.tectonic || 0);
        
        if (engine.cooldowns['nature_trauma'] && engine.cooldowns['nature_trauma'] > 0) return 0;
        
        // 5% chance basal pura da natureza agir + 15% de pressões ecológicas (20% máx)
        return Math.min(0.2, 0.05 + pressure * 0.15); 
    },
    
    applyEvent(engine) {
        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length === 0) return null;
        
        engine.cooldowns['nature_trauma'] = 120; // 4 meses de trauma

        const roll = Math.random();
        
        // 57. Incêndio Florestal Estocástico
        // Mais chance onde há alta exploração (climatic pressure) ou muito wood no node.
        if (roll < 0.20) {
            engine.pressures.climatic = Math.max(0, engine.pressures.climatic - 0.2); // Queima alivia pressão seca local
            const targets = infectedNodes.filter(n => n.resources.wood > 10000 && (n.biome.id === 'jungle' || n.biome.id === 'plains'));
            if (targets.length > 0) {
                const t = targets[Math.floor(Math.random() * targets.length)];
                t.resources.wood = Math.floor(t.resources.wood * 0.5); // Perde metade da lenha
                return { message: `🔥 INCÊNDIO FLORESTAL: O tempo seco iniciou um megaincêndio em ${t.name}. Metade das florestas locais virou cinzas!`, nodeId: t.id, type: "disaster", color: "#ff8800" };
            }
        }
        
        // 58. Tempestade Solar (Flares)
        if (roll >= 0.20 && roll < 0.35) {
            if (engine.inventory.computers > 0 || engine.inventory.chips > 0) {
                engine.inventory.computers = 0;
                engine.inventory.chips = 0;
                engine.globalTrust = Math.max(0, engine.globalTrust - 30);
                return { message: `☀️ TEMPESTADE SOLAR CCE: Uma explosão solar brutal varreu a órbita. Todos os microchips do mundo fritaram e a Confiança despencou!`, type: "disaster", color: "#ffff00" };
            } else {
                // Se for idade da pedra, apenas aurora boreal
                return { message: `✨ AURORA BOREAL GLOBAL: Uma ejeção de massa coronal pintou o céu de verde vivo. Antigos deuses foram louvados no mapa.`, type: "milestone", color: "#00ff00" };
            }
        }
        
        // 59. Tsunami Localizado & 63. Terremotos de Falhas Ocultas
        if (roll >= 0.35 && roll < 0.50) {
            engine.pressures.tectonic = Math.max(0, engine.pressures.tectonic - 0.5);
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.demographics.kill(Math.floor(t.demographics.total * 0.15));
            t.resources.minerals += 5000; // Expõe veios
            return { message: `🌊 MEGATERREMOTO E TSUNAMI: Uma falha oculta sob ${t.name} cedeu. O mar varreu as costas (15% de mortos), mas novos minérios afloraram!`, nodeId: t.id, type: "disaster", color: "#0000ff" };
        }
        
        // 60. Praga de Gafanhotos
        if (roll >= 0.50 && roll < 0.65) {
            const targets = infectedNodes.filter(n => n.biome.id === 'plains');
            if (targets.length > 0) {
                const t = targets[Math.floor(Math.random() * targets.length)];
                t.soil = 0; // Solo zerado
                t.resources.wood = Math.floor(t.resources.wood * 0.8);
                return { message: `🦗 NUVEM DE GAFANHOTOS: Uma praga bíblica consumiu as safras das Planícies de ${t.name}. A agricultura parou (Solo = 0%).`, nodeId: t.id, type: "disaster", color: "#88aa00" };
            }
        }
        
        // 61. Eclipse Solar Prolongado
        if (roll >= 0.65 && roll < 0.80) {
            engine.globalKPenalty = (engine.globalKPenalty || 1.0) * 0.8;
            return { message: `🌘 ECLIPSE SOMBRIO: O Sol escureceu de forma anormal por semanas. As temperaturas despencaram e o terror místico assolou as tribos.`, type: "warning", color: "#555555" };
        }
        
        // 62. Mutação Gênica Aleatória
        if (roll >= 0.80) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            engine.adaptationPoints += 100;
            return { message: `🧬 MUTAÇÃO BENÉFICA: Crianças em ${t.name} nasceram com extrema resistência imunológica, fornecendo um salto evolutivo global (+100 DNA).`, nodeId: t.id, type: "milestone", color: "#00ff88" };
        }
        
        return null;
    }
};
