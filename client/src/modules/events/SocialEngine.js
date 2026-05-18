export default {
    id: 'events_cliodynamics',
    name: 'Cliodinâmica e Sociedade (Social Engine)',
    type: 'event',
    
    triggerProbability(engine) {
        // Usa a pressão social acumulada
        const pressure = engine.pressures.social || 0;
        
        // Cooldown para evitar spam de eventos sociais globais
        if (engine.cooldowns['social_trauma'] && engine.cooldowns['social_trauma'] > 0) return 0;
        
        return Math.min(0.2, pressure * 0.1); // Até 20% de chance diária no auge do colapso social
    },
    
    applyEvent(engine) {
        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length === 0) return null;
        
        engine.cooldowns['social_trauma'] = 180; // 6 meses de trauma social (metade do desastre natural)
        engine.pressures.social = Math.max(0, engine.pressures.social - 0.3); // Alivia a tensão social

        const roll = Math.random();
        
        // 65. Revolta dos Camponeses
        // Foca em nós superpopulosos com alto Trust geral (desigualdade oculta)
        if (roll < 0.20) {
            const targets = infectedNodes.filter(n => n.demographics.total > n.capacity * 0.9 && engine.globalTrust > 80);
            if (targets.length > 0) {
                const t = targets[Math.floor(Math.random() * targets.length)];
                t.demographics.kill(Math.floor(t.demographics.total * 0.3));
                engine.globalTrust *= 0.5; // Trust cai pela metade
                return { message: `🔥 REVOLTA CAMPONESA: A desigualdade explodiu em ${t.name}. As elites foram depostas, 30% morreram na confusão e a Confiança Global despencou!`, nodeId: t.id, type: "disaster", color: "#ff4444" };
            }
        }
        
        // 64. O Assassino Famoso
        if (roll >= 0.20 && roll < 0.30) {
            const targets = infectedNodes.filter(n => n.demographics.total > 100000);
            if (targets.length > 0) {
                const t = targets[Math.floor(Math.random() * targets.length)];
                t.demographics.kill(Math.floor(t.demographics.total * 0.1));
                engine.globalTrust = Math.max(0, engine.globalTrust - 20);
                return { message: `🗡️ ASSASSINATO DO LÍDER: Um estadista icônico foi morto em ${t.name}. A região fraturou em conflito civil e o caos tomou as ruas.`, nodeId: t.id, type: "nemesis", color: "#ff0000" };
            }
        }
        
        // 68. A Queda de Roma (Decadência Burocrática)
        if (roll >= 0.30 && roll < 0.40) {
            const targets = infectedNodes.filter(n => engine.techTree && engine.techTree.unlocked && engine.techTree.unlocked.size > 20); // Império médio+
            if (targets.length > 0) {
                const t = targets[Math.floor(Math.random() * targets.length)];
                t.resources.wood *= 0.5;
                t.resources.minerals *= 0.5;
                return { message: `🏛️ DECADÊNCIA: A burocracia corrupta de ${t.name} "perdeu" 50% dos estoques locais em desvios sistêmicos.`, nodeId: t.id, type: "warning", color: "#aa5500" };
            }
        }
        
        // 67. Descoberta de um Novo Filósofo (Evento Positivo)
        if (roll >= 0.40 && roll < 0.50) {
            engine.adaptationPoints += 50;
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            return { message: `💡 UM NOVO PENSADOR: Um gênio nasceu nas ruas de ${t.name}! A humanidade recebeu uma injeção súbita de 50 DNA para evoluir.`, nodeId: t.id, type: "milestone", color: "#00ffff" };
        }
        
        // 66. Cisma Religioso
        if (roll >= 0.50 && roll < 0.60) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            // Adiciona debuff de conflito na tribo (simulado como perda de r_boost)
            t.religiousSchism = true;
            return { message: `📜 CISMA RELIGIOSO: Uma nova doutrina radical varreu ${t.name}. A região entrou em guerra religiosa e atrasou o desenvolvimento.`, nodeId: t.id, type: "nemesis", color: "#8800ff" };
        }
        
        // 72. Movimento Neo-Luddita
        if (roll >= 0.60 && roll < 0.70) {
            if (engine.inventory.computers > 0 || engine.inventory.chips > 0) {
                engine.inventory.computers = Math.floor(engine.inventory.computers * 0.8);
                engine.inventory.chips = Math.floor(engine.inventory.chips * 0.8);
                return { message: `⚙️ SABOTAGEM LUDDITA: Multidões temendo perder o emprego destruíram 20% de todos os Computadores e Chips em protesto!`, type: "disaster", color: "#ff8800" };
            }
        }
        
        // 71. Mártir Popular
        if (roll >= 0.70 && roll < 0.80) {
            engine.pressures.social += 0.5; // Estoura a pressão para o próximo turno
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            return { message: `⚖️ MÁRTIR POPULAR: Uma execução brutal e injusta em praça pública em ${t.name} chocou o mundo. A Tensão Social disparou globalmente!`, nodeId: t.id, type: "warning", color: "#ff5555" };
        }
        
        // 69. A Epidemia da Loucura (Histeria Coletiva)
        if (roll >= 0.80 && roll < 0.90) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.demographics.kill(Math.floor(t.demographics.total * 0.05)); // Pessoas param de comer/trabalhar
            return { message: `😵 HISTERIA COLETIVA: Uma síndrome psicogênica fez 5% da população de ${t.name} definhar num transe místico fatal.`, nodeId: t.id, type: "warning", color: "#aa00aa" };
        }
        
        // 73. Migração em Massa Inesperada (O Pânico)
        // 70. A Peste Oculta (Zoonose de Vetores) -- Simplesmente mata aleatoriamente como se fosse migração doentia
        if (roll >= 0.90) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.demographics.kill(Math.floor(t.demographics.total * 0.2));
            return { message: `🏃 PÂNICO GERAL: Um boato de uma Praga Silenciosa e fim do mundo fez 20% de ${t.name} fugir para a selva e morrer de inanição.`, nodeId: t.id, type: "warning", color: "#88aa88" };
        }
        
        return null; // Caso não engatilhe nenhum
    }
};
