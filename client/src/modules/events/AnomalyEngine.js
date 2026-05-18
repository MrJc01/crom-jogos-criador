export default {
    id: 'events_anomaly',
    name: 'Anomalias do Desconhecido (Anomaly Engine)',
    type: 'event',
    
    triggerProbability(engine) {
        // Anomalias não se importam com a pressão sistêmica, elas são puramente The Weird & The Wild
        if (engine.cooldowns['anomaly_trauma'] && engine.cooldowns['anomaly_trauma'] > 0) return 0;
        
        // Chance fixa e incrivelmente baixa (0.5% ao dia de ter rolagem de anomalia)
        return 0.005;
    },
    
    applyEvent(engine) {
        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length === 0) return null;
        
        engine.cooldowns['anomaly_trauma'] = 365 * 2; // 2 Anos sem anomalias

        const roll = Math.random();
        
        // 91. O Obelisco (Evento 2001)
        if (roll < 0.15) {
            engine.adaptationPoints += 500;
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.demographics.total += 10000;
            return { message: `🕋 O OBELISCO: Um monólito negro e perfeito surgiu do nada em ${t.name}. A mente humana se expandiu de forma assustadora (+500 DNA) e uma multidão migrou para adorá-lo.`, nodeId: t.id, type: "nemesis", color: "#aa00aa" };
        }
        
        // 92. O Silêncio Total (A Doença de Príons)
        if (roll >= 0.15 && roll < 0.30) {
            engine.globalKPenalty = (engine.globalKPenalty || 1.0) * 0.7; // Reduz a capacidade logística
            engine.globalTrust = Math.max(0, engine.globalTrust - 80);
            return { message: `🔇 O SILÊNCIO TOTAL: Uma doença mental assombrosa se espalhou globalmente. Ninguém consegue falar. O comércio parou, o aprendizado morreu, o silêncio domina.`, type: "disaster", color: "#666666" };
        }
        
        // 93. Sincronicidade Global
        if (roll >= 0.30 && roll < 0.45) {
            engine.pressures.social = 0;
            engine.pressures.biological = 0;
            engine.pressures.tectonic = 0;
            engine.pressures.climatic = 0;
            engine.globalTrust = 200; // Utopia
            return { message: `🧘 SINCRONICIDADE GLOBAL: Por alguma razão metafísica, todo o planeta experimentou o mesmo sonho na mesma noite. Todas as pressões globais foram a zero. A Utopia durará pouco.`, type: "milestone", color: "#ffffff" };
        }
        
        // 94. Queda de Satélite em Área Urbana
        if (roll >= 0.45 && roll < 0.60) {
            if (engine.inventory.computers > 5000) { // Era Espacial / Informação
                const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
                t.demographics.kill(Math.floor(t.demographics.total * 0.1));
                return { message: `🛰️ QUEDA DO CÉU: Uma estação orbital despencou no centro de ${t.name}. Milhões morreram e um medo atávico das estrelas surgiu na população.`, nodeId: t.id, type: "disaster", color: "#ff5555" };
            }
        }
        
        // 95. Despertar Criogênico
        if (roll >= 0.60 && roll < 0.75) {
            if (engine.globalPop < 50000 && engine.techTree && engine.techTree.unlocked.size > 20) { // Mundo devastado mas que um dia teve tecnologia
                const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
                t.demographics.total += 20000;
                return { message: `🧊 DESPERTAR CRIOGÊNICO: Abóbadas do antigo mundo abriram-se em ${t.name}. 20.000 humanos do passado acordaram em um mundo que não reconhecem mais.`, nodeId: t.id, type: "milestone", color: "#00ffff" };
            }
        }
        
        // 96. O Milagre do Solo
        if (roll >= 0.75) {
            const targets = infectedNodes.filter(n => n.biome.id === 'desert' || n.soil < 50);
            if (targets.length > 0) {
                const t = targets[Math.floor(Math.random() * targets.length)];
                t.soil = 100;
                t.resources.water += 10000;
                t.biome = { id: 'jungle', capacityBase: 100000 };
                return { message: `🌸 O MILAGRE DO SOLO: Do dia para a noite, desertos áridos em ${t.name} desabrocharam em uma floresta tropical perfeita. Ninguém sabe explicar a anomalia.`, nodeId: t.id, type: "milestone", color: "#00ff55" };
            }
        }
        
        return null;
    }
};
