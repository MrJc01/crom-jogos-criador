export default {
    id: 'biopunk_photosynthesis',
    type: 'technology',
    root: 'biological',
    name: 'Fotossíntese Humana',
    desc: 'Modificação genética avançada permitindo que a pele humana processe luz solar. Reduz severamente a necessidade de Solo (Fome) e aumenta o K.',
    baseCost: 50000,
    requires: [], // Pós-Era da Informação
    modifiers: {
        global_K_boost: 5.0,
        severity_flat_increase: -10 
    },
    onUnlock: (engine) => {
        if(engine.onEvent) {
            engine.onEvent({ message: '🧬 BIOPUNK: A humanidade alcançou a Fotossíntese Humana. A fome global despenca.', color: '#2ecc71'}, 'milestone');
        }
    }
};
