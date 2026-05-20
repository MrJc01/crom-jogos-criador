import { Config } from '../config/ConfigLoader.js';

export class Demographics {
    constructor(initialPopulation) {
        this.total = initialPopulation;
        
        const demoCfg = Config.demographics() || {};
        const ageCfg = demoCfg.ageDistribution || { child: { ratio: 0.2 }, young: { ratio: 0.3 }, adult: { ratio: 0.4 }, elder: { ratio: 0.1 } };
        const sexCfg = demoCfg.sexDistribution || { M: 0.5, F: 0.5 };
        
        // Tensores de Distribuição (Porcentagens 0.0 a 1.0)
        this.dist = {
            sex: { ...sexCfg },
            age: { 
                child: ageCfg.child?.ratio || 0.2, 
                young: ageCfg.young?.ratio || 0.3, 
                adult: ageCfg.adult?.ratio || 0.4, 
                elder: ageCfg.elder?.ratio || 0.1 
            },
            religion: { animism: 1.0 },
            factions: { tribal: 1.0 }
        };
        
        // Config de pirâmide etária para checks de capacidade
        this._ageMeta = ageCfg;
        
        // Fila de Gestação: 270 dias (9 meses). Valores são números absolutos de fetos.
        const pregnancyDays = demoCfg.pregnancyDays || 270;
        this.pregnancyQueue = new Array(pregnancyDays).fill(0);
        
        // Contadores de mortalidade para relatórios
        this.infantDeathsThisYear = 0;
        this.elderDeathsThisYear = 0;
        this.yearlyDeaths = 0;
        this.yearlyBirths = 0;
    }
    
    /**
     * 007. Retorna a população ativa (young + adult) — os únicos que produzem.
     */
    get workingPopulation() {
        return Math.floor(this.total * (this.dist.age.young + this.dist.age.adult));
    }
    
    /**
     * 007. Retorna a população que pode lutar (young + adult).
     */
    get militaryPopulation() {
        return Math.floor(this.total * (this.dist.age.young + this.dist.age.adult));
    }
    
    /**
     * 007. Retorna a população dependente (child + elder).
     */
    get dependentPopulation() {
        return Math.floor(this.total * (this.dist.age.child + this.dist.age.elder));
    }
    
    /**
     * 011. Determina o estágio DTM com base na era atual e na população global.
     */
    getDTMStage(eraMult, globalPop = 0) {
        const demoCfg = Config.demographics() || {};
        const stages = demoCfg.dtm?.stages || [
            // FIX: Boost massivo de nascimentos e redução de mortalidade para Idade da Pedra
            { name: "Pré-Industrial", minEra: 1, birthRate: 0.150, deathRate: 0.015, infantMortality: 0.10 }
        ];
        const threshold = demoCfg.dtmPopThreshold || 5000;
        
        let current = stages[0];
        for (const stage of stages) {
            if (eraMult >= stage.minEra) {
                // Só permite avançar além da Transição Inicial (minEra >= 3) se a população global exceder o limite DTM
                if (stage.minEra <= 2 || globalPop >= threshold) {
                    current = stage;
                }
            }
        }
        return current;
    }
    
