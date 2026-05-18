export default {
    id: 'terremoto',
    type: 'event',
    name: 'Terremoto de Grau 9',
    triggerCondition(engine) { return engine.severity >= 50 && Math.random() < 0.01; },
    applyEvent(engine) { return 'Ocorreu um(a) Terremoto de Grau 9!'; }
};