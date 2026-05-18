export default {
    id: 'cyberpunk_matrix',
    type: 'technology',
    root: 'technological',
    name: 'Matriz de Simulação',
    desc: 'Uma prisão de paraíso virtual perfeita. Gera paz e estabilidade inabaláveis (+50 Trust passivamente).',
    baseCost: 400000,
    requires: ["cyberpunk_upload"],
    modifiers: {
        severity_flat_increase: -50
    },
    onUnlock: (engine) => {
        if(engine.onEvent) {
            engine.onEvent({ message: '💻 CYBERPUNK: A Matriz de Simulação está ativa. A humanidade agora sonha para sempre.', color: '#00ffff'}, 'milestone');
        }
    }
};
