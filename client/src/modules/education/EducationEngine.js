/**
 * EducationEngine — Literacia, escolas, universidades, eureka moments.
 * 
 * Inspirações: Civ6 (Eureka/Inspiration), real history (printing press → literacy boom)
 * 
 * Literacy 0-100% afeta:
 * - < 10%: Sem pesquisa, religião domina
 * - 10-30%: Pesquisa lenta, monarquias
 * - 30-60%: Repúblicas possíveis, ciência cresce
 * - 60-90%: Democracias, pesquisa rápida
 * - 90%+: Secularização, tecnocracia possível
 */
export default {
    id: 'education_engine',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        if (engine.day % 30 !== 0) return; // Mensal
        
        // Inicializa
        if (engine.literacy === undefined) engine.literacy = 5;
        if (node.schools === undefined) node.schools = 0;
        if (node.universities === undefined) node.universities = 0;
        if (node.localLiteracy === undefined) node.localLiteracy = 5;
        
        // Só processa uma vez por tick global
        if (engine._eduProcessed === engine.year + '_' + engine.day) {
            // Ainda processa escolas locais
            this.processLocalEducation(node, engine);
            return;
        }
        engine._eduProcessed = engine.year + '_' + engine.day;
        
        const pop = engine.globalPop;
        const techs = engine.unlockedTechs?.size || 0;
        
        // ========================================
        // EVOLUÇÃO GLOBAL DE LITERACIA
        // ========================================
        
        // Base: Cresce muito devagar naturalmente (tradição oral)
        let literacyGrowth = 0.001; // 0.001% por mês
        
        // Tech: Código de leis = escrita = literacy boost
        if (engine.unlockedTechs?.has('codigo_de_leis')) {
            literacyGrowth += 0.01;
        }
        
        // Tech: Imprensa (se existir)
        if (engine.unlockedTechs?.has('imprensa')) {
            literacyGrowth += 0.05; // Gutenberg effect
        }
        
        // Tech: Educação universal
        if (engine.unlockedTechs?.has('educacao_universal')) {
            literacyGrowth += 0.1;
        }
        
        // Tech: Internet / computadores
        if (engine.unlockedTechs?.has('internet') || (engine.inventory.computers || 0) > 0) {
            literacyGrowth += 0.2;
        }
        
        // Escolas no mundo: Cada escola contribui
        let totalSchools = 0;
        let totalUniversities = 0;
        engine.nodes.forEach(n => {
            totalSchools += n.schools || 0;
            totalUniversities += n.universities || 0;
        });
        
        literacyGrowth += totalSchools * 0.005;
        literacyGrowth += totalUniversities * 0.02;
        
        // Caps naturais por era
        let maxLiteracy = 10; // Base: sociedade oral
        if (engine.unlockedTechs?.has('codigo_de_leis')) maxLiteracy = 30;
        if (engine.unlockedTechs?.has('imprensa')) maxLiteracy = 60;
        if (engine.unlockedTechs?.has('educacao_universal')) maxLiteracy = 90;
        if (engine.unlockedTechs?.has('internet') || (engine.inventory.computers || 0) > 0) maxLiteracy = 100;
        
        engine.literacy = Math.min(maxLiteracy, engine.literacy + literacyGrowth);
        
        // Literacy DECAI se pop muito baixo (perda de conhecimento)
        if (pop < 500) {
            engine.literacy = Math.max(1, engine.literacy - 0.05);
        }
        
        // ========================================
        // EUREKA MOMENTS (Civ6 inspired)
        // ========================================
        if (engine.literacy > 50 && Math.random() < 0.005) {
            // Eureka: Desconto de 50% em uma tech aleatória
            const available = [];
            const config = engine.techTree?.config;
            if (config) {
                for (const [id, tech] of Object.entries(config)) {
                    if (id.startsWith('_')) continue;
                    if (engine.unlockedTechs?.has(id)) continue;
                    const reqs = tech.requires || [];
                    if (reqs.every(r => engine.unlockedTechs?.has(r))) {
                        available.push({ id, ...tech });
                    }
                }
            }
            if (available.length > 0) {
                const eureka = available[Math.floor(Math.random() * available.length)];
                // Dá DNA equivalente a 30% do custo
                const bonus = Math.floor(eureka.baseCost * 0.3);
                engine.adaptationPoints += bonus;
                if (engine.onEvent) {
                    engine.onEvent({
                        message: `💡 EUREKA! Um momento de brilhantismo acelerou a pesquisa de "${eureka.name}"! +${bonus} DNA.`,
                        type: 'milestone', color: '#f39c12'
                    }, 'milestone');
                }
            }
        }
        
        // ========================================
        // AUTO-CONSTRUÇÃO DE ESCOLAS (Zero-Player)
        // ========================================
        this.processLocalEducation(node, engine);
    },
    
    processLocalEducation(node, engine) {
        const pop = node.demographics.total;
        
        // Atualiza literacy local
        node.localLiteracy = Math.min(engine.literacy || 5, (node.localLiteracy || 5) + (node.schools || 0) * 0.01);
        
        // Constrói escola se pop > 2000 e literacy < 50 e tem madeira
        if (pop > 2000 && node.schools < 3 && (engine.literacy || 5) < 60) {
            if (engine.inventory.wood >= 100 && Math.random() < 0.005) {
                node.schools++;
                engine.inventory.wood -= 100;
                if (engine.onEvent) {
                    engine.onEvent({
                        message: `📚 ESCOLA: ${node.name} construiu uma escola! Literacia +0.5%.`,
                        nodeId: node.id, type: 'milestone', color: '#27ae60'
                    }, 'milestone');
                }
            }
        }
        
        // Universidade se pop > 20k e literacy > 40
        if (pop > 20000 && node.universities < 2 && (engine.literacy || 5) > 40) {
            if (engine.inventory.minerals >= 200 && engine.inventory.wood >= 200 && Math.random() < 0.003) {
                node.universities++;
                engine.inventory.minerals -= 200;
                engine.inventory.wood -= 200;
                if (engine.onEvent) {
                    engine.onEvent({
                        message: `🎓 UNIVERSIDADE: ${node.name} fundou uma universidade! Research +10%.`,
                        nodeId: node.id, type: 'milestone', color: '#2980b9'
                    }, 'milestone');
                }
            }
        }
        
        // Manutenção (sem wood = escola fecha)
        if (engine.day === 1 && (node.schools > 0 || node.universities > 0)) {
            const cost = (node.schools || 0) * 2 + (node.universities || 0) * 5;
            if (engine.inventory.wood < cost && (node.schools > 0 || node.universities > 0)) {
                if (node.universities > 0) node.universities--;
                else if (node.schools > 0) node.schools--;
            } else {
                engine.inventory.wood -= cost;
            }
        }
    }
};
