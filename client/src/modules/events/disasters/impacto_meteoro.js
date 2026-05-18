export default {
    id: 'impacto_meteoro',
    type: 'event',
    name: 'Impacto de Meteoro',
    triggerCondition(engine) { return engine.severity >= 100 && Math.random() < 0.01; },
    applyEvent(engine) { return 'Ocorreu um(a) Impacto de Meteoro!'; }
};