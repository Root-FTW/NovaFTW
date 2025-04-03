export class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = {};
        this.currentMusic = null;
        this.isMuted = false;
        
        // Initialize audio context
        this.initAudioContext();
        
        // Load sounds
        this.loadSounds();
    }
    
    initAudioContext() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API is not supported in this browser');
            this.audioContext = null;
        }
    }
    
    loadSounds() {
        // Define sound effects
        const soundEffects = {
            'playerShoot': { url: 'audio/player_shoot.mp3', volume: 0.5 },
            'playerHit': { url: 'audio/player_hit.mp3', volume: 0.7 },
            'enemyHit': { url: 'audio/enemy_hit.mp3', volume: 0.5 },
            'enemyDestroyed': { url: 'audio/enemy_destroyed.mp3', volume: 0.6 },
            'powerUp': { url: 'audio/power_up.mp3', volume: 0.7 },
            'explosion': { url: 'audio/explosion.mp3', volume: 0.8 },
            'bossWarning': { url: 'audio/boss_warning.mp3', volume: 0.9 },
            'gameOver': { url: 'audio/game_over.mp3', volume: 1.0 },
            'victory': { url: 'audio/victory.mp3', volume: 1.0 }
        };
        
        // Define music tracks
        const musicTracks = {
            'title': { url: 'audio/title_music.mp3', volume: 0.5, loop: true },
            'game': { url: 'audio/game_music.mp3', volume: 0.4, loop: true },
            'boss': { url: 'audio/boss_music.mp3', volume: 0.6, loop: true }
        };
        
        // Create placeholder sounds since we don't have actual audio files
        for (const [name, config] of Object.entries(soundEffects)) {
            this.createPlaceholderSound(name, config);
        }
        
        // Create placeholder music tracks
        for (const [name, config] of Object.entries(musicTracks)) {
            this.createPlaceholderMusic(name, config);
        }
    }
    
    createPlaceholderSound(name, config) {
        if (!this.audioContext) return;
        
        // Create a short beep sound as a placeholder
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'sine';
        
        // Different sounds have different frequencies
        switch (name) {
            case 'playerShoot':
                oscillator.frequency.value = 440; // A4
                break;
            case 'playerHit':
                oscillator.frequency.value = 220; // A3
                break;
            case 'enemyHit':
                oscillator.frequency.value = 330; // E4
                break;
            case 'enemyDestroyed':
                oscillator.frequency.value = 880; // A5
                break;
            case 'powerUp':
                oscillator.frequency.value = 660; // E5
                break;
            case 'explosion':
                oscillator.frequency.value = 110; // A2
                break;
            case 'bossWarning':
                oscillator.frequency.value = 554; // C#5
                break;
            case 'gameOver':
                oscillator.frequency.value = 196; // G3
                break;
            case 'victory':
                oscillator.frequency.value = 784; // G5
                break;
            default:
                oscillator.frequency.value = 440; // A4
        }
        
        gainNode.gain.value = config.volume;
        
        // Store the sound configuration
        this.sounds[name] = {
            play: () => {
                if (this.isMuted || !this.audioContext) return;
                
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.type = oscillator.type;
                osc.frequency.value = oscillator.frequency.value;
                gain.gain.value = gainNode.gain.value;
                
                // Short duration for sound effects
                osc.start();
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                osc.stop(this.audioContext.currentTime + 0.3);
            }
        };
    }
    
    createPlaceholderMusic(name, config) {
        if (!this.audioContext) return;
        
        // Create a repeating pattern as placeholder music
        const playMusic = () => {
            if (this.isMuted || !this.audioContext) return;
            
            const notes = [261.63, 329.63, 392, 523.25]; // C4, E4, G4, C5
            const noteDuration = 0.2;
            const patternDuration = notes.length * noteDuration;
            
            const startTime = this.audioContext.currentTime;
            
            // Create a simple pattern that repeats
            const playPattern = () => {
                notes.forEach((freq, i) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    
                    osc.connect(gain);
                    gain.connect(this.audioContext.destination);
                    
                    osc.type = 'sine';
                    osc.frequency.value = freq;
                    
                    gain.gain.value = config.volume * 0.5;
                    
                    const noteStart = startTime + i * noteDuration;
                    osc.start(noteStart);
                    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration - 0.05);
                    osc.stop(noteStart + noteDuration);
                });
            };
            
            // Play the pattern once
            playPattern();
            
            // Store reference to the timeout
            const timeout = setTimeout(() => {
                if (this.currentMusic === name && config.loop) {
                    playMusic();
                }
            }, patternDuration * 1000);
            
            return timeout;
        };
        
        this.music[name] = {
            play: playMusic,
            stop: (timeout) => {
                if (timeout) {
                    clearTimeout(timeout);
                }
            },
            timeout: null
        };
    }
    
    playSound(name) {
        if (this.sounds[name]) {
            this.sounds[name].play();
        } else {
            console.warn(`Sound '${name}' not found`);
        }
    }
    
    playMusic(name) {
        if (this.currentMusic === name) return;
        
        // Stop current music
        this.stopMusic();
        
        // Play new music
        if (this.music[name]) {
            this.currentMusic = name;
            this.music[name].timeout = this.music[name].play();
        } else {
            console.warn(`Music '${name}' not found`);
        }
    }
    
    stopMusic() {
        if (this.currentMusic && this.music[this.currentMusic]) {
            this.music[this.currentMusic].stop(this.music[this.currentMusic].timeout);
            this.currentMusic = null;
        }
    }
    
    mute() {
        this.isMuted = true;
        this.stopMusic();
    }
    
    unmute() {
        this.isMuted = false;
        
        // Resume current music if any
        if (this.currentMusic) {
            this.playMusic(this.currentMusic);
        }
    }
    
    toggleMute() {
        if (this.isMuted) {
            this.unmute();
        } else {
            this.mute();
        }
        
        return this.isMuted;
    }
}
