// 障碍物系统
class Obstacle {
    constructor(canvas, type, x) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.type = type; // 'rock', 'gap', 'moving', 'spike', 'shuriken'
        this.x = x || canvas.width;
        this.active = true;
        
        // 障碍物基本属性
        this.loadObstacleType(type);
        this.init();
    }

    loadObstacleType(type) {
        const types = {
            rock: {
                width: 40,
                height: 50,
                color: '#8B4513',
                damage: 10,
                speedModifier: 1.0,
                canJumpOver: true,
                sprite: null
            },
            gap: {
                width: 80,
                height: 0, // 特殊处理
                color: 'transparent',
                damage: 0, // 掉落伤害
                speedModifier: 1.0,
                canJumpOver: false,
                isGap: true
            },
            moving: {
                width: 50,
                height: 40,
                color: '#A0522D',
                damage: 15,
                speedModifier: 1.2,
                canJumpOver: true,
                movePattern: 'horizontal', // 'horizontal', 'vertical', 'zigzag'
                moveSpeed: 2,
                moveRange: 100
            },
            spike: {
                width: 60,
                height: 30,
                color: '#DC143C',
                damage: 20,
                speedModifier: 1.0,
                canJumpOver: true,
                spikeCount: 5
            },
            shuriken: {
                width: 30,
                height: 30,
                color: '#B0C4DE',
                damage: 15,
                speedModifier: 1.5,
                canJumpOver: false,
                isProjectile: true,
                rotationSpeed: 0.1
            }
        };

        const config = types[type] || types.rock;
        Object.assign(this, config);
        
        // 设置位置
        this.y = this.canvas.height - this.height - 120; // 与地面齐平
        if (type === 'gap') {
            this.y = this.canvas.height - 120; // 地面高度
        }
        
        // 动画属性
        this.animationFrame = 0;
        this.animationSpeed = 0.15;
        
        // 移动属性
        this.startX = this.x;
        this.startY = this.y;
        this.moveTimer = 0;
        this.moveDirection = 1;
        
        // 物理属性
        this.gravity = 0;
        this.velocityY = 0;
        
        // 效果属性
        this.particles = [];
        this.hitEffectTimer = 0;
    }

    init() {
        // 初始化移动模式
        if (this.movePattern === 'zigzag') {
            this.moveDirection = Math.random() > 0.5 ? 1 : -1;
        }
        
        // 初始化手里剑旋转
        if (this.type === 'shuriken') {
            this.rotation = 0;
        }
        
        // 初始化尖刺位置
        if (this.type === 'spike') {
            this.spikePositions = [];
            for (let i = 0; i < this.spikeCount; i++) {
                this.spikePositions.push({
                    x: (i / (this.spikeCount - 1)) * this.width,
                    height: 20 + Math.random() * 10
                });
            }
        }
    }

    update(deltaTime, gameSpeed) {
        if (!this.active) return;
        
        // 基本移动
        this.x -= gameSpeed * this.speedModifier;
        
        // 更新动画
        this.animationFrame += this.animationSpeed;
        if (this.animationFrame >= 4) {
            this.animationFrame = 0;
        }
        
        // 处理移动障碍
        if (this.movePattern) {
            this.updateMovement(deltaTime);
        }
        
        // 处理手里剑旋转
        if (this.type === 'shuriken') {
            this.rotation += this.rotationSpeed;
        }
        
        // 处理物理
        if (this.gravity > 0) {
            this.velocityY += this.gravity;
            this.y += this.velocityY;
            
            // 地面碰撞检测
            const groundY = this.canvas.height - this.height - 120;
            if (this.y > groundY) {
                this.y = groundY;
                this.velocityY = 0;
                this.createImpactEffect();
            }
        }
        
        // 更新粒子效果
        this.updateParticles(deltaTime);
        
        // 更新击中效果
        if (this.hitEffectTimer > 0) {
            this.hitEffectTimer -= deltaTime;
        }
        
        // 检查是否超出屏幕
        if (this.x + this.width < 0) {
            this.active = false;
        }
    }

    updateMovement(deltaTime) {
        this.moveTimer += deltaTime;
        
        switch(this.movePattern) {
            case 'horizontal':
                this.x += Math.sin(this.moveTimer * 0.005) * this.moveSpeed;
                break;
                
            case 'vertical':
                this.y = this.startY + Math.sin(this.moveTimer * 0.005) * this.moveRange;
                break;
                
            case 'zigzag':
                this.x += this.moveSpeed * this.moveDirection;
                this.y = this.startY + Math.sin(this.moveTimer * 0.01) * 30;
                
                // 边界检测
                if (this.x > this.startX + this.moveRange || 
                    this.x < this.startX - this.moveRange) {
                    this.moveDirection *= -1;
                }
                break;
                
            case 'circular':
                const angle = this.moveTimer * 0.005;
                this.x = this.startX + Math.cos(angle) * this.moveRange;
                this.y = this.startY + Math.sin(angle) * this.moveRange;
                break;
        }
    }

    updateParticles(deltaTime) {
        // 更新现有粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity || 0.05;
            particle.life -= 0.02;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // 为移动障碍物创建轨迹
        if (this.movePattern && this.type !== 'gap') {
            if (Math.random() < 0.1) {
                this.particles.push({
                    x: this.x + this.width,
                    y: this.y + this.height * Math.random(),
                    vx: -Math.random() * 2,
                    vy: Math.random() * 2 - 1,
                    size: Math.random() * 2 + 1,
                    color: this.color,
                    life: 0.5 + Math.random() * 0.5
                });
            }
        }
    }

    draw(ctx) {
        if (!this.active) return;
        
        ctx.save();
        
        // 绘制击中效果
        if (this.hitEffectTimer > 0) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10);
            ctx.globalAlpha = 1.0;
        }
        
        // 根据类型绘制障碍物
        switch(this.type) {
            case 'rock':
                this.drawRock(ctx);
                break;
            case 'gap':
                this.drawGap(ctx);
                break;
            case 'moving':
                this.drawMovingObstacle(ctx);
                break;
            case 'spike':
                this.drawSpike(ctx);
                break;
            case 'shuriken':
                this.drawShuriken(ctx);
                break;
        }
        
        // 绘制粒子效果
        this.drawParticles(ctx);
        
        ctx.restore();
    }

    drawRock(ctx) {
        const frame = Math.floor(this.animationFrame);
        
        // 石头主体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 10);
        ctx.fill();
        
        // 石头纹理
        ctx.fillStyle = '#A0522D';
        for (let i = 0; i < 5; i++) {
            const texX = this.x + Math.random() * this.width;
            const texY = this.y + Math.random() * this.height;
            ctx.beginPath();
            ctx.arc(texX, texY, 2 + Math.random() * 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 高光
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.roundRect(this.x + 5, this.y + 5, this.width - 10, 10, 5);
        ctx.fill();
    }

    drawGap(ctx) {
        const groundY = this.canvas.height - 120;
        const gapDepth = 50;
        
        // 沟壑阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x, groundY, this.width, gapDepth);
        
        // 沟壑内部
        const gradient = ctx.createLinearGradient(
            this.x, groundY,
            this.x, groundY + gapDepth
        );
        gradient.addColorStop(0, '#2a1b3a');
        gradient.addColorStop(1, '#1a0b2a');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x, groundY, this.width, gapDepth);
        
        // 边缘高光
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, groundY, this.width, 2);
        
        // 危险标志
        ctx.fillStyle = '#ff0000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠️', this.x + this.width / 2, groundY + gapDepth / 2);
    }

    drawMovingObstacle(ctx) {
        // 移动障碍物主体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        
        if (this.movePattern === 'horizontal' || this.movePattern === 'zigzag') {
            // 圆角矩形
            ctx.roundRect(this.x, this.y, this.width, this.height, 8);
        } else {
            // 圆形或椭圆形
            ctx.ellipse(
                this.x + this.width / 2,
                this.y + this.height / 2,
                this.width / 2,
                this.height / 2,
                0, 0, Math.PI * 2
            );
        }
        ctx.fill();
        
        // 移动指示器
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        if (this.movePattern === 'horizontal') {
            ctx.beginPath();
            ctx.moveTo(this.startX - this.moveRange, this.y + this.height / 2);
            ctx.lineTo(this.startX + this.moveRange, this.y + this.height / 2);
            ctx.stroke();
        } else if (this.movePattern === 'vertical') {
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.startY - this.moveRange);
            ctx.lineTo(this.x + this.width / 2, this.startY + this.moveRange);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        
        // 危险符号
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', this.x + this.width / 2, this.y + this.height / 2);
    }

    drawSpike(ctx) {
        // 基座
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y + this.height - 10, this.width, 10);
        
        // 尖刺
        ctx.fillStyle = this.color;
        this.spikePositions.forEach(spike => {
            const spikeX = this.x + spike.x;
            const spikeY = this.y + this.height - 10;
            
            ctx.beginPath();
            ctx.moveTo(spikeX, spikeY);
            ctx.lineTo(spikeX - 5, spikeY - spike.height);
            ctx.lineTo(spikeX + 5, spikeY - spike.height);
            ctx.closePath();
            ctx.fill();
            
            // 尖刺高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(spikeX, spikeY - spike.height);
            ctx.lineTo(spikeX - 3, spikeY - spike.height + 5);
            ctx.lineTo(spikeX, spikeY - spike.height + 3);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = this.color;
        });
        
        // 血迹效果
        if (this.hitEffectTimer > 0) {
            ctx.fillStyle = 'rgba(139, 0, 0, 0.5)';
            for (let i = 0; i < 3; i++) {
                const bloodX = this.x + Math.random() * this.width;
                const bloodY = this.y + this.height - 5;
                ctx.beginPath();
                ctx.arc(bloodX, bloodY, 3 + Math.random() * 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    drawShuriken(ctx) {
        ctx.save();
        
        // 移动到旋转中心
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        // 绘制手里剑
        ctx.fillStyle = this.color;
        
        // 四个刀刃
        for (let i = 0; i < 4; i++) {
            ctx.rotate(Math.PI / 2);
            
            // 刀刃主体
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-this.width / 3, -this.height / 2);
            ctx.lineTo(this.width / 3, -this.height / 2);
            ctx.closePath();
            ctx.fill();
            
            // 刀刃高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(0, -this.height / 4);
            ctx.lineTo(-this.width / 6, -this.height / 2);
            ctx.lineTo(this.width / 6, -this.height / 2);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = this.color;
        }
        
        // 中心圆环
        ctx.fillStyle = '#2a1b3a';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 4, 0, Math.PI * 2);
        ctx.fill();
        
        // 中心符号
        ctx.fillStyle = '#ff6b00';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('忍', 0, 0);
        
        // 旋转轨迹
        if (this.movePattern) {
            ctx.strokeStyle = 'rgba(255, 107, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.arc(0, 0, this.moveRange, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }

    drawParticles(ctx) {
        this.particles.forEach(particle => {
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }

    createImpactEffect() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 10,
                size: Math.random() * 3 + 2,
                color: this.color,
                gravity: 0.2,
                life: 1.0
            });
        }
    }

    hit() {
        this.hitEffectTimer = 300; // 300ms击中效果
        
        // 创建击中粒子
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 4 + 2,
                color: '#ff0000',
                life: 0.5 + Math.random() * 0.5
            });
        }
    }

    getHitbox() {
        // 返回精确的碰撞箱
        switch(this.type) {
            case 'gap':
                return {
                    x: this.x,
                    y: this.canvas.height - 120,
                    width: this.width,
                    height: 100 // 掉落深度
                };
                
            case 'shuriken':
                // 手里剑使用圆形碰撞
                return {
                    x: this.x + this.width / 2 - 15,
                    y: this.y + this.height / 2 - 15,
                    width: 30,
                    height: 30,
                    isCircle: true,
                    radius: 15
                };
                
            default:
                return {
                    x: this.x,
                    y: this.y,
                    width: this.width,
                    height: this.height
                };
        }
    }

    isPassed(playerX) {
        return this.x + this.width < playerX;
    }

    reset() {
        this.active = false;
        this.particles = [];
        this.hitEffectTimer = 0;
    }
}

