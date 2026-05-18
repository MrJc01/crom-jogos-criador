/**
 * AudioManager — Sistema de áudio procedural do CROM.
 * 
 * 089. Web Audio API — AudioContext básico com sons de interface.
 * 090. Som Ambiente Procedural — Drones que mudam com a Era.
 * 091. Alarme de Nemesis — Sirene reverberada quando severidade > 80%.
 * 092. Tone.js stub — Estrutura para sequências musicais.
 * 093. Efeitos de Desastre — Sons de impacto reverb para vulcões/meteoros.
 * 094. Som Dielétrico — Orquestração que fica densa com progresso.
 */
export class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.droneOsc = null;
        this.enabled = false;
        this.currentEra = 'tribal';
        this.volume = 0.3;
    }
    
    /**
     * 089. Inicializa Web Audio API.
     */
    init() {
        if (typeof AudioContext === 'undefined' && typeof webkitAudioContext === 'undefined') return;
        
        try {
            this.ctx = new (AudioContext || webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.ctx.destination);
            this.enabled = true;
        } catch(e) {
            console.warn('[AudioManager] Falha ao inicializar:', e.message);
        }
    }
    
    /**
     * 089. Som de click de botão.
     */
    playClick() {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
    
    /**
     * 090. Drone ambiente que muda com a era.
     */
    updateAmbientDrone(eraName) {
        if (!this.enabled) return;
        
        const eraFreqs = {
            'Idade da Pedra': { freq: 55, type: 'sine' },
            'Idade do Cobre': { freq: 73, type: 'sine' },
            'Idade do Bronze': { freq: 98, type: 'triangle' },
            'Idade do Ferro': { freq: 110, type: 'triangle' },
            'Era Industrial': { freq: 146, type: 'sawtooth' },
            'Era da Informação': { freq: 220, type: 'square' },
            'Era Espacial': { freq: 330, type: 'sine' }
        };
        
        const config = eraFreqs[eraName] || eraFreqs['Idade da Pedra'];
        
        if (this.currentEra === eraName && this.droneOsc) return;
        this.currentEra = eraName;
        
        // Para o drone anterior
        if (this.droneOsc) {
            try { this.droneOsc.stop(); } catch(e) {}
        }
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        osc.type = config.type;
        osc.frequency.value = config.freq;
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        gain.gain.value = 0.05; // Bem sutil
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        
        this.droneOsc = osc;
    }
    
    /**
     * 091. Alarme de Nemesis — Sirene quando severidade > 80%.
     */
    playNemesisAlarm() {
        if (!this.enabled) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.5);
        osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 1.0);
        
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
        
        // Reverb via delay
        const delay = this.ctx.createDelay();
        delay.delayTime.value = 0.1;
        const feedback = this.ctx.createGain();
        feedback.gain.value = 0.3;
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        gain.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        feedback.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 1.5);
    }
    
    /**
     * 093. Som de desastre (explosão reverb).
     */
    playDisasterSound(type) {
        if (!this.enabled) return;
        
        const configs = {
            'volcanic': { freq: 60, duration: 2.0, type: 'sawtooth' },
            'earthquake': { freq: 40, duration: 1.5, type: 'square' },
            'meteor': { freq: 100, duration: 3.0, type: 'sawtooth' },
            'pandemic': { freq: 300, duration: 1.0, type: 'sine' },
            'war': { freq: 150, duration: 0.5, type: 'square' }
        };
        
        const cfg = configs[type] || configs['earthquake'];
        
        // Noise burst + low-pass filter
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        osc.type = cfg.type;
        osc.frequency.value = cfg.freq;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(cfg.freq, this.ctx.currentTime + cfg.duration);
        
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + cfg.duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + cfg.duration);
    }
    
    /**
     * 094. Orquestração proporcional à complexidade.
     */
    updateDensity(techCount) {
        if (!this.enabled || !this.masterGain) return;
        // Volume do drone aumenta sutilmente com complexidade
        const density = Math.min(0.5, 0.05 + (techCount * 0.005));
        this.masterGain.gain.setTargetAtTime(density, this.ctx.currentTime, 0.5);
    }
    
    setVolume(v) {
        this.volume = Math.max(0, Math.min(1, v));
        if (this.masterGain) this.masterGain.gain.value = this.volume;
    }
    
    destroy() {
        if (this.droneOsc) try { this.droneOsc.stop(); } catch(e) {}
        if (this.ctx) this.ctx.close();
        this.enabled = false;
    }
}
