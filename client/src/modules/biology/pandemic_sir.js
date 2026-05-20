import { Config } from '../../config/ConfigLoader.js';

/**
 * 010/013/014. Motor SIR de Pandemias — Modelo Susceptible→Infected→Recovered por nó.
 * Spillover zoonótico por desmatamento + aglomeração.
 * Propagação via nós vizinhos (rotas comerciais).
 */
export default {
    id: 'pandemic_sir',
    type: 'biology',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total < 1000) return;
        
        // Inicializar estado SIR no nó
        if (!node.sir) {
            node.sir = { susceptible: 1.0, infected: 0.0, recovered: 0.0, active: false, strain: null };
        }
        
        const demoCfg = Config.demographics() || {};
        const zooCfg = demoCfg.zoonosis || { crowdingThreshold: 0.80, deforestationThreshold: 5000, baseSpilloverChance: 0.001, sirRecoveryRate: 0.05, sirTransmissionRate: 0.15 };
        
        // =============================
        // FASE 1: Spillover Zoonótico (010)
        // =============================
        if (!node.sir.active) {
            const crowding = node.demographics.total / (node.capacity || 50000);
            const deforested = (node.resources?.wood || 10000) < zooCfg.deforestationThreshold;
            
            let spilloverChance = zooCfg.baseSpilloverChance;
            if (crowding > zooCfg.crowdingThreshold) spilloverChance *= 3;
            if (deforested) spilloverChance *= 2;
            if (!engine.unlockedTechs.has('saneamento_basico')) spilloverChance *= 2;
            
            // Semanal (menos processamento)
            if (engine.day % 7 === 0 && Math.random() < spilloverChance) {
                node.sir = { susceptible: 0.95, infected: 0.05, recovered: 0.0, active: true, strain: 'pandemic_' + engine.year };
                if (engine.onEvent) {
                    engine.onEvent({ message: `🦠 SPILLOVER ZOONÓTICO em ${node.name || node.id}: Um novo patógeno saltou de animais selvagens para humanos! ${Math.floor(node.demographics.total * 0.05)} infectados iniciais.`, type: "disaster", color: "#00ff00" }, "disaster");
                    engine.logEvent?.({ message: `🦠 Spillover em ${node.id}` }, "pandemic");
                }
            }
            
            // 014. Propagação via vizinhos infectados
            if (node.neighbors && engine.day % 7 === 0) {
                for (const nId of node.neighbors) {
                    const neighbor = engine.nodes.get(nId);
                    if (neighbor?.sir?.active && neighbor.sir.infected > 0.1) {
                        // 3% chance semanal de contágio por vizinho infectado
                        if (Math.random() < 0.03) {
                            node.sir = { susceptible: 0.90, infected: 0.10, recovered: 0.0, active: true, strain: neighbor.sir.strain };
                            if (engine.onEvent) engine.onEvent({ message: `🦠 PROPAGAÇÃO: Doença de ${nId} chegou a ${node.id} via rotas comerciais!`, type: "warning", color: "#88ff00" }, "warning");
                            break;
                        }
                    }
                }
            }
            return;
        }
        
        // =============================
        // FASE 2: Dinâmica SIR (013)
        // =============================
        const beta = zooCfg.sirTransmissionRate; // Taxa de transmissão
        let gamma = zooCfg.sirRecoveryRate;       // Taxa de recuperação
        
        // Antibióticos aceleram recuperação
        if (engine.unlockedTechs.has('antibioticos')) gamma *= 2;
        // Vacinas reduzem transmissão
        if (engine.inventory.vaccines > 0) {
            engine.inventory.vaccines = Math.max(0, (engine.inventory.vaccines || 0) - 1);
            gamma *= 1.5;
        }
        
        const S = node.sir.susceptible;
        const I = node.sir.infected;
        const R = node.sir.recovered;
        
        // Equações SIR (diferenças finitas diárias)
        const newInfected = beta * S * I;
        const newRecovered = gamma * I;
        
        node.sir.susceptible = Math.max(0, S - newInfected);
        node.sir.infected = Math.max(0, I + newInfected - newRecovered);
        node.sir.recovered = Math.min(1.0, R + newRecovered);
        
        // Mortes = fração dos infectados
        let deathRate = 0.01; // 1% dos infectados morrem/dia com medicina
        if (!engine.unlockedTechs.has('medicine')) deathRate = 0.03; // 3% sem medicina
        
        // FIX BALANCE: Populações menores têm menor densidade → menor letalidade
        // Na realidade, pragas em aldeias de 100 são menos letais que em cidades de 100K
        if (node.demographics.total < 500) deathRate *= 0.1; // Quase inexistente em aldeias
        else if (node.demographics.total < 2000) deathRate *= 0.3; // Reduzida em vilas
        else if (node.demographics.total < 10000) deathRate *= 0.5; // Moderada em cidades pequenas
        
        const deaths = Math.floor(node.demographics.total * node.sir.infected * deathRate);
        if (deaths > 0) {
            node.demographics.kill(deaths);
        }
        
        // Pandemia acaba quando infected < 1%
        if (node.sir.infected < 0.01) {
            node.sir.active = false;
            node.sir.infected = 0;
            // Normalizar
            const total = node.sir.susceptible + node.sir.recovered;
            if (total > 0) {
                node.sir.susceptible /= total;
                node.sir.recovered /= total;
            }
        }
    }
};
