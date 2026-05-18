export default {
    id: 'tech_transhumanism',
    name: 'Transumanismo e Imortalidade',
    type: 'technology',
    root: 'philosophical', // Pertence ao ramo Filosófico
    baseCost: 20000, // Custo brutal
    requires: [], 
    
    onUnlock(engine) {
        // Reduz o limiar de desastre quase a zero impacto (A severidade não importa mais)
        if (engine.config) {
            engine.config.disasterThreshold += 500; // Planeta pode estar 500% poluído, eles são imortais sintéticos
        }
        
        // Emite o evento de Milestone
        if (engine.onEvent) {
            engine.onEvent({
                message: `🤖 MARCO TRANSHUMANISTA: As mentes foram convertidas para silício. O ciclo de Severidade foi quebrado. O 'Great Filter' foi superado!`,
                type: 'milestone',
                color: '#00ddff' // Azul Tecnocrata
            }, "milestone");
        }
    }
};
