export default {
    id: 'events_targeted_disasters',
    name: 'A Fúria do Planeta (The Nemesis Tree)',
    type: 'event',
    
    triggerProbability(engine) {
        if (engine.severity >= engine.config.disasterThreshold) return 1.0;
        if (engine.severity < 20) return 0;
        return (engine.severity / 100) * 0.1; // Máximo de 10% chance ao dia de o planeta contra-atacar
    },
    
    applyEvent(engine) {
        // Inicializa o estado do Nemesis se não existir
        if (!engine.nemesis) {
            engine.nemesis = { atmospheric: 0, biological: 0, geological: 0, sentientAwakened: false };
        }

        // --- O CICLO INFINITO (GREAT FILTER) ---
        if (engine.severity >= engine.config.disasterThreshold) {
            engine.nodes.forEach(n => {
                if (!n.infected) return;
                n.demographics.kill(Math.floor(n.demographics.total * 0.99));
                n.resources.minerals += 10000;
            });
            
            engine.techTree.unlocked.clear();
            engine.severity = 0;
            engine.adaptationPoints = 0;
            engine.inventory.chips = 0;
            engine.inventory.computers = 0;
            
            // Reseta a Fúria do Planeta
            engine.nemesis = { atmospheric: 0, biological: 0, geological: 0, sentientAwakened: false };
            
            return { message: `☢️ COLAPSO! A Fúria do Planeta chegou ao ápice. O sistema mundial colapsou. Sobreviventes voltaram à Idade da Pedra em meio a ruínas.`, type: "disaster" };
        }

        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length === 0) return null;

        // O Planeta escolhe como atacar baseado no "Level" de defesa
        const roll = Math.random();
        
        // 1. Raiz Geológica (Terremotos em Minas)
        if (roll < 0.33) {
            engine.nemesis.geological++;
            // Foca nos nós onde estão minerando muito (Alto nível de minérios extraídos = População alta + Madeira Baixa)
            const miningTargets = infectedNodes.filter(n => n.resources.minerals < 5000);
            if (miningTargets.length > 0) {
                const t = miningTargets[Math.floor(Math.random() * miningTargets.length)];
                const killRate = Math.min(0.8, 0.1 * engine.nemesis.geological);
                t.demographics.kill(Math.floor(t.demographics.total * killRate));
                return { message: `🌋 RAÍZ GEOLÓGICA (Nv ${engine.nemesis.geological}): Terremoto massivo em ${t.name} (Zonas de Escavação). ${killRate*100}% de letalidade!`, nodeId: t.id, type: "disaster" };
            }
        }
        
        // 2. Raiz Atmosférica (Seca e Desertificação)
        else if (roll < 0.66) {
            engine.nemesis.atmospheric++;
            // Aumenta o GlobalKPenalty, dificultando a vida de todos
            engine.globalKPenalty = (engine.globalKPenalty || 1.0) * 0.95;
            
            // Desertificação de um bioma verde
            const greenNodes = infectedNodes.filter(n => n.biome.id === 'plains' || n.biome.id === 'jungle');
            if (greenNodes.length > 0) {
                const target = greenNodes[Math.floor(Math.random() * greenNodes.length)];
                target.biome = { id: 'desert', capacityBase: target.biome.capacityBase * 0.5 };
                target.capacity = target.capacity * 0.5; // Corta pela metade permanentemente
                return { message: `🌪️ RAÍZ ATMOSFÉRICA (Nv ${engine.nemesis.atmospheric}): Seca Global Intensificada. ${target.name} sofreu Desertificação irreversível! A capacidade de carga caiu.`, nodeId: target.id, type: "disaster" };
            }
        }
        
        // 3. Raiz Biológica (Pandemias de Super Fungos e Sencientes)
        else {
            engine.nemesis.biological++;
            
            // Se passar do nível 10, desperta espécies sencientes nativas
            if (engine.nemesis.biological > 10 && !engine.nemesis.sentientAwakened) {
                engine.nemesis.sentientAwakened = true;
                return { message: `👽 DESPERTAR NATIVO: A Biosfera reagiu. Espécies Sencientes das Profundezas começaram a coordenar a caça aos humanos em todos os oceanos!`, type: "disaster", color: "#ff00ff" };
            }

            // Tarefa 05: Zoonoses de Povoamento e Desmatamento
            // Pandemia foca em nós superlotados E severamente desmatados (contato com fauna)
            const crowdedNodes = infectedNodes.filter(n => (n.demographics.total / n.capacity) > 0.8 && (n.resources.wood || 0) < 5000);
            if (crowdedNodes.length > 0) {
                const target = crowdedNodes[Math.floor(Math.random() * crowdedNodes.length)];
                const killRate = engine.unlockedTechs.has("tech_medicine") ? 0.15 : 0.60; // 60% wipe sem medicina
                target.demographics.kill(Math.floor(target.demographics.total * killRate));
                return { message: `🦠 ZOONOSE VIRAL (Nv ${engine.nemesis.biological}): O desmatamento forçou contato direto humano/fauna em ${target.name}. Uma nova pandemia exterminou ${killRate*100}% da população local!`, nodeId: target.id, type: "disaster" };
            }
        }

        // 4. Fauna Resistência (Passivo)
        // Se a severidade for média e nenhum grande ataque foi engatilhado
        const targetNode = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
        const victims = Math.floor(targetNode.demographics.total * 0.05);
        targetNode.demographics.kill(victims);
        return { message: `🐺 RESISTÊNCIA DA FAUNA: Predadores locais coordenaram ataques contra postos avançados em ${targetNode.name}. Perdas menores (${victims} mortos).`, nodeId: targetNode.id, type: "nemesis" };
    }
};
