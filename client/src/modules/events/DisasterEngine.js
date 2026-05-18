export default {
    id: 'events_targeted_disasters',
    name: 'Desastres Inteligentes e Ciclos Infinitos',
    type: 'event',
    
    // Condição: Auditar se deve gerar um desastre
    triggerProbability(engine) {
        // Se a severidade for absurda, aciona 100% (Reset Global)
        if (engine.severity >= engine.config.disasterThreshold) return 1.0;
        
        // Só começa a engatilhar desastres punitivos locais se severidade > 30%
        if (engine.severity < 30) return 0;
        return (engine.severity / 100) * 0.05; // Máximo de 5% de chance ao dia
    },
    
    applyEvent(engine) {
        // --- O CICLO INFINITO (GREAT FILTER) ---
        if (engine.severity >= engine.config.disasterThreshold) {
            engine.nodes.forEach(n => {
                if (!n.infected) return;
                // Extermina 99% da população
                n.demographics.kill(Math.floor(n.demographics.total * 0.99));
                // O bioma ganha "Ruínas Tecnológicas" (simulado injetando um boost massivo de minerais)
                n.resources.minerals += 10000;
            });
            
            // Zera a Árvore de Tecnologia (Recomeça da Idade da Pedra)
            engine.techTree.unlocked.clear();
            engine.severity = 0;
            engine.adaptationPoints = 0;
            engine.inventory.chips = 0;
            engine.inventory.computers = 0;
            
            // Adiciona um evento cataclísmico
            return { message: `☢️ COLAPSO DA CIVILIZAÇÃO! A severidade chegou ao ápice. O sistema mundial colapsou. Sobreviventes voltaram à Idade da Pedra em meio a ruínas.` };
        }

        // --- DESASTRES LOCAIS (METRÓPOLES) ---
        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length === 0) return null;
        
        let totalPop = 0;
        infectedNodes.forEach(n => totalPop += n.demographics.total);
        const avgPop = totalPop / infectedNodes.length;
        
        const targets = infectedNodes.filter(n => n.demographics.total > (avgPop * 1.5) && (n.demographics.total / n.capacity) > 0.8);
        
        if (targets.length === 0) return null;
        
        const targetNode = targets[Math.floor(Math.random() * targets.length)];
        const era = engine.currentEra.name;
        
        let killRate = 0.1; 
        let disasterName = "Colapso Desconhecido";
        
        if (era === 'Idade da Pedra' || era === 'Idade do Cobre' || era === 'Idade do Bronze') {
            disasterName = "Praga Local / Fome Extrema";
            killRate = 0.3; 
        } else if (era === 'Idade do Ferro' || era === 'Era Industrial') {
            disasterName = "Nuvem Tóxica / Fogo Urbano";
            killRate = 0.2; 
        } else {
            disasterName = "Vírus Cibernético / Falha Crítica de Reator";
            killRate = 0.4; 
        }
        
        const victims = Math.floor(targetNode.demographics.total * killRate);
        targetNode.demographics.kill(victims);
        
        return { message: `⚠️ DESASTRE (${disasterName}) atinge ${targetNode.name}! Mortalidade de ${killRate*100}% devido à superlotação, dizimando ${victims.toLocaleString('pt-BR')} habitantes.`, nodeId: targetNode.id };
    }
};
