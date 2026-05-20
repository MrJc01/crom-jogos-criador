/**
 * client/src/core/StaticPlugins.js
 * 
 * Módulo de injeção manual estática de plugins para o CROM.
 * Garante compatibilidade 100% em ambientes sem suporte a import.meta.glob (como live-server cru, tests, etc.).
 */

// Biologia
import bioAging from '../modules/biology/aging.js';
import bioGestation from '../modules/biology/gestation.js';
import bioMigration from '../modules/biology/migration.js';
import bioExpansion from '../modules/biology/BioExpansion.js';
import bioAdaptation from '../modules/biology/BiomeAdaptationEngine.js';
import bioClimate from '../modules/biology/ClimateShiftEngine.js';
import bioGenetics from '../modules/biology/GeneticsEngine.js';
import bioPandemic from '../modules/biology/pandemic_sir.js';

// Agricultura
import agriCropRotation from '../modules/agriculture/CropRotation.js';
import agriFamine from '../modules/agriculture/FamineEngine.js';
import agriFarming from '../modules/agriculture/FarmingEngine.js';
import agriFishery from '../modules/agriculture/Fishery.js';
import agriIrrigation from '../modules/agriculture/IrrigationEngine.js';
import agriLivestock from '../modules/agriculture/LivestockEngine.js';

// Economia
import econAdvanced from '../modules/economy/advanced_economy.js';
import econBureaucracy from '../modules/economy/bureaucracy.js';
import econExtraction from '../modules/economy/extraction.js';
import econMilitary from '../modules/economy/military_economy.js';
import econTradeLogistics from '../modules/economy/trade_logistics.js';

// Economia - Receitas
import recAco from '../modules/economy/recipes/aco_reforcado.js';
import recArca from '../modules/economy/recipes/arca_geracional.js';
import recChips from '../modules/economy/recipes/chips.js';
import recIa from '../modules/economy/recipes/ia_geral.js';
import recEspacial from '../modules/economy/recipes/modulo_espacial.js';
import recMotor from '../modules/economy/recipes/motor_combustao.js';
import recPedra from '../modules/economy/recipes/pedra_lascada.js';
import recPlaca from '../modules/economy/recipes/placa_mae.js';
import recPropulsor from '../modules/economy/recipes/propulsor_ionico.js';
import recBronze from '../modules/economy/recipes/refino_bronze.js';
import recNuvem from '../modules/economy/recipes/servidores_em_nuvem.js';
import recSilicon from '../modules/economy/recipes/silicon.js';
import recSupercomp from '../modules/economy/recipes/supercomputer.js';
import recVacina from '../modules/economy/recipes/vacina_mrna.js';

// Eventos
import evtAnomaly from '../modules/events/AnomalyEngine.js';
import evtCosmic from '../modules/events/CosmicEngine.js';
import evtDisaster from '../modules/events/DisasterEngine.js';
import evtGeopolitics from '../modules/events/GeopoliticsEngine.js';
import evtIceAge from '../modules/events/IceAgeEngine.js';
import evtIndustry from '../modules/events/IndustryEngine.js';
import evtNature from '../modules/events/NatureEngine.js';
import evtSocial from '../modules/events/SocialEngine.js';

// Felicidade (Happiness)
import hapAmenities from '../modules/happiness/AmenitiesEngine.js';
import hapCrime from '../modules/happiness/CrimeEngine.js';
import hapMorale from '../modules/happiness/MoraleEngine.js';

// Governança (Governance)
import govEspionage from '../modules/governance/EspionageEngine.js';
import govExpansion from '../modules/governance/GovernanceExpansion.js';
import govGovernment from '../modules/governance/GovernmentEngine.js';

// Infraestrutura (Infrastructure)
import infBuilding from '../modules/infrastructure/BuildingEngine.js';
import infExpansion from '../modules/infrastructure/InfrastructureExpansion.js';

// Comércio (Trade)
import trdMarket from '../modules/trade/MarketEngine.js';
import trdExpansion from '../modules/trade/TradeExpansion.js';

// Vitória (Victory)
import vicVictory from '../modules/victory/VictoryEngine.js';

