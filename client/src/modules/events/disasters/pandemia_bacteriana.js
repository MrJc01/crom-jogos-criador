export default {
    id: 'pandemia_bacteriana',
    type: 'event',
    name: 'Pandemia Bacteriana',
    triggerCondition(engine) { return engine.severity >= 60 && Math.random() < 0.01; },
    applyEvent(engine) { return 'Ocorreu um(a) Pandemia Bacteriana!'; }
};