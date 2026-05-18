export default {
    id: 'events_geopolitics',
    name: 'Geopolítica de Fronteiras (Geo Engine)',
    type: 'event',
    
    triggerProbability(engine) {
        // Geopolítica tem chance base constante enquanto houver alta população global
        if (engine.globalPop < 500000) return 0; // Apenas quando o mapa está muito povoado
        
        if (engine.cooldowns['geo_trauma'] && engine.cooldowns['geo_trauma'] > 0) return 0;
        
        const pressure = Math.max(engine.pressures.social || 0, engine.pressures.biological || 0);
        return Math.min(0.2, 0.05 + pressure * 0.1); 
    },
    
    applyEvent(engine) {
        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length < 2) return null; // Precisa de pelo menos 2 nós para geopolítica
        
        engine.cooldowns['geo_trauma'] = 150; // 5 meses de estabilidade diplomática base

        const roll = Math.random();
        
        // 82. Casamento Diplomático (Unificação de Factions pacífica)
        if (roll < 0.15) {
            // Unir culturas não é trivial, apenas reduz a chance de guerra (aumenta Trust absurdamente)
            engine.globalTrust += 50; 
            const t1 = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            return { message: `💍 CASAMENTO DIPLOMÁTICO: Elites de ${t1.name} selaram matrimônio com nações vizinhas. A Confiança Global disparou (+50) pacificando fronteiras!`, type: "milestone", color: "#ffb6c1" };
        }
        
        // 83. Incidente de Fronteira (Casus Belli Falso)
        if (roll >= 0.15 && roll < 0.25) {
            engine.globalTrust = Math.max(0, engine.globalTrust - 40); // Destrói o Trust instantâneo
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            return { message: `⚔️ INCIDENTE DE FRONTEIRA: Soldados em ${t.name} atiraram por acidente contra vizinhos. O pânico de uma Guerra Mundial derrubou a Confiança Global.`, nodeId: t.id, type: "nemesis", color: "#ff0000" };
        }
        
        // 84. Pirataria Tecnológica Massiva
        if (roll >= 0.25 && roll < 0.35) {
            engine.adaptationPoints += 150; // Injeta DNA "roubado" para a engine de IA usar
            return { message: `🏴‍☠️ ESPIONAGEM TECNOLÓGICA: Uma rede de espiões roubou patentes cruciais e as vazou na Dark Web para todas as tribos! (+150 DNA Global)`, type: "warning", color: "#55aaff" };
        }
        
        // 85. O Boom dos Refugiados de Ouro
        if (roll >= 0.35 && roll < 0.45) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.demographics.total += 50000; // Imigração massiva
            engine.adaptationPoints += 50; // Trazem intelecto
            return { message: `🛳️ REFUGIADOS DE OURO: Um influxo massivo de imigrantes intelectuais chegou em ${t.name}, turbinando a pesquisa (+50 DNA) e a população local!`, nodeId: t.id, type: "milestone", color: "#ffff00" };
        }
        
        // 86. Descoberta Arqueológica
        if (roll >= 0.45 && roll < 0.55) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            engine.adaptationPoints += 200;
            return { message: `🏺 DESCOBERTA ARQUEOLÓGICA: Escavações em ${t.name} revelaram relíquias avançadas! O salto científico foi estrondoso (+200 DNA).`, nodeId: t.id, type: "milestone", color: "#ffcc00" };
        }
        
        // 87. Seita Suicida
        if (roll >= 0.55 && roll < 0.65) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.demographics.kill(Math.min(t.demographics.total, 50000));
            return { message: `💀 CULTO APOCALÍPTICO: Uma seita extremista isolacionista induziu o auto-sacrifício de até 50.000 pessoas em ${t.name}.`, nodeId: t.id, type: "disaster", color: "#550055" };
        }
        
        // 88. Epidemia de Esterilidade Randômica
        if (roll >= 0.65 && roll < 0.75) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.sterilityTimer = 180; // flag para gestation
            return { message: `🚼 ESTERILIDADE MISTERIOSA: Fatores ambientais severos travaram os nascimentos em ${t.name}. Ninguém nascerá na região pelos próximos 6 meses!`, nodeId: t.id, type: "warning", color: "#aaffaa" };
        }
        
        // 89. A Paz de Natal (Trégua de Inverno)
        if (roll >= 0.75 && roll < 0.85) {
            engine.globalTrust = 100; // Reseta confiança ao topo
            return { message: `🕊️ A PAZ DE NATAL: Em um raro momento de humanidade sistêmica, as frentes abaixaram as armas. A Confiança Global foi plenamente restaurada (100%).`, type: "milestone", color: "#ffffff" };
        }
        
        // 90. Sabotagem de Infraestrutura de Água
        if (roll >= 0.85) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.resources.water = 0;
            return { message: `🧪 SABOTAGEM DE AQUÍFEROS: Terroristas infiltrados envenenaram as reservas hídricas centrais de ${t.name}. A sede vai assolar a região!`, nodeId: t.id, type: "disaster", color: "#0055ff" };
        }
        
        return null;
    }
};