// 障碍物管理器
class ObstacleManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.obstacles = [];
        
        // 生成设置
        this.spawnTimer = 0;
        this.spawnInterval = 1500; // 初始生成间隔
        this.minSpawnInterval = 500; // 最小生成间隔
        
        // 难度设置
        this.difficulty = 1;
        this.maxDifficulty = 10;
        this.distance = 0;
        
        // 障碍物类型权重
        this.obstacleWeights = {
            rock: 40,
            gap: 25,
            moving: 20,
            spike: 10,
            shuriken: 5
        };
        
        // 组合障碍物
        this.comboObstacles = [];
        this.comboTimer = 0;
        this.comboInterval = 10000; // 10秒一次组合
        
        // 性能优化
        this.maxObstacles = 20;
        this.pool = [];
        this.initPool();
    }

    initPool() {
        // 初始化对象池
        for (let i = 0; i < 30; i++) {
            this.pool.push(new Obstacle(this.canvas, 'rock', -1000));
        }
    }

    getFromPool(type, x) {
        // 从对象池获取障碍物
        let obstacle = this.pool.find(obj => !obj.active && obj.type === type);
        
        if (!obstacle) {
            obstacle = new Obstacle(this.canvas, type, x);
            this.pool.push(obstacle);
        } else {
            obstacle.loadObstacleType(type);
            obstacle.x = x;
            obstacle.active = true;
            obstacle.init();
        }
        
        return obstacle;
    }

    update(deltaTime, gameSpeed) {
        // 更新距离
        this.distance += gameSpeed * deltaTime * 0.01;
        
        // 更新难度
        this.updateDifficulty();
        
        // 更新生成计时器
        this.spawnTimer += deltaTime;
        
        // 生成障碍物
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnObstacle();
            this.spawnTimer = 0;
            
            // 随机生成组合障碍物
            if (Math.random() < 0.3 && this.difficulty > 3) {
                this.spawnComboObstacle();
            }
        }
        
        // 更新组合计时器
        this.comboTimer += deltaTime;
        if (this.comboTimer >= this.comboInterval && this.difficulty > 5) {
            this.spawnComboObstacle();
            this.comboTimer = 0;
        }
        
        // 更新所有障碍物
        this.obstacles = this.obstacles.filter(obstacle => {
            obstacle.update(deltaTime, gameSpeed);
            return obstacle.active;
        });
        
        // 更新组合障碍物
        this.updateComboObstacles(deltaTime, gameSpeed);
        
        // 清理不活跃的障碍物
        this.cleanup();
    }

    updateDifficulty() {
        // 根据距离增加难度
        this.difficulty = Math.min(this.maxDifficulty, 1 + this.distance * 0.0001);
        
        // 调整生成间隔
        this.spawnInterval = Math.max(
            this.minSpawnInterval,
            1500 - (this.difficulty - 1) * 100
        );
        
        // 调整障碍物权重
        this.updateObstacleWeights();
    }

    updateObstacleWeights() {
        // 随着难度增加，更难障碍物的权重增加
        const difficultyFactor = this.difficulty / this.maxDifficulty;
        
        this.obstacleWeights = {
            rock: Math.max(10, 40 - difficultyFactor * 30),
            gap: 25 + difficultyFactor * 10,
            moving: 20 + difficultyFactor * 15,
            spike: 10 + difficultyFactor * 10,
            shuriken: 5 + difficultyFactor * 20
        };
    }

    spawnObstacle() {
        if (this.obstacles.length >= this.maxObstacles) return;
        
        // 根据权重选择障碍物类型
        const type = this.selectObstacleType();
        
        // 计算生成位置（考虑安全距离）
        let x = this.canvas.width;
        if (this.obstacles.length > 0) {
            const lastObstacle = this.obstacles[this.obstacles.length - 1];
            const minDistance = 200 + (type === 'gap' ? 100 : 0);
            x = Math.max(x, lastObstacle.x + lastObstacle.width + minDistance);
        }
        
        // 从对象池获取障碍物
        const obstacle = this.getFromPool(type, x);
        
        // 设置移动模式（如果适用）
        if (type === 'moving' || type === 'shuriken') {
            const patterns = ['horizontal', 'vertical', 'zigzag', 'circular'];
            obstacle.movePattern = patterns[Math.floor(Math.random() * patterns.length)];
            obstacle.moveRange = 50 + Math.random() * 100;
            obstacle.moveSpeed = 1 + Math.random() * 2;
        }
        
        // 添加到活跃障碍物列表
        this.obstacles.push(obstacle);
    }

    selectObstacleType() {
        const weights = Object.values(this.obstacleWeights);
        const types = Object.keys(this.obstacleWeights);
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

    spawnComboObstacle() {
        if (this.difficulty < 4) return;
        
        const comboTypes = [
            ['rock', 'gap', 'rock'], // 石头-沟壑-石头组合
            ['moving', 'moving'], // 双移动障碍
            ['spike', 'gap', 'spike'], // 尖刺陷阱
            ['shuriken', 'shuriken', 'shuriken'] // 三连手里剑
        ];
        
        const combo = comboTypes[Math.floor(Math.random() * comboTypes.length)];
        const startX = this.canvas.width;
        const spacing = 150;
        
        combo.forEach((type, index) => {
            const x = startX + index * spacing;
            const obstacle = this.getFromPool(type, x);
            
            // 设置组合特有的属性
            if (type === 'shuriken') {
                obstacle.movePattern = 'circular';
                obstacle.moveRange = 30 + index * 20;
            }
            
            this.comboObstacles.push(obstacle);
            this.obstacles.push(obstacle);
        });
    }

    updateComboObstacles(deltaTime, gameSpeed) {
        this.comboObstacles = this.comboObstacles.filter(obstacle => {
            return obstacle.active;
        });
    }

    draw(ctx) {
        // 绘制所有障碍物
        this.obstacles.forEach(obstacle => {
            obstacle.draw(ctx);
        });
        
        // 绘制组合指示器
        if (this.comboObstacles.length > 0) {
            this.drawComboIndicator(ctx);
        }
    }

    drawComboIndicator(ctx) {
        const firstObstacle = this.comboObstacles[0];
        if (!firstObstacle) return;
        
        // 警告标志
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚠️ 组合障碍 ⚠️', this.canvas.width / 2, 50);
        
        // 组合数量
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(
            `剩余: ${this.comboObstacles.length}`,
            this.canvas.width / 2,
            80
        );
    }

    checkCollision(player) {
        const playerHitbox = player.getHitbox();
        
        for (const obstacle of this.obstacles) {
            if (!obstacle.active) continue;
            
            const obstacleHitbox = obstacle.getHitbox();
            let collision = false;
            
            if (obstacleHitbox.isCircle) {
                // 圆形碰撞检测
                collision = GameUtils.circleCollides(
                    {
                        x: obstacleHitbox.x + obstacleHitbox.width / 2,
                        y: obstacleHitbox.y + obstacleHitbox.height / 2,
                        radius: obstacleHitbox.radius
                    },
                    playerHitbox
                );
            } else if (obstacle.type === 'gap') {
                // 沟壑碰撞检测（掉落检测）
                const playerBottom = playerHitbox.y + playerHitbox.height;
                const gapTop = obstacleHitbox.y;
                
                if (playerBottom > gapTop && 
                    playerHitbox.x + playerHitbox.width > obstacleHitbox.x &&
                    playerHitbox.x < obstacleHitbox.x + obstacleHitbox.width) {
                    collision = true;
                }
            } else {
                // 矩形碰撞检测
                collision = GameUtils.collides(playerHitbox, obstacleHitbox);
            }
            
            if (collision) {
                obstacle.hit();
                return {
                    obstacle: obstacle,
                    damage: obstacle.damage,
                    type: obstacle.type
                };
            }
        }
        
        return null;
    }

    cleanup() {
        // 清理超出屏幕的障碍物
        this.obstacles = this.obstacles.filter(obstacle => {
            if (obstacle.x + obstacle.width < -100) {
                obstacle.reset();
                return false;
            }
            return true;
        });
    }

    reset() {
        this.obstacles.forEach(obstacle => obstacle.reset());
        this.obstacles = [];
        this.comboObstacles = [];
        this.spawnTimer = 0;
        this.distance = 0;
        this.difficulty = 1;
        this.comboTimer = 0;
    }

    getActiveCount() {
        return this.obstacles.filter(o => o.active).length;
    }

    getDifficulty() {
        return this.difficulty;
    }

    getDistance() {
        return Math.floor(this.distance);
    }
}

export { Obstacle, ObstacleManager };