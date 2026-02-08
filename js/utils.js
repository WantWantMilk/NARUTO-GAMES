// 工具函数集合
class GameUtils {
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    static distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    static collides(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }

    static circleCollides(circle, rect) {
        const closestX = GameUtils.clamp(circle.x, rect.x, rect.x + rect.width);
        const closestY = GameUtils.clamp(circle.y, rect.y, rect.y + rect.height);
        return GameUtils.distance(circle.x, circle.y, closestX, closestY) < circle.radius;
    }

    static lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }

    static formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    static saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('LocalStorage保存失败:', e);
            return false;
        }
    }

    static loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.warn('LocalStorage读取失败:', e);
            return defaultValue;
        }
    }

    static preloadImages(urls) {
        return Promise.all(
            urls.map(url => new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = reject;
                img.src = url;
            }))
        );
    }

    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static getDevicePixelRatio() {
        return window.devicePixelRatio || 1;
    }

    static createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        const dpr = GameUtils.getDevicePixelRatio();
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return { canvas, ctx };
    }
}

// 性能监控
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.frameTimes = [];
    }

    update() {
        this.frameCount++;
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;

        if (deltaTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
        }

        this.frameTimes.push(deltaTime);
        if (this.frameTimes.length > 60) {
            this.frameTimes.shift();
        }
    }

    getAverageFrameTime() {
        if (this.frameTimes.length === 0) return 0;
        return this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
    }

    getFPS() {
        return this.fps;
    }
}

// 声音管理器
class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.muted = GameUtils.loadFromStorage('game_muted', false);
        this.volume = GameUtils.loadFromStorage('game_volume', 0.5);
    }

    addSound(name, url) {
        if (!this.sounds.has(name)) {
            const audio = new Audio(url);
            audio.volume = this.volume;
            audio.preload = 'auto';
            this.sounds.set(name, audio);
        }
    }

    play(name, loop = false) {
        if (this.muted || !this.sounds.has(name)) return;

        const sound = this.sounds.get(name);
        sound.currentTime = 0;
        sound.loop = loop;
        sound.volume = this.volume;
        
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.warn('音频播放失败:', e));
        }
    }

    stop(name) {
        if (this.sounds.has(name)) {
            const sound = this.sounds.get(name);
            sound.pause();
            sound.currentTime = 0;
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        GameUtils.saveToStorage('game_muted', this.muted);
        return this.muted;
    }

    setVolume(volume) {
        this.volume = GameUtils.clamp(volume, 0, 1);
        this.sounds.forEach(sound => {
            sound.volume = this.volume;
        });
        GameUtils.saveToStorage('game_volume', this.volume);
    }

    getVolume() {
        return this.volume;
    }

    isMuted() {
        return this.muted;
    }
}

export { GameUtils, PerformanceMonitor, AudioManager };