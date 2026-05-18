import { FactionsData } from '../../core/FactionsData.js';

/**
 * CulturalTraumaEngine — Memória e Cicatrizes Culturais
 * 
 * "Aprender com os erros". Facções que sofrem catástrofes adquirem
 * traumas permanentes (traits) que alteram seu comportamento futuro.
 */
export default {
    id: 'sociology_cultural_trauma',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        // Analisa globalmente apenas uma vez por ano
        if (engine.day !== 0 || !node.infected) return;
        if (!engine._trauma_lock) {
            engine._trauma_lock = true;
            this.processGlobalTraumas(engine);
        }
    },
    
    processGlobalTraumas(engine) {
        if (!engine.factionHistory) engine.factionHistory = {};
        
        const currentPops = engine.globalDemographics?.factions || {};
        
        for (const [facId, currentPop] of Object.entries(currentPops)) {
            const data = FactionsData.getFaction(facId);
            if (!data.traumas) data.traumas = [];
            
            const lastPop = engine.factionHistory[facId] || currentPop;
            
            // Perda de 30% da população em um único ano!
            if (currentPop < lastPop * 0.7 && lastPop > 1000) {
                let newTrauma = null;
                let eventMsg = "";
                
                // Descobrir a causa principal (heurística baseada no estado global)
                if (engine.globalTemperature > 0.8 && !data.traumas.includes("desert_survivors")) {
                    newTrauma = "desert_survivors";
                    eventMsg = "Seca Catastrófica";
                } else if (engine.globalTemperature < -0.8 && !data.traumas.includes("ice_survivors")) {
                    newTrauma = "ice_survivors";
                    eventMsg = "Inverno Mortal";
                } else if (engine._foodDeficit > 0.3 && !data.traumas.includes("famine_trauma")) {
                    newTrauma = "famine_trauma";
                    eventMsg = "A Grande Fome";
                } else if (!data.traumas.includes("war_paranoia")) {
                    newTrauma = "war_paranoia";
                    eventMsg = "Massacre da Guerra";
                }
                
                if (newTrauma) {
                    data.traumas.push(newTrauma);
                    if (!data.traits.includes(newTrauma)) data.traits.push(newTrauma);
                    
                    if (engine.onEvent) {
                        engine.onEvent({
                            message: `🧠 TRAUMA CULTURAL: A facção ${data.name} sofreu perdas massivas por ${eventMsg}. Eles adquiriram o traço permanente: ${newTrauma.toUpperCase()}!`,
                            type: 'warning', color: '#9b59b6'
                        }, 'sociology');
                    }
                }
            }
            
            // Atualiza histórico
            engine.factionHistory[facId] = currentPop;
        }
        
        // Libera o lock no tick seguinte
        setTimeout(() => { engine._trauma_lock = false; }, 0);
    }
};
