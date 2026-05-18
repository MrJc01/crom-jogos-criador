export default {
    id: 'events_industry_tech',
    name: 'Acidentes Industriais (Tech Engine)',
    type: 'event',
    
    triggerProbability(engine) {
        // Usa pressão de exaustão de minérios ou apenas sorte no late-game
        const isIndustrialized = engine.inventory.minerals > 10000 || engine.inventory.chips > 0;
        if (!isIndustrialized) return 0; // Se não tem indústria, não tem acidente industrial
        
        if (engine.cooldowns['industry_trauma'] && engine.cooldowns['industry_trauma'] > 0) return 0;
        
        const pressure = Math.max(engine.pressures.tectonic || 0, engine.pressures.social || 0);
        return Math.min(0.2, 0.05 + pressure * 0.1); 
    },
    
    applyEvent(engine) {
        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length === 0) return null;
        
        engine.cooldowns['industry_trauma'] = 180; // 6 meses sem grandes crashes

        const roll = Math.random();
        
        // 76. Quebra da Bolsa de Valores (Crash)
        if (roll < 0.15) {
            if (engine.globalTrust > 150) { // Bolha estourando
                engine.globalTrust = 50; // Cai pra 50
                engine.pressures.social += 0.5; // Tensão vai ao teto
                return { message: `📉 CRASH DA BOLSA: A bolha financeira estourou. A Confiança despencou para níveis críticos e a economia travou mundialmente.`, type: "disaster", color: "#ff0000" };
            }
        }
        
        // 74. Colapso de Mina de Carvão
        if (roll >= 0.15 && roll < 0.30) {
            const targets = infectedNodes.filter(n => n.resources.minerals < 5000); // Exaustão máxima
            if (targets.length > 0) {
                const t = targets[Math.floor(Math.random() * targets.length)];
                t.demographics.kill(Math.floor(t.demographics.total * 0.05)); // Mata 5% dos adultos trabalhadores
                engine.pressures.tectonic = Math.max(0, engine.pressures.tectonic - 0.2);
                return { message: `⛏️ COLAPSO DE MINA: Câmaras subterrâneas cederam devido à extrema exaustão em ${t.name}. Milhares de mineiros morreram soterrados.`, nodeId: t.id, type: "disaster", color: "#aa5500" };
            }
        }
        
        // 75. Vazamento de Óleo/Tóxico
        if (roll >= 0.30 && roll < 0.45) {
            if (engine.inventory.minerals > 50000) {
                const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
                t.resources.water = 0; // Zera a água limpa
                return { message: `🛢️ VAZAMENTO TÓXICO: Resíduos industriais contaminaram os lençóis freáticos de ${t.name}. A Água Potável foi a zero, disparando mortalidade infantil!`, nodeId: t.id, type: "disaster", color: "#aa00ff" };
            }
        }
        
        // 78. Acidente Nuclear Estocástico
        if (roll >= 0.45 && roll < 0.55) {
            if (engine.inventory.computers > 5000) { // Proxy para tecnologia alta
                const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
                t.demographics.kill(Math.floor(t.demographics.total * 0.5)); // Metade do nó limpo
                t.capacity = Math.floor(t.capacity * 0.1); // Solo permanentemente radioativo
                return { message: `☢️ MELTDOWN NUCLEAR: Uma usina em ${t.name} derreteu. O território se tornou uma zona de exclusão radioativa, dizimando 50% da população.`, nodeId: t.id, type: "disaster", color: "#00ff00" };
            }
        }
        
        // 77. Epidemia de Códigos Defeituosos (Y2K Real)
        if (roll >= 0.55 && roll < 0.65) {
            if (engine.inventory.chips > 1000) {
                engine.inventory.chips = Math.floor(engine.inventory.chips * 0.5);
                engine.inventory.computers = Math.floor(engine.inventory.computers * 0.5);
                return { message: `🐛 BUG SISTÊMICO (Y2K): Um erro corrompeu infraestruturas vitais. Metade do estoque mundial de Microchips e Computadores foi perdido!`, type: "disaster", color: "#ffff00" };
            }
        }
        
        // 81. Revolta das Máquinas (IA Alucinada)
        if (roll >= 0.65 && roll < 0.75) {
            if (engine.inventory.computers > 10000) { // Altamente digitalizado
                engine.inventory.wood = 0;
                engine.inventory.minerals = 0;
                engine.globalTrust = 0;
                return { message: `🤖 ALUCINAÇÃO DE I.A.: Robôs logísticos autônomos falharam criticamente, jogando todos os estoques físicos de Matéria-Prima no oceano. O Trust colapsou a ZERO.`, type: "nemesis", color: "#ff00ff" };
            }
        }
        
        // 80. Cartelização Secreta
        if (roll >= 0.75 && roll < 0.85) {
            engine.globalKPenalty = (engine.globalKPenalty || 1.0) * 0.9;
            return { message: `💼 CARTEL CORPORATIVO: Megacorporações secretamente fixaram preços. O custo de vida subiu, reduzindo artificialmente a Capacidade de Suporte Global.`, type: "warning", color: "#ffffff" };
        }
        
        // 79. Avanço Médico Brilhante (Sorte)
        if (roll >= 0.85) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.capacity = Math.floor(t.capacity * 1.5);
            return { message: `🔬 MILAGRE DA MEDICINA: Laboratórios em ${t.name} descobriram uma panaceia acidental! A capacidade e saúde urbana pularam em 50%.`, nodeId: t.id, type: "milestone", color: "#00ffff" };
        }
        
        return null;
    }
};
