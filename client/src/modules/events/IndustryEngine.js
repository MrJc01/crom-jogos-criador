import { Config } from '../../config/ConfigLoader.js';

const CFG = Config.event('industry') || {};

export default {
    id: CFG.id || 'events_industry_tech',
    name: 'Acidentes Industriais (Tech Engine)',
    type: 'event',
    
    triggerProbability(engine) {
        const minMinerals = CFG.minMinerals || 10000;
        const isIndustrialized = engine.inventory.minerals > minMinerals || engine.inventory.chips > 0;
        if (!isIndustrialized) return 0;
        
        if (engine.cooldowns[CFG.cooldownKey] && engine.cooldowns[CFG.cooldownKey] > 0) return 0;
        
        const pressure = Math.max(engine.pressures.tectonic || 0, engine.pressures.social || 0);
        return Math.min(CFG.maxProbability, CFG.baseProbability + pressure * CFG.pressureMultiplier); 
    },
    
    applyEvent(engine) {
        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length === 0) return null;
        
        engine.cooldowns[CFG.cooldownKey] = CFG.cooldownDays;
        const roll = Math.random();
        const ev = CFG.events || {};
        
        // 76. Quebra da Bolsa
        if (roll < (ev.stockMarketCrash?.rollMax || 0.15)) {
            const minTrust = ev.stockMarketCrash?.minTrust || 150;
            if (engine.globalTrust > minTrust) {
                engine.globalTrust = ev.stockMarketCrash?.trustFloor || 50;
                engine.pressures.social += (ev.stockMarketCrash?.socialPressureBoost || 0.5);
                return { message: `📉 CRASH DA BOLSA: A bolha financeira estourou. A Confiança despencou e a economia travou.`, type: "disaster", color: "#ff0000" };
            }
        }
        
        // 74. Colapso de Mina
        if (roll >= (ev.mineCollapse?.rollMin || 0.15) && roll < (ev.mineCollapse?.rollMax || 0.30)) {
            const maxMineral = ev.mineCollapse?.maxMineral || 5000;
            const targets = infectedNodes.filter(n => n.resources.minerals < maxMineral);
            if (targets.length > 0) {
                const t = targets[Math.floor(Math.random() * targets.length)];
                t.demographics.kill(Math.floor(t.demographics.total * (ev.mineCollapse?.killRate || 0.05)));
                engine.pressures.tectonic = Math.max(0, engine.pressures.tectonic - (ev.mineCollapse?.pressureRelief || 0.2));
                return { message: `⛏️ COLAPSO DE MINA: Câmaras subterrâneas cederam em ${t.name}. Mineiros morreram soterrados.`, nodeId: t.id, type: "disaster", color: "#aa5500" };
            }
        }
        
        // 75. Vazamento Tóxico
        if (roll >= (ev.toxicSpill?.rollMin || 0.30) && roll < (ev.toxicSpill?.rollMax || 0.45)) {
            const minMin = ev.toxicSpill?.minMinerals || 50000;
            if (engine.inventory.minerals > minMin) {
                const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
                t.resources.water = 0;
                return { message: `🛢️ VAZAMENTO TÓXICO: Resíduos industriais contaminaram os lençóis freáticos de ${t.name}. Água Potável zerou!`, nodeId: t.id, type: "disaster", color: "#aa00ff" };
            }
        }
        
        // 78. Acidente Nuclear
        if (roll >= (ev.nuclearMeltdown?.rollMin || 0.45) && roll < (ev.nuclearMeltdown?.rollMax || 0.55)) {
            const minPCs = ev.nuclearMeltdown?.minComputers || 5000;
            if (engine.inventory.computers > minPCs) {
                const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
                t.demographics.kill(Math.floor(t.demographics.total * (ev.nuclearMeltdown?.killRate || 0.5)));
                t.capacity = Math.floor(t.capacity * (ev.nuclearMeltdown?.capacityMultiplier || 0.1));
                return { message: `☢️ MELTDOWN NUCLEAR: Uma usina em ${t.name} derreteu. Zona de exclusão radioativa!`, nodeId: t.id, type: "disaster", color: "#00ff00" };
            }
        }
        
        // 77. Y2K Bug
        if (roll >= (ev.y2kBug?.rollMin || 0.55) && roll < (ev.y2kBug?.rollMax || 0.65)) {
            const minChips = ev.y2kBug?.minChips || 1000;
            if (engine.inventory.chips > minChips) {
                const lossRate = 1 - (ev.y2kBug?.techLossRate || 0.5);
                engine.inventory.chips = Math.floor(engine.inventory.chips * lossRate);
                engine.inventory.computers = Math.floor(engine.inventory.computers * lossRate);
                return { message: `🐛 BUG SISTÊMICO (Y2K): Erro corrompeu infraestrutura. Metade dos Chips e PCs perdidos!`, type: "disaster", color: "#ffff00" };
            }
        }
        
        // 81. Revolta das Máquinas
        if (roll >= (ev.aiRebellion?.rollMin || 0.65) && roll < (ev.aiRebellion?.rollMax || 0.75)) {
            const minPCs = ev.aiRebellion?.minComputers || 10000;
            if (engine.inventory.computers > minPCs) {
                engine.inventory.wood = 0;
                engine.inventory.minerals = 0;
                engine.globalTrust = 0;
                return { message: `🤖 ALUCINAÇÃO DE I.A.: Robôs autônomos jogaram todos os estoques no oceano. Trust colapsou a ZERO.`, type: "nemesis", color: "#ff00ff" };
            }
        }
        
        // 80. Cartelização
        if (roll >= (ev.corporateCartel?.rollMin || 0.75) && roll < (ev.corporateCartel?.rollMax || 0.85)) {
            engine.globalKPenalty = (engine.globalKPenalty || 1.0) * (ev.corporateCartel?.kPenaltyMult || 0.9);
            return { message: `💼 CARTEL CORPORATIVO: Megacorps fixaram preços. Capacidade de Suporte reduzida.`, type: "warning", color: "#ffffff" };
        }
        
        // 79. Avanço Médico
        if (roll >= (ev.medicalMiracle?.rollMin || 0.85)) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.capacity = Math.floor(t.capacity * (ev.medicalMiracle?.capacityBoost || 1.5));
            return { message: `🔬 MILAGRE DA MEDICINA: Panaceia acidental em ${t.name}! Capacidade de saúde +50%.`, nodeId: t.id, type: "milestone", color: "#00ffff" };
        }
        
        return null;
    }
};
