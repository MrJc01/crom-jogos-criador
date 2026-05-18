/**
 * ReligionEngine — Religiões procedurais emergentes.
 * 
 * Inspirações: Civ6 (religion spread, theological combat),
 *              Dwarf Fortress (temples, worship, priests),
 *              Jared Diamond (religion as double-edged sword)
 * 
 * Religiões SURGEM sozinhas quando pop > 3000 e literacy < 40%.
 * Cada religião tem tenets aleatórios que definem comportamento.
 * Religiões se ESPALHAM por vizinhança e trade routes.
 * Religiões podem CISMAR quando ficam muito grandes.
 * Secularização acontece quando literacy > 80%.
 */
export default {
    id: 'religion_engine',
    type: 'sociology',
    
    applyTick(node, globalRules, engine) {
        if (!node.infected || node.demographics.total === 0) return;
        if (engine.day % 30 !== 0) return; // Mensal
        
        // Inicializa
        if (!engine.religions) engine.religions = {};
        if (!node.religion) node.religion = { id: null, active: false, piety: 0, temples: 0 };
        
        const pop = node.demographics.total;
        const literacy = engine.literacy || 5;
        
        // ========================================
        // NASCIMENTO DE RELIGIÃO
        // ========================================
        if (!node.religion.active && pop > 3000 && literacy < 40) {
            if (Math.random() < 0.002) {
                const religionId = this.generateReligion(engine);
                node.religion = { id: religionId, active: true, piety: 50, temples: 0 };
                
                if (engine.onEvent) {
                    const rel = engine.religions[religionId];
                    engine.onEvent({
                        message: `🕌 NOVA RELIGIÃO: "${rel.name}" surgiu em ${node.name}! Tenets: ${rel.tenets.join(', ')}.`,
                        nodeId: node.id, type: 'milestone', color: '#9b59b6'
                    }, 'milestone');
                    engine.logEvent?.({ message: `🕌 ${rel.name} surgiu` }, 'religion');
                }
            }
        }
        
        if (!node.religion.active) return;
        
        const rel = engine.religions[node.religion.id];
        if (!rel) return;
        
        // ========================================
        // EFEITOS DOS TENETS
        // ========================================
        for (const tenet of rel.tenets) {
            switch (tenet) {
                case 'pacifism':
                    // Reduz chance de guerra
                    if (node.veteranBuff) node.veteranBuff *= 0.9;
                    break;
                case 'sacrifice':
                    // Sacrifício ritual (mata pop, dá morale)
                    if (Math.random() < 0.001 && pop > 1000) {
                        node.demographics.kill(Math.max(1, Math.floor(pop * 0.001)));
                        node.moraleFactors = node.moraleFactors || {};
                        node.moraleFactors.religion = 8;
                    }
                    break;
                case 'asceticism':
                    // Reduz consumo de food
                    if (node.food !== undefined) node.food += Math.floor(pop * 0.0002);
                    break;
                case 'stewardship':
                    // Boost de farming
                    if (node.soil !== undefined) node.soil = Math.min(100, node.soil + 0.001);
                    break;
                case 'knowledge':
                    // Boost de literacy
                    if (Math.random() < 0.01) engine.literacy = Math.min(100, (engine.literacy || 5) + 0.01);
                    break;
                case 'nature_worship':
                    // Reduz poluição
                    if (engine.globalTemperatureOffset > 0) {
                        engine.globalTemperatureOffset -= 0.0001;
                    }
                    break;
                case 'holy_war':
                    // Boost militar
                    if (node.veteranBuff !== undefined) node.veteranBuff = Math.min(5, (node.veteranBuff || 0) + 0.0001);
                    break;
                case 'expansion':
                    // Spread mais rápido — processado abaixo
                    break;
            }
        }
        
        // Morale da religião
        node.moraleFactors = node.moraleFactors || {};
        node.moraleFactors.religion = node.religion.temples > 0 ? 10 : 5;
        
        // ========================================
        // SPREAD (conversão de vizinhos)
        // ========================================
        const spreadRate = rel.tenets.includes('expansion') ? 0.004 : 0.002;
        const neighbors = node.neighbors || [];
        for (const nId of neighbors) {
            const neighbor = engine.nodes.get(nId);
            if (!neighbor?.infected) continue;
            if (neighbor.religion?.active && neighbor.religion.id === node.religion.id) continue;
            
            // Resistência por literacy
            const resistance = Math.max(0.1, 1 - ((engine.literacy || 5) / 100));
            
            if (Math.random() < spreadRate * resistance) {
                if (!neighbor.religion?.active) {
                    neighbor.religion = { id: node.religion.id, active: true, piety: 30, temples: 0 };
                } else if (neighbor.religion.piety < node.religion.piety) {
                    // Conversão: religião mais forte substitui
                    neighbor.religion.id = node.religion.id;
                    neighbor.religion.piety = 30;
                }
            }
        }
        
        // ========================================
        // PIETY (devoção cresce/decresce)
        // ========================================
        if (node.religion.temples > 0) {
            node.religion.piety = Math.min(100, node.religion.piety + 0.5);
        } else {
            node.religion.piety = Math.max(0, node.religion.piety - 0.1);
        }
        
        // ========================================
        // CONSTRUÇÃO DE TEMPLOS (Zero-Player)
        // ========================================
        if (node.religion.piety > 60 && node.religion.temples < 3) {
            if (engine.inventory.wood >= 200 && engine.inventory.minerals >= 100) {
                if (Math.random() < 0.01) {
                    node.religion.temples++;
                    engine.inventory.wood -= 200;
                    engine.inventory.minerals -= 100;
                    if (engine.onEvent) {
                        engine.onEvent({
                            message: `⛪ TEMPLO CONSTRUÍDO: ${node.name} ergueu um templo para "${rel.name}".`,
                            nodeId: node.id, type: 'milestone', color: '#8e44ad'
                        }, 'milestone');
                    }
                }
            }
        }
        
        // Manutenção de templos
        if (node.religion.temples > 0 && engine.inventory.wood < node.religion.temples * 2) {
            node.religion.temples--;
        }
        
        // ========================================
        // SECULARIZAÇÃO (literacy alta = religião perde força)
        // ========================================
        if (literacy > 80) {
            node.religion.piety = Math.max(0, node.religion.piety - 1.0);
            if (node.religion.piety <= 0) {
                node.religion.active = false;
                if (engine.onEvent) {
                    engine.onEvent({
                        message: `📖 SECULARIZAÇÃO: A educação em ${node.name} dissolveu a fé em "${rel.name}". Sociedade secular.`,
                        nodeId: node.id, type: 'milestone', color: '#2980b9'
                    }, 'milestone');
                }
            }
        }
        
        // ========================================
        // CISMA (religião grande demais se divide)
        // ========================================
        if (pop > 50000 && node.religion.piety > 70 && Math.random() < 0.005) {
            const schismId = this.generateReligion(engine, rel.name + ' (Reforma)');
            engine.pressures.social += 1.0;
            engine.globalTrust = Math.max(5, engine.globalTrust - 20);
            
            if (engine.onEvent) {
                engine.onEvent({
                    message: `⚔️ CISMA RELIGIOSO: "${rel.name}" se dividiu em ${node.name}! Tensão social disparou.`,
                    nodeId: node.id, type: 'nemesis', color: '#e74c3c'
                }, 'nemesis');
                engine.logEvent?.({ message: `⚔️ Cisma em "${rel.name}"` }, 'religion');
            }
        }
    },
    
    generateReligion(engine, forcedName) {
        const prefixes = ["Culto de", "Igreja de", "Irmandade de", "Ordem de", "Templo de", "Fé em", "Caminho de"];
        const concepts = ["Luz Eterna", "Pedra Sagrada", "Fogo Interior", "Águas Profundas", "Céu Infinito", "Raiz do Mundo", "Sol Negro", "Lua Vermelha", "Espírito Antigo", "Chama Imortal", "Vento Norte", "Sombra Mãe"];
        
        const name = forcedName || `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${concepts[Math.floor(Math.random() * concepts.length)]}`;
        
        const allTenets = ['pacifism', 'sacrifice', 'asceticism', 'expansion', 'mysticism', 'stewardship', 'ancestor_worship', 'holy_war', 'knowledge', 'nature_worship'];
        const numTenets = 2 + Math.floor(Math.random() * 2); // 2-3 tenets
        const tenets = [];
        for (let i = 0; i < numTenets; i++) {
            const t = allTenets[Math.floor(Math.random() * allTenets.length)];
            if (!tenets.includes(t)) tenets.push(t);
        }
        
        const id = 'rel_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        engine.religions[id] = { name, tenets, founded: engine.year, followers: 0 };
        return id;
    }
};
