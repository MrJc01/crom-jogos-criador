import { Config } from '../../config/ConfigLoader.js';
import { FactionsData } from '../../core/FactionsData.js';

/**
 * 084. Tratados e Federações — Facções com alta Trust formam pactos.
 * 085. Mercado Global Ativo — Rotas trocam recursos autonomamente.
 * 086. Jornada Infinita — Sem Game Over, civ recomeça da pedra.
 * 087. Sistema de Neurônios por Facção — Decide entre extrair/pesquisar/expandir/guerrear.
 * 088. FSM por Facção — Estados: Expansão, Defesa, Comércio, Crise, Recuperação.
 */
export default {
    id: 'diplomacy_zero_player',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        if (engine.day % 30 !== 0) return; // Mensal
        if (!node.infected) return;
        
        const factionsPresent = Object.keys(node.demographics.dist.factions);
        if (factionsPresent.length < 1) return;
        
        // ============================================
        // 088. FSM — Cada facção tem um estado comportamental
        // ============================================
        if (!engine.factionStates) engine.factionStates = {};
        
        for (const facId of factionsPresent) {
            if (!engine.factionStates[facId]) {
                engine.factionStates[facId] = { 
                    state: 'expansion', // expansion, defense, commerce, crisis, recovery
                    turnsInState: 0 
                };
            }
            
            const fs = engine.factionStates[facId];
            fs.turnsInState++;
            const data = FactionsData.getFaction(facId);
            
            // 087. Neurônios — Decide estado baseado em condições
            const capacityRatio = node.demographics.total / (node.capacity || 50000);
            const trustLevel = engine.globalTrust;
            
            // Transição de estados
            if (fs.state === 'expansion') {
                if (capacityRatio > 0.9) fs.state = 'defense';
                else if (trustLevel > 100 && engine.inventory.minerals > 5000) fs.state = 'commerce';
                else if (engine.pressures.social > 2.0) fs.state = 'crisis';
            } else if (fs.state === 'defense') {
                if (capacityRatio < 0.5) fs.state = 'recovery';
                else if (engine.pressures.social < 0.5 && capacityRatio < 0.7) fs.state = 'expansion';
            } else if (fs.state === 'commerce') {
                if (engine.pressures.social > 1.5) fs.state = 'crisis';
                else if (capacityRatio > 0.95) fs.state = 'defense';
            } else if (fs.state === 'crisis') {
                if (fs.turnsInState > 12) { // 12 meses em crise → recuperação
                    fs.state = 'recovery';
                    fs.turnsInState = 0;
                }
            } else if (fs.state === 'recovery') {
                if (fs.turnsInState > 6 && capacityRatio < 0.6) {
                    fs.state = 'expansion';
                    fs.turnsInState = 0;
                }
            }
            
            // Aplicar efeito do estado
            switch (fs.state) {
                case 'expansion':
                    // Boost de crescimento
                    if (node.demographics.total > 100) {
                        node.demographics.addBirths(Math.floor(node.demographics.total * 0.001));
                    }
                    break;
                case 'defense':
                    // Conserva recursos, não expande
                    break;
                case 'commerce':
                    // Gera trust passivo
                    engine.globalTrust = Math.min(200, engine.globalTrust + 0.1);
                    break;
                case 'crisis':
                    // Drena resources
                    engine.pressures.social += 0.01;
                    break;
                case 'recovery':
                    // Regen lenta
                    engine.pressures.social = Math.max(0, engine.pressures.social - 0.05);
                    break;
            }
        }
        
        // ============================================
        // 084. Tratados e Federações
        // ============================================
        if (!engine.federation) engine.federation = null;
        
        // FIX BALANCE: Federação pode DISSOLVER se trust cai ou guerra ativa
        if (engine.federation) {
            if (engine.globalTrust < 40 || engine.pressures.social > 3.0) {
                if (engine.onEvent) {
                    engine.onEvent({ message: `💔 FEDERAÇÃO DISSOLVIDA: Trust baixo e tensão social destruíram a aliança diplomática.`, type: "warning", color: "#ff4400" }, "diplomacy");
                    engine.logEvent?.({ message: `💔 Federação dissolvida` }, "diplomacy");
                }
                engine.federation = null;
            } else {
                // Federação ativa: boost mútuo MAS custa resources (manutenção)
                globalRules.global_K_boost *= 1.1;
                engine.inventory.wood = Math.max(0, engine.inventory.wood - 1); // Custo diplomático
            }
        }
        
        // Formação de nova federação
        if (factionsPresent.length >= 2 && engine.globalTrust > 80 && !engine.federation) {
            if (Math.random() < 0.01) {
                engine.federation = { members: factionsPresent.slice(0, 2), formed: engine.year };
                if (engine.onEvent) {
                    engine.onEvent({ message: `🤝 FEDERAÇÃO: ${factionsPresent[0]} e ${factionsPresent[1]} formaram uma aliança diplomática! Trust compartilhado.`, type: "milestone", color: "#00aaff" }, "milestone");
                    engine.logEvent?.({ message: `🤝 Federação formada` }, "diplomacy");
                }
            }
        }
        
        // ============================================
        // 085. Mercado Global Ativo — Trocas automáticas
        // ============================================
        if (engine.day % 90 === 0 && engine.tradeRoutes) { // Trimestral
            for (const route of engine.tradeRoutes) {
                const src = engine.nodes.get(route.sourceId);
                const tgt = engine.nodes.get(route.targetId);
                if (!src?.infected || !tgt?.infected) continue;
                
                // Equalizar recursos entre nós conectados (difusão)
                const woodDiff = (src.resources.wood || 0) - (tgt.resources.wood || 0);
                if (Math.abs(woodDiff) > 1000) {
                    const transfer = Math.floor(woodDiff * 0.1);
                    src.resources.wood = (src.resources.wood || 0) - transfer;
                    tgt.resources.wood = (tgt.resources.wood || 0) + transfer;
                }
            }
        }
        
        // ============================================
        // 086. Jornada Infinita — Sem Game Over
        // ============================================
        if (engine.globalPop <= 0 && engine.day % 365 === 0) {
            // Respawn com 100 pessoas na Idade da Pedra
            const firstNode = Array.from(engine.nodes.values())[0];
            if (firstNode) {
                firstNode.demographics.addBirths(100);
                firstNode.infected = true;
                engine.techTree.unlocked.clear();
                engine.adaptationPoints = 0;
                engine.globalTrust = 100;
                if (engine.onEvent) {
                    engine.onEvent({ message: `🔄 JORNADA INFINITA: A civilização renasceu das cinzas. 100 sobreviventes recomeçam na Idade da Pedra.`, type: "milestone", color: "#00ff88" }, "milestone");
                    engine.logEvent?.({ message: `🔄 Civilização renasceu` }, "rebirth");
                }
            }
        }
    }
};
