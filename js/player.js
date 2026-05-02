// 角色类 - 忍者角色系统
import { GameUtils } from './utils.js';

class Player {
    constructor(canvas, character = 'naruto') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.character = character;
        
        // 角色属性
        this.width = 40;
        this.height = 60;
        this.x = 100;
        this.baseY = canvas.height - this.height - 120; // 地面高度
        this.y = this.baseY;
        
        // 物理属性
        this.velocityY = 0;
        this.jumpPower = 15;
        this.gravity = 0.8;
        this.isJumping = false;
        this.isDoubleJumping = false;
        this.canDoubleJump = false;
        this.maxDoubleJumps = 1;
        this.doubleJumpsUsed = 0;
        
        // 动作状态
        this.isRunning = true;
        this.runAnimationFrame = 0;
        this.runSpeed = 0.15;
        
        // 角色属性
        this.health = 100;
        this.maxHealth = 100;
        this.speedMultiplier = 1.0;
        this.jumpMultiplier = 1.0;
        
        // 效果状态
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.invincibleDuration = 1000; // 1秒无敌时间
        
        this.isSpeedBoosted = false;
        this.speedBoostTimer = 0;
        this.speedBoostDuration = 3000; // 3秒加速
        
        // 视觉效果
        this.trailParticles = [];
        this.maxTrailParticles = 10;
        this.trailTimer = 0;
        
