import { Config } from '../../config/ConfigLoader.js';

const CFG = Config.event('anomaly') || {};

export default {
    id: CFG.id || 'events_anomaly',
    name: 'Anomalias do Desconhecido (Anomaly Engine)',
    type: 'event',
    
    triggerProbability(engine) {
        if (engine.cooldowns[CFG.cooldownKey] && engine.cooldowns[CFG.cooldownKey] > 0) return 0;
        return CFG.fixedProbability || 0.005;
    },
    
    applyEvent(engine) {
        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length === 0) return null;
        
        engine.cooldowns[CFG.cooldownKey] = CFG.cooldownDays || 730;
        const roll = Math.random();
        const ev = CFG.events || {};
        
        // 91. O Obelisco
        if (roll < (ev.obelisk?.rollMax || 0.15)) {
            engine.adaptationPoints += (ev.obelisk?.dnaBonus || 500);
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.demographics.total += (ev.obelisk?.popBonus || 10000);
            return { message: `🕋 O OBELISCO: Um monólito negro surgiu em ${t.name}. A mente humana se expandiu (+${ev.obelisk?.dnaBonus || 500} DNA).`, nodeId: t.id, type: "nemesis", color: "#aa00aa" };
        }
        
        // 92. O Silêncio Total
        if (roll >= (ev.totalSilence?.rollMin || 0.15) && roll < (ev.totalSilence?.rollMax || 0.30)) {
            engine.globalKPenalty = (engine.globalKPenalty || 1.0) * (ev.totalSilence?.kPenaltyMult || 0.7);
            engine.globalTrust = Math.max(0, engine.globalTrust - (ev.totalSilence?.trustLoss || 80));
            return { message: `🔇 O SILÊNCIO TOTAL: Doença mental assombrosa se espalhou. Comércio parou, aprendizado morreu.`, type: "disaster", color: "#666666" };
        }
        
        // 93. Sincronicidade Global
        if (roll >= (ev.globalSynchrony?.rollMin || 0.30) && roll < (ev.globalSynchrony?.rollMax || 0.45)) {
            engine.pressures.social = 0;
            engine.pressures.biological = 0;
            engine.pressures.tectonic = 0;
            engine.pressures.climatic = 0;
            engine.globalTrust = ev.globalSynchrony?.trustReset || 200;
            return { message: `🧘 SINCRONICIDADE GLOBAL: Todo o planeta sonhou junto. Todas as pressões zeradas. Utopia temporária!`, type: "milestone", color: "#ffffff" };
        }
        
        // 94. Queda de Satélite
        if (roll >= (ev.satelliteCrash?.rollMin || 0.45) && roll < (ev.satelliteCrash?.rollMax || 0.60)) {
            const minPCs = ev.satelliteCrash?.minComputers || 5000;
            if (engine.inventory.computers > minPCs) {
                const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
                t.demographics.kill(Math.floor(t.demographics.total * (ev.satelliteCrash?.killRate || 0.1)));
                return { message: `🛰️ QUEDA DO CÉU: Estação orbital despencou em ${t.name}. Medo atávico das estrelas surgiu.`, nodeId: t.id, type: "disaster", color: "#ff5555" };
            }
        }
        
        // 95. Despertar Criogênico
        if (roll >= (ev.cryogenicAwakening?.rollMin || 0.60) && roll < (ev.cryogenicAwakening?.rollMax || 0.75)) {
            const maxPop = ev.cryogenicAwakening?.maxPop || 50000;
            const minTechs = ev.cryogenicAwakening?.minTechs || 20;
            if (engine.globalPop < maxPop && engine.techTree && engine.techTree.unlocked.size > minTechs) {
                const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
                t.demographics.total += (ev.cryogenicAwakening?.popBonus || 20000);
                return { message: `🧊 DESPERTAR CRIOGÊNICO: Abóbadas do antigo mundo abriram em ${t.name}. ${(ev.cryogenicAwakening?.popBonus || 20000).toLocaleString()} humanos do passado acordaram!`, nodeId: t.id, type: "milestone", color: "#00ffff" };
            }
        }
        
        // 96. Milagre do Solo
        if (roll >= (ev.soilMiracle?.rollMin || 0.75)) {
            const biomes = ev.soilMiracle?.biomes || ['desert'];
            const targets = infectedNodes.filter(n => biomes.includes(n.biome.id) || n.soil < 50);
            if (targets.length > 0) {
                const t = targets[Math.floor(Math.random() * targets.length)];
                t.soil = ev.soilMiracle?.soilReset || 100;
                t.resources.water += (ev.soilMiracle?.waterBonus || 10000);
                t.biome = { id: 'jungle', capacityBase: 100000 };
                return { message: `🌸 MILAGRE DO SOLO: Desertos em ${t.name} desabrocharam em floresta tropical perfeita!`, nodeId: t.id, type: "milestone", color: "#00ff55" };
            }
        }
        
        return null;
    }
};
