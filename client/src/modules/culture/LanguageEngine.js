/**
 * N13. LanguageEngine — Linguagens procedurais emergentes.
 * N14. ArtEngine — Arte e música emergente.
 * N15. TraditionEngine — Tradições e costumes.
 */
export default {
    id: 'language_art_tradition',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        if (engine.day % 30 !== 0) return;
        
        // ========================================
        // N13: LINGUAGENS
        // ========================================
        if (!engine.languages) engine.languages = {};
        if (!node.language) {
            // Cada facção gera uma língua
            const facs = Object.keys(node.demographics.dist?.factions || {});
            if (facs.length > 0) {
                const mainFac = facs[0];
                if (!engine.languages[mainFac]) {
                    const roots = ['Kora', 'Zhul', 'Nema', 'Thar', 'Vex', 'Ashk', 'Drui', 'Mael', 'Syl', 'Omn'];
                    const suffixes = ['iano', 'ês', 'ik', 'an', 'oth', 'uri', 'ese', 'achi', 'ell'];
                    const name = roots[Math.floor(Math.random() * roots.length)] + suffixes[Math.floor(Math.random() * suffixes.length)];
                    engine.languages[mainFac] = { name, speakers: 0, writingSystem: false };
                }
                node.language = mainFac;
            }
        }
        
        // Escrita emerge com código de leis
        if (node.language && engine.languages[node.language]) {
            if (engine.unlockedTechs?.has('codigo_de_leis') && !engine.languages[node.language].writingSystem) {
                engine.languages[node.language].writingSystem = true;
                if (engine.onEvent) {
                    engine.onEvent({
                        message: `✍️ ESCRITA: A língua "${engine.languages[node.language].name}" ganhou sistema de escrita!`,
                        type: 'milestone', color: '#8e44ad'
                    }, 'milestone');
                }
            }
            engine.languages[node.language].speakers += node.demographics.total;
        }
        
        // Barreira linguística reduz trade
        const neighbors = node.neighbors || [];
        for (const nId of neighbors) {
            const neighbor = engine.nodes.get(nId);
            if (!neighbor?.infected || !neighbor.language) continue;
            if (neighbor.language !== node.language) {
                node.tradeBarrier = Math.max(0, 1 - ((engine.literacy || 5) / 100) * 0.5);
            }
        }
        
        // ========================================
        // N15: TRADIÇÕES
        // ========================================
        if (!node.traditions) node.traditions = [];
        
        const pop = node.demographics.total;
        if (pop > 1000 && node.traditions.length < 5) {
            const possibleTraditions = [
                { id: 'harvest_fest', name: 'Festa da Colheita', morale: 3, condition: () => node.crops?.length > 0 },
                { id: 'ancestor_rites', name: 'Ritos Ancestrais', morale: 4, condition: () => true },
                { id: 'coming_of_age', name: 'Rito de Passagem', morale: 2, condition: () => pop > 2000 },
                { id: 'trade_fair', name: 'Feira Comercial', morale: 3, trust: 2, condition: () => pop > 5000 },
                { id: 'memorial_day', name: 'Dia Memorial', morale: 2, condition: () => (node.veteranBuff || 0) > 0 },
                { id: 'nature_worship', name: 'Culto à Natureza', morale: 3, condition: () => node.biome?.id === 'jungle' },
                { id: 'martial_games', name: 'Jogos Marciais', morale: 4, military: 0.05, condition: () => pop > 10000 }
            ];
            
            for (const t of possibleTraditions) {
                if (node.traditions.find(tr => tr.id === t.id)) continue;
                if (!t.condition()) continue;
                if (Math.random() < 0.002) {
                    node.traditions.push({ id: t.id, name: t.name, morale: t.morale });
                    if (engine.onEvent) {
                        engine.onEvent({
                            message: `🏺 TRADIÇÃO: "${t.name}" se tornou costume em ${node.name}. Morale +${t.morale}.`,
                            nodeId: node.id, type: 'milestone', color: '#d35400'
                        }, 'milestone');
                    }
                    break;
                }
            }
        }
        
        // Tradições dão morale
        if (!node.moraleFactors) node.moraleFactors = {};
        node.moraleFactors.traditions = node.traditions.reduce((sum, t) => sum + (t.morale || 0), 0);
    }
};
