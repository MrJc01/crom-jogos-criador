import { Config } from '../../config/ConfigLoader.js';

const CFG = Config.event('nature') || {};

export default {
    id: CFG.id || 'events_nature_exogenous',
    name: 'Natureza Exógena (Nature Engine)',
    type: 'event',
    
    triggerProbability(engine) {
        const pressure = Math.max(engine.pressures.climatic || 0, engine.pressures.tectonic || 0);
        
        if (engine.cooldowns[CFG.cooldownKey] && engine.cooldowns[CFG.cooldownKey] > 0) return 0;
        
        return Math.min(CFG.maxProbability, CFG.baseProbability + pressure * CFG.pressureMultiplier); 
    },
    
    applyEvent(engine) {
        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length === 0) return null;
        
        engine.cooldowns[CFG.cooldownKey] = CFG.cooldownDays;

        const roll = Math.random();
        const ev = CFG.events || {};
        
        // FIX BALANCE: Função de escalonamento realista de dano.
        // Aldeias pequenas (<1000) sofrem menos mortes proporcionais que cidades grandes.
        // Na realidade, um terremoto em uma vila de 100 mata 2-5, não 15-30.
        const scaledKillRate = (baseRate, pop) => {
            if (pop < 500) return Math.min(baseRate, 0.01); // Max 1% para fundadores
            if (pop < 2000) return Math.min(baseRate, 0.02); // Max 2% para aldeias
            if (pop < 10000) return Math.min(baseRate, 0.03); // Max 3% para vilas
            if (pop < 50000) return Math.min(baseRate, 0.05); // Max 5% para cidades pequenas
            return baseRate; // Taxa cheia para metrópoles
        };
        
        // 57. Incêndio Florestal Estocástico
        if (roll < (ev.forestFire?.rollMax || 0.20)) {
            engine.pressures.climatic = Math.max(0, engine.pressures.climatic - (ev.forestFire?.pressureRelief || 0.2));
            const minWood = ev.forestFire?.minWood || 10000;
            const biomes = ev.forestFire?.biomes || ['jungle', 'plains'];
            const targets = infectedNodes.filter(n => n.resources.wood > minWood && biomes.includes(n.biome.id));
            if (targets.length > 0) {
                const t = targets[Math.floor(Math.random() * targets.length)];
                t.resources.wood = Math.floor(t.resources.wood * (1 - (ev.forestFire?.woodLossRate || 0.5)));
                return { message: `🔥 INCÊNDIO FLORESTAL: O tempo seco iniciou um megaincêndio em ${t.name}. Metade das florestas locais virou cinzas!`, nodeId: t.id, type: "disaster", color: "#ff8800" };
            }
        }
        
        // 58. Tempestade Solar (Flares)
        if (roll >= (ev.solarStorm?.rollMin || 0.20) && roll < (ev.solarStorm?.rollMax || 0.35)) {
            if (engine.inventory.computers > 0 || engine.inventory.chips > 0) {
                engine.inventory.computers = 0;
                engine.inventory.chips = 0;
                engine.globalTrust = Math.max(0, engine.globalTrust - (ev.solarStorm?.trustLoss || 30));
                return { message: `☀️ TEMPESTADE SOLAR CCE: Uma explosão solar brutal varreu a órbita. Todos os microchips do mundo fritaram e a Confiança despencou!`, type: "disaster", color: "#ffff00" };
            } else {
                return { message: `✨ AURORA BOREAL GLOBAL: Uma ejeção de massa coronal pintou o céu de verde vivo. Antigos deuses foram louvados no mapa.`, type: "milestone", color: "#00ff00" };
            }
        }
        
        // 59. Tsunami & 63. Terremotos
        if (roll >= (ev.megaEarthquake?.rollMin || 0.35) && roll < (ev.megaEarthquake?.rollMax || 0.50)) {
            engine.pressures.tectonic = Math.max(0, engine.pressures.tectonic - (ev.megaEarthquake?.pressureRelief || 0.5));
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            const rate = scaledKillRate(ev.megaEarthquake?.killRate || 0.15, t.demographics.total);
            t.demographics.kill(Math.floor(t.demographics.total * rate));
            t.resources.minerals += (ev.megaEarthquake?.mineralBonus || 5000);
            return { message: `🌊 MEGATERREMOTO E TSUNAMI: Uma falha oculta sob ${t.name} cedeu. O mar varreu as costas, mas novos minérios afloraram!`, nodeId: t.id, type: "disaster", color: "#0000ff" };
        }
        
        // 60. Praga de Gafanhotos
        if (roll >= (ev.locustPlague?.rollMin || 0.50) && roll < (ev.locustPlague?.rollMax || 0.65)) {
            const biomes = ev.locustPlague?.biomes || ['plains'];
            const targets = infectedNodes.filter(n => biomes.includes(n.biome.id));
            if (targets.length > 0) {
                const t = targets[Math.floor(Math.random() * targets.length)];
                t.soil = Math.max(30, Math.floor(t.soil * 0.5));
                t.resources.wood = Math.floor(t.resources.wood * (1 - (ev.locustPlague?.woodLossRate || 0.8)));
                return { message: `🦗 NUVEM DE GAFANHOTOS: Uma praga bíblica consumiu as safras das Planícies de ${t.name}. A agricultura parou (Solo = ${t.soil}%).`, nodeId: t.id, type: "disaster", color: "#88aa00" };
            }
        }
        
        // 61. Eclipse Solar Prolongado
        if (roll >= (ev.solarEclipse?.rollMin || 0.60) && roll < (ev.solarEclipse?.rollMax || 0.68)) {
            engine.globalKPenalty = (engine.globalKPenalty || 1.0) * (ev.solarEclipse?.kPenaltyMult || 0.8);
            return { message: `🌘 ECLIPSE SOMBRIO: O Sol escureceu de forma anormal por semanas. As temperaturas despencaram e o terror místico assolou as tribos.`, type: "warning", color: "#555555" };
        }
        
        // 62. Mutação Gênica Aleatória
        if (roll >= (ev.beneficialMutation?.rollMin || 0.68) && roll < (ev.beneficialMutation?.rollMax || 0.75)) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            engine.adaptationPoints += (ev.beneficialMutation?.dnaBonus || 100);
            return { message: `🧬 MUTAÇÃO BENÉFICA: Crianças em ${t.name} nasceram com extrema resistência imunológica (+${ev.beneficialMutation?.dnaBonus || 100} DNA).`, nodeId: t.id, type: "milestone", color: "#00ff88" };
        }
        
        // Tarefa 29: Pequena Era do Gelo
        if (roll >= (ev.littleIceAge?.rollMin || 0.75) && roll < (ev.littleIceAge?.rollMax || 0.82)) {
            engine.globalTemperatureOffset += (ev.littleIceAge?.tempOffset || -2.0);
            return { message: `❄️ PEQUENA ERA DO GELO: Um resfriamento global anômalo cobriu o hemisfério de neve. As colheitas vão falhar severamente!`, type: "disaster", color: "#00ffff" };
        }
        
        // Tarefa 32: Impacto de Asteroide
        if (roll >= (ev.asteroidImpact?.rollMin || 0.82) && roll < (ev.asteroidImpact?.rollMax || 0.90)) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            const rate = scaledKillRate(ev.asteroidImpact?.killRate || 0.3, t.demographics.total);
            t.demographics.kill(Math.floor(t.demographics.total * rate));
            t.resources.minerals += (ev.asteroidImpact?.mineralBonus || 50000);
            return { message: `☄️ IMPACTO DE METEORO: Um asteroide devastou ${t.name} (${Math.floor(rate*100)}% mortos), mas deixou Metais Raros!`, nodeId: t.id, type: "disaster", color: "#ff8800" };
        }
        
        // Tarefa 33: Inverno Vulcânico
        if (roll >= (ev.volcanicWinter?.rollMin || 0.90)) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.soil = Math.max(40, Math.floor(t.soil * 0.6));
            engine.globalKPenalty = (engine.globalKPenalty || 1.0) * (ev.volcanicWinter?.kPenaltyMult || 0.7);
            return { message: `🌋 INVERNO VULCÂNICO: Um supervulcão entrou em erupção em ${t.name}. As cinzas bloquearam o Sol globalmente (Solo = ${t.soil}%).`, nodeId: t.id, type: "disaster", color: "#ff4444" };
        }
        
        return null;
    }
};