// Conhecimento (Knowledge)
import knwAgriculture from '../modules/knowledge/agriculture_knowledge.js';
import knwBotany from '../modules/knowledge/botany.js';
import knwMedicine from '../modules/knowledge/medicine_knowledge.js';
import knwMetallurgy from '../modules/knowledge/metallurgy.js';

// Sociologia (Sociology)
import socDynamics from '../modules/sociology/CivilizationDynamics.js';
import socCombat from '../modules/sociology/CombatEngine.js';
import socTrauma from '../modules/sociology/CulturalTraumaEngine.js';
import socDiplomacy from '../modules/sociology/DiplomacyEngine.js';
import socEthnogenesis from '../modules/sociology/EthnogenesisEngine.js';
import socFactionEvol from '../modules/sociology/FactionEvolution.js';
import socCompetition from '../modules/sociology/HominidCompetitionEngine.js';
import socMigration from '../modules/sociology/MigrationEngine.js';
import socExpansion from '../modules/sociology/SociologyExpansion.js';
import socState from '../modules/sociology/StateEngine.js';

// Sociologia - Facções
import facAcademicos from '../modules/sociology/factions/academicos.js';
import facPrimitivistas from '../modules/sociology/factions/anarco_primitivistas.js';
import facComerciantes from '../modules/sociology/factions/comerciantes_livres.js';
import facCorporatist from '../modules/sociology/factions/corporatist.js';
import facApocalipse from '../modules/sociology/factions/culto_do_apocalipse.js';
import facEcoExtremistas from '../modules/sociology/factions/eco_extremistas.js';
import facMilitares from '../modules/sociology/factions/expansionistas_militares.js';
import facFeudalistas from '../modules/sociology/factions/feudalistas_modernos.js';
import facHivemind from '../modules/sociology/factions/ia_hivemind.js';
import facIsolados from '../modules/sociology/factions/nacionalistas_isolados.js';
import facOceanicos from '../modules/sociology/factions/nomades_oceanicos.js';
import facSindicatos from '../modules/sociology/factions/sindicatos_operarios.js';
import facSpiritualist from '../modules/sociology/factions/spiritualist.js';
import facTecnocratas from '../modules/sociology/factions/tecnocratas.js';
import facTransumanistas from '../modules/sociology/factions/transumanistas.js';

export const StaticPlugins = [
    // Biologia
    bioAging,
    bioGestation,
    bioMigration,
    bioExpansion,
    bioAdaptation,
    bioClimate,
    bioGenetics,
    bioPandemic,

    // Agricultura
    agriCropRotation,
    agriFamine,
    agriFarming,
    agriFishery,
    agriIrrigation,
    agriLivestock,

    // Economia
    econAdvanced,
    econBureaucracy,
    econExtraction,
    econMilitary,
    econTradeLogistics,

    // Receitas
    recAco,
    recArca,
    recChips,
    recIa,
    recEspacial,
    recMotor,
    recPedra,
    recPlaca,
    recPropulsor,
    recBronze,
    recNuvem,
    recSilicon,
    recSupercomp,
    recVacina,

    // Eventos
    evtAnomaly,
    evtCosmic,
    evtDisaster,
    evtGeopolitics,
    evtIceAge,
    evtIndustry,
    evtNature,
    evtSocial,

    // Happiness
    hapAmenities,
    hapCrime,
    hapMorale,

    // Governance
    govEspionage,
    govExpansion,
    govGovernment,

    // Infrastructure
    infBuilding,
    infExpansion,

    // Trade
    trdMarket,
    trdExpansion,

    // Victory
    vicVictory,

    // Knowledge
    knwAgriculture,
    knwBotany,
    knwMedicine,
    knwMetallurgy,

    // Sociology
    socDynamics,
    socCombat,
    socTrauma,
    socDiplomacy,
    socEthnogenesis,
    socFactionEvol,
    socCompetition,
    socMigration,
    socExpansion,
    socState,

    // Facções
    facAcademicos,
    facPrimitivistas,
    facComerciantes,
    facCorporatist,
    facApocalipse,
    facEcoExtremistas,
    facMilitares,
    facFeudalistas,
    facHivemind,
    facIsolados,
    facOceanicos,
    facSindicatos,
    facSpiritualist,
    facTecnocratas,
    facTransumanistas
];
