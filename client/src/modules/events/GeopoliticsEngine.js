import { Config } from '../../config/ConfigLoader.js';

const CFG = Config.event('geopolitics') || {};

export default {
    id: CFG.id || 'events_geopolitics',
    name: 'Geopolítica de Fronteiras (Geo Engine)',
    type: 'event',
    
    triggerProbability(engine) {
        if (engine.globalPop < (CFG.minGlobalPop || 500000)) return 0;
        if (engine.cooldowns[CFG.cooldownKey] && engine.cooldowns[CFG.cooldownKey] > 0) return 0;
        const pressure = Math.max(engine.pressures.social || 0, engine.pressures.biological || 0);
        return Math.min(CFG.maxProbability, CFG.baseProbability + pressure * CFG.pressureMultiplier); 
    },
    
    applyEvent(engine) {
        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length < 2) return null;
        engine.cooldowns[CFG.cooldownKey] = CFG.cooldownDays;
        const roll = Math.random();
        const ev = CFG.events || {};
        
        if (roll < (ev.diplomaticMarriage?.rollMax || 0.15)) {
            engine.globalTrust += (ev.diplomaticMarriage?.trustBonus || 50);
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            return { message: `💍 CASAMENTO DIPLOMÁTICO: Elites de ${t.name} selaram pacto. Confiança Global +${ev.diplomaticMarriage?.trustBonus || 50}!`, type: "milestone", color: "#ffb6c1" };
        }
        
        if (roll >= (ev.borderIncident?.rollMin || 0.15) && roll < (ev.borderIncident?.rollMax || 0.25)) {
            engine.globalTrust = Math.max(0, engine.globalTrust - (ev.borderIncident?.trustLoss || 40));
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            return { message: `⚔️ INCIDENTE DE FRONTEIRA: Soldados em ${t.name} atiraram contra vizinhos. Trust despencou!`, nodeId: t.id, type: "nemesis", color: "#ff0000" };
        }
        
        if (roll >= (ev.techPiracy?.rollMin || 0.25) && roll < (ev.techPiracy?.rollMax || 0.35)) {
            engine.adaptationPoints += (ev.techPiracy?.dnaBonus || 150);
            return { message: `🏴‍☠️ ESPIONAGEM TECNOLÓGICA: Patentes vazaram na Dark Web! (+${ev.techPiracy?.dnaBonus || 150} DNA Global)`, type: "warning", color: "#55aaff" };
        }
        
        if (roll >= (ev.goldenRefugees?.rollMin || 0.35) && roll < (ev.goldenRefugees?.rollMax || 0.45)) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            engine.adaptationPoints += (ev.goldenRefugees?.dnaBonus || 50) + 1000;
            return { message: `🛳️ REFUGIADOS DE OURO: Gênios e pensadores exilados chegaram em ${t.name}! (+DNA Massivo)`, nodeId: t.id, type: "milestone", color: "#ffff00" };
        }
        
        if (roll >= (ev.archaeologicalFind?.rollMin || 0.45) && roll < (ev.archaeologicalFind?.rollMax || 0.55)) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            engine.adaptationPoints += (ev.archaeologicalFind?.dnaBonus || 200);
            return { message: `🏺 DESCOBERTA ARQUEOLÓGICA: Relíquias avançadas em ${t.name}! (+${ev.archaeologicalFind?.dnaBonus || 200} DNA)`, nodeId: t.id, type: "milestone", color: "#ffcc00" };
        }
        
        if (roll >= (ev.suicideCult?.rollMin || 0.55) && roll < (ev.suicideCult?.rollMax || 0.65)) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.demographics.kill(Math.min(t.demographics.total, ev.suicideCult?.killCap || 50000));
            return { message: `💀 CULTO APOCALÍPTICO: Seita extremista induziu o auto-sacrifício em ${t.name}.`, nodeId: t.id, type: "disaster", color: "#550055" };
        }
        
        if (roll >= (ev.sterilityEpidemic?.rollMin || 0.65) && roll < (ev.sterilityEpidemic?.rollMax || 0.75)) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.sterilityTimer = ev.sterilityEpidemic?.sterilityDays || 180;
            return { message: `🚼 ESTERILIDADE MISTERIOSA: Nascimentos travados em ${t.name} por 6 meses!`, nodeId: t.id, type: "warning", color: "#aaffaa" };
        }
        
        if (roll >= (ev.christmasPeace?.rollMin || 0.75) && roll < (ev.christmasPeace?.rollMax || 0.85)) {
            engine.globalTrust = ev.christmasPeace?.trustReset || 100;
            return { message: `🕊️ A PAZ DE NATAL: Confiança Global restaurada a ${ev.christmasPeace?.trustReset || 100}%!`, type: "milestone", color: "#ffffff" };
        }
        
        if (roll >= (ev.waterSabotage?.rollMin || 0.85)) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.resources.water = 0;
            return { message: `🧪 SABOTAGEM DE AQUÍFEROS: Terroristas envenenaram as reservas de ${t.name}!`, nodeId: t.id, type: "disaster", color: "#0055ff" };
        }
        
        return null;
    }
};
