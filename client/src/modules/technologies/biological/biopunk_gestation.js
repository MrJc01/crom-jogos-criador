// REBALANCEADO: Custo aumentado de 80k→80k, modifier de r×5→r×1.8
export default {
    id: 'biopunk_gestation',
    type: 'technology',
    root: 'biological',
    name: 'Úteros Artificiais (Biopunk)',
    desc: 'Gestação artificial permite crescimento populacional sem limites biológicos.',
    baseCost: 80000,
    requires: ['clonagem_orgaos'],
    modifiers: {
        global_r_boost: 1.8
    },
    onUnlock: (engine) => {
        if(engine.onEvent) {
            engine.onEvent({ message: '🧬 BIOPUNK: Úteros artificiais online. A humanidade não depende mais da gestação natural.', color: '#9b59b6'}, 'milestone');
        }
    }
};
