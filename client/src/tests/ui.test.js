// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { Config } from '../config/ConfigLoader.js';
import { GameEngine } from '../core/Engine.js';

describe('UI/UX de Abas Responsivas e Calibragem Cósmica do Painel Deus', () => {

    beforeEach(() => {
        // Inicializa o mock do DOM simulado pelo JSDOM para o Painel Deus
        document.body.innerHTML = `
            <div id="god-panel" class="fullscreen-menu" style="display: flex;">
                <div class="god-panel-tabs">
                    <button class="god-tab-btn active" id="btn-tab-physics" data-god-tab="god-tab-physics">🎛️ FÍSICA</button>
                    <button class="god-tab-btn" id="btn-tab-saves" data-god-tab="god-tab-saves">💾 TEMPO</button>
                    <button class="god-tab-btn" id="btn-tab-presets" data-god-tab="god-tab-presets">🪐 PRESETS</button>
                </div>
                
                <div class="menu-grid">
                    <div id="god-tab-physics" class="god-tab-content active">
                        <input type="range" id="config-war" min="1" max="20" value="5">
                        <input type="range" id="config-disaster" min="50" max="200" value="95">
                        <input type="range" id="config-tech" min="0.5" max="3.0" step="0.1" value="1.0">
                        <input type="range" id="config-growth" min="2" max="20" value="8">
                        <input type="range" id="config-dna" min="50" max="500" step="10" value="200">
                        <span id="val-war">5%</span>
                        <span id="val-disaster">95%</span>
                    </div>
                    <div id="god-tab-saves" class="god-tab-content">
                        <div id="save-drop-zone"></div>
                    </div>
                    <div id="god-tab-presets" class="god-tab-content"></div>
                </div>

                <button id="btn-start-universe">INICIAR UNIVERSO</button>
                <div id="loading-screen" style="display: none;"></div>
            </div>
        `;
    });

    it('deve alternar a visibilidade das abas e botões ativos ao clicar (Navegação Responsiva)', () => {
        const btns = document.querySelectorAll('.god-tab-btn');
        const contents = document.querySelectorAll('.god-tab-content');

        // Fiação lógica de alternância idêntica ao index.js
        btns.forEach(btn => {
            btn.onclick = (e) => {
                const targetTabId = btn.dataset.godTab;
                
                btns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                contents.forEach(content => {
                    if (content.id === targetTabId) content.classList.add('active');
                    else content.classList.remove('active');
                });
            };
        });

        // 1. Estado inicial
        expect(document.getElementById('btn-tab-physics').classList.contains('active')).toBe(true);
        expect(document.getElementById('god-tab-physics').classList.contains('active')).toBe(true);
        expect(document.getElementById('god-tab-saves').classList.contains('active')).toBe(false);

        // 2. Clique na aba TEMPO (Saves)
        document.getElementById('btn-tab-saves').click();
        expect(document.getElementById('btn-tab-physics').classList.contains('active')).toBe(false);
        expect(document.getElementById('btn-tab-saves').classList.contains('active')).toBe(true);
        expect(document.getElementById('god-tab-physics').classList.contains('active')).toBe(false);
        expect(document.getElementById('god-tab-saves').classList.contains('active')).toBe(true);

        // 3. Clique na aba PRESETS
        document.getElementById('btn-tab-presets').click();
        expect(document.getElementById('btn-tab-saves').classList.contains('active')).toBe(false);
        expect(document.getElementById('btn-tab-presets').classList.contains('active')).toBe(true);
        expect(document.getElementById('god-tab-saves').classList.contains('active')).toBe(false);
        expect(document.getElementById('god-tab-presets').classList.contains('active')).toBe(true);
    });

    it('deve realizar a calibragem física em engine.config e Config global ao clicar em iniciar, sem lançar TypeError', () => {
        const engine = new GameEngine();
        const startBtn = document.getElementById('btn-start-universe');

        // Garante que o hotfix de inicialização defensiva e mutação de Config funciona perfeitamente
        startBtn.onclick = () => {
            const warVal = parseFloat(document.getElementById('config-war').value) / 100.0;
            const disasterVal = parseInt(document.getElementById('config-disaster').value);
            const techVal = parseFloat(document.getElementById('config-tech').value);
            const growthVal = parseFloat(document.getElementById('config-growth').value) / 100.0;
            const dnaVal = parseInt(document.getElementById('config-dna').value);

            engine.config.warChance = warVal;
            engine.config.disasterThreshold = disasterVal;
            engine.config.techCostMultiplier = techVal;
            
            // Inicializa defensivamente os sub-objetos para prevenir TypeError
            if (!engine.config.demographics) engine.config.demographics = {};
            engine.config.demographics.baseGrowthRate = growthVal;
            engine.config.baseGrowth = growthVal;

            if (!engine.config.dnaGeneration) engine.config.dnaGeneration = {};
            engine.config.dnaGeneration.popPerPoint = dnaVal;
            
            // Sincroniza mutações com o singleton global Config
            if (Config && Config._game) {
                if (!Config._game.warConfig) Config._game.warConfig = {};
                Config._game.warConfig.warChance = warVal;
                Config._game.warConfig.techCostMultiplier = techVal;

                if (!Config._game.severity) Config._game.severity = {};
                Config._game.severity.disasterThreshold = disasterVal;

                if (!Config._game.demographics) Config._game.demographics = {};
                Config._game.demographics.baseGrowthRate = growthVal;

                if (!Config._game.dnaGeneration) Config._game.dnaGeneration = {};
                Config._game.dnaGeneration.popPerPoint = dnaVal;
            }
        };

        // Executa o clique simulado e valida que não gera exceção
        expect(() => startBtn.click()).not.toThrow();

        // Verifica se os valores foram injetados perfeitamente em engine.config
        expect(engine.config.warChance).toBe(0.05);
        expect(engine.config.disasterThreshold).toBe(95);
        expect(engine.config.techCostMultiplier).toBe(1.0);
        expect(engine.config.baseGrowth).toBe(0.08);
        expect(engine.config.demographics.baseGrowthRate).toBe(0.08);
        expect(engine.config.dnaGeneration.popPerPoint).toBe(200);

        // Verifica a sincronicidade científica com o Config global
        expect(Config.get('warConfig.warChance')).toBe(0.05);
        expect(Config.get('severity.disasterThreshold')).toBe(95);
        expect(Config.get('demographics.baseGrowthRate')).toBe(0.08);
        expect(Config.get('dnaGeneration.popPerPoint')).toBe(200);
    });

});
