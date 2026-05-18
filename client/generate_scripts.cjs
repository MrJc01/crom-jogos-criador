const fs = require('fs');
const path = require('path');

const scripts = {
    'technologies/physical/ferramentas_pedra.js': { id: 'ferramentas_pedra', name: 'Ferramentas de Pedra', root: 'physical' },
    'technologies/physical/metalurgia_bronze.js': { id: 'metalurgia_bronze', name: 'Metalurgia do Bronze', root: 'physical' },
    'technologies/physical/arquitetura_vertical.js': { id: 'arquitetura_vertical', name: 'Arquitetura Vertical', root: 'physical' },
    'technologies/physical/motor_a_combustao.js': { id: 'motor_a_combustao', name: 'Motor a Combustão', root: 'physical' },
    'technologies/physical/fissao_nuclear.js': { id: 'fissao_nuclear', name: 'Fissão Nuclear', root: 'physical' },
    'technologies/physical/fusao_nuclear.js': { id: 'fusao_nuclear', name: 'Fusão Nuclear', root: 'physical' },
    'technologies/physical/elevador_espacial.js': { id: 'elevador_espacial', name: 'Elevador Espacial', root: 'physical' },
    'technologies/physical/dobra_espacial.js': { id: 'dobra_espacial', name: 'Motor de Dobra Espacial', root: 'physical' },
    'technologies/physical/esfera_de_dyson.js': { id: 'esfera_de_dyson', name: 'Esfera de Dyson', root: 'physical' },
    'technologies/physical/manipulacao_gravitacional.js': { id: 'manipulacao_gravitacional', name: 'Manipulação Gravitacional', root: 'physical' },

    'technologies/philosophical/animismo.js': { id: 'animismo', name: 'Animismo', root: 'philosophical' },
    'technologies/philosophical/metodo_cientifico.js': { id: 'metodo_cientifico', name: 'Método Científico', root: 'philosophical' },
    'technologies/philosophical/iluminismo.js': { id: 'iluminismo', name: 'Iluminismo', root: 'philosophical' },
    'technologies/philosophical/existencialismo.js': { id: 'existencialismo', name: 'Existencialismo', root: 'philosophical' },
    'technologies/philosophical/niilismo_cosmico.js': { id: 'niilismo_cosmico', name: 'Niilismo Cósmico', root: 'philosophical' },
    'technologies/philosophical/etica_maquinal.js': { id: 'etica_maquinal', name: 'Ética Maquinal', root: 'philosophical' },
    'technologies/philosophical/panteismo_galactico.js': { id: 'panteismo_galactico', name: 'Panteísmo Galáctico', root: 'philosophical' },
    'technologies/philosophical/determinismo.js': { id: 'determinismo', name: 'Determinismo', root: 'philosophical' },
    'technologies/philosophical/transcendencia_da_carne.js': { id: 'transcendencia_da_carne', name: 'Transcendência da Carne', root: 'philosophical' },

    'technologies/social/codigo_de_leis.js': { id: 'codigo_de_leis', name: 'Código de Leis', root: 'social' },
    'technologies/social/moeda_fiduciaria.js': { id: 'moeda_fiduciaria', name: 'Moeda Fiduciária', root: 'social' },
    'technologies/social/propaganda_em_massa.js': { id: 'propaganda_em_massa', name: 'Propaganda em Massa', root: 'social' },
    'technologies/social/estado_de_bem_estar.js': { id: 'estado_de_bem_estar', name: 'Estado de Bem-Estar', root: 'social' },
    'technologies/social/capitalismo_tardio.js': { id: 'capitalismo_tardio', name: 'Capitalismo Tardio', root: 'social' },
    'technologies/social/governo_mundial_unificado.js': { id: 'governo_mundial_unificado', name: 'Governo Mundial Unificado', root: 'social' },
    'technologies/social/controle_populacional.js': { id: 'controle_populacional', name: 'Controle Populacional', root: 'social' },
    'technologies/social/educacao_universal.js': { id: 'educacao_universal', name: 'Educação Universal', root: 'social' },
    
    // Recipes
    'economy/recipes/pedra_lascada.js': { id: 'pedra_lascada', name: 'Pedra Lascada', inputs: { minerals: 10 }, outputs: { tools: 1 } },
    'economy/recipes/refino_bronze.js': { id: 'refino_bronze', name: 'Refino de Bronze', inputs: { minerals: 100 }, outputs: { bronze: 10 } },
    'economy/recipes/aco_reforcado.js': { id: 'aco_reforcado', name: 'Aço Reforçado', inputs: { minerals: 1000 }, outputs: { steel: 100 } },
    'economy/recipes/motor_combustao.js': { id: 'motor_combustao', name: 'Motor a Combustão', inputs: { steel: 50 }, outputs: { engine: 1 } },
    'economy/recipes/placa_mae.js': { id: 'placa_mae', name: 'Placa Mãe', inputs: { chips: 5 }, outputs: { board: 1 } },
    'economy/recipes/servidores_em_nuvem.js': { id: 'servidores_em_nuvem', name: 'Servidores em Nuvem', inputs: { computers: 100 }, outputs: { server: 1 } },
    'economy/recipes/ia_geral.js': { id: 'ia_geral', name: 'IA Geral', inputs: { server: 5, adaptationPoints: 10000 }, outputs: { agi: 1 } },
    'economy/recipes/vacina_mrna.js': { id: 'vacina_mrna', name: 'Vacina de mRNA', inputs: { adaptationPoints: 10 }, outputs: { vaccines: 1 } },
    'economy/recipes/propulsor_ionico.js': { id: 'propulsor_ionico', name: 'Propulsor Iônico', inputs: { steel: 50 }, outputs: { thruster: 1 } },
    'economy/recipes/modulo_espacial.js': { id: 'modulo_espacial', name: 'Módulo Espacial', inputs: { thruster: 4, steel: 100 }, outputs: { spaceship: 1 } },
    'economy/recipes/arca_geracional.js': { id: 'arca_geracional', name: 'Arca Geracional', inputs: { spaceship: 100, agi: 1 }, outputs: { victory: 1 } },

    // Disasters
    'events/disasters/tsunami.js': { id: 'tsunami', name: 'Mega Tsunami', severity: 40 },
    'events/disasters/terremoto.js': { id: 'terremoto', name: 'Terremoto de Grau 9', severity: 50 },
    'events/disasters/pandemia_bacteriana.js': { id: 'pandemia_bacteriana', name: 'Pandemia Bacteriana', severity: 60 },
    'events/disasters/pandemia_viral.js': { id: 'pandemia_viral', name: 'Pandemia Viral', severity: 70 },
    'events/disasters/inverno_vulcanico.js': { id: 'inverno_vulcanico', name: 'Inverno Vulcânico', severity: 80 },
    'events/disasters/colapso_ecologico.js': { id: 'colapso_ecologico', name: 'Colapso Ecológico', severity: 90 },
    'events/disasters/aquecimento_global.js': { id: 'aquecimento_global', name: 'Aquecimento Global Extremo', severity: 100 },
    'events/disasters/tempestade_solar.js': { id: 'tempestade_solar', name: 'Tempestade Solar', severity: 60 },
    'events/disasters/impacto_meteoro.js': { id: 'impacto_meteoro', name: 'Impacto de Meteoro', severity: 100 },
    
    // Factions
    'sociology/factions/eco_extremistas.js': { id: 'eco_extremistas', name: 'Eco-Extremistas' },
    'sociology/factions/tecnocratas.js': { id: 'tecnocratas', name: 'Tecnocratas' },
    'sociology/factions/feudalistas_modernos.js': { id: 'feudalistas_modernos', name: 'Feudalistas Modernos' },
    'sociology/factions/nomades_oceanicos.js': { id: 'nomades_oceanicos', name: 'Nômades Oceânicos' },
    'sociology/factions/ia_hivemind.js': { id: 'ia_hivemind', name: 'Hivemind de IA' },
    'sociology/factions/comerciantes_livres.js': { id: 'comerciantes_livres', name: 'Comerciantes Livres' },
    'sociology/factions/nacionalistas_isolados.js': { id: 'nacionalistas_isolados', name: 'Nacionalistas Isolados' }
};