    /**
     * 006+011. Processa nascimentos e mortes baseado no DTM.
     * Chamado por tick no Engine.
     */
    processDTM(eraMult, hasSanitation, biomeId, deltaDays = 1, globalPop = 0) {
        const stage = this.getDTMStage(eraMult, globalPop);
        const demoCfg = Config.demographics() || {};
        
        // ESTOCÁSTICA (CAOS)
        let chaosFactorBirths = 0.5 + Math.random(); // 0.5x a 1.5x
        let chaosFactorDeaths = 0.5 + Math.random(); // 0.5x a 1.5x
        
        // EVENTOS CISNE NEGRO (BLACK SWANS) - 1% de chance de algo brutal acontecer ao ano por região
        if (deltaDays > 1 && Math.random() < (0.01 * (deltaDays / 365))) {
            if (Math.random() > 0.5) {
                // Cisne Negro Positivo (Baby Boom / Era de Ouro Oculta)
                chaosFactorBirths *= 3.0;
                chaosFactorDeaths *= 0.2;
            } else {
                // Cisne Negro Negativo (Praga Oculta / Fome Súbita)
                chaosFactorBirths *= 0.2;
                chaosFactorDeaths *= 5.0;
            }
        }
        
        // Nascimentos baseados no DTM (Crude Birth Rate se aplica à população total)
        const dailyBirthRate = stage.birthRate / 365;
        const exactBirths = this.total * dailyBirthRate * deltaDays * chaosFactorBirths;
        const totalBirths = Math.floor(exactBirths) + (Math.random() < (exactBirths % 1) ? 1 : 0);
        
        let newborns = 0;
        
        // Fast-forward na fila de gestação
        const advance = Math.min(deltaDays, this.pregnancyQueue.length);
        for (let i = 0; i < advance; i++) {
            newborns += this.pregnancyQueue.shift() || 0;
        }
        
        // Preenche a fila de volta para 270 dias
        while (this.pregnancyQueue.length < 270) {
            this.pregnancyQueue.push(0);
        }
        
        if (deltaDays >= 270) {
            // Tempo passou tão rápido que nasceram instantaneamente
            newborns += totalBirths;
        } else {
            // Coloca no fim da fila
            this.pregnancyQueue[this.pregnancyQueue.length - 1] += totalBirths;
        }
        
        // 006. Mortalidade infantil
        let infantMortality = stage.infantMortality * chaosFactorDeaths;
        const sanitCfg = demoCfg.sanitationImpact || {};
        if (!hasSanitation) {
            infantMortality *= (sanitCfg.noSanitationMortalityMultiplier || 1.5); // Reduzido de 3.0 para 1.5 para sobrevivência inicial
        }
        infantMortality = Math.min(0.80, infantMortality); // Cap elevado em caso de pragas
        
        const exactSurvivingBabies = newborns * (1 - infantMortality);
        const survivingBabies = Math.floor(exactSurvivingBabies) + (Math.random() < (exactSurvivingBabies % 1) ? 1 : 0);
        const infantDeaths = newborns - survivingBabies;
        
        // Mortalidade natural calculada sobre a população inicial do tick
        const dailyDeathRate = stage.deathRate / 365;
        const exactDeaths = this.total * dailyDeathRate * deltaDays * chaosFactorDeaths;
        const naturalDeaths = Math.floor(exactDeaths) + (Math.random() < (exactDeaths % 1) ? 1 : 0);
        
        if (survivingBabies > 0) {
            this.addBirths(survivingBabies);
            this.yearlyBirths += survivingBabies;
        }
        this.infantDeathsThisYear += infantDeaths;
        if (naturalDeaths > 0) {
            const elderDeaths = Math.floor(naturalDeaths * 0.6);
            const otherDeaths = naturalDeaths - elderDeaths;
            this.killByAge('elder', elderDeaths);
            this.kill(otherDeaths);
            this.yearlyDeaths += naturalDeaths;
        }
        
        // O debug do DTM foi removido para não poluir o terminal.
        
        return { births: survivingBabies, deaths: naturalDeaths + infantDeaths, infantDeaths };
    }
    
    /**
     * Envelhece a pirâmide etária (chamado 1x por ano).
     * O envelhecimento contínuo suave por coortes já é processado diariamente em aging.js.
     * Manter a transição anual aqui gera um envelhecimento redundante severo
     * que acelera artificialmente o óbito de adultos ativos e inflaciona idosos.
     */
    ageOneYear() {
        // Apenas normaliza para somar 1.0 para manter integridade numérica
        const sum = this.dist.age.child + this.dist.age.young + this.dist.age.adult + this.dist.age.elder;
        if (sum > 0 && Math.abs(sum - 1.0) > 0.001) {
            this.dist.age.child /= sum;
            this.dist.age.young /= sum;
            this.dist.age.adult /= sum;
            this.dist.age.elder /= sum;
        }
        
        // Reset contadores anuais
        this.infantDeathsThisYear = 0;
        this.elderDeathsThisYear = 0;
        this.yearlyDeaths = 0;
        this.yearlyBirths = 0;
    }
    
    /**
     * 012. Calcula o consumo de recursos baseado no metabolismo do bioma.
     */
    getMetabolism(biomeId) {
        const demoCfg = Config.demographics() || {};
        const metab = demoCfg.metabolismByBiome || {};
        return metab[biomeId] || { food: 1.0, wood: 1.0, water: 1.0 };
    }
    
    // Injeta novos nascimentos na demografia e recalcula a matriz de Idades
    addBirths(amount) {
        if (amount <= 0) return;
        
        const newTotal = this.total + amount;
        if (newTotal === 0) return;
        
        // As novas pessoas são "crianças". A % de crianças sobe, o resto é diluído.
        const oldChildCount = this.total * this.dist.age.child;
        this.dist.age.child = (oldChildCount + amount) / newTotal;
        
        this.dist.age.young = (this.total * this.dist.age.young) / newTotal;
        this.dist.age.adult = (this.total * this.dist.age.adult) / newTotal;
        this.dist.age.elder = (this.total * this.dist.age.elder) / newTotal;
        
        this.total = newTotal;
    }

