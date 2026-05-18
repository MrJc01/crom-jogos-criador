export default {
    id: 'aquecimento_global',
    type: 'event',
    name: 'Aquecimento Global Extremo',
    triggerCondition(engine) { return engine.severity >= 100 && Math.random() < 0.01; },
    applyEvent(engine) { return 'Ocorreu um(a) Aquecimento Global Extremo!'; }
};