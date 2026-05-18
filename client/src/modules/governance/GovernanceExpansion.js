/**
 * N09. PolicyEngine — Sistema de Policy Cards com trade-offs.
 * N10. LawEngine — Código de leis emergente.
 * N11. TaxEngine — Tributação e tesouro.
 * N12. ElectionEngine — Eleições em democracias.
 * 
 * Combinados em GovernanceExpansion para performance (1 plugin).
 */
export default {
    id: 'governance_expansion',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected) return;
        if (engine.day % 30 !== 0) return; // Mensal
        
        // Só processa uma vez por tick global
        if (engine._govExpProcessed === engine.year + '_' + engine.day) return;
        engine._govExpProcessed = engine.year + '_' + engine.day;
        
        // ========================================
        // N11: TRIBUTAÇÃO
        // ========================================
        if (!engine.treasury) engine.treasury = 0;
        if (!engine.taxRate) engine.taxRate = 0.05; // 5% base
        
        const gov = engine.currentGovernment;
        if (gov) {
            // Tax rate varia por governo
            const govTaxRates = {
                tribal: 0.02, chiefdom: 0.05, theocracy: 0.10, monarchy: 0.15,
                republic: 0.12, democracy: 0.10, autocracy: 0.20, technocracy: 0.15,
                corporatocracy: 0.08, hivemind: 0.00
            };
            engine.taxRate = govTaxRates[gov.type] || 0.10;
        }
        
        // Coleta de impostos (mensal)
        const taxRevenue = Math.floor(engine.globalPop * engine.taxRate * 0.001);
        engine.treasury += taxRevenue;
        
        // Tax afeta morale
        engine.nodes.forEach(n => {
            if (!n.infected) return;
            if (!n.moraleFactors) n.moraleFactors = {};
            n.moraleFactors.tax = engine.taxRate > 0.15 ? -10 : (engine.taxRate < 0.05 ? 5 : 0);
        });
        
        // Treasury financia coisas automaticamente
        if (engine.treasury > 100) {
            // Investimento em infraestrutura
            engine.inventory.wood += Math.floor(engine.treasury * 0.01);
            engine.inventory.minerals += Math.floor(engine.treasury * 0.005);
            engine.treasury = Math.floor(engine.treasury * 0.95); // 5% de despesas
        }
        
        // ========================================
        // N10: CÓDIGO DE LEIS
        // ========================================
        if (!engine.laws) engine.laws = [];
        
        if (engine.unlockedTechs?.has('codigo_de_leis') && engine.laws.length < 5) {
            const possibleLaws = [
                { id: 'property_rights', name: 'Direito de Propriedade', morale: 3, crime: -1, production: 0.05, minPop: 5000 },
                { id: 'criminal_code', name: 'Código Penal', morale: 0, crime: -2, production: 0, minPop: 10000 },
                { id: 'labor_laws', name: 'Leis Trabalhistas', morale: 5, crime: 0, production: -0.05, minPop: 20000 },
                { id: 'slavery_ban', name: 'Abolição da Escravidão', morale: 10, crime: -1, production: -0.10, minPop: 50000 },
                { id: 'womens_rights', name: 'Direitos das Mulheres', morale: 5, growth: 0.10, minPop: 100000 },
                { id: 'environmental_law', name: 'Lei Ambiental', pollution: -0.30, production: -0.05, minPop: 200000 },
                { id: 'universal_healthcare', name: 'Saúde Universal', morale: 8, death: -0.20, tax: 0.05, minPop: 500000 }
            ];
            
            for (const law of possibleLaws) {
                if (engine.laws.find(l => l.id === law.id)) continue;
                if (engine.globalPop < law.minPop) continue;
                
                if (Math.random() < 0.005) {
                    engine.laws.push(law);
                    if (engine.onEvent) {
                        engine.onEvent({
                            message: `⚖️ NOVA LEI: "${law.name}" foi promulgada! ${law.morale > 0 ? `Morale +${law.morale}` : ''} ${law.crime ? `Crime ${law.crime}` : ''}`,
                            type: 'milestone', color: '#8e44ad'
                        }, 'milestone');
                        engine.logEvent?.({ message: `⚖️ Lei: ${law.name}` }, 'diplomacy');
                    }
                    break;
                }
            }
        }
        
        // Aplicar efeitos das leis
        let lawMorale = 0;
        let lawCrime = 0;
        for (const law of engine.laws) {
            lawMorale += (law.morale || 0);
            lawCrime += (law.crime || 0);
        }
        engine.nodes.forEach(n => {
            if (!n.infected) return;
            if (!n.moraleFactors) n.moraleFactors = {};
            n.moraleFactors.laws = lawMorale;
            n.crime = Math.max(0, (n.crime || 0) + lawCrime * 0.01);
        });
        
        // ========================================
        // N12: ELEIÇÕES (em democracias/repúblicas)
        // ========================================
        if (!engine.electionYear) engine.electionYear = 0;
        
        if (gov && (gov.type === 'democracy' || gov.type === 'republic')) {
            if (engine.year >= engine.electionYear + 4) { // A cada 4 anos
                engine.electionYear = engine.year;
                
                // Simula eleição: facção mais popular muda policies
                const factions = engine.globalDemographics?.factions || {};
                let winner = null;
                let maxPop = 0;
                for (const [fac, count] of Object.entries(factions)) {
                    if (count > maxPop) { maxPop = count; winner = fac; }
                }
                
                // Resultado
                const isCorrupt = (engine.laws.find(l => l.id === 'criminal_code') ? false : Math.random() < 0.1);
                
                if (isCorrupt) {
                    engine.pressures.social += 1.0;
                    engine.globalTrust = Math.max(5, engine.globalTrust - 15);
                    if (engine.onEvent) {
                        engine.onEvent({
                            message: `🗳️ FRAUDE ELEITORAL: Eleição em ${engine.year} foi fraudada! Trust -15. Protestos eclodem.`,
                            type: 'nemesis', color: '#c0392b'
                        }, 'nemesis');
                    }
                } else {
                    engine.globalTrust = Math.min(200, engine.globalTrust + 5);
                    if (engine.onEvent) {
                        engine.onEvent({
                            message: `🗳️ ELEIÇÃO: Eleição democrática em ${engine.year}. ${winner || 'Coalizão'} venceu. Trust +5.`,
                            type: 'milestone', color: '#3498db'
                        }, 'milestone');
                    }
                    
                    // Shuffle policies
                    if (gov.policies && gov.policies.length > 0) {
                        gov.policies.pop();
                    }
                }
                
                engine.logEvent?.({ message: `🗳️ Eleição ${isCorrupt ? '(fraudada)' : ''}` }, 'diplomacy');
            }
        }
        
        // ========================================
        // N09: POLICY EFFECTS (aplicar)
        // ========================================
        if (gov?.policies) {
            for (const policyId of gov.policies) {
                switch (policyId) {
                    case 'conscription':
                        // Boost militar mas morale -5
                        engine.nodes.forEach(n => {
                            if (n.infected && n.moraleFactors) n.moraleFactors.policy_conscription = -5;
                        });
                        break;
                    case 'rationing':
                        // Conserva food 50% mas morale -10
                        engine.nodes.forEach(n => {
                            if (n.infected) {
                                if (n.food !== undefined) n.food += Math.floor(n.demographics.total * 0.0005);
                                if (n.moraleFactors) n.moraleFactors.policy_rationing = -10;
                            }
                        });
                        break;
                    case 'public_education':
                        engine.literacy = Math.min(100, (engine.literacy || 5) + 0.01);
                        break;
                    case 'propaganda':
                        engine.nodes.forEach(n => {
                            if (n.infected && n.moraleFactors) n.moraleFactors.policy_propaganda = 15;
                        });
                        engine.globalTrust = Math.max(5, engine.globalTrust - 0.05);
                        break;
                    case 'welfare_state':
                        engine.nodes.forEach(n => {
                            if (n.infected && n.moraleFactors) n.moraleFactors.policy_welfare = 10;
                        });
                        break;
                }
            }
        }
    }
};
