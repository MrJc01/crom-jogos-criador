export const FactionTaxonomy = {
    indo_europeus: { name: "Indo-Europeus", baseColor: "#3498db", traits: ["expansionist", "militarist"] },
    sino_tibetanos: { name: "Sino-Tibetanos", baseColor: "#e74c3c", traits: ["technological", "materialist"] },
    bantu: { name: "Expansão Bantu", baseColor: "#2ecc71", traits: ["ecological", "survivalist"] },
    semitas: { name: "Povos Semitas", baseColor: "#f1c40f", traits: ["spiritual", "survivalist"] },
    mesoamericanos: { name: "Mesoamericanos", baseColor: "#8e44ad", traits: ["spiritual", "militarist"] },
    dravidianos: { name: "Dravidianos", baseColor: "#e67e22", traits: ["technological", "ecological"] },
    uralicos: { name: "Urálicos", baseColor: "#1abc9c", traits: ["survivalist", "pacifist"] },
    austronesios: { name: "Austronésios", baseColor: "#00a8ff", traits: ["expansionist", "ecological"] },
    isolacionistas_andinos: { name: "Andinos", baseColor: "#7f8c8d", traits: ["survivalist", "spiritual"] },
    tribal_generico: { name: "Tribos Nativas", baseColor: "#8b4513", traits: ["survivalist", "animist"] }
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
