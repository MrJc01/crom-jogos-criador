export default {
    id: 'biopunk_gestation',
    type: 'technology',
    root: 'biological',
    name: 'Úteros Artificiais',
    desc: 'Remove o gargalo biológico da reprodução. O crescimento populacional (r) explode e as fêmeas biológicas deixam de ser um limitador demográfico.',
    baseCost: 80000,
    requires: ['biopunk_photosynthesis'],
    modifiers: {
        global_r_boost: 5.0
    },
    onUnlock: (engine) => {
        if(engine.onEvent) {
            engine.onEvent({ message: '🧬 BIOPUNK: Úteros Artificiais ativados. O crescimento humano tornou-se exponencial.', color: '#2ecc71'}, 'milestone');
        }
    }
};
