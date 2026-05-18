/** N43. Propaganda Tech — Técnicas de propaganda. Morale manipulation. */
export default { id:'propaganda_tech', type:'technology', name:'Técnicas de Propaganda', category:'social', baseCost:8000, era:4,
    requires:['imprensa'],
    modifiers:{ K:1, r:1, deathMod:1 },
    description:'Controle de narrativa e manipulação de massas. Morale +15, Trust -5.',
    onUnlock(engine){
        engine.nodes.forEach(n => { if(n.infected && n.moraleFactors) n.moraleFactors.propaganda_tech = 10; });
        engine.globalTrust = Math.max(5, engine.globalTrust - 5);
    }
};
