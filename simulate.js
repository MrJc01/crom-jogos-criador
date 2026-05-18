// Wrapper para redirecionar de node simulate.js para simulate.mjs
import('./simulate.mjs').catch(err => {
    console.error('Erro ao iniciar a simulação:', err);
});
