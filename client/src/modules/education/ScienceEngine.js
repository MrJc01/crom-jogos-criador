/**
 * N16. ScienceEngine — Pesquisa autônoma e peer review.
 * N17. PhilosophyEngine — Correntes filosóficas emergentes.
 */
export default {
    id: 'science_philosophy',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected) return;
        if (engine.day % 90 !== 0) return; // Trimestral
        
        if (engine._sciProcessed === engine.year + '_' + engine.day) return;
        engine._sciProcessed = engine.year + '_' + engine.day;
        
        // ========================================
        // N16: CIÊNCIA AUTÔNOMA
        // ========================================
        let totalUniversities = 0;
        engine.nodes.forEach(n => { totalUniversities += (n.universities || 0); });
        
        // Peer review: mais universidades = pesquisa mais rápida
        if (totalUniversities > 0) {
            const peerReviewBonus = Math.min(2.0, 1 + totalUniversities * 0.1);
            const researchPoints = Math.floor(totalUniversities * 10 * peerReviewBonus);
            engine.adaptationPoints += researchPoints;
        }
        
        // Descobertas acidentais (serendipity)
        if ((engine.literacy || 5) > 30 && Math.random() < 0.01) {
            const bonuses = [
                { msg: '🔬 DESCOBERTA: Novo composto químico acelera produção!', dna: 50 },
                { msg: '⚗️ ALQUIMIA: Processo de refinamento melhorado!', dna: 30 },
                { msg: '🧪 EXPERIMENTO: Resultado inesperado abre nova linha de pesquisa!', dna: 100 },
                { msg: '📐 MATEMÁTICA: Novo teorema otimiza cálculos de engenharia!', dna: 75 }
            ];
            const disc = bonuses[Math.floor(Math.random() * bonuses.length)];
            engine.adaptationPoints += disc.dna;
            if (engine.onEvent) {
                engine.onEvent({ message: disc.msg, type: 'milestone', color: '#e74c3c' }, 'milestone');
            }
        }
        
        // ========================================
        // N17: FILOSOFIA
        // ========================================
        if (!engine.philosophy) engine.philosophy = { current: null, since: 0 };
        
        const philosophies = [
            { id: 'animism', name: 'Animismo', minLiteracy: 0, researchMod: -0.10, moraleMod: 5, religionMod: 1.5 },
            { id: 'rationalism', name: 'Racionalismo', minLiteracy: 30, researchMod: 0.20, moraleMod: -3, religionMod: 0.5 },
            { id: 'empiricism', name: 'Empirismo', minLiteracy: 40, researchMod: 0.30, moraleMod: 0, religionMod: 0.7 },
            { id: 'humanism', name: 'Humanismo', minLiteracy: 50, researchMod: 0.10, moraleMod: 10, religionMod: 0.3 },
            { id: 'utilitarianism', name: 'Utilitarismo', minLiteracy: 60, researchMod: 0.15, moraleMod: -5, religionMod: 0.2 },
            { id: 'existentialism', name: 'Existencialismo', minLiteracy: 70, researchMod: 0.05, moraleMod: -8, religionMod: 0.1 },
            { id: 'transhumanism', name: 'Transhumanismo', minLiteracy: 90, researchMod: 0.50, moraleMod: -10, religionMod: 0.0 }
        ];
        
        const literacy = engine.literacy || 5;
        const eligible = philosophies.filter(p => literacy >= p.minLiteracy);
        
        if (eligible.length > 0 && engine.year > (engine.philosophy.since || 0) + 50) {
            // Nova corrente filosófica emerge a cada ~50 anos
            if (Math.random() < 0.02) {
                const newPhil = eligible[eligible.length - 1]; // Mais avançada
                if (!engine.philosophy.current || engine.philosophy.current !== newPhil.id) {
                    const old = engine.philosophy.current;
                    engine.philosophy = { current: newPhil.id, since: engine.year, data: newPhil };
                    if (engine.onEvent) {
                        engine.onEvent({
                            message: `📚 FILOSOFIA: "${newPhil.name}" se torna a corrente dominante! ${old ? `(substituindo ${old})` : ''} Research ${newPhil.researchMod > 0 ? '+' : ''}${Math.floor(newPhil.researchMod * 100)}%.`,
                            type: 'milestone', color: '#9b59b6'
                        }, 'milestone');
                        engine.logEvent?.({ message: `📚 ${newPhil.name}` }, 'culture');
                    }
                }
            }
        }
    }
};
