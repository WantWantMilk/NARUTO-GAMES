// 道具系统脚本
import { GameUtils } from './utils.js';

class GameItem {
    constructor(canvas, type, x, y) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.type = type; // 'scroll', 'pill', 'kunai', 'health', 'coin'
        this.x = x || canvas.width;
        this.y = y || canvas.height - 200;
        this.active = true;
        this.collected = false;
        
        // 物品属性配置
        this.loadItemType(type);
        this.init();
    }

    loadItemType(type) {
        const itemTypes = {
            scroll: {
                width: 30,
                height: 40,
                color: '#FFD700',
                value: 10,
                points: 50,
                effect: 'score',
                glowColor: '#FFFF00',
                name: '忍术卷轴',
                description: '增加分数和解锁进度'
            },
            pill: {
                width: 25,
                height: 25,
                color: '#FF4500',
                value: 1.5,
                points: 20,
                effect: 'speed',
                duration: 3000,
                glowColor: '#FF6347',
                name: '兵粮丸',
                description: '短暂提升移动速度'
            },
            kunai: {
                width: 35,
                height: 10,
                color: '#B0C4DE',
                value: 15,
                points: 30,
                effect: 'weapon',
                damage: 25,
                glowColor: '#87CEEB',
                name: '苦无',
                description: '一次性武器，可破坏障碍'
            },
            health: {
                width: 30,
                height: 30,
                color: '#32CD32',
                value: 30,
                points: 15,
                effect: 'heal',
                glowColor: '#90EE90',
                name: '医疗包',
                description: '恢复生命值'
            },
            coin: {
                width: 20,
                height: 20,
                color: '#FFD700',
                value: 5,
                points: 5,
                effect: 'coin',
                glowColor: '#FFEC8B',
                name: '忍者币',
                description: '基础分数道具'
            },
            chakra: {
                width: 35,
                height: 35,
                color: '#9370DB',
                value: 50,
                points: 100,
                effect: 'ability',
                duration: 5000,
                glowColor: '#BA55D3',
                name: '查克拉球',
                description: '立即激活角色特殊能力'
            }
        };

        const config = itemTypes[type] || itemTypes.scroll;
        Object.assign(this, config);
        
        // 动画属性
        this.floatHeight = 0;
        this.floatSpeed = 0.05;
        this.floatRange = 15;
        this.floatDirection = 1;
        
        this.rotation = 0;
        this.rotationSpeed = type === 'scroll' ? 0.02 : 0.05;
        
        // 拾取效果
        this.collectEffect = null;
        this.collectTimer = 0;
        
        // 粒子效果
        this.particles = [];
        this.particleTimer = 0;
        
        // 生成效果
        this.spawnTimer = 0;
        this.spawnDuration = 500;
        
        // 稀有度效果
        this.rarity = this.calculateRarity();
        this.glowIntensity = 0;
        this.glowSpeed = 0.05;
    }

    calculateRarity() {
        const rarities = {
            scroll: 'common',
            coin: 'common',
            pill: 'uncommon',
            kunai: 'rare',
            health: 'uncommon',
            chakra: 'epic'
        };
        return rarities[this.type] || 'common';
    }

    init() {
        // 初始浮动位置
        this.baseY = this.y;
        this.floatHeight = Math.random() * this.floatRange;
        
        // 稀有度特定效果
        switch(this.rarity) {
            case 'epic':
                this.glowColor = '#FF00FF';
                this.floatRange = 25;
                this.rotationSpeed = 0.08;
                break;
            case 'rare':
                this.glowColor = '#00FFFF';
                this.floatRange = 20;
                this.rotationSpeed = 0.06;
                break;
            case 'uncommon':
                this.glowColor = '#00FF00';
                this.floatRange = 15;
                break;
        }
        
        // 生成特效
        this.createSpawnEffect();
    }

    update(deltaTime, gameSpeed) {
        if (!this.active) return;
        
        // 基本移动
        this.x -= gameSpeed;
        
        // 浮动动画
        this.floatHeight += this.floatSpeed * this.floatDirection;
        if (this.floatHeight > this.floatRange || this.floatHeight < 0) {
            this.floatDirection *= -1;
        }
        this.y = this.baseY + Math.sin(this.floatHeight) * 5;
        
        // 旋转动画
        this.rotation += this.rotationSpeed;
        
        // 发光效果
        this.glowIntensity = (Math.sin(Date.now() * this.glowSpeed) + 1) / 2;
        
        // 更新粒子效果
        this.updateParticles(deltaTime);
        
        // 更新生成效果
        if (this.spawnTimer < this.spawnDuration) {
            this.spawnTimer += deltaTime;
        }
        
        // 更新收集效果
        if (this.collectEffect) {
            this.collectTimer += deltaTime;
            if (this.collectTimer > 1000) {
                this.collectEffect = null;
            }
        }
        
        // 自动生成粒子
        this.particleTimer += deltaTime;
        if (this.particleTimer > 200 && this.active && !this.collected) {
            this.createIdleParticle();
            this.particleTimer = 0;
        }
        
        // 检查是否超出屏幕
        if (this.x + this.width < 0) {
            this.active = false;
        }
    }

    updateParticles(deltaTime) {
        // 更新现有粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            if (particle.gravity) {
                particle.vy += 0.1;
            }
            
            if (particle.rotationSpeed) {
                particle.rotation += particle.rotationSpeed;
            }
            
            particle.life -= 0.02;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    createSpawnEffect() {
        // 生成时的特效
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: Math.random() * 4 + 2,
                color: this.glowColor,
                life: 1.0
            });
        }
    }

    createIdleParticle() {
        // 闲置时的粒子效果
        if (this.particles.length < 20) {
            this.particles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -Math.random() * 0.5,
                size: Math.random() * 2 + 1,
                color: this.glowColor,
                life: 0.5 + Math.random() * 0.5
            });
        }
    }

    createCollectEffect() {
        // 收集时的特效
        this.collectEffect = {
            type: this.type,
            x: this.x + this.width / 2,
            y: this.y + this.height / 2,
            timer: 0
        };
        
        // 爆炸粒子
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2;
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * 5,
                vy: Math.sin(angle) * 5,
                size: Math.random() * 3 + 2,
                color: this.glowColor,
                life: 1.0
            });
        }
        
        // 分数弹出效果
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 2,
                size: 10,
                color: '#FFFFFF',
                text: `+${this.points}`,
                life: 1.5,
                gravity: 0.2
            });
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // 绘制生成效果
        if (this.spawnTimer < this.spawnDuration) {
            const spawnProgress = this.spawnTimer / this.spawnDuration;
            ctx.globalAlpha = spawnProgress;
            ctx.scale(spawnProgress, spawnProgress);
        }
        
        // 绘制发光效果
        if (this.glowIntensity > 0 && !this.collected) {
            this.drawGlowEffect(ctx);
        }
        
        // 绘制物品主体
        this.drawItemBody(ctx);
        
        // 绘制稀有度特效
        if (this.rarity !== 'common') {
            this.drawRarityEffect(ctx);
        }
        
        // 绘制粒子效果
        this.drawParticles(ctx);
        
        // 绘制收集效果
        if (this.collectEffect) {
            this.drawCollectEffect(ctx);
        }
        
        ctx.restore();
    }

    drawGlowEffect(ctx) {
        const glowRadius = Math.max(this.width, this.height) * (1 + this.glowIntensity * 0.5);
        
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2,
            this.y + this.height / 2,
            0,
            this.x + this.width / 2,
            this.y + this.height / 2,
            glowRadius
        );
        
        gradient.addColorStop(0, `${this.glowColor}${Math.floor(this.glowIntensity * 50).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${this.glowColor}00`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
            this.x + this.width / 2,
            this.y + this.height / 2,
            glowRadius,
            0, Math.PI * 2
        );
        ctx.fill();
    }

    drawItemBody(ctx) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.rotation);
        
        switch(this.type) {
            case 'scroll':
                this.drawScroll(ctx);
                break;
            case 'pill':
                this.drawPill(ctx);
                break;
            case 'kunai':
                this.drawKunai(ctx);
                break;
            case 'health':
                this.drawHealth(ctx);
                break;
            case 'coin':
                this.drawCoin(ctx);
                break;
            case 'chakra':
                this.drawChakra(ctx);
                break;
        }
        
        ctx.restore();
    }

    drawScroll(ctx) {
        // 卷轴主体
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        
        // 卷轴端部
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(-this.width / 2, 0, 5, this.height / 2, 0, 0, Math.PI * 2);
        ctx.ellipse(this.width / 2, 0, 5, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 卷轴纹理
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        for (let i = -3; i <= 3; i++) {
            const y = i * 5;
            ctx.beginPath();
            ctx.moveTo(-this.width / 2 + 5, y);
            ctx.lineTo(this.width / 2 - 5, y);
            ctx.stroke();
        }
        
        // 忍字标志
        ctx.fillStyle = '#8B0000';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('忍', 0, 0);
    }

    drawPill(ctx) {
        // 药丸主体
        const gradient = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, this.width / 2
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, '#8B0000');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 药丸纹理
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2 - 3, 0, Math.PI * 2);
        ctx.stroke();
        
        // 光泽
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(-this.width / 4, -this.height / 4, this.width / 6, 0, Math.PI * 2);
        ctx.fill();
    }

    drawKunai(ctx) {
        // 苦无手柄
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-this.width / 2, -2, this.width * 0.3, 4);
        
        // 苦无刀刃
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.width * 0.3 - this.width / 2, -this.height / 2);
        ctx.lineTo(this.width / 2, 0);
        ctx.lineTo(this.width * 0.3 - this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();
        
        // 刀刃光泽
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(this.width * 0.3 - this.width / 2 + 2, -this.height / 2 + 2);
        ctx.lineTo(this.width / 2 - 3, 0);
        ctx.lineTo(this.width * 0.3 - this.width / 2 + 2, this.height / 2 - 2);
        ctx.closePath();
        ctx.fill();
        
        // 环扣
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(-this.width / 2 + 5, 0, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawHealth(ctx) {
        // 医疗包主体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -this.height / 3);
        ctx.lineTo(this.width / 2, -this.height / 3);
        ctx.lineTo(this.width / 2, this.height / 3);
        ctx.lineTo(-this.width / 2, this.height / 3);
        ctx.closePath();
        ctx.fill();
        
        // 十字标志
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-this.width / 6, -this.height / 2, this.width / 3, this.height);
        ctx.fillRect(-this.width / 2, -this.height / 6, this.width, this.height / 3);
        
        // 边框
        ctx.strokeStyle = '#228B22';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawCoin(ctx) {
        // 硬币主体
        const gradient = ctx.createRadialGradient(
            0, 0, this.width / 4,
            0, 0, this.width / 2
        );
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(0.5, '#FFEC8B');
        gradient.addColorStop(1, '#B8860B');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 硬币纹理
        ctx.strokeStyle = '#B8860B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2 - 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // 硬币符号
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('忍', 0, 0);
    }

    drawChakra(ctx) {
        // 查克拉球主体
        const gradient = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, this.width / 2
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.7, '#4B0082');
        gradient.addColorStop(1, '#000080');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 能量波动
        for (let i = 0; i < 3; i++) {
            const radius = (this.width / 2) * (1 + i * 0.3);
            const alpha = 0.3 - i * 0.1;
            
            ctx.strokeStyle = `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 查克拉符号
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('気', 0, 0);
    }

    drawRarityEffect(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // 稀有度光环
        ctx.strokeStyle = this.glowColor;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        for (let i = 0; i < 2; i++) {
            const radius = Math.max(this.width, this.height) / 2 + 10 + i * 5;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
        
        // 稀有度星星
        if (this.rarity === 'epic' || this.rarity === 'rare') {
            const starCount = this.rarity === 'epic' ? 8 : 5;
            const starRadius = Math.max(this.width, this.height) / 2 + 20;
            
            for (let i = 0; i < starCount; i++) {
                const angle = (i / starCount) * Math.PI * 2 + this.rotation;
                const starX = Math.cos(angle) * starRadius;
                const starY = Math.sin(angle) * starRadius;
                
                ctx.fillStyle = this.glowColor;
                ctx.beginPath();
                ctx.arc(starX, starY, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }

    drawParticles(ctx) {
        this.particles.forEach(particle => {
            ctx.save();
            ctx.globalAlpha = particle.life;
            
            if (particle.text) {
                // 绘制文本粒子（分数弹出）
                ctx.fillStyle = particle.color;
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(particle.text, particle.x, particle.y);
            } else if (particle.rotation) {
                // 绘制旋转粒子
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // 绘制普通粒子
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }

    drawCollectEffect(ctx) {
        if (!this.collectEffect) return;
        
        const progress = Math.min(this.collectTimer / 1000, 1);
        const scale = 1 + progress * 2;
        const alpha = 1 - progress;
        
        ctx.save();
        ctx.translate(this.collectEffect.x, this.collectEffect.y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        
        // 收集光效
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
        gradient.addColorStop(0, `${this.glowColor}ff`);
        gradient.addColorStop(1, `${this.glowColor}00`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    collect() {
        if (this.collected || !this.active) return null;
        
        this.collected = true;
        this.active = false;
        this.createCollectEffect();
        
        return {
            type: this.type,
            points: this.points,
            value: this.value,
            effect: this.effect,
            duration: this.duration || 0,
            damage: this.damage || 0
        };
    }

    getHitbox() {
        // 根据物品类型返回碰撞箱
        const padding = 5;
        
        return {
            x: this.x + padding,
            y: this.y + padding,
            width: this.width - padding * 2,
            height: this.height - padding * 2
        };
    }

    isPassed(playerX) {
        return this.x + this.width < playerX;
    }

    reset() {
        this.active = false;
        this.collected = false;
        this.particles = [];
        this.collectEffect = null;
        this.collectTimer = 0;
        this.spawnTimer = 0;
    }
}

// 物品管理器
class ItemManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.items = [];
        
        // 生成设置
        this.spawnTimer = 0;
        this.spawnInterval = 2000;
        this.minSpawnInterval = 800;
        
        // 物品类型权重
        this.itemWeights = {
            scroll: 35,
            coin: 30,
            pill: 15,
            kunai: 8,
            health: 10,
            chakra: 2
        };
        
        // 组合物品
        this.comboItems = [];
        this.comboSpawnChance = 0.1;
        
        // 难度设置
        this.difficulty = 1;
        this.distance = 0;
        
        // 收集统计
        this.collectionStats = {
            totalCollected: 0,
            byType: {},
            totalPoints: 0,
            combos: 0
        };
        
        // 对象池
        this.pool = [];
        this.initPool();
        
        // 磁力效果
        this.magnetActive = false;
        this.magnetTimer = 0;
        this.magnetDuration = 5000;
        this.magnetRadius = 200;
    }

    initPool() {
        // 初始化对象池
        for (let i = 0; i < 50; i++) {
            this.pool.push(new GameItem(this.canvas, 'scroll', -1000, -1000));
        }
    }

    getFromPool(type, x, y) {
        // 从对象池获取物品
        let item = this.pool.find(obj => !obj.active && obj.type === type);
        
        if (!item) {
            item = new GameItem(this.canvas, type, x, y);
            this.pool.push(item);
        } else {
            item.loadItemType(type);
            item.x = x;
            item.y = y || this.canvas.height - 200;
            item.active = true;
            item.collected = false;
            item.init();
        }
        
        return item;
    }

    update(deltaTime, gameSpeed, player) {
        // 更新距离
        this.distance += gameSpeed * deltaTime * 0.01;
        
        // 更新难度
        this.updateDifficulty();
        
        // 更新磁力效果
        if (this.magnetActive) {
            this.magnetTimer -= deltaTime;
            if (this.magnetTimer <= 0) {
                this.magnetActive = false;
            }
        }
        
        // 更新生成计时器
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnItem();
            this.spawnTimer = 0;
        }
        
        // 更新所有物品
        this.items = this.items.filter(item => {
            item.update(deltaTime, gameSpeed);
            
            // 磁力吸引效果
            if (this.magnetActive && !item.collected) {
                this.applyMagnetEffect(item, player);
            }
            
            return item.active;
        });
        
        // 更新组合物品
        this.updateComboItems(deltaTime, gameSpeed);
        
        // 清理不活跃的物品
        this.cleanup();
    }

    updateDifficulty() {
        // 根据距离调整难度
        this.difficulty = 1 + this.distance * 0.00005;
        
        // 调整生成间隔
        this.spawnInterval = Math.max(
            this.minSpawnInterval,
            2000 - (this.difficulty - 1) * 100
        );
        
        // 调整物品权重
        this.updateItemWeights();
    }

    updateItemWeights() {
        // 随着游戏进行，稀有物品权重增加
        const difficultyFactor = Math.min(this.difficulty / 10, 1);
        
        this.itemWeights = {
            scroll: 35 - difficultyFactor * 10,
            coin: 30 - difficultyFactor * 15,
            pill: 15 + difficultyFactor * 5,
            kunai: 8 + difficultyFactor * 7,
            health: 10 + difficultyFactor * 5,
            chakra: 2 + difficultyFactor * 3
        };
    }

    applyMagnetEffect(item, player) {
        if (item.collected) return;
        
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const itemCenterX = item.x + item.width / 2;
        const itemCenterY = item.y + item.height / 2;
        
        const distance = GameUtils.distance(
            playerCenterX, playerCenterY,
            itemCenterX, itemCenterY
        );
        
        if (distance < this.magnetRadius) {
            // 计算吸引力
            const angle = Math.atan2(
                playerCenterY - itemCenterY,
                playerCenterX - itemCenterX
            );
            
            const force = (this.magnetRadius - distance) / this.magnetRadius * 10;
            
            item.x += Math.cos(angle) * force;
            item.y += Math.sin(angle) * force;
            
            // 磁力特效
            if (Math.random() < 0.3) {
                item.particles.push({
                    x: itemCenterX,
                    y: itemCenterY,
                    vx: -Math.cos(angle) * 2,
                    vy: -Math.sin(angle) * 2,
                    size: Math.random() * 2 + 1,
                    color: '#00FFFF',
                    life: 0.5
                });
            }
        }
    }

    spawnItem() {
        if (this.items.length >= 15) return;
        
        // 决定是否生成组合物品
        if (Math.random() < this.comboSpawnChance && this.difficulty > 3) {
            this.spawnComboItem();
            return;
        }
        
        // 根据权重选择物品类型
        const type = this.selectItemType();
        
        // 计算生成位置
        let x = this.canvas.width;
        let y = this.canvas.height - 200 + (Math.random() - 0.5) * 100;
        
        // 确保不会与其他物品重叠
        const minDistance = 100;
        for (const item of this.items) {
            if (Math.abs(item.x - x) < minDistance) {
                x += minDistance;
            }
        }
        
        // 从对象池获取物品
        const item = this.getFromPool(type, x, y);
        this.items.push(item);
    }

    selectItemType() {
        const weights = Object.values(this.itemWeights);
        const types = Object.keys(this.itemWeights);
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        
        let random = Math.random() * totalWeight;
        let weightSum = 0;
        
        for (let i = 0; i < weights.length; i++) {
            weightSum += weights[i];
            if (random <= weightSum) {
                return types[i];
            }
        }
        
        return types[0];
    }

    spawnComboItem() {
        const comboPatterns = [
            { type: 'scroll', count: 3, spacing: 60, vertical: true },
            { type: 'coin', count: 5, spacing: 40, pattern: 'line' },
            { type: 'pill', count: 2, spacing: 80, pattern: 'horizontal' },
            { types: ['scroll', 'pill', 'health'], spacing: 100, pattern: 'mixed' }
        ];
        
        const pattern = comboPatterns[Math.floor(Math.random() * comboPatterns.length)];
        const startX = this.canvas.width + 100;
        const startY = this.canvas.height - 200;
        
        if (pattern.types) {
            // 混合类型组合
            pattern.types.forEach((type, index) => {
                const x = startX + index * pattern.spacing;
                const y = startY + (Math.random() - 0.5) * 50;
                
                const item = this.getFromPool(type, x, y);
                this.items.push(item);
                this.comboItems.push(item);
            });
        } else {
            // 单一类型组合
            for (let i = 0; i < pattern.count; i++) {
                let x, y;
                
                if (pattern.vertical) {
                    x = startX;
                    y = startY + i * pattern.spacing - (pattern.count * pattern.spacing) / 2;
                } else if (pattern.pattern === 'line') {
                    x = startX + i * pattern.spacing;
                    y = startY;
                } else {
                    x = startX + i * pattern.spacing;
                    y = startY + (i % 2 === 0 ? -20 : 20);
                }
                
                const item = this.getFromPool(pattern.type, x, y);
                this.items.push(item);
                this.comboItems.push(item);
            }
        }
    }

    updateComboItems(deltaTime, gameSpeed) {
        this.comboItems = this.comboItems.filter(item => {
            return item.active && !item.collected;
        });
    }

    draw(ctx) {
        // 绘制所有物品
        this.items.forEach(item => {
            item.draw(ctx);
        });
        
        // 绘制磁力场效果
        if (this.magnetActive) {
            this.drawMagnetField(ctx);
        }
        
        // 绘制组合物品指示器
        if (this.comboItems.length > 0) {
            this.drawComboIndicator(ctx);
        }
    }

    drawMagnetField(ctx) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 磁力场光环
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.3 + Math.sin(Date.now() * 0.005) * 0.2})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        
        for (let i = 0; i < 3; i++) {
            const radius = this.magnetRadius * (0.7 + i * 0.1);
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
        
        // 磁力图标
        ctx.fillStyle = '#00FFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧲', centerX, centerY);
        
        // 剩余时间
        const timeLeft = Math.ceil(this.magnetTimer / 1000);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`${timeLeft}s`, centerX, centerY + 30);
    }

    drawComboIndicator(ctx) {
        if (this.comboItems.length === 0) return;
        
        const firstItem = this.comboItems[0];
        const comboCount = this.comboItems.length;
        
        // 组合提示
        ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`✨ 物品连击 x${comboCount} ✨`, this.canvas.width / 2, 100);
        
        // 连接线
        if (comboCount > 1) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            ctx.beginPath();
            this.comboItems.forEach((item, index) => {
                const x = item.x + item.width / 2;
                const y = item.y + item.height / 2;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // 第一个物品的提示箭头
        if (firstItem && firstItem.x > this.canvas.width / 2) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.7)';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⬅️ 这里有连击！', firstItem.x - 50, firstItem.y - 30);
        }
    }

    checkCollection(player) {
        const playerHitbox = player.getHitbox();
        const collectedItems = [];
        
        for (const item of this.items) {
            if (!item.active || item.collected) continue;
            
            const itemHitbox = item.getHitbox();
            if (GameUtils.collides(playerHitbox, itemHitbox)) {
                const collectData = item.collect();
                if (collectData) {
                    collectedItems.push(collectData);
                    
                    // 更新收集统计
                    this.updateCollectionStats(collectData);
                    
                    // 检查连击
                    if (this.comboItems.includes(item)) {
                        this.checkComboCompletion();
                    }
                }
            }
        }
        
        return collectedItems;
    }

    updateCollectionStats(collectData) {
        this.collectionStats.totalCollected++;
        this.collectionStats.totalPoints += collectData.points;
        
        if (!this.collectionStats.byType[collectData.type]) {
            this.collectionStats.byType[collectData.type] = 0;
        }
        this.collectionStats.byType[collectData.type]++;
    }

    checkComboCompletion() {
        // 检查组合物品是否全部收集
        const remaining = this.comboItems.filter(item => !item.collected).length;
        
        if (remaining === 0 && this.comboItems.length > 0) {
            // 完成连击奖励
            this.collectionStats.combos++;
            
            // 创建连击完成特效
            this.createComboCompleteEffect();
            
            // 清空组合物品列表
            this.comboItems = [];
        }
    }

    createComboCompleteEffect() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 创建爆炸特效
        for (let i = 0; i < 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            this.items.forEach(item => {
                if (!item.active) return;
                
                item.particles.push({
                    x: centerX,
                    y: centerY,
                    vx: Math.cos(angle) * (5 + Math.random() * 5),
                    vy: Math.sin(angle) * (5 + Math.random() * 5),
                    size: Math.random() * 4 + 2,
                    color: '#FFFF00',
                    life: 1.5
                });
            });
        }
    }

    activateMagnet(duration = 5000) {
        this.magnetActive = true;
        this.magnetTimer = duration;
        this.magnetDuration = duration;
    }

    cleanup() {
        // 清理超出屏幕的物品
        this.items = this.items.filter(item => {
            if (item.x + item.width < -100) {
                item.reset();
                return false;
            }
            return true;
        });
    }

    reset() {
        this.items.forEach(item => item.reset());
        this.items = [];
        this.comboItems = [];
        this.spawnTimer = 0;
        this.distance = 0;
        this.difficulty = 1;
        this.magnetActive = false;
        this.magnetTimer = 0;
        this.collectionStats = {
            totalCollected: 0,
            byType: {},
            totalPoints: 0,
            combos: 0
        };
    }

    getCollectionStats() {
        return { ...this.collectionStats };
    }

    getActiveItemCount() {
        return this.items.filter(item => item.active && !item.collected).length;
    }
}

export { GameItem, ItemManager };