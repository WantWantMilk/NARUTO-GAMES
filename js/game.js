// 火影忍者跑酷游戏主引擎
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
            setupAudio() {
    try {
        // 原有的音频代码
        this.audioManager.addSound('jump', 'assets/audio/jump.mp3');
        // ...
    } catch (e) {
        console.warn('音频初始化失败，继续游戏:', e);
        // 继续执行而不中断
    }
}
            
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
        // 添加游戏音效
        // 注意：实际项目中需要替换为真实音效文件URL
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
    }

    setupInputControls() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // 防止空格键滚动页面
            if (e.code === 'Space') {
                e.preventDefault();
            }
            
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
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isTouching = false;
            this.handleTouchEnd(e);
        }, { passive: false });
        
        // 鼠标控制（PC端备用）
        this.canvas.addEventListener('mousedown', (e) => {
            this.isTouching = true;
            this.touchStartY = e.clientY;
            this.touchStartTime = Date.now();
            this.handleTouchStart(e);
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.isTouching = false;
            this.handleTouchEnd(e);
        });
        
        // 防止右键菜单
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    setupUIEvents() {
        // 开始游戏按钮
        document.getElementById('startButton').addEventListener('click', () => {
            this.startGame();
        });
        
        // 继续游戏按钮
        document.getElementById('continueButton').addEventListener('click', () => {
            this.continueGame();
        });
        
        // 游戏说明按钮
        document.getElementById('instructionsButton').addEventListener('click', () => {
            this.showInstructions();
        });
        
        // 关闭说明按钮
        document.getElementById('closeInstructions').addEventListener('click', () => {
            this.hideInstructions();
        });
        
        // 暂停按钮
        document.getElementById('pauseButton').addEventListener('click', () => {
            this.togglePause();
        });
        
        // 继续按钮（暂停菜单）
        document.getElementById('resumeButton').addEventListener('click', () => {
            this.togglePause();
        });
        
        // 重新开始按钮
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        // 返回菜单按钮
        document.getElementById('menuButton').addEventListener('click', () => {
            this.returnToMenu();
        });
        
        // 再玩一次按钮
        document.getElementById('playAgainButton').addEventListener('click', () => {
            this.restartGame();
        });
        
        // 返回菜单按钮（游戏结束）
        document.getElementById('backToMenuButton').addEventListener('click', () => {
            this.returnToMenu();
        });
        
        // 声音切换按钮
        document.getElementById('soundToggle').addEventListener('click', () => {
            this.toggleSound();
        });
        
        // 角色选择
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!card.classList.contains('locked')) {
                    this.selectCharacter(card.dataset.character);
                }
            });
        });
        
        // 防止移动端下拉刷新
        document.addEventListener('touchmove', function(e) {
            if (this.gameState === 'PLAYING') {
                e.preventDefault();
            }
        }.bind(this), { passive: false });
    }

    handleKeyDown(e) {
        switch(e.code) {
            case 'Space':
            case 'ArrowUp':
                if (this.gameState === 'PLAYING') {
                    this.player.jump();
                    if (this.soundEnabled) {
                        this.audioManager.play('jump');
                    }
                } else if (this.gameState === 'MENU' || this.gameState === 'GAME_OVER') {
                    this.startGame();
                }
                break;
                
            case 'KeyP':
                this.togglePause();
                break;
                
            case 'KeyM':
                this.toggleSound();
                break;
                
            case 'KeyR':
                if (this.gameState === 'PLAYING' || this.gameState === 'GAME_OVER') {
                    this.restartGame();
                }
                break;
                
            case 'Escape':
                if (this.gameState === 'PLAYING') {
                    this.togglePause();
                } else if (this.gameState === 'PAUSED') {
                    this.returnToMenu();
                }
                break;
                
            case 'Digit1':
                this.selectCharacter('naruto');
                break;
                
            case 'Digit2':
                this.selectCharacter('sasuke');
                break;
                
            case 'Digit3':
                this.selectCharacter('sakura');
                break;
        }
    }

    handleTouchStart(e) {
        if (this.gameState === 'PLAYING') {
            this.player.jump();
            if (this.soundEnabled) {
                this.audioManager.play('jump');
            }
        } else if (this.gameState === 'MENU' || this.gameState === 'GAME_OVER') {
            this.startGame();
        }
    }

    handleTouchEnd(e) {
        // 长按检测（跳更高）
        const touchDuration = Date.now() - this.touchStartTime;
        if (touchDuration > 300 && this.gameState === 'PLAYING') {
            // 可以在这里实现长按跳更高的逻辑
        }
    }

    gameLoop(timestamp = 0) {
        // 计算时间增量
        if (this.lastTimestamp === 0) {
            this.lastTimestamp = timestamp;
        }
        this.deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        
        // 限制最大时间增量，防止卡顿导致异常
        if (this.deltaTime > 100) {
            this.deltaTime = 16; // 大约60fps
        }
        
        // 更新性能监控
        this.performanceMonitor.update();
        this.fps = this.performanceMonitor.getFPS();
        
        // 更新游戏逻辑
        this.update(this.deltaTime);
        
        // 渲染游戏画面
        this.draw();
        
        // 继续游戏循环
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    update(deltaTime) {
        // 更新游戏时间
        this.gameTime += deltaTime;
        
        // 更新连击计时器
        if (this.combo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.comboMultiplier = 1;
            }
        }
        
        // 更新屏幕震动
        if (this.screenShake.timer > 0) {
            this.screenShake.timer -= deltaTime;
        }
        
        // 更新闪光效果
        if (this.flashEffect.timer > 0) {
            this.flashEffect.timer -= deltaTime;
        }
        
        // 根据游戏状态更新
        switch(this.gameState) {
            case 'PLAYING':
                this.updateGameplay(deltaTime);
                break;
                
            case 'PAUSED':
                // 暂停时不更新游戏逻辑
                break;
                
            case 'GAME_OVER':
                // 游戏结束时的更新
                this.updateGameOver(deltaTime);
                break;
        }
    }

    updateGameplay(deltaTime) {
        // 更新游戏速度
        this.updateGameSpeed(deltaTime);
        
        // 更新距离
        this.distance += this.gameSpeed * deltaTime * 0.01;
        
        // 更新游戏对象
        this.background.update(deltaTime, this.gameSpeed);
        this.player.update(deltaTime, this.gameSpeed);
        this.obstacleManager.update(deltaTime, this.gameSpeed);
        this.itemManager.update(deltaTime, this.gameSpeed, this.player);
        
        // 检查碰撞
        this.checkCollisions();
        
        // 检查物品收集
        this.checkItemCollection();
        
        // 更新UI
        this.updateGameUI();
        
        // 检查游戏结束条件
        this.checkGameOver();
        
        // 自动保存进度
        if (this.gameTime % 10000 < deltaTime) { // 每10秒保存一次
            this.saveGameProgress();
        }
    }

    updateGameSpeed(deltaTime) {
        // 基础速度随时间增加
        const speedIncrease = 0.00001 * deltaTime;
        this.baseSpeed = Math.min(this.maxSpeed, this.baseSpeed + speedIncrease);
        
        // 应用速度乘数（来自道具等）
        this.gameSpeed = this.baseSpeed * this.speedMultiplier;
        
        // 更新难度
        this.difficulty = 1 + this.distance * 0.0001;
    }

    checkCollisions() {
        // 检查障碍物碰撞
        const collision = this.obstacleManager.checkCollision(this.player);
        if (collision) {
            this.handleCollision(collision);
        }
        
        // 检查是否掉出屏幕
        if (this.player.y > this.canvas.height + 100) {
            this.handleFallOffScreen();
        }
    }

    handleCollision(collision) {
        const { obstacle, damage, type } = collision;
        
        // 应用伤害
        const isDead = this.player.takeDamage(damage);
        
        // 播放音效
        if (this.soundEnabled) {
            this.audioManager.play('hit');
        }
        
        // 屏幕震动
        this.screenShake(10, 300);
        
        // 红色闪光
        this.flashEffect('#ff0000', 200);
        
        // 重置连击
        this.combo = 0;
        this.comboMultiplier = 1;
        
        // 更新分数（碰撞扣分）
        this.score = Math.max(0, this.score - damage * 10);
        
        // 检查是否游戏结束
        if (isDead) {
            this.gameOver('被障碍物击败');
        }
    }

    handleFallOffScreen() {
        // 掉落屏幕外
        if (this.soundEnabled) {
            this.audioManager.play('game_over');
        }
        
        this.screenShake(15, 500);
        this.flashEffect('#ff0000', 500);
        
        this.gameOver('掉落悬崖');
    }

    checkItemCollection() {
        const collectedItems = this.itemManager.checkCollection(this.player);
        
        if (collectedItems.length > 0) {
            // 播放收集音效
            if (this.soundEnabled) {
                this.audioManager.play('collect');
            }
            
            // 处理每个收集的物品
            collectedItems.forEach(item => {
                this.handleItemCollection(item);
            });
            
            // 更新连击
            this.updateCombo(collectedItems.length);
        }
    }

    handleItemCollection(item) {
        switch(item.effect) {
            case 'score':
                this.addScore(item.points * this.comboMultiplier);
                this.gameProgress.totalScrolls += item.value;
                
                // 检查角色解锁
                this.checkCharacterUnlock();
                break;
                
            case 'speed':
                this.player.applySpeedBoost(item.value, item.duration);
                this.speedMultiplier = item.value;
                this.flashEffect('#ffff00', 500);
                break;
                
            case 'heal':
                this.player.heal(item.value);
                this.flashEffect('#00ff00', 300);
                break;
                
            case 'ability':
                this.player.activateSpecialAbility();
                this.flashEffect('#9370DB', 500);
                break;
                
            case 'weapon':
                // 武器效果（暂时无敌或破坏障碍）
                this.player.isInvincible = true;
                this.player.invincibleTimer = 1000;
                this.flashEffect('#87CEEB', 300);
                break;
                
            case 'coin':
                this.addScore(item.points * this.comboMultiplier);
                break;
        }
        
        // 更新统计
        this.updateCollectionStats(item);
    }

    updateCombo(itemCount) {
        if (itemCount > 0) {
            this.combo += itemCount;
            this.comboTimer = 2000; // 2秒连击窗口
            
            // 更新最大连击
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }
            
            // 计算连击乘数
            this.comboMultiplier = 1 + Math.floor(this.combo / 5) * 0.2;
            
            // 连击特效
            if (this.combo % 5 === 0) {
                this.screenShake(5, 200);
                this.flashEffect('#00ffff', 100);
            }
        }
    }

    updateCollectionStats(item) {
        // 可以在这里添加特定的收集统计
    }

    checkGameOver() {
        if (this.player.health <= 0) {
            this.gameOver('生命值耗尽');
        }
    }

    updateGameUI() {
        // 更新分数显示
        document.getElementById('score').textContent = Math.floor(this.score);
        document.getElementById('distance').textContent = Math.floor(this.distance) + 'm';
        document.getElementById('speed').textContent = 'x' + this.gameSpeed.toFixed(1);
        
        // 更新连击显示
        if (this.combo > 0) {
            // 可以添加连击UI
        }
        
        // 更新生命值显示（如果需要）
    }

    draw() {
        // 保存上下文状态
        this.ctx.save();
        
        // 应用屏幕震动
        if (this.screenShake.timer > 0) {
            const intensity = this.screenShake.intensity * (this.screenShake.timer / this.screenShake.duration);
            const offsetX = (Math.random() - 0.5) * intensity;
            const offsetY = (Math.random() - 0.5) * intensity;
            this.ctx.translate(offsetX, offsetY);
        }
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制闪光效果
        if (this.flashEffect.timer > 0) {
            const alpha = this.flashEffect.timer / this.flashEffect.duration * 0.5;
            this.ctx.fillStyle = this.flashEffect.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // 根据游戏状态绘制
        switch(this.gameState) {
            case 'LOADING':
                this.drawLoading();
                break;
                
            case 'MENU':
                this.drawMenu();
                break;
                
            case 'PLAYING':
            case 'PAUSED':
            case 'GAME_OVER':
                this.drawGameplay();
                break;
        }
        
        // 绘制调试信息（开发时可用）
        if (location.hash === '#debug') {
            this.drawDebugInfo();
        }
        
        // 恢复上下文状态
        this.ctx.restore();
    }

    drawGameplay() {
        // 绘制背景
        this.background.draw(this.ctx);
        
        // 绘制游戏对象
        this.itemManager.draw(this.ctx);
        this.obstacleManager.draw(this.ctx);
        this.player.draw(this.ctx);
        
        // 绘制游戏UI
        this.drawGameUI();
        
        // 根据状态绘制覆盖层
        if (this.gameState === 'PAUSED') {
            this.drawPauseOverlay();
        } else if (this.gameState === 'GAME_OVER') {
            this.drawGameOverOverlay();
        }
    }

    drawGameUI() {
        // 绘制分数和游戏信息
        this.ctx.save();
        
        // 设置UI绘制样式
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 10, 200, 80);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'left';
        
        // 绘制分数
        this.ctx.fillText(`分数: ${Math.floor(this.score)}`, 20, 30);
        this.ctx.fillText(`距离: ${Math.floor(this.distance)}m`, 20, 50);
        this.ctx.fillText(`速度: x${this.gameSpeed.toFixed(1)}`, 20, 70);
        
        // 绘制生命值
        const healthWidth = 100;
        const healthHeight = 10;
        const healthX = this.canvas.width - healthWidth - 10;
        const healthY = 20;
        
        // 生命值背景
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        this.ctx.fillRect(healthX, healthY, healthWidth, healthHeight);
        
        // 生命值条
        const healthPercent = this.player.health / this.player.maxHealth;
        this.ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : 
                           healthPercent > 0.25 ? '#FFC107' : '#F44336';
        this.ctx.fillRect(healthX, healthY, healthWidth * healthPercent, healthHeight);
        
        // 生命值边框
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(healthX, healthY, healthWidth, healthHeight);
        
        // 生命值文字
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`${Math.floor(this.player.health)}/${this.player.maxHealth}`, 
                         healthX + healthWidth / 2, healthY - 5);
        
        // 绘制连击
        if (this.combo > 0) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`连击 x${this.combo}`, this.canvas.width / 2, 40);
            
            // 连击乘数
            if (this.comboMultiplier > 1) {
                this.ctx.font = 'bold 18px Arial';
                this.ctx.fillText(`乘数 x${this.comboMultiplier.toFixed(1)}`, 
                                 this.canvas.width / 2, 65);
            }
        }
        
        this.ctx.restore();
    }

    drawLoading() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ff6b00';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('加载中...', this.canvas.width / 2, this.canvas.height / 2);
        
        // 加载动画
        const radius = 20;
        const angle = (Date.now() / 1000) * Math.PI * 2;
        const x = this.canvas.width / 2 + Math.cos(angle) * 30;
        const y = this.canvas.height / 2 + Math.sin(angle) * 30;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawMenu() {
        // 菜单由HTML/CSS控制，这里不需要绘制
        // 但可以绘制一些背景动画
        this.background.draw(this.ctx);
    }

    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2 - 50);
        
        this.ctx.font = '24px Arial';
        this.ctx.fillText('按P键或点击继续按钮继续游戏', 
                         this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    drawGameOverOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#ff6b00';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 2 - 100);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`最终分数: ${Math.floor(this.score)}`, 
                         this.canvas.width / 2, this.canvas.height / 2 - 40);
        this.ctx.fillText(`最远距离: ${Math.floor(this.distance)}m`, 
                         this.canvas.width / 2, this.canvas.height / 2 - 10);
        this.ctx.fillText(`最高连击: ${this.maxCombo}`, 
                         this.canvas.width / 2, this.canvas.height / 2 + 20);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText('按空格键或点击屏幕重新开始', 
                         this.canvas.width / 2, this.canvas.height / 2 + 70);
    }

    drawDebugInfo() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, this.canvas.height - 150, 250, 140);
        
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        
        let y = this.canvas.height - 135;
        const lineHeight = 15;
        
        this.ctx.fillText(`FPS: ${this.fps}`, 20, y); y += lineHeight;
        this.ctx.fillText(`状态: ${this.gameState}`, 20, y); y += lineHeight;
        this.ctx.fillText(`速度: ${this.gameSpeed.toFixed(2)}`, 20, y); y += lineHeight;
        this.ctx.fillText(`障碍物: ${this.obstacleManager.getActiveCount()}`, 20, y); y += lineHeight;
        this.ctx.fillText(`物品: ${this.itemManager.getActiveItemCount()}`, 20, y); y += lineHeight;
        this.ctx.fillText(`角色: ${this.selectedCharacter}`, 20, y); y += lineHeight;
        this.ctx.fillText(`生命值: ${this.player.health.toFixed(0)}`, 20, y); y += lineHeight;
        this.ctx.fillText(`连击: ${this.combo} (x${this.comboMultiplier.toFixed(1)})`, 20, y);
    }

    startGame() {
        if (this.gameState === 'PLAYING') return;
        
        // 重置游戏状态
        this.resetGame();
        
        // 更新游戏状态
        this.gameState = 'PLAYING';
        
        // 隐藏菜单
        this.hideAllMenus();
        
        // 播放音效
        if (this.soundEnabled) {
            this.audioManager.play('select');
        }
        
        // 更新游戏统计
        this.gameProgress.totalGames++;
        this.saveGameProgress();
        
        console.log('游戏开始！');
    }

    continueGame() {
        if (this.gameState !== 'PAUSED') return;
        
        this.gameState = 'PLAYING';
        this.hideAllMenus();
        
        if (this.soundEnabled) {
            this.audioManager.play('select');
        }
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
        
        if (this.soundEnabled) {
            this.audioManager.play('select');
        }
    }

    restartGame() {
        this.resetGame();
        this.gameState = 'PLAYING';
        this.hideAllMenus();
        
        if (this.soundEnabled) {
            this.audioManager.play('select');
        }
    }

    returnToMenu() {
        this.gameState = 'MENU';
        this.showMenu('gameMenu');
        this.updateUI();
        
        if (this.soundEnabled) {
            this.audioManager.play('select');
        }
    }

    gameOver(reason = '') {
        this.gameState = 'GAME_OVER';
        
        // 播放游戏结束音效
        if (this.soundEnabled) {
            this.audioManager.stop('background');
            this.audioManager.play('game_over');
        }
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            GameUtils.saveToStorage('highScore', this.highScore);
            
            // 新纪录特效
            this.screenShake(20, 1000);
            this.flashEffect('#ffff00', 1000);
        }
        
        // 更新游戏进度
        this.gameProgress.totalDistance += this.distance;
        this.saveGameProgress();
        
        // 显示游戏结束菜单
        this.showGameOverMenu();
        
        console.log(`游戏结束: ${reason}, 分数: ${this.score}`);
    }

    resetGame() {
        // 重置游戏数据
        this.score = 0;
        this.distance = 0;
        this.gameSpeed = this.baseSpeed;
        this.speedMultiplier = 1.0;
        this.gameTime = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        this.comboMultiplier = 1;
        
        // 重置游戏对象
        this.player.reset();
        this.obstacleManager.reset();
        this.itemManager.reset();
        
        // 重置视觉效果
        this.screenShake.timer = 0;
        this.flashEffect.timer = 0;
        
        // 恢复背景音乐
        if (this.soundEnabled) {
            this.audioManager.play('background', true);
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.audioManager.setVolume(this.soundEnabled ? 0.5 : 0);
        
        const soundButton = document.getElementById('soundToggle');
        soundButton.textContent = this.soundEnabled ? '🔊 声音' : '🔇 静音';
        
        if (this.soundEnabled) {
            this.audioManager.play('select');
            if (this.gameState === 'PLAYING') {
                this.audioManager.play('background', true);
            }
        } else {
            this.audioManager.stop('background');
        }
        
        GameUtils.saveToStorage('game_muted', !this.soundEnabled);
    }

    selectCharacter(character) {
        if (this.selectedCharacter === character) return;
        
        // 检查是否已解锁
        if (!this.gameProgress.unlockedCharacters.includes(character)) {
            this.showMessage(`需要收集${this.characterUnlockRequirements[character]}个卷轴解锁`);
            return;
        }
        
        // 更改角色
        this.selectedCharacter = character;
        this.player.changeCharacter(character);
        
        // 更新UI
        this.updateCharacterSelection();
        
        // 播放音效
        if (this.soundEnabled) {
            this.audioManager.play('select');
        }
        
        console.log(`已选择角色: ${character}`);
    }

    checkCharacterUnlock() {
        let unlockedNew = false;
        
        Object.entries(this.characterUnlockRequirements).forEach(([character, requirement]) => {
            if (!this.gameProgress.unlockedCharacters.includes(character) &&
                this.gameProgress.totalScrolls >= requirement) {
                
                this.gameProgress.unlockedCharacters.push(character);
                unlockedNew = true;
                
                // 显示解锁消息
                this.showMessage(`${character} 已解锁！`);
                
                // 解锁特效
                this.screenShake(15, 500);
                this.flashEffect('#00ff00', 500);
            }
        });
        
        if (unlockedNew) {
            this.saveGameProgress();
            this.updateCharacterSelection();
        }
    }

    showInstructions() {
        document.getElementById('instructionsModal').style.display = 'flex';
        
        if (this.soundEnabled) {
            this.audioManager.play('select');
        }
    }

    hideInstructions() {
        document.getElementById('instructionsModal').style.display = 'none';
        
        if (this.soundEnabled) {
            this.audioManager.play('select');
        }
    }

    showMenu(menuId) {
        // 隐藏所有菜单
        this.hideAllMenus();
        
        // 显示指定菜单
        const menu = document.getElementById(menuId);
        if (menu) {
            menu.classList.add('active');
        }
    }

    hideAllMenus() {
        const menus = ['gameMenu', 'pauseMenu', 'gameOverMenu'];
        menus.forEach(id => {
            const menu = document.getElementById(id);
            if (menu) {
                menu.classList.remove('active');
            }
        });
    }

    showGameOverMenu() {
        // 更新最终分数显示
        document.getElementById('finalScore').textContent = Math.floor(this.score);
        document.getElementById('finalHighScore').textContent = Math.floor(this.highScore);
        
        // 显示游戏结束菜单
        this.showMenu('gameOverMenu');
    }

    updateUI() {
        // 更新最高分显示
        document.getElementById('highScoreDisplay').textContent = Math.floor(this.highScore);
        document.getElementById('totalScrolls').textContent = this.gameProgress.totalScrolls;
        
        // 更新角色选择
        this.updateCharacterSelection();
        
        // 更新声音按钮
        const soundButton = document.getElementById('soundToggle');
        soundButton.textContent = this.soundEnabled ? '🔊 声音' : '🔇 静音';
    }

    updateCharacterSelection() {
        document.querySelectorAll('.character-card').forEach(card => {
            const character = card.dataset.character;
            
            // 更新解锁状态
            if (this.gameProgress.unlockedCharacters.includes(character)) {
                card.classList.remove('locked');
                card.querySelector('.require').style.display = 'none';
                card.querySelector('.unlocked').style.display = 'block';
            } else {
                card.classList.add('locked');
                card.querySelector('.require').style.display = 'block';
                card.querySelector('.unlocked').style.display = 'none';
            }
            
            // 更新选中状态
            if (character === this.selectedCharacter) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
    }

    addScore(points) {
        const oldScore = this.score;
        this.score += points * this.comboMultiplier;
        
        // 分数增加特效
        if (this.score > oldScore && this.score % 1000 < points) {
            this.flashEffect('#00ff00', 100);
        }
    }

    screenShake(intensity, duration) {
        this.screenShake.intensity = intensity;
        this.screenShake.duration = duration;
        this.screenShake.timer = duration;
    }

    flashEffect(color, duration) {
        this.flashEffect.color = color;
        this.flashEffect.duration = duration;
        this.flashEffect.timer = duration;
    }

    showMessage(message, duration = 3000) {
        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = 'game-message';
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 20px;
            z-index: 10000;
            pointer-events: none;
            animation: fadeInOut ${duration}ms ease;
        `;
        
        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -60%); }
                10% { opacity: 1; transform: translate(-50%, -50%); }
                90% { opacity: 1; transform: translate(-50%, -50%); }
                100% { opacity: 0; transform: translate(-50%, -40%); }
            }
        `;
        document.head.appendChild(style);
        
        // 添加到页面
        document.body.appendChild(messageEl);
        
        // 自动移除
        setTimeout(() => {
            document.body.removeChild(messageEl);
            document.head.removeChild(style);
        }, duration);
    }

    showError(message) {
        this.showMessage(`错误: ${message}`, 5000);
        console.error(message);
    }

    saveGameProgress() {
        this.gameProgress.totalDistance += this.distance;
        GameUtils.saveToStorage('game_progress', this.gameProgress);
    }

    // 工具方法
    getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// 页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    // 隐藏加载界面
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 500);
    }
    
    // 初始化游戏引擎
    window.game = new GameEngine();
    
    // 将游戏对象暴露到全局，方便调试
    console.log('游戏已加载，使用 window.game 访问游戏对象');
    
    // 添加键盘快捷键说明
    console.log(`
游戏快捷键:
空格/↑ - 跳跃
P - 暂停/继续
M - 切换声音
R - 重新开始
ESC - 返回菜单
1/2/3 - 选择角色
    `);
});

// 确保游戏在页面可见时恢复运行
document.addEventListener('visibilitychange', () => {
    if (window.game && document.hidden) {
        if (window.game.gameState === 'PLAYING') {
            window.game.togglePause();
        }
    }
});

// 导出游戏引擎类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameEngine;
}