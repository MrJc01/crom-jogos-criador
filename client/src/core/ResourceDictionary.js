export class ResourceDictionary {
    static aliases = {
        food: {
            generic: "Comida",
            ocean: "Peixes e Algas",
            desert: "Cactos e Insetos",
            jungle: "Frutas Tropicais e Caça",
            tundra: "Líquen e Carne de Morsa",
            plains: "Grãos Silvestres e Gado",
            forest: "Frutos Silvestres e Caça",
            volcanic: "Bactérias Termófilas"
        },
        wood: {
            generic: "Madeira",
            ocean: "Kelp Fibroso",
            desert: "Raízes Secas",
            jungle: "Madeira de Lei",
            tundra: "Gravetos Congelados",
            plains: "Arbustos",
            forest: "Madeira Maciça",
            volcanic: "Pedra Pomes" // Substituto de construção básica
        },
        minerals: {
            generic: "Minerais",
            ocean: "Nódulos Polimetálicos",
            desert: "Sais e Areia de Sílica",
            jungle: "Minérios Superficiais",
            tundra: "Gelo Ferruginoso",
            plains: "Argila e Calcário",
            forest: "Carvão Vegetal",
            volcanic: "Obsidiana e Enxofre"
        }
    };

    /**
     * Retorna o nome "saborizado" do recurso com base no bioma dominante.
     * @param {string} resourceKey - A chave interna (ex: "food", "wood")
     * @param {string} biomeType - O ID do bioma (ex: "desert", "tundra")
     */
    static getLocalizedName(resourceKey, biomeType) {
        if (!this.aliases[resourceKey]) return resourceKey;
        return this.aliases[resourceKey][biomeType] || this.aliases[resourceKey].generic || resourceKey;
    }
}
