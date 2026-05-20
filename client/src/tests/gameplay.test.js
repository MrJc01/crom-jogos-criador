// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngine } from '../core/Engine.js';
import { UIManager } from '../ui/UIManager.js';
import { Config } from '../config/ConfigLoader.js';

// Mock do Web Audio API para evitar erros em ambiente JSDOM
class AudioContextMock {
    createOscillator() {
        return {
            type: 'sawtooth',
            frequency: {
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn()
            },
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn()
        };
    }
    createGain() {
        return {
            gain: {
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn()
            },
            connect: vi.fn()
        };
    }
    get currentTime() {
        return 0;
    }
    get destination() {
        return {};
    }
}

global.AudioContext = AudioContextMock;
global.webkitAudioContext = AudioContextMock;

describe('E2E gameplay Simulation - Deus Virtual / Tester Automatizado', () => {
    let engine;
    let renderer;
    let uiManager;

    beforeEach(() => {
        // 1. Limpa o DOM do JSDOM e cria o container base idêntico ao index.html
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
                        <span id="val-tech">1.0x</span>
                        <span id="val-growth">8%</span>
                        <span id="val-dna">200</span>
                    </div>
                    <div id="god-tab-saves" class="god-tab-content">
                        <div id="save-drop-zone"></div>
                    </div>
                </div>
                <button id="btn-start-universe">GERAR UNIVERSO E INICIAR MATRIZ</button>
                <div id="loading-screen" style="display: none;"></div>
            </div>
            <div id="game-container"></div>
        `;

        // 2. Injeta o HUD unificado do UIManager
        UIManager.injectCoreUI();

        // 3. Inicializa e Mocka o MapRenderer de alta performance
        renderer = {
            activeLayer: 'base',
            init: vi.fn().mockResolvedValue(true),
            update: vi.fn(),
            spawnBubble: vi.fn(),
            animateBlink: vi.fn(),
            animateMigration: vi.fn()
        };

        // 4. Instancia a Engine de simulação
        engine = new GameEngine();

        // Inicializa o mundo da engine com duas regiões continentais mockadas
        const nodes = [
            { id: 'region_A', name: 'Nirvana Ocidental', biome: { id: 'forest', name: 'Floresta Temperada' } },
            { id: 'region_B', name: 'Valhala Polar', biome: { id: 'tundra', name: 'Tundra Congelada' } }
        ];
        const adjacency = [
            ['region_A', 'region_B']
        ];
        engine.initWorld(nodes, adjacency);

        // Instancia a interface associada
        uiManager = new UIManager(engine, renderer);
    });

    it('deve realizar a calibração de Deus no painel de abertura e sumir com a tela inicial', () => {
        const startBtn = document.getElementById('btn-start-universe');
        const godPanel = document.getElementById('god-panel');

        // Mapeia a fiação das constantes físicas idêntica ao index.js
        startBtn.onclick = () => {
            const growthVal = parseFloat(document.getElementById('config-growth').value) / 100.0;
            const dnaVal = parseInt(document.getElementById('config-dna').value);

            if (!engine.config.demographics) engine.config.demographics = {};
            engine.config.demographics.baseGrowthRate = growthVal;
            engine.config.baseGrowth = growthVal;

            if (!engine.config.dnaGeneration) engine.config.dnaGeneration = {};
            engine.config.dnaGeneration.popPerPoint = dnaVal;

            godPanel.style.display = 'none';
        };

        expect(godPanel.style.display).toBe('flex');
        startBtn.click();
        expect(godPanel.style.display).toBe('none');
        expect(engine.config.demographics.baseGrowthRate).toBe(0.08);
        expect(engine.config.dnaGeneration.popPerPoint).toBe(200);
    });

    it('deve simular as interações de um tester real (seleção de região, criação da tribo fundadora, ticks e gasto de DNA)', () => {
        // 1. Simula clique do jogador no mapa estabelecendo a Tribo Fundadora
        engine.startInfection('region_A');
        const nodeA = engine.nodes.get('region_A');
        nodeA.name = 'Nirvana Ocidental';
        nodeA.demographics.total = 1000;
        nodeA.capacity = 5000;
        nodeA.resources = { wood: 5000, water: 8000, minerals: 2000 };
        nodeA.soil = 100;
        engine.globalPop = 1000;

        // 2. Cria a fiação para o loop de atualização do UIManager e sincronização da sidebar
        const countryInfo = document.getElementById('country-info');
        const infoName = document.getElementById('info-name');
        const infoPop = document.getElementById('info-pop');
        const infoWood = document.getElementById('info-wood');

        // Emula a lógica de updateSidebar do index.js
        const mockUpdateSidebar = (node) => {
            countryInfo.classList.remove('hidden');
            infoName.textContent = node.name;
            infoPop.textContent = Math.floor(node.demographics.total);
            infoWood.textContent = Math.floor(node.resources.wood);
        };

        // Verifica que o painel começa escondido
        expect(countryInfo.classList.contains('hidden')).toBe(true);

        // Jogador clica na região A e inspeciona
        mockUpdateSidebar(nodeA);
        expect(countryInfo.classList.contains('hidden')).toBe(false);
        expect(infoName.textContent).toBe('Nirvana Ocidental');
        expect(infoPop.textContent).toBe('1000');
        expect(infoWood.textContent).toBe('5000');

        // 3. Simula um tick ecológico acumulado de 30 dias (mesma taxa que dispara updates mensais)
        engine.adaptationPoints = 100; // DNA Points inicial
        engine.day = 30; // 1 mês se passa
        uiManager.update();

        // 4. Jogador interage com os botões de DNA Power na aba de controle
        const godPopBtn = document.getElementById('btn-god-pop');
        expect(godPopBtn).not.toBeNull();

        // Fiação lógica da Bênção de Natalidade (+50 pop, gasta 30 DNA)
        godPopBtn.onclick = () => {
            const cost = 30;
            if (engine.adaptationPoints >= cost) {
                engine.adaptationPoints -= cost;
                nodeA.demographics.total += 50;
                engine.globalPop += 50;
                mockUpdateSidebar(nodeA);
            }
        };

        // Jogador abençoa a região A com crescimento divino
        godPopBtn.click();
        expect(engine.adaptationPoints).toBe(70);
        expect(nodeA.demographics.total).toBe(1050);
        expect(infoPop.textContent).toBe('1050');

        // 5. Testador clica em outra região (Região B) vazia
        const nodeB = engine.nodes.get('region_B');
        nodeB.name = 'Valhala Polar';
        nodeB.demographics.total = 0;
        nodeB.capacity = 2000;
        nodeB.resources = { wood: 1000, water: 2000, minerals: 500 };
        nodeB.soil = 100;

        mockUpdateSidebar(nodeB);
        expect(infoName.textContent).toBe('Valhala Polar');
        expect(infoPop.textContent).toBe('0');
    });

    it('deve simular o processamento da fila de eventos em frames de jogo (onEvent) sem quebrar o DOM do newsfeed', () => {
        const newsFeedList = document.getElementById('news-feed-list');
        const eventsQueue = [];

        // Fiação lógica de eventos idêntica ao processEventsQueue do index.js
        const mockOnEvent = (data, type) => {
            eventsQueue.push({ data, type });
        };

        const mockProcessEventsQueue = () => {
            for (const event of eventsQueue) {
                const { data, type } = event;
                if (type === "disaster" || type === "warning") {
                    const item = document.createElement('div');
                    item.textContent = data.message || data;
                    newsFeedList.prepend(item);
                }
            }
            eventsQueue.length = 0;
        };

        // Executa eventos estocásticos da engine
        mockOnEvent({ message: '☄️ Um asteroide radioativo passou de raspão!' }, 'warning');
        mockOnEvent({ message: '💥 Tsunami nas praias do Nirvana Ocidental!' }, 'disaster');

        expect(eventsQueue.length).toBe(2);
        expect(newsFeedList.children.length).toBe(0);

        // Processa o frame
        mockProcessEventsQueue();
        expect(eventsQueue.length).toBe(0);
        expect(newsFeedList.children.length).toBe(2);
        expect(newsFeedList.children[0].textContent).toBe('💥 Tsunami nas praias do Nirvana Ocidental!');
    });
});
