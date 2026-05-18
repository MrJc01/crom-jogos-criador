/** N37. ClassEngine — Classes sociais.
 *  N38. IdeologyEngine — Ideologias emergentes.
 *  N39. MediaEngine — Mídia e informação.
 */
export default {
    id: 'sociology_expansion',
    type: 'sociology',
    applyTick(node, globalRules, engine) {
        if (!node.infected) return;
        if (engine.day % 90 !== 0) return;
        if (engine._socExpProcessed === engine.year+'_'+engine.day) return;
        engine._socExpProcessed = engine.year+'_'+engine.day;

        // N37: CLASSES SOCIAIS
        if (!engine.socialClasses) engine.socialClasses = { workers: 0.70, specialists: 0.20, rulers: 0.10 };
        const literacy = engine.literacy || 5;
        const gov = engine.currentGovernment?.type;

        // Mobilidade social
        if (gov === 'democracy' || gov === 'republic') {
            engine.socialClasses.specialists = Math.min(0.40, engine.socialClasses.specialists + 0.001);
            engine.socialClasses.workers = Math.max(0.40, 1 - engine.socialClasses.specialists - engine.socialClasses.rulers);
        } else if (gov === 'monarchy' || gov === 'theocracy') {
            engine.socialClasses.rulers = Math.min(0.15, engine.socialClasses.rulers + 0.001);
            engine.socialClasses.workers = Math.max(0.60, 1 - engine.socialClasses.specialists - engine.socialClasses.rulers);
        }

        // N38: IDEOLOGIAS
        if (!engine.ideology) engine.ideology = null;
        const ideologies = [
            { id: 'feudalism', name: 'Feudalismo', minLit: 0, maxLit: 30, morale: 0, prod: 0 },
            { id: 'mercantilism', name: 'Mercantilismo', minLit: 20, maxLit: 50, morale: 0, trade: 0.2 },
            { id: 'capitalism', name: 'Capitalismo', minLit: 40, morale: -5, prod: 0.3, inequality: 0.5 },
            { id: 'socialism', name: 'Socialismo', minLit: 50, morale: 5, prod: -0.1, equality: 0.3 },
            { id: 'communism', name: 'Comunismo', minLit: 40, morale: -10, prod: -0.2, equality: 0.8 },
            { id: 'fascism', name: 'Fascismo', minLit: 30, morale: -15, military: 0.5, trust: -20 },
            { id: 'anarchism', name: 'Anarquismo', minLit: 60, morale: -5, crime: 2, freedom: 1.0 }
        ];

        if (engine.year % 50 === 0 && Math.random() < 0.1) {
            const eligible = ideologies.filter(i => literacy >= i.minLit && (!i.maxLit || literacy <= i.maxLit));
            if (eligible.length > 0) {
                const newIdeo = eligible[Math.floor(Math.random()*eligible.length)];
                if (!engine.ideology || engine.ideology !== newIdeo.id) {
                    engine.ideology = newIdeo.id;
                    engine.onEvent?.({
                        message: `📕 IDEOLOGIA: "${newIdeo.name}" se tornou dominante! ${newIdeo.morale>0?'Morale +'+newIdeo.morale:''}`,
                        type:'milestone', color:'#c0392b'
                    }, 'milestone');
                    engine.logEvent?.({message:`📕 ${newIdeo.name}`},'culture');
                }
            }
        }

        // N39: MÍDIA
        if (!engine.mediaLevel) engine.mediaLevel = 0;
        const mediaTiers = [
            { level:1, name:'Tradição Oral', minPop:100, spreadMult:1.0 },
            { level:2, name:'Escrita', minPop:5000, spreadMult:1.5, minLit:15 },
            { level:3, name:'Imprensa', minPop:50000, spreadMult:3.0, minLit:30 },
            { level:4, name:'Rádio', minPop:200000, spreadMult:5.0, minLit:50 },
            { level:5, name:'Televisão', minPop:500000, spreadMult:8.0, minLit:60 },
            { level:6, name:'Internet', minPop:1000000, spreadMult:15.0, minLit:80 }
        ];
        for (const t of mediaTiers.reverse()) {
            if (engine.globalPop >= t.minPop && literacy >= (t.minLit||0)) {
                if (engine.mediaLevel < t.level) {
                    engine.mediaLevel = t.level;
                    engine.cultureSpreadMult = t.spreadMult;
                    engine.onEvent?.({
                        message: `📺 MÍDIA: "${t.name}" inaugurada! Cultura/religião/ideologia spread ×${t.spreadMult}.`,
                        type:'milestone', color:'#1abc9c'
                    }, 'milestone');
                }
                break;
            }
        }
    }
};
