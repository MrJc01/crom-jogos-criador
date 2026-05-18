export default {
    id: 'bureaucracy',
    type: 'economy',
    applyTick(node, globalRules, engine) {
        if (!node.infected || !node.demographics.dist || !node.demographics.dist.factions) return;
        
        const factions = Object.entries(node.demographics.dist.factions);
        if (factions.length === 0) return;
        
        let largestFactionSize = 0;
        factions.forEach(([_, pct]) => {
            if (pct > largestFactionSize) largestFactionSize = pct;
        });
        
        // TAREFA 20: Custo Quadrático da Burocracia
        // Se uma facção tem domínio sobre uma megacidade, o custo administrativo e corrupção escala quadrado
        if (largestFactionSize > 0.8 && node.demographics.total > 100000) {
            const bureaucracyPenalty = Math.floor((node.demographics.total / 100000) ** 2);
            node.resources.water = Math.max(0, node.resources.water - bureaucracyPenalty);
            engine.inventory.wood = Math.max(0, engine.inventory.wood - Math.floor(bureaucracyPenalty * 0.1));
        }
        
        // TAREFA 16: Superprodução de Elites (Revoltas por excesso de riqueza/Trust)
        // Quando a sociedade tá rica e estável demais, cria-se muita elite lutando pelo topo, gerando conflito de classes.
        if (engine.globalTrust > 150 && engine.inventory.minerals > 50000) {
            if (Math.random() < 0.001) { // 0.1% chance diária por nó quando condições atingidas
                node.demographics.kill(Math.floor(node.demographics.total * 0.05));
                engine.pressures.social += 0.5;
                if (engine.onEvent) engine.onEvent({ message: `🏛️ SUPERPRODUÇÃO DE ELITES: Facções opulentas em ${node.name} entraram em guerra civil interna pelo poder. A Tensão Social disparou!`, nodeId: node.id, type: "warning", color: "#ffaa00" }, "warning");
            }
        }
        
        // TAREFA 18: Fragmentação de Mega-Impérios
        // Se um nó chega em populações abissais com apenas 1 facção (monopólio), ele tende a rachar.
        if (largestFactionSize > 0.95 && node.demographics.total > 500000) {
            if (Math.random() < 0.005) { // 0.5%
                // Injeta uma facção rebelde pegando 40% da população
                node.demographics.dist.factions['rebels_' + Math.floor(Math.random()*1000)] = 0.4;
                const originalFac = factions.find(([_, pct]) => pct === largestFactionSize)[0];
                node.demographics.dist.factions[originalFac] = 0.6; // Reduz a original
                
                engine.pressures.social += 1.0; // Desestabiliza globalmente
                if (engine.onEvent) engine.onEvent({ message: `🗡️ FRAGMENTAÇÃO IMPERIAL: O Mega-Império em ${node.name} ficou massivo demais e ruiu, dividindo-se em duas facções separatistas!`, nodeId: node.id, type: "nemesis", color: "#ff0000" }, "nemesis");
            }
        }
    }
};
