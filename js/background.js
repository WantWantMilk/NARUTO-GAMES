// 背景管理器
class Background {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 多层背景实现视差效果
        this.layers = [
            {
                image: this.createSkyLayer(),
                speed: 0.1,
                y: 0
            },
            {
                image: this.createDistantMountainsLayer(),
                speed: 0.3,
                y: 0
            },
            {
                image: this.createNearMountainsLayer(),
                speed: 0.5,
                y: 0
            },
            {
                image: this.createRoofLayer(),
                speed: 1.0,
                y: 0
            },
            {
                image: this.createGroundLayer(),
                speed: 1.2,
                y: 0
            }
        ];

        // 云朵系统
        this.clouds = [];
        this.cloudSpawnTimer = 0;
        this.maxClouds = 5;

        // 星星系统（夜晚效果）
        this.stars = [];
        this.createStars(50);

        // 天气效果
        this.weather = {
            particles: [],
            type: 'none', // none, rain, leaves
            intensity: 0
        };

        this.init();
    }

    init() {
        // 创建云朵
        for (let i = 0; i < 3; i++) {
            this.createCloud();
        }
    }

    createSkyLayer() {
        const { canvas, ctx } = GameUtils.createCanvas(this.canvas.width, this.canvas.height);
        
        // 渐变天空
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 添加一些微弱的星星
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height * 0.5;
            const size = Math.random() * 2;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        return canvas;
    }

    createDistantMountainsLayer() {
        const { canvas, ctx } = GameUtils.createCanvas(this.canvas.width, this.canvas.height);
        
        // 远处的山脉
        const gradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(30, 30, 60, 0.7)');
        gradient.addColorStop(1, 'rgba(30, 30, 60, 0)');
        
        ctx.fillStyle = gradient;
        
        for (let i = 0; i < 5; i++) {
            const x = i * (canvas.width / 4);
            const height = canvas.height * 0.3 * (0.5 + Math.random() * 0.5);
            
            ctx.beginPath();
            ctx.moveTo(x, canvas.height);
            ctx.bezierCurveTo(
                x + 50, canvas.height - height * 0.8,
                x + 100, canvas.height - height,
                x + 200, canvas.height - height * 0.7
            );
            ctx.lineTo(x + 200, canvas.height);
            ctx.closePath();
            ctx.fill();
        }

        return canvas;
    }

    createNearMountainsLayer() {
        const { canvas, ctx } = GameUtils.createCanvas(this.canvas.width, this.canvas.height);
        
        // 近处的山脉
        const gradient = ctx.createLinearGradient(0, canvas.height * 0.7, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(40, 40, 80, 0.9)');
        gradient.addColorStop(1, 'rgba(40, 40, 80, 0)');
        
        ctx.fillStyle = gradient;
        
        for (let i = 0; i < 4; i++) {
            const x = i * (canvas.width / 3);
            const height = canvas.height * 0.4 * (0.6 + Math.random() * 0.4);
            
            ctx.beginPath();
            ctx.moveTo(x - 50, canvas.height);
            ctx.bezierCurveTo(
                x, canvas.height - height * 0.6,
                x + 100, canvas.height - height,
                x + 250, canvas.height - height * 0.5
            );
            ctx.lineTo(x + 250, canvas.height);
            ctx.closePath();
            ctx.fill();
        }

        return canvas;
    }

    createRoofLayer() {
        const { canvas, ctx } = GameUtils.createCanvas(this.canvas.width * 2, this.canvas.height);
        const roofHeight = 150;
        const groundY = canvas.height - 100;

        // 屋顶颜色
        ctx.fillStyle = '#2a1b3a';
        
        // 绘制连续的屋顶
        for (let x = 0; x < canvas.width * 2; x += 300) {
            // 屋顶主体
            ctx.fillRect(x, groundY - roofHeight, 250, roofHeight);
            
            // 屋顶瓦片效果
            ctx.fillStyle = '#3a2b4a';
            for (let i = 0; i < 250; i += 20) {
                ctx.fillRect(x + i, groundY - roofHeight, 15, 10);
            }
            ctx.fillStyle = '#2a1b3a';
            
            // 屋檐
            ctx.fillStyle = '#4a3b5a';
            ctx.fillRect(x, groundY - 20, 250, 20);
            ctx.fillStyle = '#2a1b3a';
            
            // 窗户
            ctx.fillStyle = '#ffcc00';
            for (let i = 0; i < 4; i++) {
                const windowX = x + 30 + i * 50;
                const windowY = groundY - roofHeight + 40;
                ctx.fillRect(windowX, windowY, 15, 20);
                ctx.fillStyle = '#000';
                ctx.fillRect(windowX + 3, windowY + 3, 9, 14);
                ctx.fillStyle = '#ffcc00';
            }
        }

        return canvas;
    }

    createGroundLayer() {
        const { canvas, ctx } = GameUtils.createCanvas(this.canvas.width * 2, this.canvas.height);
        const groundY = canvas.height - 100;

        // 地面
        const groundGradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
        groundGradient.addColorStop(0, '#1a5a1a');
        groundGradient.addColorStop(1, '#0a3a0a');
        
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, groundY, canvas.width * 2, canvas.height - groundY);

        // 地面纹理
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width * 2;
            const y = groundY + Math.random() * (canvas.height - groundY);
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        return canvas;
    }

    createCloud() {
        const cloud = {
            x: this.canvas.width + Math.random() * 200,
            y: Math.random() * this.canvas.height * 0.4 + 50,
            width: 80 + Math.random() * 120,
            height: 40 + Math.random() * 60,
            speed: 0.5 + Math.random() * 1.5,
            opacity: 0.3 + Math.random() * 0.4,
            color: `rgba(255, 255, 255, ${0.3 + Math.random() * 0.3})`
        };
        this.clouds.push(cloud);
    }

    createStars(count) {
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height * 0.6,
                size: Math.random() * 1.5,
                brightness: 0.2 + Math.random() * 0.8,
                twinkleSpeed: 0.5 + Math.random() * 2
            });
        }
    }

    update(deltaTime, gameSpeed) {
        const speedFactor = gameSpeed / 5;
        
        // 更新背景层
        this.layers.forEach(layer => {
            layer.x = (layer.x - layer.speed * speedFactor) % layer.image.width;
        });

        // 更新云朵
        this.clouds = this.clouds.filter(cloud => {
            cloud.x -= cloud.speed * speedFactor;
            return cloud.x + cloud.width > 0;
        });

        // 生成新云朵
        this.cloudSpawnTimer += deltaTime;
        if (this.cloudSpawnTimer > 2000 && this.clouds.length < this.maxClouds) {
            this.createCloud();
            this.cloudSpawnTimer = 0;
        }

        // 更新星星闪烁
        const now = Date.now() / 1000;
        this.stars.forEach(star => {
            star.brightness = 0.2 + 0.8 * Math.abs(Math.sin(now * star.twinkleSpeed));
        });

        // 更新天气效果
        if (this.weather.type !== 'none') {
            this.updateWeather(deltaTime, speedFactor);
        }
    }

    updateWeather(deltaTime, speedFactor) {
        // 移除超出屏幕的粒子
        this.weather.particles = this.weather.particles.filter(p => p.y < this.canvas.height);

        // 生成新粒子
        const spawnRate = this.weather.intensity * 0.1;
        if (Math.random() < spawnRate) {
            this.createWeatherParticle();
        }

        // 更新现有粒子
        this.weather.particles.forEach(particle => {
            particle.x += particle.vx * speedFactor;
            particle.y += particle.vy * speedFactor;
            particle.vy += 0.1; // 重力
            particle.life -= 0.01;
        });
    }

    createWeatherParticle() {
        const types = {
            rain: {
                color: 'rgba(100, 150, 255, 0.6)',
                vx: -2,
                vy: 5,
                size: 2
            },
            leaves: {
                color: `rgba(${GameUtils.randomInt(100, 200)}, ${GameUtils.randomInt(50, 100)}, 0, 0.8)`,
                vx: -1 + Math.random() * 2,
                vy: 1 + Math.random() * 2,
                size: 4 + Math.random() * 8
            }
        };

        const config = types[this.weather.type];
        if (!config) return;

        this.weather.particles.push({
            x: this.canvas.width + Math.random() * 100,
            y: Math.random() * this.canvas.height * 0.5,
            vx: config.vx + Math.random() * 2 - 1,
            vy: config.vy + Math.random() * 2 - 1,
            size: config.size,
            color: config.color,
            life: 1
        });
    }

    draw(ctx) {
        // 清除画布
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制背景层
        this.layers.forEach(layer => {
            // 绘制第一部分
            ctx.drawImage(
                layer.image,
                layer.x, 0,
                this.canvas.width, this.canvas.height,
                0, 0,
                this.canvas.width, this.canvas.height
            );
            
            // 绘制第二部分（无缝衔接）
            ctx.drawImage(
                layer.image,
                layer.x + layer.image.width, 0,
                this.canvas.width, this.canvas.height,
                0, 0,
                this.canvas.width, this.canvas.height
            );
        });

        // 绘制星星
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.stars.forEach(star => {
            ctx.globalAlpha = star.brightness;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // 绘制云朵
        this.clouds.forEach(cloud => {
            ctx.fillStyle = cloud.color;
            ctx.globalAlpha = cloud.opacity;
            
            // 绘制云朵（多个圆形组成）
            const segments = 5;
            for (let i = 0; i < segments; i++) {
                const segmentX = cloud.x + (i / (segments - 1)) * cloud.width * 0.8;
                const segmentY = cloud.y + Math.sin(i * 0.8) * 10;
                const segmentSize = cloud.height * (0.6 + Math.sin(i * 0.5) * 0.4);
                
                ctx.beginPath();
                ctx.arc(segmentX, segmentY, segmentSize, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.globalAlpha = 1;

        // 绘制天气效果
        if (this.weather.type !== 'none') {
            this.weather.particles.forEach(particle => {
                ctx.globalAlpha = particle.life;
                ctx.fillStyle = particle.color;
                
                if (this.weather.type === 'rain') {
                    // 雨滴
                    ctx.fillRect(particle.x, particle.y, 1, particle.size * 2);
                } else {
                    // 树叶
                    ctx.beginPath();
                    ctx.ellipse(particle.x, particle.y, particle.size, particle.size * 0.7, Math.PI / 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.globalAlpha = 1;
        }

        // 绘制地面细节
        this.drawGroundDetails(ctx);
    }

    drawGroundDetails(ctx) {
        const groundY = this.canvas.height - 100;
        
        // 绘制一些草
        ctx.fillStyle = '#2a8b2a';
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * this.canvas.width;
            if (x % 50 < 30) {
                ctx.fillRect(x, groundY - 10, 2, 10 + Math.random() * 10);
            }
        }

        // 绘制路径标记
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 10]);
        ctx.beginPath();
        ctx.moveTo(0, groundY - 60);
        ctx.lineTo(this.canvas.width, groundY - 60);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    setWeather(type, intensity = 1) {
        this.weather.type = type;
        this.weather.intensity = GameUtils.clamp(intensity, 0, 1);
        this.weather.particles = [];
    }

    resize(newWidth, newHeight) {
        this.canvas.width = newWidth;
        this.canvas.height = newHeight;
        
        // 重新创建所有图层
        this.layers = [
            {
                image: this.createSkyLayer(),
                speed: 0.1,
                x: 0
            },
            {
                image: this.createDistantMountainsLayer(),
                speed: 0.3,
                x: 0
            },
            {
                image: this.createNearMountainsLayer(),
                speed: 0.5,
                x: 0
            },
            {
                image: this.createRoofLayer(),
                speed: 1.0,
                x: 0
            },
            {
                image: this.createGroundLayer(),
                speed: 1.2,
                x: 0
            }
        ];
        
        // 重新创建星星
        this.stars = [];
        this.createStars(50);
        
        // 重置云朵
        this.clouds = [];
        this.init();
    }
}

export default Background;