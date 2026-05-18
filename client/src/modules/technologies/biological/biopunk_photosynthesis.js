// REBALANCEADO: Custo aumentado de 50k para 40k, modifier de K×5→K×2
export default {
    id: 'biopunk_photosynthesis',
    type: 'technology',
    root: 'biological',
    name: 'Fotossíntese Humana (Biopunk)',
    desc: 'Modificação genética que permite que a pele processe luz solar. Reduz necessidade de alimento.',
    baseCost: 40000,
    requires: ['edicao_genetica_crispr'],
    modifiers: {
        global_K_boost: 2.0,
        severity_flat_increase: -8
    },
    onUnlock: (engine) => {
        if(engine.onEvent) {
            engine.onEvent({ message: '🧬 BIOPUNK: A humanidade alcançou a Fotossíntese Humana. A fome global despenca.', color: '#2ecc71'}, 'milestone');
        }
    }
};
