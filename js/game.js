// 火影忍者跑酷游戏主引擎
import { GameUtils, PerformanceMonitor, AudioManager } from './utils.js';
import Background from './background.js';
import Player from './player.js';
import { ObstacleManager } from './obstacle.js';
import { ItemManager } from './items.js';

class GameEngine {
    constructor() {
        // 获取画布和上下文
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏状态
        this.gameState = 'LOADING'; // LOADING, MENU, PLAYING, PAUSED, GAME_OVER
        this.previousState = 'MENU';
        
        // 游戏数据
        this.score = 0;
        this.highScore = GameUtils.loadFromStorage('highScore', 0);
        this.distance = 0;
        this.gameSpeed = 5;
        this.baseSpeed = 5;
        this.maxSpeed = 15;
        this.speedMultiplier = 1.0;
        this.gameTime = 0;
        
        // 游戏对象
        this.player = null;
        this.obstacleManager = null;
        this.itemManager = null;
        this.background = null;
        
        // 性能监控
        this.performanceMonitor = new PerformanceMonitor();
        this.lastTimestamp = 0;
        this.deltaTime = 0;
        this.fps = 60;
        
        // 音频管理
        this.audioManager = new AudioManager();
        this.soundEnabled = !GameUtils.loadFromStorage('game_muted', false);
        
        // 游戏进度
        this.gameProgress = GameUtils.loadFromStorage('game_progress', {
            totalScrolls: 0,
            unlockedCharacters: ['naruto'],
            totalGames: 0,
            totalDistance: 0
        });
        
        // 输入控制
        this.keys = {};
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isTouching = false;
        
        // 游戏设置
        this.difficulty = 1;
        this.selectedCharacter = 'naruto';
        this.characterUnlockRequirements = {
            sasuke: 100,
            sakura: 500,
            kakashi: 1000
        };
        
        // 视觉效果
        this.screenShake = {
            intensity: 0,
            duration: 0,
            timer: 0
        };
        
        this.flashEffect = {
            color: null,
            duration: 0,
            timer: 0
        };
        
        // 组合和连击
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        this.comboMultiplier = 1;
        
        // 初始化游戏
        this.init();
    }

    async init() {
        try {
            // 设置画布大小
            this.setupCanvas();
            
            // 初始化游戏对象
            this.background = new Background(this.canvas);
            this.player = new Player(this.canvas, this.selectedCharacter);
            this.obstacleManager = new ObstacleManager(this.canvas);
            this.itemManager = new ItemManager(this.canvas);
            
            // 设置音频
            this.setupAudio();
            
            // 设置输入控制
            this.setupInputControls();
            
            // 设置UI事件
            this.setupUIEvents();
            
            // 更新UI显示
            this.updateUI();
            
            // 加载完成
            this.gameState = 'MENU';
            
            // 开始游戏循环
            this.gameLoop();
            
            console.log('游戏初始化完成！');
        } catch (error) {
            console.error('游戏初始化失败:', error);
            this.showError('游戏初始化失败，请刷新页面重试');
        }
    }

