export const FactionTaxonomy = {
    tribal: { name: "Tribal", baseColor: "#8b4513", traits: ["survivalist", "animist"] },
    expansionistas_militares: { name: "Expansionistas Militares", baseColor: "#e74c3c", traits: ["militarist", "materialist"] },
    tecnocratas: { name: "Tecnocratas", baseColor: "#3498db", traits: ["technological", "materialist"] },
    espiritualistas: { name: "Espiritualistas", baseColor: "#9b59b6", traits: ["spiritual", "pacifist"] },
    corporatist: { name: "Corporativistas", baseColor: "#f1c40f", traits: ["materialist", "expansionist"] },
    eco_rebeldes: { name: "Eco Rebeldes", baseColor: "#2ecc71", traits: ["ecological", "survivalist"] },
    isolacionistas: { name: "Isolacionistas", baseColor: "#7f8c8d", traits: ["survivalist", "pacifist"] },
    simbioticos_mutantes: { name: "Simbióticos Mutantes", baseColor: "#00ffcc", traits: ["ecological", "mutant"] },
    nexistas_digitais: { name: "Nexistas Digitais", baseColor: "#00ffff", traits: ["technological", "hive"] },
    hive_mind: { name: "Mente de Colmeia", baseColor: "#ff00ff", traits: ["hive", "survivalist"] }
};

export class FactionsData {
    static dynamicFactions = {};

    static injectSpeciesMap(speciesMap) {
        this.dynamicFactions = { ...this.dynamicFactions, ...speciesMap };
    }

    static getFaction(id) {
        if (this.dynamicFactions[id]) return this.dynamicFactions[id];
        return FactionTaxonomy[id] || { name: id.replace('_', ' '), baseColor: this.generateHashColor(id), traits: ["mutant"] };
    }
    
    static generateHashColor(name) {
        let hash = 0;
        for(let i=0; i<name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
    }
    
    // Motor procedural para criar nomes híbridos baseados em cruzamento de traits
    static generateHybridFactionId(parentA, parentB) {
        const pA = this.getFaction(parentA);
        const pB = this.getFaction(parentB);
        
        const allTraits = [...pA.traits, ...pB.traits];
        
        if (allTraits.includes("technological") && allTraits.includes("spiritual")) return "cyber_xamas";
        if (allTraits.includes("militarist") && allTraits.includes("ecological")) return "eco_terroristas";
        if (allTraits.includes("corporatist") && allTraits.includes("technological")) return "mega_corporacao";
        if (allTraits.includes("spiritual") && allTraits.includes("militarist")) return "cruzados";
        
        // Fallback genérico
        return `${parentA}_${parentB}`;
    }
}