        // 角色专属属性
        this.loadCharacterStats(character);
        this.init();
    }

    loadCharacterStats(character) {
        const characters = {
            naruto: {
                name: '漩涡鸣人',
                color: '#ff6b00',
                accentColor: '#ff9500',
                jumpMultiplier: 1.0,
                speedMultiplier: 1.0,
                specialAbility: 'shadowClone', // 影分身
                abilityCooldown: 10000,
                abilityDuration: 5000
            },
            sasuke: {
                name: '宇智波佐助',
                color: '#9400d3',
                accentColor: '#4b0082',
                jumpMultiplier: 1.1,
                speedMultiplier: 1.2,
                specialAbility: 'fireball', // 火球术
                abilityCooldown: 8000,
                abilityDuration: 3000
            },
            sakura: {
                name: '春野樱',
                color: '#ff1493',
                accentColor: '#ff69b4',
                jumpMultiplier: 0.9,
                speedMultiplier: 0.8,
                specialAbility: 'healing', // 治疗
                abilityCooldown: 15000,
                abilityDuration: 4000
            },
            kakashi: {
                name: '旗木卡卡西',
                color: '#808080',
                accentColor: '#a0a0a0',
                jumpMultiplier: 1.0,
                speedMultiplier: 1.1,
                specialAbility: 'lightning', // 雷切
                abilityCooldown: 12000,
                abilityDuration: 4000
            }
        };

        const stats = characters[character] || characters.naruto;
        Object.assign(this, stats);
        
        // 解锁状态
        this.isUnlocked = this.checkUnlockStatus(character);
    }

    checkUnlockStatus(character) {
        if (character === 'naruto') return true;
        
        const saveData = GameUtils.loadFromStorage('game_progress', { scrolls: 0, unlocked: ['naruto'] });
        return saveData.unlocked.includes(character);
    }

    init() {
        // 初始化角色特定效果
        this.specialAbilityActive = false;
        this.abilityCooldownTimer = 0;
        this.abilityDurationTimer = 0;
        
        // 角色视觉效果
        this.particles = [];
        this.effectTimer = 0;
    }

    jump() {
        if (!this.isJumping) {
            // 第一次跳跃
            this.velocityY = -this.jumpPower * this.jumpMultiplier;
            this.isJumping = true;
            this.canDoubleJump = true;
            this.createJumpEffect();
            return true;
        } else if (this.canDoubleJump && this.doubleJumpsUsed < this.maxDoubleJumps) {
            // 二段跳
            this.velocityY = -this.jumpPower * this.jumpMultiplier * 0.8;
            this.doubleJumpsUsed++;
            this.canDoubleJump = false;
            this.createDoubleJumpEffect();
            return true;
        }
        return false;
    }

    createJumpEffect() {
        // 跳跃特效粒子
        for (let i = 0; i < 8; i++) {
            this.trailParticles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height,
                vx: (Math.random() - 0.5) * 4,
                vy: -Math.random() * 3 - 1,
                size: Math.random() * 3 + 2,
                color: this.accentColor,
                life: 1.0
            });
        }
    }

    createDoubleJumpEffect() {
        // 二段跳特效
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            this.trailParticles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                size: Math.random() * 4 + 3,
                color: '#ffffff',
                life: 1.0
            });
        }
    }

    update(deltaTime, gameSpeed) {
        // 更新物理
        this.velocityY += this.gravity;
        this.y += this.velocityY;

        // 地面检测
        if (this.y > this.baseY) {
            this.y = this.baseY;
            this.velocityY = 0;
            this.isJumping = false;
            this.doubleJumpsUsed = 0;
            this.canDoubleJump = false;
        }

        // 更新动画帧
        if (this.isRunning) {
            this.runAnimationFrame += this.runSpeed * gameSpeed;
            if (this.runAnimationFrame >= 4) {
                this.runAnimationFrame = 0;
            }
        }

        // 更新无敌时间
        if (this.isInvincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.isInvincible = false;
            }
        }

        // 更新加速效果
        if (this.isSpeedBoosted) {
            this.speedBoostTimer -= deltaTime;
            if (this.speedBoostTimer <= 0) {
                this.isSpeedBoosted = false;
                this.speedMultiplier = 1.0;
            }
        }

        // 更新技能冷却
        if (this.abilityCooldownTimer > 0) {
            this.abilityCooldownTimer -= deltaTime;
        }

        // 更新技能持续时间
        if (this.specialAbilityActive) {
            this.abilityDurationTimer -= deltaTime;
            if (this.abilityDurationTimer <= 0) {
                this.deactivateSpecialAbility();
            }
        }

        // 更新轨迹粒子
        this.updateTrailParticles(deltaTime);
        
        // 更新角色特效粒子
        this.updateParticles(deltaTime);
        
        // 创建奔跑轨迹
        this.trailTimer += deltaTime;
        if (this.trailTimer > 50 && this.isRunning && !this.isJumping) {
            this.createTrailParticle();
            this.trailTimer = 0;
        }
    }

    updateTrailParticles(deltaTime) {
        for (let i = this.trailParticles.length - 1; i >= 0; i--) {
            const particle = this.trailParticles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // 重力
            particle.life -= 0.02;
            
            if (particle.life <= 0) {
                this.trailParticles.splice(i, 1);
            }
        }
    }

    updateParticles(deltaTime) {
        // 角色专属特效
        this.effectTimer += deltaTime;
        
        if (this.specialAbilityActive) {
            this.createAbilityParticles();
        }
    }

    createTrailParticle() {
        if (this.trailParticles.length < this.maxTrailParticles) {
            this.trailParticles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + this.height - 5,
                vx: -gameSpeed * 0.5,
                vy: Math.random() * 2 - 1,
                size: Math.random() * 2 + 1,
                color: this.color,
                life: 0.5 + Math.random() * 0.5
            });
        }
    }

    createAbilityParticles() {
        // 根据角色技能创建不同特效
        switch(this.specialAbility) {
            case 'shadowClone':
                if (this.effectTimer > 100) {
                    this.particles.push({
                        x: this.x + Math.random() * this.width,
                        y: this.y + Math.random() * this.height,
                        size: Math.random() * 10 + 5,
                        color: this.accentColor,
                        life: 0.5
                    });
                    this.effectTimer = 0;
                }
                break;
                
            case 'fireball':
                if (this.effectTimer > 50) {
                    this.particles.push({
                        x: this.x + this.width,
                        y: this.y + this.height / 2,
                        vx: 3,
                        vy: (Math.random() - 0.5) * 2,
                        size: Math.random() * 6 + 4,
                        color: '#ff4500',
                        life: 1.0
                    });
                    this.effectTimer = 0;
                }
                break;
        }
        
        // 更新并移除过期粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            if (p.vx) p.x += p.vx;
            if (p.vy) p.y += p.vy;
            p.life -= 0.02;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // 保存上下文状态
        ctx.save();
        
        // 绘制轨迹粒子
        this.drawTrailParticles(ctx);
        
        // 绘制角色特效粒子
        this.drawAbilityParticles(ctx);
        
        // 无敌状态闪烁效果
        let alpha = 1.0;
        if (this.isInvincible) {
            alpha = (Math.sin(Date.now() / 100) + 1) / 2;
        }
        
        ctx.globalAlpha = alpha;
        
        // 绘制角色主体
        this.drawCharacterBody(ctx);
        
        // 绘制角色细节
        this.drawCharacterDetails(ctx);
        
        // 绘制技能特效
        if (this.specialAbilityActive) {
            this.drawSpecialAbilityEffect(ctx);
        }
        
        // 绘制健康条
        this.drawHealthBar(ctx);
        
        // 绘制状态效果
        this.drawStatusEffects(ctx);
        
        ctx.restore();
    }

    drawCharacterBody(ctx) {
        const animationFrame = Math.floor(this.runAnimationFrame);
        
        // 角色主体（不同姿势）
        ctx.fillStyle = this.color;
        
        if (this.isJumping) {
            // 跳跃姿势
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else {
            // 奔跑姿势
            switch(animationFrame) {
                case 0:
                    // 站立姿势
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                    break;
                case 1:
                    // 奔跑姿势1
                    ctx.fillRect(this.x, this.y + 5, this.width, this.height - 5);
                    break;
                case 2:
                    // 站立姿势
                    ctx.fillRect(this.x, this.y, this.width, this.height);
                    break;
                case 3:
                    // 奔跑姿势2
                    ctx.fillRect(this.x, this.y + 8, this.width, this.height - 8);
                    break;
            }
        }
        
        // 护额
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 10, this.y, 20, 8);
        
        // 护额标志
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 4, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCharacterDetails(ctx) {
        // 眼睛
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 15, this.y + 20, 5, 8);
        ctx.fillRect(this.x + 30, this.y + 20, 5, 8);
        
        // 瞳孔
        ctx.fillStyle = '#000000';
        ctx.fillRect(this.x + 16, this.y + 22, 3, 4);
        ctx.fillRect(this.x + 31, this.y + 22, 3, 4);
        
        // 嘴部
        if (this.isJumping) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x + 20, this.y + 35, 10, 3);
        } else {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x + 22, this.y + 35, 6, 2);
        }
        
        // 服装细节
        ctx.fillStyle = this.accentColor;
        ctx.fillRect(this.x + 5, this.y + this.height - 15, this.width - 10, 10);
    }

    drawTrailParticles(ctx) {
        this.trailParticles.forEach(particle => {
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }

    drawAbilityParticles(ctx) {
        this.particles.forEach(particle => {
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }

    drawSpecialAbilityEffect(ctx) {
        switch(this.specialAbility) {
            case 'shadowClone':
                // 影分身残影效果
                ctx.strokeStyle = this.accentColor;
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.strokeRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
                ctx.setLineDash([]);
                break;
                
            case 'fireball':
                // 火球术火焰效果
                const gradient = ctx.createRadialGradient(
                    this.x + this.width, this.y + this.height / 2,
                    0,
                    this.x + this.width, this.y + this.height / 2,
                    30
                );
                gradient.addColorStop(0, 'rgba(255, 69, 0, 0.8)');
                gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(this.x + this.width - 15, this.y, 30, this.height);
                break;
        }
    }

    drawHealthBar(ctx) {
        const barWidth = 50;
        const barHeight = 6;
        const barX = this.x + this.width / 2 - barWidth / 2;
        const barY = this.y - 15;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // 血量
        const healthWidth = (this.health / this.maxHealth) * barWidth;
        const healthColor = this.health > 50 ? '#4CAF50' : 
                          this.health > 25 ? '#FFC107' : '#F44336';
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, healthWidth, barHeight);
        
        // 边框
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    drawStatusEffects(ctx) {
        const iconSize = 20;
        const iconX = this.x - iconSize - 5;
        let iconY = this.y;
        
        // 加速效果图标
        if (this.isSpeedBoosted) {
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡', iconX + iconSize/2, iconY + iconSize/2);
            
            iconY += iconSize + 5;
        }
        
        // 无敌效果图标
        if (this.isInvincible) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(iconX + iconSize/2, iconY + iconSize/2, iconSize/2, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🛡️', iconX + iconSize/2, iconY + iconSize/2);
        }
    }

    activateSpecialAbility() {
        if (this.abilityCooldownTimer > 0 || this.specialAbilityActive) return false;
        
        this.specialAbilityActive = true;
        this.abilityDurationTimer = this.abilityDuration;
        this.abilityCooldownTimer = this.abilityCooldown;
        
        switch(this.specialAbility) {
            case 'shadowClone':
                this.createShadowClones();
                break;
            case 'fireball':
                this.launchFireball();
                break;
            case 'healing':
                this.heal(30);
                break;
        }
        
        return true;
    }

    deactivateSpecialAbility() {
        this.specialAbilityActive = false;
        this.particles = [];
    }

    createShadowClones() {
        // 创建影分身效果
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: this.x + (Math.random() - 0.5) * 100,
                y: this.y + (Math.random() - 0.5) * 50,
                width: this.width,
                height: this.height,
                alpha: 0.5,
                life: 2.0
            });
        }
    }

    launchFireball() {
        // 创建火球
        this.particles.push({
            x: this.x + this.width,
            y: this.y + this.height / 2,
            vx: 8,
            vy: 0,
            radius: 15,
            color: '#ff4500',
            damage: 20,
            life: 2.0
        });
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        
        // 治疗特效
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.x + this.width / 2,
                y: this.y + this.height / 2,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                size: Math.random() * 4 + 2,
                color: '#4CAF50',
                life: 1.0
            });
        }
    }

    takeDamage(amount) {
        if (this.isInvincible) return false;
        
        this.health = Math.max(0, this.health - amount);
        
        // 受伤特效
        this.createDamageEffect();
        
        // 短暂无敌
        if (this.health > 0) {
            this.isInvincible = true;
            this.invincibleTimer = this.invincibleDuration;
        }
        
        return this.health <= 0;
    }

    createDamageEffect() {
        for (let i = 0; i < 15; i++) {
            this.trailParticles.push({
                x: this.x + Math.random() * this.width,
                y: this.y + Math.random() * this.height,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 3 + 1,
                color: '#ff0000',
                life: 1.0
            });
        }
    }

    applySpeedBoost(multiplier, duration) {
        this.isSpeedBoosted = true;
        this.speedMultiplier = multiplier;
        this.speedBoostTimer = duration;
    }

    getHitbox() {
        // 精确的碰撞箱（比视觉小一些）
        return {
            x: this.x + 5,
            y: this.y + 10,
            width: this.width - 10,
            height: this.height - 15
        };
    }

    changeCharacter(character) {
        if (this.character === character) return false;
        
        if (this.checkUnlockStatus(character)) {
            this.character = character;
            this.loadCharacterStats(character);
            return true;
        }
        return false;
    }

    reset() {
        this.y = this.baseY;
        this.velocityY = 0;
        this.isJumping = false;
        this.doubleJumpsUsed = 0;
        this.canDoubleJump = false;
        this.health = this.maxHealth;
        this.isInvincible = false;
        this.invincibleTimer = 0;
        this.isSpeedBoosted = false;
        this.speedBoostTimer = 0;
        this.speedMultiplier = 1.0;
        this.trailParticles = [];
        this.particles = [];
        this.specialAbilityActive = false;
        this.abilityCooldownTimer = 0;
        this.abilityDurationTimer = 0;
    }
}

export default Player;