export default {
    id: 'inverno_vulcanico',
    type: 'event',
    name: 'Inverno Vulcânico',
    triggerCondition(engine) { return engine.severity >= 80 && Math.random() < 0.01; },
    applyEvent(engine) { return 'Ocorreu um(a) Inverno Vulcânico!'; }
};