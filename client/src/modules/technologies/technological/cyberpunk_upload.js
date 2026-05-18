export default {
    id: 'cyberpunk_upload',
    type: 'technology',
    root: 'technological',
    name: 'Mind Uploading',
    desc: 'Digitalização completa das mentes humanas. A morte biológica cessa (Mortalidade = 0), mas a natalidade também. K torna-se essencialmente infinito nos servidores.',
    baseCost: 100000,
    requires: [],
    modifiers: {
        global_K_boost: 100.0,
        global_r_boost: 0.001, // Quase cessa a reprodução biológica
    },
    onUnlock: (engine) => {
        if(engine.onEvent) {
            engine.onEvent({ message: '💻 CYBERPUNK: A carne foi abandonada. A humanidade enviou suas consciências para a Grande Nuvem.', color: '#00ffff'}, 'milestone');
        }
    }
};
