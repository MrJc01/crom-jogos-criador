/**
 * N25. VictoryEngine — 6 condições de vitória.
 * N26. ScoreEngine — Pontuação civilizatória.
 */
export default {
    id: 'victory_score',
    type: 'sociology',
    applyTick(node, globalRules, engine) {
        if (engine.day !== 1 || engine.year % 1 !== 0) return;
        if (engine._victoryProcessed === engine.year) return;
        engine._victoryProcessed = engine.year;

        if (!engine.victoryProgress) engine.victoryProgress = {};
        if (!engine.civScore) engine.civScore = 0;
        const totalHexes = engine.nodes.size;
        let infectedHexes = 0;
        engine.nodes.forEach(n => { if (n.infected) infectedHexes++; });

        // DOMINATION: 75% hexes
        const domPct = infectedHexes / Math.max(1, totalHexes);
        engine.victoryProgress.domination = Math.floor(domPct * 100);

        // SCIENCE: Dyson + Arca
        const hasDyson = engine.unlockedTechs?.has('space_dyson');
        const hasArk = engine.unlockedTechs?.has('space_ark');
        engine.victoryProgress.science = (hasDyson ? 50 : 0) + (hasArk ? 50 : 0);

        // CULTURE: influência em 100% dos hexes
        let culturedHexes = 0;
        engine.nodes.forEach(n => { if (n.infected && (n.cultureLevel||0) > 10) culturedHexes++; });
        engine.victoryProgress.culture = Math.floor((culturedHexes / Math.max(1,totalHexes)) * 100);

        // RELIGION: 80% dos hexes com religião ativa
        let religiousHexes = 0;
        engine.nodes.forEach(n => { if (n.infected && n.religion?.active) religiousHexes++; });
        engine.victoryProgress.religion = Math.floor((religiousHexes / Math.max(1,infectedHexes)) * 100);

        // DIPLOMACY: federação com todas as facções
        const totalFacs = Object.keys(engine.globalDemographics?.factions || {}).length;
        const fedMembers = engine.federation?.members?.length || 0;
        engine.victoryProgress.diplomacy = Math.floor((fedMembers / Math.max(1,totalFacs)) * 100);

        // SCORE
        const techs = engine.unlockedTechs?.size || 0;
        const wonders = Object.keys(engine.wonders || {}).length;
        engine.civScore = Math.floor(
            engine.globalPop * 0.001 + techs * 100 + wonders * 500 +
            (engine.literacy || 0) * 10 + (engine.market?.gdp || 0) * 0.1
        );
        engine.victoryProgress.score = engine.civScore;

        // Check victories
        const checks = [
            { type: 'domination', threshold: 75, msg: '⚔️ VITÓRIA POR DOMINAÇÃO!' },
            { type: 'science', threshold: 100, msg: '🚀 VITÓRIA CIENTÍFICA!' },
            { type: 'culture', threshold: 90, msg: '🎭 VITÓRIA CULTURAL!' },
            { type: 'religion', threshold: 80, msg: '🕌 VITÓRIA RELIGIOSA!' },
            { type: 'diplomacy', threshold: 80, msg: '🤝 VITÓRIA DIPLOMÁTICA!' }
        ];
        for (const c of checks) {
            if (engine.victoryProgress[c.type] >= c.threshold && !engine._victoryAchieved) {
                engine._victoryAchieved = c.type;
                engine.onEvent?.({ message: `🏆 ${c.msg} Civilização atingiu ${c.type} no ano ${engine.year}! Score: ${engine.civScore}`, type:'milestone', color:'#f1c40f' }, 'milestone');
                engine.logEvent?.({ message: `🏆 Vitória: ${c.type}` }, 'victory');
            }
        }
    }
};
