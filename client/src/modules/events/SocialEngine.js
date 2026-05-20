import { Config } from '../../config/ConfigLoader.js';

const CFG = Config.event('social') || {};

export default {
    id: CFG.id || 'events_cliodynamics',
    name: 'Cliodinâmica e Sociedade (Social Engine)',
    type: 'event',
    
    triggerProbability(engine) {
        const pressure = engine.pressures.social || 0;
        if (engine.cooldowns[CFG.cooldownKey] && engine.cooldowns[CFG.cooldownKey] > 0) return 0;
        return Math.min(CFG.maxProbability, CFG.baseProbability + pressure * CFG.pressureMultiplier);
    },
    
    applyEvent(engine) {
        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length === 0) return null;
        
        engine.cooldowns[CFG.cooldownKey] = CFG.cooldownDays;
        engine.pressures.social = Math.max(0, engine.pressures.social - (CFG.pressureRelief || 0.3));

        const roll = Math.random();
        const ev = CFG.events || {};
        
        // FIX BALANCE: Escalonamento realista de dano social.
        // Aldeias pequenas não sofrem histeria/pânico na mesma escala que cidades.
        const scaledKillRate = (baseRate, pop) => {
            if (pop < 500) return Math.min(baseRate, 0.01);
            if (pop < 2000) return Math.min(baseRate, 0.02);
            if (pop < 10000) return Math.min(baseRate, 0.03);
            if (pop < 50000) return Math.min(baseRate, 0.05);
            return baseRate;
        };
        
        // 65. Revolta dos Camponeses
        if (roll < (ev.peasantRevolt?.rollMax || 0.20)) {
            const minCapRatio = ev.peasantRevolt?.minCapRatio || 0.9;
            const minTrust = ev.peasantRevolt?.minTrust || 80;
            const targets = infectedNodes.filter(n => n.demographics.total > n.capacity * minCapRatio && engine.globalTrust > minTrust);
            if (targets.length > 0) {
                const t = targets[Math.floor(Math.random() * targets.length)];
                t.demographics.kill(Math.floor(t.demographics.total * (ev.peasantRevolt?.killRate || 0.3)));
                engine.globalTrust *= (ev.peasantRevolt?.trustMultiplier || 0.5);
                return { message: `🔥 REVOLTA CAMPONESA: A desigualdade explodiu em ${t.name}. As elites foram depostas e a Confiança Global despencou!`, nodeId: t.id, type: "disaster", color: "#ff4444" };
            }
        }
        
        // 64. O Assassino Famoso
        if (roll >= (ev.famousAssassin?.rollMin || 0.20) && roll < (ev.famousAssassin?.rollMax || 0.30)) {
            const minPop = ev.famousAssassin?.minPop || 100000;
            const targets = infectedNodes.filter(n => n.demographics.total > minPop);
            if (targets.length > 0) {
                const t = targets[Math.floor(Math.random() * targets.length)];
                t.demographics.kill(Math.floor(t.demographics.total * (ev.famousAssassin?.killRate || 0.1)));
                engine.globalTrust = Math.max(0, engine.globalTrust - (ev.famousAssassin?.trustLoss || 20));
                return { message: `🗡️ ASSASSINATO DO LÍDER: Um estadista icônico foi morto em ${t.name}. A região fraturou em conflito civil.`, nodeId: t.id, type: "nemesis", color: "#ff0000" };
            }
        }
        
        // 68. Decadência Burocrática
        if (roll >= (ev.bureaucraticDecay?.rollMin || 0.30) && roll < (ev.bureaucraticDecay?.rollMax || 0.40)) {
            const minTechs = ev.bureaucraticDecay?.minTechs || 20;
            const targets = infectedNodes.filter(n => engine.techTree && engine.techTree.unlocked && engine.techTree.unlocked.size > minTechs);
            if (targets.length > 0) {
                const t = targets[Math.floor(Math.random() * targets.length)];
                const lossRate = ev.bureaucraticDecay?.resourceLossRate || 0.5;
                t.resources.wood *= (1 - lossRate);
                t.resources.minerals *= (1 - lossRate);
                return { message: `🏛️ DECADÊNCIA: A burocracia corrupta de ${t.name} "perdeu" ${Math.floor(lossRate*100)}% dos estoques em desvios sistêmicos.`, nodeId: t.id, type: "warning", color: "#aa5500" };
            }
        }
        
        // 67. Novo Filósofo
        if (roll >= (ev.newPhilosopher?.rollMin || 0.40) && roll < (ev.newPhilosopher?.rollMax || 0.50)) {
            const bonus = ev.newPhilosopher?.dnaBonus || 50;
            engine.adaptationPoints += bonus;
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            return { message: `💡 UM NOVO PENSADOR: Um gênio nasceu em ${t.name}! A humanidade recebeu +${bonus} DNA.`, nodeId: t.id, type: "milestone", color: "#00ffff" };
        }
        
        // 66. Cisma Religioso
        if (roll >= (ev.religiousSchism?.rollMin || 0.50) && roll < (ev.religiousSchism?.rollMax || 0.60)) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            t.religiousSchism = true;
            return { message: `📜 CISMA RELIGIOSO: Uma nova doutrina radical varreu ${t.name}. Guerra religiosa atrasou o desenvolvimento.`, nodeId: t.id, type: "nemesis", color: "#8800ff" };
        }
        
        // 72. Movimento Neo-Luddita
        if (roll >= (ev.neoLuddite?.rollMin || 0.60) && roll < (ev.neoLuddite?.rollMax || 0.70)) {
            if (engine.inventory.computers > 0 || engine.inventory.chips > 0) {
                const lossRate = 1 - (ev.neoLuddite?.techLossRate || 0.2);
                engine.inventory.computers = Math.floor(engine.inventory.computers * lossRate);
                engine.inventory.chips = Math.floor(engine.inventory.chips * lossRate);
                return { message: `⚙️ SABOTAGEM LUDDITA: Multidões destruíram ${Math.floor((1-lossRate)*100)}% dos Computadores e Chips em protesto!`, type: "disaster", color: "#ff8800" };
            }
        }
        
        // 71. Mártir Popular
        if (roll >= (ev.popularMartyr?.rollMin || 0.70) && roll < (ev.popularMartyr?.rollMax || 0.80)) {
            engine.pressures.social += (ev.popularMartyr?.socialPressureBoost || 0.5);
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            return { message: `⚖️ MÁRTIR POPULAR: Uma execução pública em ${t.name} chocou o mundo. Tensão Social disparou!`, nodeId: t.id, type: "warning", color: "#ff5555" };
        }
        
        // 69. Histeria Coletiva
        if (roll >= (ev.collectiveHysteria?.rollMin || 0.80) && roll < (ev.collectiveHysteria?.rollMax || 0.90)) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            const rate = scaledKillRate(ev.collectiveHysteria?.killRate || 0.05, t.demographics.total);
            t.demographics.kill(Math.floor(t.demographics.total * rate));
            return { message: `😵 HISTERIA COLETIVA: Uma síndrome psicogênica fez parte da população de ${t.name} definhar num transe fatal.`, nodeId: t.id, type: "warning", color: "#aa00aa" };
        }
        
        // 73. Pânico em Massa
        if (roll >= (ev.massPanic?.rollMin || 0.90)) {
            const t = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            const rate = scaledKillRate(ev.massPanic?.killRate || 0.2, t.demographics.total);
            t.demographics.kill(Math.floor(t.demographics.total * rate));
            return { message: `🏃 PÂNICO GERAL: Boato de Praga fez ${Math.floor(rate*100)}% de ${t.name} fugir para a selva.`, nodeId: t.id, type: "warning", color: "#88aa88" };
        }
        
        return null;
    }
};
