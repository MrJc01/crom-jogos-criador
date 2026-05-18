export default {
    id: 'tsunami',
    type: 'event',
    name: 'Mega Tsunami',
    triggerCondition(engine) { return engine.severity >= 40 && Math.random() < 0.01; },
    applyEvent(engine) { return 'Ocorreu um(a) Mega Tsunami!'; }
};