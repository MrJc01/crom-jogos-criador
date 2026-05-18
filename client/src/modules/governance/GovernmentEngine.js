/**
 * GovernmentEngine — Tipos de governo emergentes com transições autônomas.
 * 
 * Inspirações: Civ6 (governments + policy cards), Stellaris (ethics/civics),
 *              Jared Diamond (elite isolation causes collapse)
 * 
 * 10 tipos de governo: tribal → chiefdom → monarchy → republic → democracy etc.
 * Cada governo tem policy slots e modifiers únicos.
 * Transições são EMERGENTES (baseadas em pop, morale, literacy, tech).
 */
export default {
    id: 'government_engine',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        if (engine.day % 90 !== 0) return; // Trimestral
        if (!node.infected) return;
        
        // Inicializa governo global
        if (!engine.currentGovernment) {
            engine.currentGovernment = {
                type: 'tribal',
                name: 'Tribal',
                modifiers: { growthBonus: 0.10, researchPenalty: -0.20 },
                policySlots: 1,
                policies: [],
                since: engine.year
            };
        }
        if (!engine.literacy) engine.literacy = 5; // 5% base
        
        // Só processa uma vez por tick global (no primeiro node)
        if (engine._govProcessed === engine.year + '_' + engine.day) return;
        engine._govProcessed = engine.year + '_' + engine.day;
        
        const gov = engine.currentGovernment;
        const pop = engine.globalPop;
        const morale = this.getGlobalMorale(engine);
        const techs = engine.unlockedTechs?.size || 0;
        const literacy = engine.literacy;
        
        // ========================================
        // EVOLUÇÃO DA LITERACIA
        // ========================================
        // Literacia cresce com escolas (techs educação) e era
        if (engine.unlockedTechs?.has('educacao_universal')) {
            engine.literacy = Math.min(100, literacy + 0.5); // +0.5%/trimestre
        } else if (engine.unlockedTechs?.has('codigo_de_leis')) {
            engine.literacy = Math.min(60, literacy + 0.1); // Cap 60% sem educação formal
        } else {
            engine.literacy = Math.min(20, literacy + 0.01); // Cap 20% oral
        }
        
        // ========================================
        // DETECÇÃO DE TRANSIÇÃO DE GOVERNO
        // ========================================
        const possibleGovs = this.getEligibleGovernments(pop, morale, literacy, techs, engine);
        
        // Prioriza governo mais avançado elegível
        if (possibleGovs.length > 0) {
            const bestGov = possibleGovs[possibleGovs.length - 1]; // Último = mais avançado
            
            if (bestGov.type !== gov.type) {
                // Transição! Verifica se é voluntária ou revolucionária
                const isRevolution = morale < 25 || engine.pressures.social > 2.0;
                
                const oldName = gov.name;
                engine.currentGovernment = {
                    type: bestGov.type,
                    name: bestGov.name,
                    modifiers: bestGov.modifiers,
                    policySlots: bestGov.policySlots,
                    policies: [],
                    since: engine.year
                };
                
                // Instabilidade na transição
                engine.pressures.social += isRevolution ? 2.0 : 0.5;
                
                const emoji = isRevolution ? '🔥' : '🏛️';
                const verb = isRevolution ? 'REVOLUÇÃO' : 'TRANSIÇÃO';
                
                if (engine.onEvent) {
                    engine.onEvent({ 
                        message: `${emoji} ${verb} POLÍTICA: ${oldName} → ${bestGov.name}! ${isRevolution ? 'O povo derrubou o regime!' : 'Transição pacífica de poder.'}`, 
                        type: isRevolution ? 'nemesis' : 'milestone', 
                        color: isRevolution ? '#c0392b' : '#3498db' 
                    }, isRevolution ? 'nemesis' : 'milestone');
                    engine.logEvent?.({ message: `${emoji} ${verb}: ${oldName} → ${bestGov.name}` }, 'diplomacy');
                }
                
                // Revolução mata gente
                if (isRevolution) {
                    const killed = Math.floor(pop * 0.02);
                    engine.nodes.forEach(n => {
                        if (n.infected && n.demographics.total > 0) {
                            n.demographics.kill(Math.floor(n.demographics.total * 0.02));
                        }
                    });
                }
            }
        }
        
        // ========================================
        // AUTO-SELEÇÃO DE POLICIES (Zero-Player)
        // ========================================
        const govData = engine.currentGovernment;
        if (govData.policies.length < govData.policySlots) {
            const available = this.getAvailablePolicies(engine);
            if (available.length > 0) {
                // Escolhe a melhor policy baseado na situação atual
                const best = this.chooseBestPolicy(available, engine);
                if (best && !govData.policies.includes(best.id)) {
                    govData.policies.push(best.id);
                    if (engine.onEvent) {
                        engine.onEvent({ 
                            message: `📜 NOVA POLÍTICA: "${best.name}" foi adotada pelo governo ${govData.name}.`, 
                            type: 'milestone', color: '#9b59b6' 
                        }, 'milestone');
                    }
                }
            }
        }
        
        // ========================================
        // APLICAR MODIFIERS DO GOVERNO
        // ========================================
        if (govData.modifiers.researchBonus) {
            // Bonus de pesquisa = mais DNA
            if (engine.day === 90) {
                const bonus = Math.floor(engine.adaptationPoints * govData.modifiers.researchBonus * 0.1);
                engine.adaptationPoints += bonus;
            }
        }
        if (govData.modifiers.growthBonus) {
            // Bonus de crescimento global
            globalRules.global_r_boost *= (1 + govData.modifiers.growthBonus);
        }
    },
    
    getGlobalMorale(engine) {
        let totalMorale = 0;
        let count = 0;
        engine.nodes.forEach(node => {
            if (node.infected && node.morale !== undefined) {
                totalMorale += node.morale;
                count++;
            }
        });
        return count > 0 ? totalMorale / count : 50;
    },
    
    getEligibleGovernments(pop, morale, literacy, techs, engine) {
        const govs = [];
        
        // Sempre elegível
        govs.push({ type: 'tribal', name: 'Tribal', modifiers: { growthBonus: 0.10, researchPenalty: -0.20 }, policySlots: 1 });
        
        if (pop >= 500) {
            govs.push({ type: 'chiefdom', name: 'Chefia', modifiers: { growthBonus: 0.05, trustBonus: 5, militaryBonus: 0.10 }, policySlots: 1 });
        }
        if (pop >= 2000 && engine.nodes.values().next().value?.religion?.active) {
            govs.push({ type: 'theocracy', name: 'Teocracia', modifiers: { moraleBonus: 15, researchPenalty: -0.30 }, policySlots: 2 });
        }
        if (pop >= 5000) {
            govs.push({ type: 'monarchy', name: 'Monarquia', modifiers: { stabilityBonus: 0.20, trustBonus: 10 }, policySlots: 2 });
        }
        if (pop >= 20000 && literacy >= 30) {
            govs.push({ type: 'republic', name: 'República', modifiers: { moraleBonus: 10, researchBonus: 0.15 }, policySlots: 3 });
        }
        if (pop >= 50000 && literacy >= 50 && techs >= 15) {
            govs.push({ type: 'democracy', name: 'Democracia', modifiers: { moraleBonus: 20, researchBonus: 0.25 }, policySlots: 4 });
        }
        if (pop >= 10000 && morale < 30) {
            govs.push({ type: 'autocracy', name: 'Autocracia', modifiers: { stabilityBonus: 0.30, moralePenalty: -10, militaryBonus: 0.30 }, policySlots: 2 });
        }
        if (pop >= 100000 && literacy >= 80 && techs >= 25) {
            govs.push({ type: 'technocracy', name: 'Tecnocracia', modifiers: { researchBonus: 0.50, moralePenalty: -5 }, policySlots: 4 });
        }
        if (pop >= 100000 && techs >= 20) {
            govs.push({ type: 'corporatocracy', name: 'Corporatocracia', modifiers: { tradeBonus: 0.50, moralePenalty: -15 }, policySlots: 3 });
        }
        if (engine.unlockedTechs?.has('cyberpunk_upload')) {
            govs.push({ type: 'hivemind', name: 'Mente Colmeia', modifiers: { researchBonus: 1.0 }, policySlots: 0 });
        }
        
        return govs;
    },
    
    getAvailablePolicies(engine) {
        return [
            { id: 'conscription', name: 'Recrutamento', weight: engine.pressures.social > 1 ? 3 : 0 },
            { id: 'free_trade', name: 'Livre Comércio', weight: engine.globalTrust > 80 ? 2 : 0 },
            { id: 'public_education', name: 'Educação Pública', weight: engine.literacy < 50 ? 3 : 1 },
            { id: 'rationing', name: 'Racionamento', weight: (engine.inventory.food || 0) < 100 ? 4 : 0 },
            { id: 'propaganda', name: 'Propaganda', weight: engine.globalTrust < 50 ? 2 : 0 },
            { id: 'welfare_state', name: 'Estado de Bem-Estar', weight: engine.globalPop > 50000 ? 2 : 0 },
            { id: 'land_reform', name: 'Reforma Agrária', weight: engine.globalPop > 10000 ? 1 : 0 },
            { id: 'scientific_method', name: 'Método Científico', weight: engine.unlockedTechs?.size > 10 ? 2 : 0 }
        ];
    },
    
    chooseBestPolicy(available, engine) {
        const weighted = available.filter(p => p.weight > 0 && !engine.currentGovernment.policies.includes(p.id));
        if (weighted.length === 0) return null;
        weighted.sort((a, b) => b.weight - a.weight);
        return weighted[0];
    }
};
