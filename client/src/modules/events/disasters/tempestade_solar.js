export default {
    id: 'tempestade_solar',
    type: 'event',
    name: 'Tempestade Solar',
    triggerCondition(engine) { return engine.severity >= 60 && Math.random() < 0.01; },
    applyEvent(engine) { return 'Ocorreu um(a) Tempestade Solar!'; }
};