    setupCanvas() {
        // 设置响应式画布
        const container = this.canvas.parentElement;
        
        const resizeCanvas = () => {
            // 设置CSS尺寸
            this.canvas.style.width = container.clientWidth + 'px';
            this.canvas.style.height = container.clientHeight + 'px';
            
            // 设置实际渲染尺寸（考虑高DPI屏幕）
            const dpr = GameUtils.getDevicePixelRatio();
            this.canvas.width = container.clientWidth * dpr;
            this.canvas.height = container.clientHeight * dpr;
            
            // 缩放上下文
            this.ctx.scale(dpr, dpr);
            
            // 通知其他对象画布大小已改变
            if (this.background) {
                this.background.resize(container.clientWidth, container.clientHeight);
            }
            if (this.player) {
                this.player.baseY = this.canvas.height - this.player.height - 120;
                this.player.y = this.player.baseY;
            }
        };
        
        // 初始调整
        resizeCanvas();
        
        // 监听窗口大小变化
        window.addEventListener('resize', resizeCanvas);
        
        // 使用ResizeObserver监听容器变化
        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(resizeCanvas);
            ro.observe(container);
        }
    }

    setupAudio() {
        try {
            // 添加游戏音效
            this.audioManager.addSound('jump', 'assets/audio/jump.mp3');
            this.audioManager.addSound('collect', 'assets/audio/collect.mp3');
            this.audioManager.addSound('hit', 'assets/audio/hit.mp3');
            this.audioManager.addSound('game_over', 'assets/audio/game_over.mp3');
            this.audioManager.addSound('select', 'assets/audio/select.mp3');
            this.audioManager.addSound('background', 'assets/audio/background.mp3');
            
            // 设置音量
            this.audioManager.setVolume(this.soundEnabled ? 0.5 : 0);
            
            // 播放背景音乐
            if (this.soundEnabled) {
                this.audioManager.play('background', true);
            }
        } catch (e) {
            console.warn('音频系统初始化失败，游戏将静音运行:', e);
            this.soundEnabled = false;
        }
    }

    setupInputControls() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') e.preventDefault();
            this.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // 触摸控制
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isTouching = true;
            this.touchStartY = e.touches[0].clientY;
            this.touchStartTime = Date.now();
            this.handleTouchStart(e);
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isTouching = false;
            this.handleTouchEnd(e);
        }, { passive: false });
    }

    setupUIEvents() {
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('continueButton').addEventListener('click', () => this.continueGame());
        document.getElementById('instructionsButton').addEventListener('click', () => this.showInstructions());
        document.getElementById('closeInstructions').addEventListener('click', () => this.hideInstructions());
        document.getElementById('pauseButton').addEventListener('click', () => this.togglePause());
        document.getElementById('resumeButton').addEventListener('click', () => this.togglePause());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        document.getElementById('menuButton').addEventListener('click', () => this.returnToMenu());
        document.getElementById('playAgainButton').addEventListener('click', () => this.restartGame());
        document.getElementById('backToMenuButton').addEventListener('click', () => this.returnToMenu());
        document.getElementById('soundToggle').addEventListener('click', () => this.toggleSound());
        
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', () => {
                if (!card.classList.contains('locked')) {
                    this.selectCharacter(card.dataset.character);
                }
            });
        });
    }

    handleKeyDown(e) {
        switch(e.code) {
            case 'Space':
            case 'ArrowUp':
                if (this.gameState === 'PLAYING') {
                    this.player.jump();
                    if (this.soundEnabled) this.audioManager.play('jump');
                } else if (this.gameState === 'MENU' || this.gameState === 'GAME_OVER') {
                    this.startGame();
                }
                break;
            case 'KeyP': this.togglePause(); break;
            case 'KeyM': this.toggleSound(); break;
            case 'KeyR': if (this.gameState === 'PLAYING' || this.gameState === 'GAME_OVER') this.restartGame(); break;
            case 'Escape':
                if (this.gameState === 'PLAYING') this.togglePause();
                else if (this.gameState === 'PAUSED') this.returnToMenu();
                break;
            case 'Digit1': this.selectCharacter('naruto'); break;
            case 'Digit2': this.selectCharacter('sasuke'); break;
            case 'Digit3': this.selectCharacter('sakura'); break;
        }
    }

    handleTouchStart(e) {
        if (this.gameState === 'PLAYING') {
            this.player.jump();
            if (this.soundEnabled) this.audioManager.play('jump');
        } else if (this.gameState === 'MENU' || this.gameState === 'GAME_OVER') {
            this.startGame();
        }
    }

    handleTouchEnd(e) {
        const touchDuration = Date.now() - this.touchStartTime;
        if (touchDuration > 300 && this.gameState === 'PLAYING') {
            // 长按逻辑
        }
    }

    gameLoop(timestamp = 0) {
        if (this.lastTimestamp === 0) this.lastTimestamp = timestamp;
        this.deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        if (this.deltaTime > 100) this.deltaTime = 16;
        
        this.performanceMonitor.update();
        this.fps = this.performanceMonitor.getFPS();
        
        this.update(this.deltaTime);
        this.draw();
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    update(deltaTime) {
        this.gameTime += deltaTime;
        if (this.combo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) { this.combo = 0; this.comboMultiplier = 1; }
        }
        if (this.screenShake.timer > 0) this.screenShake.timer -= deltaTime;
        if (this.flashEffect.timer > 0) this.flashEffect.timer -= deltaTime;
        
        switch(this.gameState) {
            case 'PLAYING': this.updateGameplay(deltaTime); break;
            case 'GAME_OVER': this.updateGameOver(deltaTime); break;
        }
    }

    updateGameplay(deltaTime) {
        this.updateGameSpeed(deltaTime);
        this.distance += this.gameSpeed * deltaTime * 0.01;
        this.background.update(deltaTime, this.gameSpeed);
        this.player.update(deltaTime, this.gameSpeed);
        this.obstacleManager.update(deltaTime, this.gameSpeed);
        this.itemManager.update(deltaTime, this.gameSpeed, this.player);
        this.checkCollisions();
        this.checkItemCollection();
        this.updateGameUI();
        this.checkGameOver();
        if (this.gameTime % 10000 < deltaTime) this.saveGameProgress();
    }

    updateGameOver(deltaTime) {
        this.background.update(deltaTime, this.gameSpeed * 0.2);
        this.player.update(deltaTime, 0);
    }

    updateGameSpeed(deltaTime) {
        const speedIncrease = 0.00001 * deltaTime;
        this.baseSpeed = Math.min(this.maxSpeed, this.baseSpeed + speedIncrease);
        this.gameSpeed = this.baseSpeed * this.speedMultiplier;
        this.difficulty = 1 + this.distance * 0.0001;
    }

    checkCollisions() {
        const collision = this.obstacleManager.checkCollision(this.player);
        if (collision) this.handleCollision(collision);
        if (this.player.y > this.canvas.height + 100) this.handleFallOffScreen();
    }

    handleCollision(collision) {
        const { damage } = collision;
        const isDead = this.player.takeDamage(damage);
        if (this.soundEnabled) this.audioManager.play('hit');
        this.screenShake(10, 300);
        this.flashEffect('#ff0000', 200);
        this.combo = 0;
        this.comboMultiplier = 1;
        this.score = Math.max(0, this.score - damage * 10);
        if (isDead) this.gameOver('被障碍物击败');
    }

    handleFallOffScreen() {
        if (this.soundEnabled) this.audioManager.play('game_over');
        this.screenShake(15, 500);
        this.flashEffect('#ff0000', 500);
        this.gameOver('掉落悬崖');
    }

    checkItemCollection() {
        const collectedItems = this.itemManager.checkCollection(this.player);
        collectedItems.forEach(item => this.handleItemCollection(item));
    }

    handleItemCollection(item) {
        this.addScore(item.points || 10);
        if (item.type === 'scroll') {
            this.gameProgress.totalScrolls++;
            this.checkCharacterUnlock();
        }
        if (this.soundEnabled) this.audioManager.play('collect');
    }

    updateGameUI() {
        const scoreEl = document.getElementById('score');
        const distanceEl = document.getElementById('distance');
        const speedEl = document.getElementById('speed');
        if (scoreEl) scoreEl.textContent = Math.floor(this.score);
        if (distanceEl) distanceEl.textContent = Math.floor(this.distance) + 'm';
        if (speedEl) speedEl.textContent = 'x' + this.speedMultiplier.toFixed(1);
    }

    checkGameOver() {
        if (this.player.health <= 0) this.gameOver('生命值耗尽');
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        if (this.screenShake.timer > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake.intensity;
            const shakeY = (Math.random() - 0.5) * this.screenShake.intensity;
            this.ctx.translate(shakeX, shakeY);
        }
        
        switch(this.gameState) {
            case 'MENU': this.drawGameplay(); this.drawMenu(); break;
            case 'PLAYING': this.drawGameplay(); break;
            case 'PAUSED': this.drawGameplay(); this.drawPauseOverlay(); break;
            case 'GAME_OVER': this.drawGameplay(); this.drawGameOverOverlay(); break;
        }
        
        if (this.flashEffect.timer > 0) {
            this.ctx.fillStyle = this.flashEffect.color;
            this.ctx.globalAlpha = (this.flashEffect.timer / 500) * 0.3;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.globalAlpha = 1.0;
        }
        this.ctx.restore();
    }

    drawGameplay() {
        this.background.draw(this.ctx);
        this.player.draw(this.ctx);
        this.obstacleManager.draw(this.ctx);
        this.itemManager.draw(this.ctx);
    }

    drawMenu() {}
    drawPauseOverlay() {}
    drawGameOverOverlay() {}

    startGame() {
        if (this.gameState === 'PLAYING') return;
        this.resetGame();
        this.gameState = 'PLAYING';
        this.hideAllMenus();
        if (this.soundEnabled) this.audioManager.play('select');
        this.gameProgress.totalGames++;
        this.saveGameProgress();
    }

    continueGame() {
        if (this.gameState !== 'PAUSED') return;
        this.gameState = 'PLAYING';
        this.hideAllMenus();
        if (this.soundEnabled) this.audioManager.play('select');
    }

    togglePause() {
        if (this.gameState === 'PLAYING') {
            this.previousState = this.gameState;
            this.gameState = 'PAUSED';
            this.showMenu('pauseMenu');
        } else if (this.gameState === 'PAUSED') {
            this.gameState = this.previousState;
            this.hideAllMenus();
        }
    }

    restartGame() {
        this.resetGame();
        this.gameState = 'PLAYING';
        this.hideAllMenus();
        if (this.soundEnabled) this.audioManager.play('select');
    }

    returnToMenu() {
        this.gameState = 'MENU';
        this.showMenu('gameMenu');
        this.updateUI();
        if (this.soundEnabled) this.audioManager.play('select');
    }

    gameOver(reason = '') {
        this.gameState = 'GAME_OVER';
        if (this.soundEnabled) {
            this.audioManager.stop('background');
            this.audioManager.play('game_over');
        }
        if (this.score > this.highScore) {
            this.highScore = this.score;
            GameUtils.saveToStorage('highScore', this.highScore);
        }
        this.gameProgress.totalDistance += this.distance;
        this.saveGameProgress();
        this.showGameOverMenu();
        console.log(`游戏结束: ${reason}, 分数: ${this.score}`);
    }

