export default {
    id: 'metallurgy',
    type: 'knowledge',
    name: 'Metalurgia Prática',
    description: 'Domínio sobre a extração e forja. Acelera indústrias pesadas.',
    calculateDailyXP(engine) {
        let xp = 0;
        // Aprende passivamente enquanto o jogador manda craftar coisas com minerais
        engine.economy.activeCrafts.forEach(craft => {
            const recipe = engine.economy.recipes.get(craft.recipeId);
            if (recipe && recipe.inputs.minerals) {
                xp += 0.005; // 0.5% por dia de craft ativo
            }
        });
        return xp;
    },
    onMastery(engine) {
        if (engine.onEvent) {
            engine.onEvent("A civilização atingiu 100% de maestria em Metalurgia!", "global");
        }
    }
};
