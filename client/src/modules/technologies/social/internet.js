/** N42. Internet — Rede global de informação. Research ×3, Literacy → 100%. */
export default { id:'internet', type:'technology', name:'Internet', category:'social', baseCost:80000, era:6,
    requires:['educacao_universal'],
    modifiers:{ K:1.2, r:1, deathMod:1 },
    description:'Rede global de comunicação instantânea. O mundo conectado.',
    onUnlock(engine){ engine.literacy=100; engine.cultureSpreadMult=(engine.cultureSpreadMult||1)*3; engine.commLevel=7; engine.awareness=1.0; }
};
