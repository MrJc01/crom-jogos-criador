export default {
    id: 'ice_age',
    type: 'events',
    applyTick(node, globalRules, engine) {
        // Inicializar variáveis climáticas globais
        if (engine.globalTemperature === undefined) {
            engine.globalTemperature = 15.0; // 15ºC inicial
            engine.iceAgeCycle = 0;           // Ciclo de Milankovitch
        }

        const deltaDays = globalRules.deltaDays || 1;
        const yearsPassed = deltaDays / 365;

        // Avança o ciclo (Período orbital completo de ~40.000 anos)
        // Reduzido para oscilar perfeitamente durante a escala da simulação
        engine.iceAgeCycle += (yearsPassed / 40000) * 2 * Math.PI;
        
        // Temperatura oscila senoidalmente entre 15ºC (quente) e -2ºC (glaciação extrema)
        engine.globalTemperature = 6.5 + 8.5 * Math.cos(engine.iceAgeCycle);

        // Guardar o bioma original de inicialização
        if (!node.originalBiome) {
            node.originalBiome = { ...node.biome };
        }

        // Latitudes climáticas das províncias históricas
        const regionLatitudes = {
            'Britânia': 'polar',
            'Germânia': 'polar',
            'Roma': 'temperate',
            'Grécia': 'temperate',
            'Pérsia': 'temperate',
            'Mesopotâmia': 'subtropical',
            'Delta do Nilo': 'subtropical',
            'Yangtze': 'subtropical',
            'Vale do Indus': 'subtropical',
            'Mesoamérica': 'tropical',
            'Andes': 'tropical',
            'Etiópia': 'tropical',
            'Nigéria': 'tropical',
            'Indonésia': 'tropical'
        };

        const zone = regionLatitudes[node.name] || 'subtropical';
        const temp = engine.globalTemperature;

        if (temp < 2.0) {
            // Glaciação Severa (Pico Glacial Máximo)
            if (zone === 'polar') {
                node.biome = { id: 'ice_sheet', name: 'Lençol de Gelo Glacial', capacityBase: 1000 };
            } else if (zone === 'temperate') {
                node.biome = { id: 'tundra', name: 'Tundra Ártica', capacityBase: 5000 };
            } else if (zone === 'subtropical') {
                node.biome = { id: 'tundra', name: 'Estepe Fria', capacityBase: 15000 };
            }
        } else if (temp < 8.0) {
            // Resfriamento Moderado
            if (zone === 'polar') {
                node.biome = { id: 'tundra', name: 'Tundra Fria', capacityBase: 8000 };
            } else if (zone === 'temperate') {
                node.biome = { id: 'tundra', name: 'Tundra Arbustiva', capacityBase: 18000 };
            }
        } else {
            // Período Interglacial Quente (Restaurar Bioma Original)
            node.biome = { ...node.originalBiome };
        }
    }
};
