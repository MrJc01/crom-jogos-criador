export default {
    id: 'colapso_ecologico',
    type: 'event',
    name: 'Colapso Ecológico',
    triggerCondition(engine) { return engine.severity >= 90 && Math.random() < 0.01; },
    applyEvent(engine) { return 'Ocorreu um(a) Colapso Ecológico!'; }
};