    /**
     * Adiciona migrantes ponderando matematicamente a mistura multicultural e religiosa,
     * além de diluir as faixas etárias de forma proporcional (migrantes são em geral jovens e adultos).
     */
    addMigrants(amount, sourceFactions, sourceReligions) {
        if (amount <= 0) return;
        
        const oldTotal = this.total;
        const newTotal = this.total + amount;
        
        if (newTotal === 0) return;
        
        // Diluição etária: assumimos que migrantes são 50% jovens e 50% adultos (população ativa)
        const oldChildCount = oldTotal * this.dist.age.child;
        const oldYoungCount = oldTotal * this.dist.age.young;
        const oldAdultCount = oldTotal * this.dist.age.adult;
        const oldElderCount = oldTotal * this.dist.age.elder;
        
        this.dist.age.child = oldChildCount / newTotal;
        this.dist.age.young = (oldYoungCount + amount * 0.5) / newTotal;
        this.dist.age.adult = (oldAdultCount + amount * 0.5) / newTotal;
        this.dist.age.elder = oldElderCount / newTotal;
        
        // Mistura as facções ponderadamente com base no tamanho das populações
        const newFactions = {};
        for (const [factionId, ratio] of Object.entries(this.dist.factions)) {
            newFactions[factionId] = (ratio * oldTotal) / newTotal;
        }
        for (const [factionId, ratio] of Object.entries(sourceFactions || {})) {
            newFactions[factionId] = (newFactions[factionId] || 0) + (ratio * amount) / newTotal;
        }
        this.dist.factions = newFactions;
        
        // Mistura as religiões ponderadamente com base no tamanho das populações
        const newReligions = {};
        for (const [relId, ratio] of Object.entries(this.dist.religion)) {
            newReligions[relId] = (ratio * oldTotal) / newTotal;
        }
        for (const [relId, ratio] of Object.entries(sourceReligions || {})) {
            newReligions[relId] = (newReligions[relId] || 0) + (ratio * amount) / newTotal;
        }
        this.dist.religion = newReligions;
        
        this.total = newTotal;
    }
    
    kill(amount) {
        if (amount <= 0) return;
        
        // Cradle of Humanity Shield: Proteção a nível de Kernel
        if (this.total > 0 && this.total <= 500) {
            const exactShield = this.total * 0.05;
            let maxLethality = Math.floor(exactShield);
            if (Math.random() < (exactShield % 1)) maxLethality += 1;
            amount = Math.min(amount, maxLethality);
        }
        
        if (amount <= 0) return;
        
        this.total = Math.max(0, this.total - amount);
    }
    
    /**
     * Mata de um grupo etário específico (usado para idosos, crianças, etc.)
     */
    killByAge(ageGroup, amount) {
        if (amount <= 0 || this.total <= 0) return;
        
        // Cradle of Humanity Shield: Proteção a nível de Kernel
        if (this.total > 0 && this.total <= 500) {
            const exactShield = this.total * 0.05;
            let maxLethality = Math.floor(exactShield);
            if (Math.random() < (exactShield % 1)) maxLethality += 1;
            amount = Math.min(amount, maxLethality);
        }
        
        if (amount <= 0) return;
        
        const groupPop = Math.floor(this.total * (this.dist.age[ageGroup] || 0));
        const actualKill = Math.min(amount, groupPop);
        if (actualKill <= 0) return;
        
        const newTotal = this.total - actualKill;
        if (newTotal <= 0) { this.total = 0; return; }
        
        // Recalcula proporções
        const groupCount = groupPop - actualKill;
        this.dist.age[ageGroup] = groupCount / newTotal;
        
        // Ajusta outros grupos proporcionalmente
        for (const key of Object.keys(this.dist.age)) {
            if (key !== ageGroup) {
                this.dist.age[key] = (this.total * this.dist.age[key]) / newTotal;
            }
        }
        this.total = newTotal;
    }

    // Função utilitária para mutação de distribuição genérica
    shiftDistribution(category, keyIncrease, keyDecrease, amount) {
        if (this.dist[category][keyDecrease] >= amount) {
            this.dist[category][keyDecrease] -= amount;
            this.dist[category][keyIncrease] += amount;
        }
    }

    // Move uma porcentagem `rate` da população de `sourceFaction` para `targetFaction`
    assimilate(targetFaction, sourceFaction, rate) {
        if (!this.dist.factions[sourceFaction]) return;
        const amountToMove = this.dist.factions[sourceFaction] * rate;
        
        this.dist.factions[sourceFaction] -= amountToMove;
        
        if (!this.dist.factions[targetFaction]) {
            this.dist.factions[targetFaction] = 0;
        }
        this.dist.factions[targetFaction] += amountToMove;
        
        if (this.dist.factions[sourceFaction] < 0.0001) {
            delete this.dist.factions[sourceFaction];
        }
    }
    
    // Fratura (Cisma) uma facção
    splitFaction(parentFaction, childFaction, percentageOfParent) {
        if (!this.dist.factions[parentFaction]) return;
        const amountToMove = this.dist.factions[parentFaction] * percentageOfParent;
        
        this.dist.factions[parentFaction] -= amountToMove;
        
        if (!this.dist.factions[childFaction]) {
            this.dist.factions[childFaction] = 0;
        }
        this.dist.factions[childFaction] += amountToMove;
    }
}
