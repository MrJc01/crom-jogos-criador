export default {
    id: 'saneamento_basico',
    type: 'technology',
    root: 'biological',
    name: 'Saneamento Básico',
    desc: 'Limpa as cidades e separa os dejetos. Aumenta a Capacidade Global em 30% e reduz Severidade.',
    baseCost: 500,
    requires: ["medicine"],
    modifiers: {
        global_K_boost: 1.3,
        severity_flat_increase: -5
    }
};
