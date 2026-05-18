export default {
    id: 'space_dyson',
    type: 'technology',
    root: 'physical',
    name: 'Esfera de Dyson',
    desc: 'Envolve a estrela local para obter energia virtualmente infinita. Todos os gargalos industriais são removidos.',
    baseCost: 500000,
    requires: ["elevador_espacial","fusao_nuclear"],
    modifiers: {
        global_K_boost: 1000.0,
        severity_flat_increase: 20
    },
    onUnlock: (engine) => {
        if(engine.onEvent) {
            engine.onEvent({ message: '🚀 ERA ESPACIAL: A Esfera de Dyson foi completada. O céu escureceu, mas a energia agora é infinita.', color: '#00ccff'}, 'milestone');
        }
    }
};
