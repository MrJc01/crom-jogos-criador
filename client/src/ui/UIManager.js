/**
 * UIManager — Componentes visuais de interface do CROM.
 * 
 * 068. Ícones de Causa/Efeito no terminal de eventos
 * 069. Chronicle Panel — Histórico rolável dos últimos 50 eventos
 * 070. Hex Flash — Destaque visual quando eventos diplomáticos acontecem
 * 071. Painel Fatores de Risco — Probabilidades acumuladas por território
 * 072. Painel de Biomas — Clicar no hex lista recursos
 * 073. Raio-X Demográfico — Gráfico de pizza com facções
 * 074. Indicadores Visuais de Desastre — Ícones piscantes
 * 078. Gráfico Hockey Stick — Plota população ao longo dos séculos
 * 079. Painel EROI Global — Barra de energia
 * 080. Filtro Sepia para Dark Age — Tela fica fria quando tech é perdida
 * 081. Histórico Forense JSON — Botão exportar
 * 082. Pause Automático por Extinção — Pausa se 5% pop sumir
 * 083. Cemitério de Civilizações — localStorage persistente
 */
export class UIManager {
    static injectCoreUI() {
        if (typeof document === 'undefined') return;
        
        // Se já foi injetado, ignora
        if (document.getElementById('global-hud')) return;

        const uiHTML = `
        <!-- HUD Global Compacto (Topo Direita) -->
        <div id="global-hud" class="stone-panel hud-box" style="top: 10px; right: 10px; left: auto; flex-direction: row; flex-wrap: wrap; width: 350px; max-width: 45%; justify-content: space-between; font-size: 14px; padding: 5px 10px; z-index: 90;">
            <div class="hud-item" style="width: 45%;"><span class="icon" title="Data do Jogo">📅</span> <span id="game-date">Ano 1, Mês 1</span></div>
            <div class="hud-item" style="width: 45%;"><span class="icon" title="População Mundial">👥</span> <span id="global-pop">0</span></div>
            <div class="hud-item" style="width: 45%;"><span class="icon" title="Severidade Planetária">⚠️</span> <span id="global-severity" style="color:#ff4444;">0%</span></div>
            <div class="hud-item" style="width: 45%;"><span class="icon" title="Pontos de DNA">🧬</span> <span id="global-dna" style="color:#f1c40f;">0</span></div>
            <div class="hud-item" style="width: 100%; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 5px; padding-top: 5px;">
                <span class="icon" title="Era Tecnológica">⏳</span> <span id="game-era" style="color:#00ddff; font-weight:bold;">Idade da Pedra</span> | 
                <span class="icon" title="Facção Dominante">👑</span> <span id="dominant-faction">-</span>
            </div>
        </div>

        <!-- Recursos Globais (Topo Esquerda) -->
        <div id="inventory-hud" class="stone-panel hud-box" style="top: 10px; left: 10px; right: auto; flex-direction: row; flex-wrap: wrap; max-width: 50%; gap: 10px; padding: 5px 10px; font-size: 16px; z-index: 90;">
            <div class="hud-item" style="color: #6ab04c;"><span class="icon" title="Madeira">🌲</span> <span id="inv-wood">0</span></div>
            <div class="hud-item" style="color: #e3c16f;"><span class="icon" title="Minérios">🪨</span> <span id="inv-minerals">0</span></div>
            <div class="hud-item" style="color: #aaa;"><span class="icon" title="Aço">⛓️</span> <span id="inv-steel">0</span></div>
            <div class="hud-item" style="color: #00ddff;"><span class="icon" title="Chips">💻</span> <span id="inv-chips">0</span></div>
            <div class="hud-item" style="color: #ffaa00; font-weight: bold; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 10px;"><span class="icon" title="Retorno Energético (EROI)">⚙️ EROI:</span> <span id="inv-eroi">100%</span></div>
        </div>

        <!-- Log de Eventos Rápido / Notícias (Flutuante Discreto) -->
        <div id="news-feed-panel" class="stone-panel hud-box" style="right: 20px; top: 120px; width: 300px; max-height: 180px; overflow-y: hidden; pointer-events: none; opacity: 0.8; background: rgba(5, 10, 20, 0.9); border-color: rgba(0, 221, 255, 0.1);">
            <div style="font-size: 13px; color: #00ddff; text-align: center; margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 2px; font-family: 'Orbitron';">NOTÍCIAS GLOBAIS</div>
            <div id="news-feed-list" style="font-size: 12px; display: flex; flex-direction: column; gap: 5px; line-height: 1.2;"></div>
        </div>

        <!-- Creator's Control Deck (Painel de Controle Central de Abas) -->
        <div id="control-deck" class="control-deck hidden">
            <div class="deck-header">
                <h2>🎛️ CONSOLE DO CRIADOR DA MATRIZ</h2>
                <button class="deck-close-btn" id="btn-close-deck" title="Fechar Painel">✖</button>
            </div>
            
            <div class="deck-tabs-header">
                <button class="deck-tab-btn active" data-tab="tab-monitor">📊 Monitor</button>
                <button class="deck-tab-btn" data-tab="tab-tech">🧬 Sabedoria</button>
                <button class="deck-tab-btn" data-tab="tab-industry">⚙️ Indústria</button>
                <button class="deck-tab-btn" data-tab="tab-factions">🎭 Facções</button>
                <button class="deck-tab-btn" data-tab="tab-policies">📜 Políticas</button>
                <button class="deck-tab-btn" data-tab="tab-god">⚡ DNA Powers</button>
                <button class="deck-tab-btn" data-tab="tab-disasters">🔥 Anomalias</button>
            </div>
            
            <div class="deck-content">
                <!-- Aba 1: Monitor Global -->
                <div id="tab-monitor" class="deck-tab-content active">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <!-- Seção Clima -->
                        <div class="stone-panel" style="padding: 10px; background: rgba(0,0,0,0.25);">
                            <div class="tab-section-title">🌍 Clima Global</div>
                            <div id="climate-bar-container"></div>
                            <div id="climate-stats" style="margin-top: 5px; font-size: 11px;">Fase: -</div>
                        </div>
                        
                        <!-- Seção EROI (Energia) -->
                        <div class="stone-panel" style="padding: 10px; background: rgba(0,0,0,0.25);">
                            <div class="tab-section-title">⚡ Energia (EROI)</div>
                            <div id="eroi-bar-container"></div>
                            <div id="eroi-stats" style="margin-top: 5px; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">-</div>
                        </div>
                    </div>
                    
                    <!-- Lentes de Ecologia -->
                    <div class="stone-panel" style="padding: 10px; background: rgba(0,0,0,0.25);">
                        <div class="tab-section-title">🌍 Lentes de Ecologia e Visualização</div>
                        <div style="display: flex; gap: 8px;">
                            <button id="btn-layer-base" class="item-action-btn" style="flex: 1; margin: 0; background: rgba(68,68,68,0.3); border-color: #555;">🌍 Biomas Base</button>
                            <button id="btn-layer-water" class="item-action-btn" style="flex: 1; margin: 0; background: rgba(17,17,17,0.3); border-color: #333;">💧 Aquífero (Água)</button>
                            <button id="btn-layer-climate" class="item-action-btn" style="flex: 1; margin: 0; background: rgba(17,17,17,0.3); border-color: #333;">🌡️ Clima (Emissões)</button>
                        </div>
                    </div>
                    
                    <!-- Gráfico de População -->
                    <div class="stone-panel" style="padding: 10px; background: rgba(0,0,0,0.25);">
                        <div class="tab-section-title">📈 Curva Populacional Global</div>
                        <canvas id="pop-graph" width="540" height="100" style="width: 100%; height: 100px; display: block;"></canvas>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px; height: 160px; overflow: hidden;">
                        <!-- Crônica de Eventos -->
                        <div class="stone-panel" style="padding: 10px; display: flex; flex-direction: column; background: rgba(0,0,0,0.25);">
                            <div class="tab-section-title">📜 Crônica do Universo</div>
                            <div id="chronicle-list" style="flex: 1; overflow-y: auto; font-size: 11px; line-height: 1.4; padding-right: 5px;"></div>
                        </div>
                        
                        <!-- Cemitério de Civilizações -->
                        <div class="stone-panel" style="padding: 10px; display: flex; flex-direction: column; background: rgba(0,0,0,0.25);">
                            <div class="tab-section-title">🪦 Cemitério</div>
                            <div id="cemetery-list" style="flex: 1; overflow-y: auto; font-size: 11px; padding-right: 5px;">
                                <div style="color: #666; font-style: italic; text-align: center; margin-top: 20px;">Nenhum registro ainda</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Aba 2: Sabedoria (Árvore de Tecnologia) -->
                <div id="tab-tech" class="deck-tab-content">
                    <div style="font-size: 13px; color: #8899a6; text-align: center; margin-bottom: 5px;">Desbloqueie teorias evolutivas e ascensão cósmica gastando Pontos de DNA.</div>
                    <div id="tech-list" style="display: flex; flex-direction: column; gap: 10px; overflow-y: auto; padding-right: 5px; flex: 1;"></div>
                </div>
                
                <!-- Aba 3: Indústria (Fabricação) -->
                <div id="tab-industry" class="deck-tab-content">
                    <div style="font-size: 13px; color: #8899a6; text-align: center; margin-bottom: 5px;">Forje insumos refinados a partir dos recursos globais coletados pelas facções.</div>
                    <div id="recipe-list" class="grid-list" style="padding: 5px 0; max-height: none; overflow-y: auto; flex: 1;"></div>
                </div>
                
                <!-- Aba 4: Facções e Demografia -->
                <div id="tab-factions" class="deck-tab-content">
                    <div style="display: flex; gap: 12px; flex: 1; overflow: hidden; align-items: flex-start; height: 100%;">
                        <!-- Gráfico de Pizza -->
                        <div class="stone-panel" style="padding: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 180px; height: 100%; box-sizing: border-box; background: rgba(0,0,0,0.25);">
                            <div class="tab-section-title" style="text-align: center; width: 100%;">👥 Fatias de Poder</div>
                            <canvas id="demo-pie" width="140" height="140" style="max-width: 140px; max-height: 140px; margin: 10px 0; display: block;"></canvas>
                        </div>
                        
                        <!-- Lista de Facções -->
                        <div class="stone-panel" style="flex: 1; padding: 10px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; background: rgba(0,0,0,0.25);">
                            <div class="tab-section-title">🎭 Distribuição e Tensões</div>
                            <div id="demo-stats" style="flex: 1; overflow-y: auto; font-size: 11px; padding-right: 5px; display: flex; flex-direction: column; gap: 6px;"></div>
                            <div id="factions-list" style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; overflow-y: auto; max-height: 140px; display: flex; flex-direction: column; gap: 5px;"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Aba 5: Políticas (Governança) -->
                <div id="tab-policies" class="deck-tab-content">
                    <div style="font-size: 13px; color: #8899a6; text-align: center; margin-bottom: 10px;">Ative decretos planetários para governar o atrito social e o desgaste ecológico.</div>
                    <div style="display: flex; flex-direction: column; gap: 12px; overflow-y: auto; padding-right: 5px; flex: 1;">
                        <div class="stone-panel" style="justify-content: space-between; padding: 12px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; background: rgba(0,0,0,0.2);">
                            <div>
                                <strong style="color: #2ecc71; font-size: 14px; font-family: 'Orbitron';">🌲 Reflorestamento Ativo</strong>
                                <div style="font-size: 12px; color: #8899a6; margin-top: 4px;">Gasta mão de obra regional para plantar lenha e resfriar o planeta. (-20% K)</div>
                            </div>
                            <button id="btn-policy-forest" class="item-action-btn" style="width: 100px; margin: 0;">Ativar</button>
                        </div>
                        <div class="stone-panel" style="justify-content: space-between; padding: 12px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; background: rgba(0,0,0,0.2);">
                            <div>
                                <strong style="color: #3498db; font-size: 14px; font-family: 'Orbitron';">💧 Racionamento Hídrico</strong>
                                <div style="font-size: 12px; color: #8899a6; margin-top: 4px;">Reduz o consumo de água local, mas causa tensões sociais. (+30% Atrito)</div>
                            </div>
                            <button id="btn-policy-water" class="item-action-btn" style="width: 100px; margin: 0;">Ativar</button>
                        </div>
                    </div>
                </div>
                
                <!-- Aba 6: Poderes Divinos (God Mode) -->
                <div id="tab-god" class="deck-tab-content">
                    <div style="font-size: 13px; color: #8899a6; text-align: center; margin-bottom: 5px;">Gaste Pontos de DNA (🧬) para intervir na sobrevivência dos seres da região selecionada no mapa.</div>
                    
                    <div class="stone-panel" style="padding: 10px; background: rgba(0, 221, 255, 0.03); border: 1px solid rgba(0, 221, 255, 0.1); margin-bottom: 10px;">
                        <strong style="color: #00ddff; display: block; font-family: 'Orbitron'; font-size: 12px; margin-bottom: 4px;">🎯 REGIÃO SELECIONADA:</strong>
                        <div id="god-selected-region-name" style="font-size: 15px; font-weight: bold; color: #fff;">Nenhuma Região Selecionada (Clique no mapa)</div>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 10px; overflow-y: auto; padding-right: 5px; flex: 1;">
                        <div class="stone-panel" style="justify-content: space-between; padding: 10px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; background: rgba(0,0,0,0.2);">
                            <div>
                                <strong style="color: #2ecc71; display: block; font-size: 13px; font-family: 'Orbitron';">🍞 Rações Divinas</strong>
                                <span style="font-size: 11px; color: #8899a6;">+10.000 Comida na Região Selecionada</span>
                            </div>
                            <button id="btn-god-food" class="item-action-btn" style="width: 100px; font-size: 11px; height: 32px; padding: 0; margin: 0;">🧬 15 DNA</button>
                        </div>
                        <div class="stone-panel" style="justify-content: space-between; padding: 10px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; background: rgba(0,0,0,0.2);">
                            <div>
                                <strong style="color: #00ddff; display: block; font-size: 13px; font-family: 'Orbitron';">💧 Aquífero Sagrado</strong>
                                <span style="font-size: 11px; color: #8899a6;">+20.000 Água na Região Selecionada</span>
                            </div>
                            <button id="btn-god-water" class="item-action-btn" style="width: 100px; font-size: 11px; height: 32px; padding: 0; margin: 0;">🧬 15 DNA</button>
                        </div>
                        <div class="stone-panel" style="justify-content: space-between; padding: 10px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; background: rgba(0,0,0,0.2);">
                            <div>
                                <strong style="color: #f1c40f; display: block; font-size: 13px; font-family: 'Orbitron';">🌱 Bênção de Natalidade</strong>
                                <span style="font-size: 11px; color: #8899a6;">+50 Seres Vivos na Região Selecionada</span>
                            </div>
                            <button id="btn-god-pop" class="item-action-btn" style="width: 100px; font-size: 11px; height: 32px; padding: 0; margin: 0;">🧬 30 DNA</button>
                        </div>
                        <div class="stone-panel" style="justify-content: space-between; padding: 10px; border: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; background: rgba(0,0,0,0.2);">
                            <div>
                                <strong style="color: #9b59b6; display: block; font-size: 13px; font-family: 'Orbitron';">🦠 Expurgar Epidemia</strong>
                                <span style="font-size: 11px; color: #8899a6;">Limpar Fomes e Pestes locais</span>
                            </div>
                            <button id="btn-god-cure" class="item-action-btn" style="width: 100px; font-size: 11px; height: 32px; padding: 0; margin: 0;">🧬 40 DNA</button>
                        </div>
                    </div>
                </div>
                
                <!-- Aba 7: Anomalias / Destruição (Fúria do Planeta) -->
                <div id="tab-disasters" class="deck-tab-content">
                    <div style="font-size: 13px; color: #8899a6; text-align: center; margin-bottom: 10px;">Invoque a Fúria Quântica sobre a Matriz para testar a resistência das civilizações terrestres.</div>
                    <div class="stone-panel" style="text-align: center; color: #8899a6; padding: 20px; background: rgba(0,0,0,0.25); display: flex; flex-direction: column; gap: 10px; flex: 1; justify-content: center; align-items: center;">
                        <p style="margin: 0; font-size: 13px;">O Grande Filtro age de forma autônoma para expurgar a ineficiência quântica planetária.</p>
                        <button class="item-action-btn" style="width: 100%; max-width: 300px; border-color: #ff3838; background: rgba(255,56,56,0.1); color: #ff3838;" onclick="alert('Destruição manual em breve!')">☄️ Lançar Meteoro de Fúria (Anomalia)</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Info Local (Lupa de Inspeção - Gaveta Retrátil Lateral Esquerda) -->
        <div id="country-info" class="stone-panel hidden">
            <div class="modal-header">
                <h2 id="info-name" style="font-size: 18px; text-transform: uppercase;">Local</h2>
                <button class="close-btn" onclick="document.getElementById('country-info').classList.add('hidden')">✖</button>
            </div>
            
            <div style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.15);">
                <div style="font-size: 13px; line-height: 1.6;">
                    <div><strong>🌍 Bioma:</strong> <span id="info-biome" style="color: var(--neon-blue);">-</span></div>
                    <div><strong>🏷️ Status:</strong> <span id="info-status" style="font-weight:bold;">Vazio</span></div>
                </div>
                
                <div style="display: flex; justify-content: space-between; font-size: 14px; color: #fff; margin-top: 8px; font-family: 'Orbitron';">
                    <span>👥 População:</span>
                    <span><span id="info-pop">0</span> / <span id="info-cap">0</span></span>
                </div>
                <!-- Barra de Superlotação -->
                <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); margin-top: 5px; border-radius:3px;">
                    <div id="info-pop-bar" style="height: 100%; width: 0%; background: var(--neon-green); transition: width 0.3s; border-radius:3px;"></div>
                </div>
            </div>
            
            <div style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                <h3 class="tab-section-title">🌲 Recursos Regionais</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 14px;">
                    <div><span id="label-wood">🌲 Madeira</span>: <span id="info-wood" style="color:#00ff88; font-weight:bold;">0</span></div>
                    <div><span id="label-water">💧 Água</span>: <span id="info-water" style="color:#00ddff; font-weight:bold;">0</span></div>
                    <div><span id="label-minerals">🪨 Minérios</span>: <span id="info-minerals" style="color:#ffaa00; font-weight:bold;">0</span></div>
                    <div>🌱 Solo: <span id="info-soil" style="color:#2ecc71; font-weight:bold;">100%</span></div>
                </div>
            </div>
            
            <div style="padding: 12px; background: rgba(255,56,56,0.02); flex: 1; display: flex; flex-direction: column; min-height: 140px;">
                <h3 class="tab-section-title" style="color: #ff3838;">🌋 Fatores de Risco</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 12px; color: #aaa;">
                    <div>🌋 Tectônico: <span id="risk-tectonic" style="color:#ff4444; font-weight:bold;">0%</span></div>
                    <div>🌡️ Climático: <span id="risk-climatic" style="color:#ff4444; font-weight:bold;">0%</span></div>
                    <div>🦠 Biológico: <span id="risk-biological" style="color:#ff4444; font-weight:bold;">0%</span></div>
                    <div>🔥 Social: <span id="risk-social" style="color:#ff4444; font-weight:bold;">0%</span></div>
                </div>
                
                <div style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 8px; flex: 1; overflow-y: auto;">
                    <div style="font-size: 11px; color: #8899a6; font-family:'Orbitron'; letter-spacing: 0.5px; margin-bottom: 4px;">TENSÕES LOCAIS (FACÇÕES)</div>
                    <div id="info-factions-list" style="display: flex; flex-direction: column; gap: 4px; font-size: 11px;">
                        <!-- Preenchido via JS -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Instruções Iniciais -->
        <div id="instructions" class="stone-panel" style="position: absolute; top: 80px; left: 50%; transform: translateX(-50%); width: 450px; text-align: center; padding: 12px; z-index: 100; pointer-events: none; border-color: var(--neon-blue); box-shadow: 0 5px 20px rgba(0, 221, 255, 0.2); font-family: 'Orbitron';">
            <h2 style="color: var(--neon-blue); margin: 0; font-size: 18px; letter-spacing: 1px;">CROM: A Tribo Fundadora</h2>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #aaa; font-family: 'Inter';">Clique em qualquer região continental no mapa para estabelecer a Tribo inicial ou aguarde 5 segundos para a dispersão cósmica automática.</p>
        </div>

        <!-- Toasts -->
        <div id="toast-container" style="position: absolute; top: 100px; left: 50%; transform: translateX(-50%); z-index: 1000; text-align: center;"></div>

        <!-- Caixa de Ferramentas Base (Bottom Toolbar) -->
        <div id="bottom-toolbar" class="stone-panel">
            <button class="tool-btn" id="btn-play-pause" title="Play/Pause" style="background: #6b2e2e; border-color: #ff3838;">⏸️</button>
            <div style="display: flex; flex-direction: column; justify-content: center; gap: 2px; padding: 0 5px;">
                <button class="speed-btn active" data-speed="1">1x</button>
                <button class="speed-btn" data-speed="3">3x</button>
                <button class="speed-btn" data-speed="5">5x</button>
            </div>
            <div style="width: 1px; background: rgba(255,255,255,0.1); height: 36px; margin: 0 6px;"></div>
            
            <!-- Botões que agora controlam as abas do Control Deck -->
            <button class="tool-btn" id="btn-world" title="Lentes e Clima (Aba Monitor)">📊</button>
            <button class="tool-btn" id="btn-wisdom" title="Sabedoria Evolutiva (Aba Sabedoria)">🧬</button>
            <button class="tool-btn" id="btn-industry" title="Complexo Industrial (Aba Indústria)">⚙️</button>
            <button class="tool-btn" id="btn-factions" title="Tensões Sociais (Aba Facções)">🎭</button>
            <button class="tool-btn" id="btn-policies" title="Decretos de Estado (Aba Políticas)">📜</button>
            <button class="tool-btn" id="btn-godmode" title="Poderes de DNA (Aba DNA Powers)" style="background: rgba(92, 59, 140, 0.4); border-color: #9b59b6;">⚡</button>
            <button class="tool-btn" id="btn-disasters" title="Fúria Planetária (Aba Anomalias)">🔥</button>
            
            <div style="width: 1px; background: rgba(255,255,255,0.1); height: 36px; margin: 0 6px;"></div>
            <!-- Botão Integrado de Exportar Save Rápido no HUD -->
            <button class="tool-btn" id="btn-export-save" title="Exportar Save JSON" style="background: rgba(0, 255, 136, 0.15); border-color: var(--neon-green);">📥</button>
        </div>
        
        <!-- Tooltip -->
        <div id="tooltip" class="stone-panel hidden" style="position: absolute; pointer-events: none; z-index: 999; padding: 5px; font-size: 14px; border-color: var(--neon-blue);"></div>
        `;
        
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.insertAdjacentHTML('beforeend', uiHTML);
        }
    }
    constructor(engine, mapRenderer) {
        this.engine = engine;
        this.mapRenderer = mapRenderer;
        this.popHistory = [];
        this.maxHistory = 500; // 500 anos de dados
        this.lastPop = 0;
        this.darkAgeActive = false;
        this.cemetery = this.loadCemetery();
        
        this.initPanels();
    }
    
    initPanels() {
        // Os painéis agora pertencem estaticamente ao Control Deck. 
        // Não é necessária a criação dinâmica de janelas flutuantes soltas.
    }
    
    // Métodos createXXXPanel simplificados, pois os elementos com os IDs corretos
    // já são fornecidos na marcação única e de alta fidelidade do Control Deck.
    createChroniclePanel(container) {}
    createDemographicsPanel(container) {}
    createPopGraphPanel(container) {}
    createEROIPanel(container) {}
    createClimatePanel(container) {}
    createCemeteryPanel(container) {}
    
    updateChronicle() {
        const list = document.getElementById('chronicle-list');
        if (!list || !this.engine.chronicle) return;
        
        const recent = this.engine.chronicle.slice(-30).reverse();
        // 068. Ícones de Causa/Efeito
        list.innerHTML = recent.map(e => {
            const icon = this.getEventIcon(e.type);
            return `<div style="padding:2px 0;border-bottom:1px solid #222;">${icon} <span style="color:#888;">Ano ${e.year}</span> ${e.message}</div>`;
        }).join('');
    }
    
    // 068. Ícones por tipo de evento
    getEventIcon(type) {
        const icons = {
            'disaster': '💥', 'war': '⚔️', 'pandemic': '🦠', 'genocide': '💀',
            'kessler': '🛰️', 'singularity': '🤖', 'exhaustion': '⛏️',
            'simplification': '🏚️', 'piracy': '🏴‍☠️', 'economy': '💰',
            'hyperinflation': '📉', 'diplomacy': '🤝', 'rebirth': '🔄',
            'achievement': '🏆', 'milestone': '⭐', 'warning': '⚠️',
            'tech_auto': '🔬', 'nemesis': '👹'
        };
        return icons[type] || '📌';
    }
    
    // =============================================
    // 073. Demographics Panel — Pizza de facções
    // =============================================
    updateDemographics() {
        const panel = document.getElementById('demographics-panel');
        const canvas = document.getElementById('demo-pie');
        const stats = document.getElementById('demo-stats');
        if (!panel || !canvas || !stats) return;
        
        if (!this.engine.globalDemographics?.factions) return;
        panel.style.display = 'block';
        
        const factions = this.engine.globalDemographics.factions;
        const total = Object.values(factions).reduce((a, b) => a + b, 0);
        if (total <= 0) return;
        
        // Desenha pizza
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 150, 150);
        const cx = 75, cy = 75, r = 60;
        let startAngle = 0;
        
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f1c40f', '#1abc9c', '#e67e22'];
        let i = 0;
        
        let statsHtml = '';
        for (const [fac, count] of Object.entries(factions)) {
            const pct = count / total;
            const endAngle = startAngle + pct * Math.PI * 2;
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, startAngle, endAngle);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            
            statsHtml += `<div><span style="color:${colors[i % colors.length]}">■</span> ${fac}: ${Math.floor(count).toLocaleString('pt-BR')} (${(pct * 100).toFixed(1)}%)</div>`;
            startAngle = endAngle;
            i++;
        }
        stats.innerHTML = statsHtml;
    }
    
    // =============================================
    // 071/072. Painel de Hex Info (Biomas + Riscos)
    // =============================================
    showHexInfo(node) {
        let panel = document.getElementById('hex-info-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'hex-info-panel';
            panel.style.cssText = 'position:fixed;left:10px;bottom:60px;background:rgba(0,0,0,0.9);color:#ddd;padding:12px;border-radius:8px;font-size:12px;z-index:200;min-width:220px;border:1px solid #444;';
            document.body.appendChild(panel);
        }
        
        const biome = node.biome?.id || 'unknown';
        const pop = node.demographics?.total || 0;
        const cap = node.capacity || 0;
        const ratio = cap > 0 ? (pop / cap * 100).toFixed(1) : 0;
        
        // 071. Fatores de Risco
        const risks = [];
        if (pop / cap > 0.8) risks.push('⚠️ Superlotação');
        if ((node.resources?.water || 0) < 1000) risks.push('💧 Seca');
        if ((node.resources?.wood || 0) < 500) risks.push('🪵 Desmatamento');
        if (node.sir?.active) risks.push('🦠 Pandemia ativa');
        if (node.veteranBuff > 0) risks.push('⚔️ Zona de conflito');
        
        panel.innerHTML = `
            <div style="color:#ffaa00;font-weight:bold;margin-bottom:5px;">📍 ${node.name || node.id}</div>
            <div>🌍 Bioma: <span style="color:#aaa">${biome}</span></div>
            <div>🧬 Adaptação: <span style="color:#9b59b6">${Math.floor(node.biomeAdaptation?.[biome] || 0)}%</span></div>
            <div>👥 Pop: <span style="color:#3498db">${pop.toLocaleString('pt-BR')}</span> / ${cap.toLocaleString('pt-BR')} (${ratio}%)</div>
            <div>🪵 Madeira: ${(node.resources?.wood || 0).toLocaleString('pt-BR')}</div>
            <div>💧 Água: ${(node.resources?.water || 0).toLocaleString('pt-BR')}</div>
            <div>⛏️ Minerais: ${(node.resources?.minerals || 0).toLocaleString('pt-BR')}</div>
            ${node.rareEarths ? `<div>💎 Terras Raras: ${node.rareEarths}</div>` : ''}
            ${node.aquiferDepth ? `<div>🕳️ Aquífero: ${node.aquiferDepth.toFixed(2)}m</div>` : ''}
            ${risks.length > 0 ? `<div style="margin-top:5px;color:#e74c3c;font-weight:bold;">RISCOS:</div>${risks.map(r => `<div>${r}</div>`).join('')}` : '<div style="color:#2ecc71;margin-top:3px;">✅ Sem riscos</div>'}
        `;
        panel.style.display = 'block';
    }
    
    hideHexInfo() {
        const panel = document.getElementById('hex-info-panel');
        if (panel) panel.style.display = 'none';
    }
    
    // =============================================
    // 078. Hockey Stick — Gráfico de pop ao longo do tempo
    // =============================================
    createPopGraphPanel(container) {
        const panel = document.createElement('div');
        panel.id = 'popgraph-panel';
        panel.style.cssText = 'pointer-events:auto;background:rgba(0,0,0,0.85);color:#ddd;padding:10px;margin:5px;border-radius:8px;font-size:11px;border:1px solid #333;';
        panel.innerHTML = '<div style="color:#2ecc71;font-weight:bold;margin-bottom:5px;">📈 POPULAÇÃO</div><canvas id="pop-graph" width="280" height="80"></canvas>';
        container.appendChild(panel);
    }
    
    updatePopGraph() {
        // Registra 1 ponto por ano
        if (this.engine.day === 0) {
            this.popHistory.push(this.engine.globalPop);
            if (this.popHistory.length > this.maxHistory) this.popHistory.shift();
        }
        
        const canvas = document.getElementById('pop-graph');
        if (!canvas || this.popHistory.length < 2) return;
        
        const ctx = canvas.getContext('2d');
        const w = 280, h = 80;
        ctx.clearRect(0, 0, w, h);
        
        const max = Math.max(...this.popHistory, 1);
        const step = w / (this.popHistory.length - 1);
        
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < this.popHistory.length; i++) {
            const x = i * step;
            const y = h - (this.popHistory[i] / max) * (h - 5);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#888';
        ctx.font = '9px monospace';
        ctx.fillText(`Peak: ${Math.max(...this.popHistory).toLocaleString('pt-BR')}`, 5, 12);
        ctx.fillText(`Atual: ${this.engine.globalPop.toLocaleString('pt-BR')}`, 5, h - 3);
    }
    
    // =============================================
    // 079. EROI Panel — Barra de energia
    // =============================================
    createEROIPanel(container) {
        const panel = document.createElement('div');
        panel.id = 'eroi-panel';
        panel.style.cssText = 'pointer-events:auto;background:rgba(0,0,0,0.85);color:#ddd;padding:10px;margin:5px;border-radius:8px;font-size:11px;border:1px solid #333;';
        panel.innerHTML = '<div style="color:#f39c12;font-weight:bold;margin-bottom:5px;">⚡ ENERGIA (EROI)</div><div id="eroi-bar-container"></div><div id="eroi-stats"></div>';
        container.appendChild(panel);
    }
    
    updateEROI() {
        const container = document.getElementById('eroi-bar-container');
        const stats = document.getElementById('eroi-stats');
        if (!container || !stats) return;
        
        const inv = this.engine.inventory;
        const woodRatio = Math.min(1, (inv.wood || 0) / 10000);
        const mineralRatio = Math.min(1, (inv.minerals || 0) / 10000);
        const totalEnergy = (woodRatio + mineralRatio) / 2;
        
        const color = totalEnergy > 0.5 ? '#2ecc71' : totalEnergy > 0.2 ? '#f39c12' : '#e74c3c';
        
        container.innerHTML = `<div style="background:#222;border-radius:4px;height:12px;"><div style="background:${color};height:100%;width:${totalEnergy * 100}%;border-radius:4px;transition:width 0.3s;"></div></div>`;
        stats.innerHTML = `<div>🪵 ${(inv.wood || 0).toLocaleString('pt-BR')} | ⛏️ ${(inv.minerals || 0).toLocaleString('pt-BR')} | 💻 ${inv.chips || 0} | 🖥️ ${inv.computers || 0}</div>`;
    }
    
    // =============================================
    // 080. Filtro Sepia para Dark Age
    // =============================================
    updateDarkAgeFilter() {
        const body = document.body;
        if (!body) return;
        
        // Detecta "dark age" — perda de techs recente
        const isDarkAge = this.engine.chronicle?.some(e => 
            e.type === 'warning' && 
            e.message?.includes('COMPLEXIDADE') && 
            e.year >= this.engine.year - 10
        );
        
        if (isDarkAge && !this.darkAgeActive) {
            body.style.filter = 'sepia(0.3) saturate(0.7) brightness(0.9)';
            this.darkAgeActive = true;
        } else if (!isDarkAge && this.darkAgeActive) {
            body.style.filter = 'none';
            this.darkAgeActive = false;
        }
    }
    
    // =============================================
    // 081. Histórico Forense JSON — Download
    // =============================================
    exportForensicJSON() {
        const data = {
            version: '2.0',
            timestamp: new Date().toISOString(),
            seed: this.engine.seed || 'unknown',
            chronicle: this.engine.chronicle || [],
            popHistory: this.popHistory,
            finalState: {
                year: this.engine.year,
                pop: this.engine.globalPop,
                techs: Array.from(this.engine.unlockedTechs || []),
                era: this.engine.currentEra?.name,
                inventory: { ...this.engine.inventory },
                trust: this.engine.globalTrust,
                severity: this.engine.severity
            }
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `crom_forensic_y${this.engine.year}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // =============================================
    // 082. Pause Automático por Extinção Tática
    // =============================================
    checkExtinctionPause() {
        if (this.lastPop > 0) {
            const loss = (this.lastPop - this.engine.globalPop) / this.lastPop;
            if (loss > 0.05 && this.engine.globalPop > 0) {
                if (this.engine.pause) this.engine.pause();
                if (this.engine.onEvent) {
                    this.engine.onEvent({ 
                        message: `⏸️ PAUSE AUTOMÁTICO: ${(loss * 100).toFixed(1)}% da população morreu repentinamente!`, 
                        type: 'warning', color: '#ff0000' 
                    }, 'warning');
                }
            }
        }
        this.lastPop = this.engine.globalPop;
    }
    
    // =============================================
    // NOVO: Climate Panel — Temperatura Global
    // =============================================
    createClimatePanel(container) {
        const panel = document.createElement('div');
        panel.id = 'climate-panel';
        panel.style.cssText = 'pointer-events:auto;background:rgba(0,0,0,0.85);color:#ddd;padding:10px;margin:5px;border-radius:8px;font-size:11px;border:1px solid #333;';
        panel.innerHTML = '<div style="color:#00cec9;font-weight:bold;margin-bottom:5px;">🌍 CLIMA GLOBAL</div><div id="climate-bar-container"></div><div id="climate-stats" style="margin-top:4px;"></div>';
        container.appendChild(panel);
    }
    
    updateClimate() {
        const container = document.getElementById('climate-bar-container');
        const stats = document.getElementById('climate-stats');
        if (!container || !stats || this.engine.globalTemperature === undefined) return;
        
        const temp = this.engine.globalTemperature; // -1.0 a 1.0
        // Normaliza de 0.0 (Gelo) a 1.0 (Calor)
        const normalized = (temp + 1) / 2;
        
        let color = '#2ecc71'; // Temperado
        let phase = 'Temperado';
        if (temp > 0.8) { color = '#e74c3c'; phase = '⚠️ Grande Seca'; }
        else if (temp > 0.4) { color = '#f39c12'; phase = 'Aquecimento'; }
        else if (temp < -0.8) { color = '#0984e3'; phase = '❄️ Era do Gelo'; }
        else if (temp < -0.4) { color = '#74b9ff'; phase = 'Resfriamento'; }
        
        container.innerHTML = `<div style="background:#222;border-radius:4px;height:12px;position:relative;"><div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:#fff;z-index:10;"></div><div style="background:${color};height:100%;width:${normalized * 100}%;border-radius:4px;transition:width 0.3s;"></div></div>`;
        stats.innerHTML = `Fase: <span style="color:${color};font-weight:bold;">${phase}</span>`;
    }

    // =============================================
    // 083. Cemitério de Civilizações (localStorage)
    // =============================================
    createCemeteryPanel(container) {
        const panel = document.createElement('div');
        panel.id = 'cemetery-panel';
        panel.style.cssText = 'pointer-events:auto;background:rgba(0,0,0,0.85);color:#ddd;padding:10px;margin:5px;border-radius:8px;font-size:11px;border:1px solid #333;display:none;';
        panel.innerHTML = '<div style="color:#7f8c8d;font-weight:bold;margin-bottom:5px;">🪦 CEMITÉRIO</div><div id="cemetery-list"></div>';
        container.appendChild(panel);
    }
    
    loadCemetery() {
        if (typeof localStorage === 'undefined') return [];
        try {
            return JSON.parse(localStorage.getItem('crom_cemetery') || '[]');
        } catch { return []; }
    }
    
    buryCurrentCiv() {
        this.cemetery.push({
            year: this.engine.year,
            pop: this.engine.globalPop,
            techs: this.engine.unlockedTechs?.size || 0,
            era: this.engine.currentEra?.name || 'Desconhecida',
            cause: this.engine.globalPop <= 0 ? 'Extinção' : 'Abandono',
            timestamp: Date.now()
        });
        this.cemetery = this.cemetery.slice(-20); // Mantém últimas 20
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('crom_cemetery', JSON.stringify(this.cemetery));
        }
    }
    
    updateCemetery() {
        const list = document.getElementById('cemetery-list');
        const panel = document.getElementById('cemetery-panel');
        if (!list || !panel || this.cemetery.length === 0) return;
        
        panel.style.display = 'block';
        list.innerHTML = this.cemetery.slice(-5).reverse().map(c => 
            `<div style="padding:2px 0;border-bottom:1px solid #222;">🪦 ${c.era} • ${c.year}y • ${c.pop.toLocaleString('pt-BR')} pop • ${c.techs} techs</div>`
        ).join('');
    }
    
    // =============================================
    // Master Update — Chamado pelo game loop
    // =============================================
    update() {
        if (this.engine.day % 30 === 0) { // Mensal
            this.updateChronicle();
            this.updateDemographics();
            this.updateEROI();
            this.updateDarkAgeFilter();
            this.updateClimate(); // NOVO
        }
        if (this.engine.day === 0) { // Anual
            this.updatePopGraph();
            this.updateCemetery();
            this.checkExtinctionPause();
        }
    }
}
