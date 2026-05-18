import { Config } from '../../config/ConfigLoader.js';

/**
 * 023. Atrito Logístico — Transporte de recursos consome energia proporcional à distância.
 * 029. Pirataria — Rotas ricas sofrem roubo aleatório.
 * 054. Êxodo Rural — Pop rural produz alimento para cidades industriais.
 */
export default {
    id: 'trade_logistics',
    type: 'economy',
    
    applyTick(node, globalRules, engine) {
        if (engine.day % 30 !== 0) return; // Mensal
        if (!node.infected || node.demographics.total < 100) return;
        
        const ecoCfg = Config.economy() || {};
        const tradeCfg = ecoCfg.trade || { frictionPerDistance: 0.02, piracyChance: 0.05 };
        
        // 023. Atrito Logístico — Cada rota comercial consome recursos proporcionais
        if (engine.tradeRoutes && engine.tradeRoutes.length > 0) {
            const activeRoutes = engine.tradeRoutes.filter(r => {
                const src = engine.nodes.get(r.sourceId);
                const tgt = engine.nodes.get(r.targetId);
                return src?.infected && tgt?.infected;
            });
            
            // Cada rota ativa custa um pouco de madeira/comida
            const routeCost = activeRoutes.length * tradeCfg.frictionPerDistance;
            engine.inventory.wood = Math.max(0, engine.inventory.wood - Math.floor(routeCost * 10));
        }
        
        // 029. Pirataria — Rotas ricas sofrem roubo
        if (engine.inventory.minerals > 10000 && Math.random() < tradeCfg.piracyChance) {
            const stolen = Math.floor(engine.inventory.minerals * 0.01); // 1% roubado
            engine.inventory.minerals -= stolen;
            if (engine.onEvent && stolen > 100) {
                engine.onEvent({ message: `🏴‍☠️ PIRATARIA: Bandidos roubaram ${stolen.toLocaleString('pt-BR')} minerais de caravanas comerciais!`, type: "warning", color: "#aa0000" }, "warning");
                engine.logEvent?.({ message: `🏴‍☠️ Pirataria: ${stolen} minerais roubados` }, "piracy");
            }
        }
        
        // 054. Êxodo Rural — Nós de baixa densidade produzem "alimento" para o inventário global
        if (node.demographics.total < 5000 && node.biome?.id !== 'desert') {
            const farmOutput = Math.floor(node.demographics.total * 0.01);
            if (farmOutput > 0) {
                engine.inventory.food = (engine.inventory.food || 0) + farmOutput;
            }
        }
        
        // 055. Refugiados — Nós com pop > K empurram excedente para vizinhos
        if (node.demographics.total > node.capacity * 1.5 && node.neighbors.length > 0) {
            const excess = Math.floor((node.demographics.total - node.capacity) * 0.1);
            if (excess > 50) {
                const targetId = node.neighbors[Math.floor(Math.random() * node.neighbors.length)];
                const targetNode = engine.nodes.get(targetId);
                if (targetNode) {
                    node.demographics.kill(excess);
                    if (!targetNode.infected) targetNode.infect?.(0);
                    if (targetNode.demographics) {
                        targetNode.demographics.addBirths(excess);
                        // Pressão social no destino
                        engine.pressures.social += 0.1;
                    }
                }
            }
        }
    }
};
