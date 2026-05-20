import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine, Biomes } from '../core/Engine.js';
import { Demographics } from '../core/Demographics.js';

describe('Demographics 2.0 (Tensores de %)', () => {
  it('deve inicializar com proporções corretas e fila de gestação limpa', () => {
    const demo = new Demographics(100);
    expect(demo.total).toBe(100);
    expect(demo.dist.sex.F).toBe(0.5);
    expect(demo.pregnancyQueue.length).toBe(270);
    expect(demo.pregnancyQueue[0]).toBe(0);
  });

  it('deve recalcular a matriz de idades após nascimentos (diluição)', () => {
    const demo = new Demographics(100); // 20 crianças, 30 jovens, 40 adultos, 10 idosos
    expect(demo.dist.age.child).toBe(0.2);
    
    // Nascem 100 novas crianças (Dobrando a pop)
    demo.addBirths(100);
    
    expect(demo.total).toBe(200);
    
    // Velho Child Count: 20. + 100 = 120. Total novo: 200. Ratio: 120/200 = 0.6
    expect(demo.dist.age.child).toBe(0.6);
    // Velho Adult: 40. Total novo 200. Ratio = 40/200 = 0.2
    expect(demo.dist.age.adult).toBe(0.2);
  });

  it('deve transferir corretamente as % de idade no shiftDistribution', () => {
    const demo = new Demographics(1000);
    demo.dist.age.child = 0.5;
    demo.dist.age.young = 0.0;
    
    demo.shiftDistribution('age', 'young', 'child', 0.1);
    
    expect(demo.dist.age.child).toBeCloseTo(0.4);
    expect(demo.dist.age.young).toBeCloseTo(0.1);
  });
});

describe('GameEngine - Auto-load de Módulos', () => {
  let engine;

  beforeEach(() => {
    engine = new GameEngine();
  });

  // Como o import.meta.glob não roda no vitest local da mesma forma sem config específica, 
  // o Array plugins pode vir vazio no teste unitário padrão. Vamos simular um mock.
  it('deve suportar injeção de plugins que mutam os Demographics', () => {
    engine.initWorld([{ id: 'A' }], [[]]);
    engine.startInfection('A');
    
    const nodeA = engine.nodes.get('A');
    nodeA.demographics.total = 100;
    
    // Mock Module
    engine.plugins = [{
        id: 'test_module',
        type: 'test',
        applyTick(node) {
            node.demographics.addBirths(50);
        }
    }];
    
    engine.processTick(1);
    
    expect(nodeA.demographics.total).toBe(150);
    expect(engine.globalPop).toBe(150);
  });
});
