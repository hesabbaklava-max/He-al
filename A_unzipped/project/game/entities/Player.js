import { Entity } from './Entity.js';

export class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        this.type = 'player';
        this.radius = 20;
        this.speed = 200;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.maxHunger = 100;
        this.hunger = this.maxHunger;
        this.maxThirst = 100;
        this.thirst = this.maxThirst;
        this.level = 1;
        this.experience = 0;
        this.experienceToNext = 100;
        
        // Movement
        this.velocity = { x: 0, y: 0 };
        this.direction = 0;
        this.isMoving = false;
        
        // Combat
        this.attackDamage = 25;
        this.attackRange = 60;
        this.attackCooldown = 0;
        this.maxAttackCooldown = 1.0;
        
        // Taming
        this.tamingSkill = 1;
        this.tamingRange = 80;
        this.tamedAnimals = [];
        this.maxTamedAnimals = 3;
        
        // Resources
        this.inventory = {
            wood: 0,
            stone: 0,
            meat: 0,
            berry: 0,
            hide: 0,
            bone: 0
        };
        
        // Equipment
        this.weapon = null;
        this.armor = null;
        
        // Animation
        this.animationFrame = 0;
        this.animationSpeed = 8;
        this.lastAnimationUpdate = 0;
        
        // Effects
        this.effects = [];
        this.statusEffects = new Map();
        
        // Nearby objects
        this.nearbyResources = [];
        this.nearbyAnimals = [];
        
        // Stats decay
        this.hungerDecayRate = 5; // per minute
        this.thirstDecayRate = 8; // per minute
        this.lastStatsUpdate = Date.now();
    }
    
    async init() {
        console.log('Player initialized');
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // Update movement
        this.updateMovement(deltaTime);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update stats decay
        this.updateStatsDecay(deltaTime);
        
        // Update status effects
        this.updateStatusEffects(deltaTime);
        
        // Update effects
        this.updateEffects(deltaTime);
        
        // Keep player in world bounds
        this.constrainToWorld();
    }
    
    updateMovement(deltaTime) {
        // Apply velocity
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        
        // Update direction if moving
        if (this.velocity.x !== 0 || this.velocity.y !== 0) {
            this.direction = Math.atan2(this.velocity.y, this.velocity.x);
            this.isMoving = true;
        } else {
            this.isMoving = false;
        }
        
        // Apply friction
        this.velocity.x *= 0.9;
        this.velocity.y *= 0.9;
        
        // Stop if velocity is very small
        if (Math.abs(this.velocity.x) < 1) this.velocity.x = 0;
        if (Math.abs(this.velocity.y) < 1) this.velocity.y = 0;
    }
    
    updateAnimation(deltaTime) {
        this.lastAnimationUpdate += deltaTime;
        
        if (this.lastAnimationUpdate >= 1 / this.animationSpeed) {
            if (this.isMoving) {
                this.animationFrame = (this.animationFrame + 1) % 4;
            } else {
                this.animationFrame = 0;
            }
            this.lastAnimationUpdate = 0;
        }
    }
    
    updateStatsDecay(deltaTime) {
        const now = Date.now();
        const timeDiff = (now - this.lastStatsUpdate) / 1000; // seconds
        
        if (timeDiff >= 1) { // Update every second
            this.hunger -= (this.hungerDecayRate / 60) * timeDiff;
            this.thirst -= (this.thirstDecayRate / 60) * timeDiff;
            
            this.hunger = Math.max(0, this.hunger);
            this.thirst = Math.max(0, this.thirst);
            
            // Health effects from low stats
            if (this.hunger <= 0 || this.thirst <= 0) {
                this.takeDamage(5 * timeDiff);
            }
            
            this.lastStatsUpdate = now;
        }
    }
    
    updateStatusEffects(deltaTime) {
        for (const [effect, data] of this.statusEffects) {
            data.duration -= deltaTime;
            
            if (data.duration <= 0) {
                this.removeStatusEffect(effect);
            } else {
                this.applyStatusEffect(effect, data, deltaTime);
            }
        }
    }
    
    updateEffects(deltaTime) {
        this.effects = this.effects.filter(effect => {
            effect.time += deltaTime;
            return effect.time < effect.duration;
        });
    }
    
    setMovement(direction) {
        const speed = this.getMovementSpeed();
        this.velocity.x = direction.x * speed;
        this.velocity.y = direction.y * speed;
    }
    
    getMovementSpeed() {
        let speed = this.speed;
        
        // Apply status effects
        if (this.statusEffects.has('speed_boost')) {
            speed *= 1.5;
        }
        if (this.statusEffects.has('slow')) {
            speed *= 0.5;
        }
        
        // Apply hunger/thirst penalties
        if (this.hunger < 30) speed *= 0.8;
        if (this.thirst < 30) speed *= 0.8;
        
        return speed;
    }
    
    attack() {
        if (this.attackCooldown > 0) return false;
        
        this.attackCooldown = this.maxAttackCooldown;
        
        // Find targets in range
        const targets = this.nearbyAnimals.filter(animal => {
            if (animal.isTamed && animal.owner === this) return false;
            
            const distance = this.getDistanceTo(animal);
            return distance <= this.attackRange;
        });
        
        // Attack closest target
        if (targets.length > 0) {
            const target = targets.reduce((closest, animal) => {
                const distA = this.getDistanceTo(animal);
                const distB = this.getDistanceTo(closest);
                return distA < distB ? animal : closest;
            });
            
            this.attackTarget(target);
            return true;
        }
        
        return false;
    }
    
    attackTarget(target) {
        const damage = this.getAttackDamage();
        target.takeDamage(damage, this);
        
        // Add attack effect
        this.addEffect('attack', target.x, target.y, { duration: 0.3 });
        
        // Gain experience
        this.gainExperience(5);
        
        // Create damage particles
        this.createDamageParticles(target.x, target.y, damage);
    }
    
    getAttackDamage() {
        let damage = this.attackDamage;
        
        // Apply weapon bonus
        if (this.weapon) {
            damage += this.weapon.damage;
        }
        
        // Apply level bonus
        damage += this.level * 2;
        
        return damage;
    }
    
    attemptTame(animal) {
        if (!animal.canBeTamed || animal.isTamed) return false;
        if (this.tamedAnimals.length >= this.maxTamedAnimals) return false;
        
        const distance = this.getDistanceTo(animal);
        if (distance > this.tamingRange) return false;
        
        // Taming success based on skill and animal difficulty
        const successChance = Math.min(0.8, this.tamingSkill * 0.1 + 0.2);
        const success = Math.random() < successChance;
        
        if (success) {
            this.tameAnimal(animal);
            this.gainExperience(20);
            return true;
        }
        
        return false;
    }
    
    tameAnimal(animal) {
        animal.isTamed = true;
        animal.owner = this;
        animal.tamingProgress = 100;
        this.tamedAnimals.push(animal);
        
        // Add taming effect
        this.addEffect('tame', animal.x, animal.y, { duration: 1.0 });
        
        // Increase taming skill
        this.tamingSkill += 0.1;
    }
    
    addResource(type, amount) {
        if (this.inventory.hasOwnProperty(type)) {
            this.inventory[type] += amount;
            return true;
        }
        return false;
    }
    
    removeResource(type, amount) {
        if (this.inventory.hasOwnProperty(type) && this.inventory[type] >= amount) {
            this.inventory[type] -= amount;
            return true;
        }
        return false;
    }
    
    hasResource(type, amount) {
        return this.inventory.hasOwnProperty(type) && this.inventory[type] >= amount;
    }
    
    consume(item) {
        if (item.type === 'food') {
            this.hunger = Math.min(this.maxHunger, this.hunger + item.hungerRestore);
            this.health = Math.min(this.maxHealth, this.health + item.healthRestore);
        } else if (item.type === 'drink') {
            this.thirst = Math.min(this.maxThirst, this.thirst + item.thirstRestore);
        }
        
        // Apply status effects
        if (item.statusEffects) {
            item.statusEffects.forEach(effect => {
                this.addStatusEffect(effect.type, effect.duration, effect.strength);
            });
        }
    }
    
    takeDamage(amount, source = null) {
        // Apply armor reduction
        if (this.armor) {
            amount *= (1 - this.armor.protection);
        }
        
        this.health -= amount;
        this.health = Math.max(0, this.health);
        
        // Add damage effect
        this.addEffect('damage', this.x, this.y, { 
            duration: 0.5,
            amount: amount
        });
        
        // Create damage particles
        this.createDamageParticles(this.x, this.y, amount, '#ff4757');
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
        
        // Add heal effect
        this.addEffect('heal', this.x, this.y, { 
            duration: 0.5,
            amount: amount
        });
        
        // Create heal particles
        this.createDamageParticles(this.x, this.y, amount, '#2ed573');
    }
    
    die() {
        // Drop some resources
        const dropChance = 0.5;
        Object.keys(this.inventory).forEach(resource => {
            if (Math.random() < dropChance && this.inventory[resource] > 0) {
                const dropAmount = Math.floor(this.inventory[resource] * 0.3);
                // TODO: Create resource drop in world
                this.inventory[resource] -= dropAmount;
            }
        });
        
        // Respawn
        this.respawn();
    }
    
    respawn() {
        this.health = this.maxHealth;
        this.hunger = this.maxHunger * 0.5;
        this.thirst = this.maxThirst * 0.5;
        
        // Reset position to spawn
        this.x = 400;
        this.y = 300;
        
        // Clear status effects
        this.statusEffects.clear();
    }
    
    gainExperience(amount) {
        this.experience += amount;
        
        if (this.experience >= this.experienceToNext) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.experience -= this.experienceToNext;
        this.experienceToNext = Math.floor(this.experienceToNext * 1.2);
        
        // Increase stats
        this.maxHealth += 10;
        this.health = this.maxHealth;
        this.attackDamage += 3;
        this.maxTamedAnimals = Math.min(10, 3 + Math.floor(this.level / 3));
        
        // Add level up effect
        this.addEffect('levelup', this.x, this.y, { duration: 2.0 });
        
        console.log(`Level up! Now level ${this.level}`);
    }
    
    addStatusEffect(type, duration, strength = 1) {
        this.statusEffects.set(type, {
            duration: duration,
            strength: strength,
            startTime: Date.now()
        });
    }
    
    removeStatusEffect(type) {
        this.statusEffects.delete(type);
    }
    
    applyStatusEffect(type, data, deltaTime) {
        switch (type) {
            case 'regeneration':
                this.heal(data.strength * deltaTime);
                break;
            case 'poison':
                this.takeDamage(data.strength * deltaTime);
                break;
            case 'speed_boost':
                // Applied in getMovementSpeed()
                break;
            case 'slow':
                // Applied in getMovementSpeed()
                break;
        }
    }
    
    addEffect(type, x, y, options = {}) {
        this.effects.push({
            type: type,
            x: x,
            y: y,
            time: 0,
            duration: options.duration || 1.0,
            ...options
        });
    }
    
    createDamageParticles(x, y, amount, color = '#ffffff') {
        // Create floating damage text
        this.addEffect('damage_text', x, y, {
            duration: 1.5,
            text: Math.floor(amount).toString(),
            color: color,
            size: 16
        });
        
        // Create particle burst
        for (let i = 0; i < 5; i++) {
            this.addEffect('particle', x, y, {
                duration: 0.8,
                velocity: {
                    x: (Math.random() - 0.5) * 100,
                    y: (Math.random() - 0.5) * 100 - 50
                },
                color: color,
                size: 3
            });
        }
    }
    
    constrainToWorld() {
        const worldWidth = 2000;
        const worldHeight = 2000;
        
        this.x = Math.max(this.radius, Math.min(worldWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(worldHeight - this.radius, this.y));
    }
    
    render(ctx) {
        // Render status effects aura
        this.renderStatusEffects(ctx);
        
        // Render player body
        this.renderBody(ctx);
        
        // Render equipment
        this.renderEquipment(ctx);
        
        // Render health bar
        if (this.health < this.maxHealth) {
            this.renderHealthBar(ctx);
        }
        
        // Render level indicator
        this.renderLevelIndicator(ctx);
        
        // Render effects
        this.renderEffects(ctx);
    }
    
    renderBody(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction);
        
        // Body shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(2, 8, this.radius * 0.8, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, '#4a90e2');
        gradient.addColorStop(0.7, '#357abd');
        gradient.addColorStop(1, '#1e3a8a');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Body outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Face
        this.renderFace(ctx);
        
        // Animation bobbing effect
        if (this.isMoving) {
            const bobOffset = Math.sin(this.animationFrame * Math.PI / 2) * 2;
            ctx.translate(0, bobOffset);
        }
        
        ctx.restore();
    }
    
    renderFace(ctx) {
        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-6, -5, 3, 0, Math.PI * 2);
        ctx.arc(6, -5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-6, -5, 1.5, 0, Math.PI * 2);
        ctx.arc(6, -5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 2, 4, 0, Math.PI);
        ctx.stroke();
    }
    
    renderEquipment(ctx) {
        if (this.weapon) {
            this.renderWeapon(ctx);
        }
        
        if (this.armor) {
            this.renderArmor(ctx);
        }
    }
    
    renderWeapon(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction);
        
        // Simple sword
        ctx.strokeStyle = '#c0c0c0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.radius + 5, 0);
        ctx.lineTo(this.radius + 25, 0);
        ctx.stroke();
        
        // Sword handle
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(this.radius + 5, 0);
        ctx.lineTo(this.radius + 15, 0);
        ctx.stroke();
        
        ctx.restore();
    }
    
    renderArmor(ctx) {
        // Render armor overlay on body
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore();
    }
    
    renderHealthBar(ctx) {
        const barWidth = this.radius * 2;
        const barHeight = 6;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 15;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.6 ? '#2ed573' : 
                           healthPercent > 0.3 ? '#ffa502' : '#ff4757';
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    renderLevelIndicator(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y - this.radius - 25);
        
        // Level background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Level border
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Level text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.level.toString(), 0, 0);
        
        ctx.restore();
    }
    
    renderStatusEffects(ctx) {
        let effectIndex = 0;
        
        for (const [effect, data] of this.statusEffects) {
            const alpha = Math.min(1, data.duration);
            ctx.globalAlpha = alpha;
            
            switch (effect) {
                case 'speed_boost':
                    this.renderSpeedBoostEffect(ctx);
                    break;
                case 'regeneration':
                    this.renderRegenerationEffect(ctx);
                    break;
                case 'poison':
                    this.renderPoisonEffect(ctx);
                    break;
            }
            
            effectIndex++;
        }
        
        ctx.globalAlpha = 1.0;
    }
    
    renderSpeedBoostEffect(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const time = Date.now() * 0.01;
        ctx.strokeStyle = '#00d2d3';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = time;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore();
    }
    
    renderRegenerationEffect(ctx) {
        const time = Date.now() * 0.005;
        
        for (let i = 0; i < 3; i++) {
            const angle = time + (i * Math.PI * 2 / 3);
            const x = this.x + Math.cos(angle) * (this.radius + 15);
            const y = this.y + Math.sin(angle) * (this.radius + 15);
            
            ctx.fillStyle = '#2ed573';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderPoisonEffect(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    renderEffects(ctx) {
        this.effects.forEach(effect => {
            const progress = effect.time / effect.duration;
            const alpha = 1 - progress;
            
            ctx.globalAlpha = alpha;
            
            switch (effect.type) {
                case 'damage_text':
                    this.renderDamageText(ctx, effect, progress);
                    break;
                case 'particle':
                    this.renderParticle(ctx, effect, progress);
                    break;
                case 'levelup':
                    this.renderLevelUpEffect(ctx, effect, progress);
                    break;
            }
        });
        
        ctx.globalAlpha = 1.0;
    }
    
    renderDamageText(ctx, effect, progress) {
        const y = effect.y - progress * 50;
        
        ctx.fillStyle = effect.color;
        ctx.font = `bold ${effect.size}px Orbitron`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(effect.text, effect.x, y);
    }
    
    renderParticle(ctx, effect, progress) {
        const x = effect.x + effect.velocity.x * effect.time;
        const y = effect.y + effect.velocity.y * effect.time;
        
        ctx.fillStyle = effect.color;
        ctx.beginPath();
        ctx.arc(x, y, effect.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderLevelUpEffect(ctx, effect, progress) {
        const radius = 30 + progress * 50;
        
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.lineDashOffset = progress * 20;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Sparkles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + progress * Math.PI;
            const sparkleX = effect.x + Math.cos(angle) * radius;
            const sparkleY = effect.y + Math.sin(angle) * radius;
            
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}