resetGame() {
    this.baseSpeed = 5; // 必须重置基础速度，否则会继承上次游戏的高速度
    this.score = 0;
    this.distance = 0;
    this.gameSpeed = this.baseSpeed;
    this.speedMultiplier = 1.0;
    this.gameTime = 0;
    this.combo = 0;
    this.comboMultiplier = 1; // 顺便补上 comboMultiplier 的重置（更严谨）
    this.player.reset();
    this.obstacleManager.reset();
    this.itemManager.reset();
    this.screenShake.timer = 0;
    this.flashEffect.timer = 0;
    if (this.soundEnabled) this.audioManager.play('background', true);
}

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.audioManager.setVolume(this.soundEnabled ? 0.5 : 0);
        const soundButton = document.getElementById('soundToggle');
        if (soundButton) soundButton.textContent = this.soundEnabled ? '🔊 声音' : '🔇 静音';
    }

    selectCharacter(character) {
        if (this.selectedCharacter === character) return;
        if (!this.gameProgress.unlockedCharacters.includes(character)) return;
        this.selectedCharacter = character;
        this.player.changeCharacter(character);
        this.updateCharacterSelection();
        if (this.soundEnabled) this.audioManager.play('select');
    }

    checkCharacterUnlock() {
        let unlockedNew = false;
        Object.entries(this.characterUnlockRequirements).forEach(([character, requirement]) => {
            if (!this.gameProgress.unlockedCharacters.includes(character) && this.gameProgress.totalScrolls >= requirement) {
                this.gameProgress.unlockedCharacters.push(character);
                unlockedNew = true;
                this.showMessage(`${character} 已解锁！`);
            }
        });
        if (unlockedNew) { this.saveGameProgress(); this.updateCharacterSelection(); }
    }

    showInstructions() { this.showMenu('instructionsModal'); }
    hideInstructions() { this.hideAllMenus(); this.showMenu('gameMenu'); }

    showMenu(menuId) {
        this.hideAllMenus();
        const menu = document.getElementById(menuId);
        if (menu) menu.classList.add('active');
    }

    hideAllMenus() {
        ['gameMenu', 'pauseMenu', 'gameOverMenu', 'instructionsModal'].forEach(id => {
            const menu = document.getElementById(id);
            if (menu) menu.classList.remove('active');
        });
    }

    showGameOverMenu() {
        const fs = document.getElementById('finalScore');
        const fhs = document.getElementById('finalHighScore');
        if (fs) fs.textContent = Math.floor(this.score);
        if (fhs) fhs.textContent = Math.floor(this.highScore);
        this.showMenu('gameOverMenu');
    }

    updateUI() {
        const hsd = document.getElementById('highScoreDisplay');
        const ts = document.getElementById('totalScrolls');
        if (hsd) hsd.textContent = Math.floor(this.highScore);
        if (ts) ts.textContent = this.gameProgress.totalScrolls;
        this.updateCharacterSelection();
        const st = document.getElementById('soundToggle');
        if (st) st.textContent = this.soundEnabled ? '🔊 声音' : '🔇 静音';
    }

    updateCharacterSelection() {
        document.querySelectorAll('.character-card').forEach(card => {
            const character = card.dataset.character;
            if (!character) return;
            const isUnlocked = this.gameProgress.unlockedCharacters.includes(character);
            card.classList.toggle('locked', !isUnlocked);
            const req = card.querySelector('.require');
            const unl = card.querySelector('.unlocked');
            if (req) req.style.display = isUnlocked ? 'none' : 'block';
            if (unl) unl.style.display = isUnlocked ? 'block' : 'none';
            card.classList.toggle('active', character === this.selectedCharacter);
        });
    }

    addScore(points) { this.score += points * this.comboMultiplier; }
    screenShake(intensity, duration) { this.screenShake = { intensity, duration, timer: duration }; }
    flashEffect(color, duration) { this.flashEffect = { color, duration, timer: duration }; }
    
    showMessage(message, duration = 3000) {
        const el = document.createElement('div');
        el.className = 'game-message';
        el.textContent = message;
        el.style.cssText = `position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:white;padding:20px 40px;border-radius:10px;font-size:20px;z-index:10000;pointer-events:none;`;
        document.body.appendChild(el);
        setTimeout(() => document.body.removeChild(el), duration);
    }

    showError(message) { this.showMessage(`错误: ${message}`, 5000); console.error(message); }
    saveGameProgress() { GameUtils.saveToStorage('game_progress', this.gameProgress); }
}

window.addEventListener('DOMContentLoaded', () => {
    const loading = document.getElementById('loadingOverlay');
    if (loading) setTimeout(() => loading.style.display = 'none', 500);
    window.game = new GameEngine();
});

document.addEventListener('visibilitychange', () => {
    if (window.game && document.hidden && window.game.gameState === 'PLAYING') window.game.togglePause();
});
