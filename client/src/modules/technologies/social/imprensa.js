/** N40. Imprensa — Prensa de Gutenberg. Literacy ×3, culture spread ×2. */
export default { id:'imprensa', type:'technology', name:'Imprensa', category:'social', baseCost:5000, era:4,
    requires:['codigo_de_leis'],
    modifiers:{ K:1, r:1, deathMod:1 },
    description:'A prensa de tipos móveis revoluciona a comunicação escrita.',
    onUnlock(engine){ engine.literacy = Math.min(100,(engine.literacy||5)*3); engine.cultureSpreadMult = (engine.cultureSpreadMult||1)*2; }
};