const BASE_DIR = '/home/j/Documentos/GitHub/crom-jogos/crom-jogos-criador/client/src/modules/';

for (const [relPath, config] of Object.entries(scripts)) {
    const fullPath = path.join(BASE_DIR, relPath);
    let content = '';

    if (relPath.includes('technologies')) {
        content = `export default {
    id: '${config.id}',
    type: 'technology',
    root: '${config.root}',
    name: '${config.name}',
    desc: 'Tecnologia auto-gerada.',
    baseCost: 500,
    modifiers: {}
};`;
    } else if (relPath.includes('recipes')) {
        content = `export default {
    id: '${config.id}',
    type: 'recipe',
    name: '${config.name}',
    desc: 'Receita auto-gerada.',
    inputs: ${JSON.stringify(config.inputs)},
    outputs: ${JSON.stringify(config.outputs)},
    craftTimeTicks: 10
};`;
    } else if (relPath.includes('events')) {
        content = `export default {
    id: '${config.id}',
    type: 'event',
    name: '${config.name}',
    triggerCondition(engine) { return engine.severity >= ${config.severity} && Math.random() < 0.01; },
    applyEvent(engine) { return 'Ocorreu um(a) ${config.name}!'; }
};`;
    } else if (relPath.includes('factions')) {
        content = `export default {
    id: '${config.id}',
    type: 'faction',
    name: '${config.name}',
    description: 'Facção auto-gerada.',
    affinities: {},
    applyTick(node, globalRules, engine) {}
};`;
    }

    fs.writeFileSync(fullPath, content);
}
console.log('Scripts gerados com sucesso!');
