import { Config } from '../../config/ConfigLoader.js';

const CFG = Config.event('cosmic') || {};

export default {
    id: CFG.id || 'events_cosmic_anomalies',
    name: 'Desastres Cósmicos Exógenos',
    type: 'event',
    
    triggerProbability(engine) {
        return CFG.fixedProbability || 0.001; 
    },
    
    applyEvent(engine) {
        const infectedNodes = Array.from(engine.nodes.values()).filter(n => n.infected);
        if (infectedNodes.length === 0) return null;
        
        const roll = Math.random();
        const ev = CFG.events || {};
        
        if (roll < (ev.solarStorm?.rollMax || 0.2)) {
            // Tempestade Solar
            if ((engine.inventory.chips && engine.inventory.chips > 0) || (engine.inventory.computers && engine.inventory.computers > 0)) {
                const chipsLost = engine.inventory.chips || 0;
                const compLost = engine.inventory.computers || 0;
                engine.inventory.chips = 0;
                engine.inventory.computers = 0;
                return { 
                    message: `☀️ TEMPESTADE SOLAR! EMP varreu o planeta. Perda de ${chipsLost} Chips e ${compLost} Computadores.`,
                    type: 'cosmic', color: '#f39c12'
                };
            }
        } else {
            // Impacto de Meteoro
            const targetNode = infectedNodes[Math.floor(Math.random() * infectedNodes.length)];
            const minPop = ev.meteorImpact?.minPop || 50000;
            if (targetNode.demographics.total < minPop) return null;
            
            const killRate = ev.meteorImpact?.killRate || 0.4;
            const victims = Math.floor(targetNode.demographics.total * killRate);
            targetNode.demographics.kill(victims);
            
            // Refugiados
            const refugeeRate = ev.meteorImpact?.refugeeRate || 0.1;
            const survivors = targetNode.demographics.total;
            const refugees = Math.floor(survivors * refugeeRate);
            let refugeeMsg = "";
            
            if (refugees > 0 && targetNode.neighbors.length > 0) {
                targetNode.demographics.kill(refugees);
                const neighborId = targetNode.neighbors[Math.floor(Math.random() * targetNode.neighbors.length)];
                const nNode = engine.nodes.get(neighborId);
                if (nNode) {
                    nNode.infect(0);
                    nNode.demographics.addBirths(refugees);
                    refugeeMsg = ` ${refugees.toLocaleString('pt-BR')} refugiados fugiram para ${nNode.name}.`;
                }
            }

            const mineralBonus = ev.meteorImpact?.mineralBonus || 50000;
            if (!targetNode.resources.minerals) targetNode.resources.minerals = 0;
            targetNode.resources.minerals += mineralBonus;
            
            return { 
                message: `☄️ IMPACTO DE METEORO em ${targetNode.name}! ${victims.toLocaleString('pt-BR')} mortos, mas ${mineralBonus.toLocaleString()} Minérios expostos!${refugeeMsg}`,
                nodeId: targetNode.id, type: 'cosmic', color: '#9b59b6'
            };
        }
        
        return null;
    }
};
