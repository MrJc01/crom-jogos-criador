import { Config } from '../../config/ConfigLoader.js';

const CFG = Config.get('disasterEngine') || {};

export default {
    id: 'events_targeted_disasters',
    name: 'A Fúria do Planeta (The Nemesis Tree)',
    type: 'event',
    
    triggerProbability(engine) {
        if (engine.severity >= engine.config.disasterThreshold) return 1.0;
        
        // Tarefa 53: Cooldowns Dinâmicos (Trauma)
        if (engine.cooldowns['disaster_trauma'] && engine.cooldowns['disaster_trauma'] > 0) return 0;
        
        // 063. Poisson-based trigger — lambda = soma das pressões
        const lambda = engine.pressures.tectonic + engine.pressures.climatic + 
                       engine.pressures.biological + engine.pressures.social;
        
        // 066. Severidade Desacoplada — cada pressão contribui independentemente
        // P(evento) = 1 - e^(-lambda) (CDF Poisson k=0)
        const poissonProb = 1 - Math.exp(-lambda * 0.1);
        
        // 067. Peste via Rotas Comerciais — rotas ativas aumentam risco biológico
        let tradeRisk = 0;
        if (engine.tradeRoutes) {
            const activeRoutes = engine.tradeRoutes.filter(r => {
                const src = engine.nodes.get(r.sourceId);
                return src?.infected && src.sir?.active;
            });
            tradeRisk = activeRoutes.length * 0.01; // Cada rota infectada +1%
        }
        
        return Math.min(0.15, poissonProb + tradeRisk);
    },
    
    applyEvent(engine) {
        // Inicializa o estado do Nemesis se não existir
        if (!engine.nemesis) {
            engine.nemesis = { atmospheric: 0, biological: 0, geological: 0, sentientAwakened: false };
        }

        // --- O CICLO INFINITO (GREAT FILTER) — FIX P0: Reduzido de 99% para 70% ---
        const collapseKillRate = CFG.collapseKillRate || 0.70;
        if (engine.severity >= engine.config.disasterThreshold) {
            engine.nodes.forEach(n => {
                if (!n.infected) return;
                let actualKillRate = collapseKillRate;
                if (n.demographics.total < 500) actualKillRate = Math.min(0.05, collapseKillRate); // Cradle Shield
                n.demographics.kill(Math.floor(n.demographics.total * actualKillRate));
                n.resources.minerals += (CFG.collapseMineralBonus || 10000);
            });
            
            // FIX P0: Não apaga TODAS as techs — remove metade (as mais caras)
            const techs = Array.from(engine.techTree.unlocked);
            const halfPoint = Math.ceil(techs.length / 2);
            for (let i = halfPoint; i < techs.length; i++) {
                engine.techTree.unlocked.delete(techs[i]);
            }
            
            engine.severity = Math.floor(engine.severity * 0.5);
            engine.adaptationPoints = Math.floor(engine.adaptationPoints * 0.3);
            engine.inventory.chips = 0;
            engine.inventory.computers = 0;
            
            engine.nemesis = { atmospheric: 0, biological: 0, geological: 0, sentientAwakened: false };
            
            return { message: `☢️ COLAPSO! A Fúria do Planeta chegou ao ápice. ${Math.floor(collapseKillRate*100)}% da vida foi dizimada. Sobreviventes tentam reconstruir.`, type: "disaster" };
        }

        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length === 0) return null;

        const p = engine.pressures;
        let activeDisaster = 'geological';
        if (p.climatic > p.tectonic && p.climatic > p.biological) activeDisaster = 'atmospheric';
        else if (p.biological > p.tectonic && p.biological > p.climatic) activeDisaster = 'biological';
        
        engine.cooldowns['disaster_trauma'] = CFG.traumaCooldownDays || 365;

        // 1. Raiz Geológica
        if (activeDisaster === 'geological') {
            engine.pressures.tectonic = Math.max(0, engine.pressures.tectonic - (CFG.geologicalPressureRelief || 0.5));
            engine.nemesis.geological++;
            const miningTargets = infectedNodes.filter(n => n.resources.minerals < 5000);
            if (miningTargets.length > 0) {
                const t = miningTargets[Math.floor(Math.random() * miningTargets.length)];
                let killRate = Math.min(0.8, 0.1 * engine.nemesis.geological);
                if (t.demographics.total < 500) killRate = Math.min(0.05, killRate); // Cradle Shield
                const victims = Math.floor(t.demographics.total * killRate);
                t.demographics.kill(victims);
                return { message: `🌋 RAÍZ GEOLÓGICA (Nv ${engine.nemesis.geological}): Terremoto massivo em ${t.name}. ${victims} vítimas (Letalidade: ${Math.floor(killRate*100)}%)!`, nodeId: t.id, type: "disaster" };
            }
        }
        
        // 2. Raiz Atmosférica
        else if (activeDisaster === 'atmospheric') {
            engine.pressures.climatic = Math.max(0, engine.pressures.climatic - (CFG.atmosphericPressureRelief || 0.5));
            engine.nemesis.atmospheric++;
            engine.globalKPenalty = (engine.globalKPenalty || 1.0) * 0.95;
            
            const greenNodes = infectedNodes.filter(n => n.biome.id === 'plains' || n.biome.id === 'jungle');
            if (greenNodes.length > 0) {
                const target = greenNodes[Math.floor(Math.random() * greenNodes.length)];
                const capMult = CFG.desertificationCapMultiplier || 0.5;
                target.biome = { id: 'desert', capacityBase: target.biome.capacityBase * capMult };
                target.capacity = target.capacity * capMult;
                return { message: `🌪️ RAÍZ ATMOSFÉRICA (Nv ${engine.nemesis.atmospheric}): ${target.name} sofreu Desertificação! Capacidade caiu ${Math.floor((1-capMult)*100)}%.`, nodeId: target.id, type: "disaster" };
            }
        }
        
        // 3. Raiz Biológica
        else if (activeDisaster === 'biological') {
            engine.pressures.biological = Math.max(0, engine.pressures.biological - (CFG.biologicalPressureRelief || 0.5));
            engine.nemesis.biological++;
            
            const awakenThreshold = CFG.sentientAwakeningThreshold || 10;
            if (engine.nemesis.biological > awakenThreshold && !engine.nemesis.sentientAwakened) {
                engine.nemesis.sentientAwakened = true;
                return { message: `👽 DESPERTAR NATIVO: A Biosfera reagiu. Espécies Sencientes das Profundezas coordenam a caça aos humanos!`, type: "disaster", color: "#ff00ff" };
            }

            const crowdedNodes = infectedNodes.filter(n => (n.demographics.total / n.capacity) > 0.8 && (n.resources.wood || 0) < 5000);
            if (crowdedNodes.length > 0) {
                const target = crowdedNodes[Math.floor(Math.random() * crowdedNodes.length)];
                let killRate = engine.unlockedTechs.has("tech_medicine") 
                    ? (CFG.zoonoseMedicineMortality || 0.15) 
                    : (CFG.zoonoseBaseMortality || 0.60);
                if (target.demographics.total < 500) killRate = Math.min(0.05, killRate); // Cradle Shield
                const victims = Math.floor(target.demographics.total * killRate);
                target.demographics.kill(victims);
                return { message: `🦠 ZOONOSE VIRAL (Nv ${engine.nemesis.biological}): Pandemia em ${target.name}. ${victims} mortos (${Math.floor(killRate*100)}%)!`, nodeId: target.id, type: "disaster" };
            }
        }

        // 4. Fauna Resistência (Passivo)
        let faunaKillRate = CFG.faunaPassiveKillRate || 0.05;
        const targetNode = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
        if (targetNode.demographics.total < 500) faunaKillRate = 0.01; // Cradle Shield
        const victims = Math.floor(targetNode.demographics.total * faunaKillRate);
        targetNode.demographics.kill(victims);
        return { message: `🐺 RESISTÊNCIA DA FAUNA: Predadores coordenaram ataques em ${targetNode.name}. ${victims} mortos.`, nodeId: targetNode.id, type: "nemesis" };
    }
};
