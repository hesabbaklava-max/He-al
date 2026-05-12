import { Entity } from './Entity.js';

export class Animal extends Entity {
    constructor(x, y, type) {
        super(x, y);
        this.type = type;
        this.animalType = type;
        
        // Set properties based on animal type
        this.setAnimalProperties();
        
        // AI and behavior
        this.aiState = 'wandering';
        this.target = null;
        this.lastStateChange = Date.now();
        this.stateTimer = 0;
        this.wanderDirection = Math.random() * Math.PI * 2;
        this.wanderTimer = 0;
        
        // Taming
        this.isTamed = false;
        this.canBeTamed = true;
        this.tamingProgress = 0;
        this.tamingDifficulty = 1;
        this.owner = null;
        this.loyalty = 0;
        this.maxLoyalty = 100;
        
        // Combat
        this.attackDamage = 15;
        this.attackRange = 40;
        this.attackCooldown = 0;
        this.maxAttackCooldown = 2.0;
        this.aggroRange = 100;
        this.isAggressive = false;
        
        // Movement
        this.velocity = { x: 0, y: 0 };
        this.direction = 0;
        this.isMoving = false;
        
        // Animation
        this.animationFrame = 0;
        this.animationSpeed = 6;
        this.lastAnimationUpdate = 0;
        
        // Special abilities
        this.abilities = [];
        this.abilityTimers = new Map();
        
        // Drops
        this.drops = [];
        
        // Visual effects
        this.effects = [];
        this.statusEffects = new Map();
    }
    
    setAnimalProperties() {
        switch (this.animalType) {
            case 'wolf':
                this.maxHealth = 80;
                this.health = this.maxHealth;
                this.speed = 120;
                this.attackDamage = 25;
                this.tamingDifficulty = 3;
                this.isAggressive = true;
                this.aggroRange = 150;
                this.radius = 18;
                this.abilities = ['pack_hunt', 'howl'];
                this.drops = [
                    { type: 'meat', amount: 3, chance: 1.0 },
                    { type: 'hide', amount: 2, chance: 0.8 }
                ];
                break;
                
            case 'bear':
                this.maxHealth = 150;
                this.health = this.maxHealth;
                this.speed = 80;
                this.attackDamage = 40;
                this.tamingDifficulty = 5;
                this.isAggressive = true;
                this.aggroRange = 120;
                this.radius = 25;
                this.abilities = ['charge', 'roar'];
                this.drops = [
                    { type: 'meat', amount: 5, chance: 1.0 },
                    { type: 'hide', amount: 4, chance: 1.0 },
                    { type: 'bone', amount: 2, chance: 0.6 }
                ];
                break;
                
            case 'rabbit':
                this.maxHealth = 30;
                this.health = this.maxHealth;
                this.speed = 180;
                this.attackDamage = 5;
                this.tamingDifficulty = 1;
                this.isAggressive = false;
                this.aggroRange = 80;
                this.radius = 12;
                this.abilities = ['quick_escape'];
                this.drops = [
                    { type: 'meat', amount: 1, chance: 1.0 },
                    { type: 'hide', amount: 1, chance: 0.5 }
                ];
                break;
                
            case 'deer':
                this.maxHealth = 60;
                this.health = this.maxHealth;
                this.speed = 150;
                this.attackDamage = 10;
                this.tamingDifficulty = 2;
                this.isAggressive = false;
                this.aggroRange = 100;
                this.radius = 20;
                this.abilities = ['leap'];
                this.drops = [
                    { type: 'meat', amount: 3, chance: 1.0 },
                    { type: 'hide', amount: 2, chance: 0.7 }
                ];
                break;
                
            case 'boar':
                this.maxHealth = 100;
                this.health = this.maxHealth;
                this.speed = 100;
                this.attackDamage = 30;
                this.tamingDifficulty = 4;
                this.isAggressive = true;
                this.aggroRange = 90;
                this.radius = 22;
                this.abilities = ['charge'];
                this.drops = [
                    { type: 'meat', amount: 4, chance: 1.0 },
                    { type: 'hide', amount: 3, chance: 0.9 }
                ];
                break;
                
            default:
                // Default small animal
                this.maxHealth = 50;
                this.health = this.maxHealth;
                this.speed = 100;
                this.attackDamage = 10;
                this.tamingDifficulty = 2;
                this.radius = 15;
        }
    }
    
    update(deltaTime) {
        super.update(deltaTime);
        
        // Update cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        
        // Update ability timers
        for (const [ability, timer] of this.abilityTimers) {
            this.abilityTimers.set(ability, timer - deltaTime);
        }
        
        // Update AI
        this.updateAI(deltaTime);
        
        // Update movement
        this.updateMovement(deltaTime);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Update status effects
        this.updateStatusEffects(deltaTime);
        
        // Update effects
        this.updateEffects(deltaTime);
        
        // Keep in world bounds
        this.constrainToWorld();
    }
    
    updateAI(deltaTime) {
        this.stateTimer += deltaTime;
        
        if (this.isTamed && this.owner) {
            this.updateTamedBehavior(deltaTime);
        } else {
            this.updateWildBehavior(deltaTime);
        }
    }
    
    updateTamedBehavior(deltaTime) {
        const distanceToOwner = this.getDistanceTo(this.owner);
        
        if (distanceToOwner > 200) {
            // Follow owner if too far
            this.aiState = 'following';
            this.target = this.owner;
        } else if (this.owner.nearbyAnimals && this.owner.nearbyAnimals.length > 0) {
            // Defend owner
            const threats = this.owner.nearbyAnimals.filter(animal => 
                !animal.isTamed && animal.isAggressive && 
                animal.getDistanceTo(this.owner) < 100
            );
            
            if (threats.length > 0) {
                this.aiState = 'defending';
                this.target = threats[0];
            }
        } else if (distanceToOwner > 50) {
            // Stay near owner
            this.aiState = 'following';
            this.target = this.owner;
        } else {
            // Idle near owner
            this.aiState = 'idle';
            this.target = null;
        }
        
        // Increase loyalty over time
        this.loyalty = Math.min(this.maxLoyalty, this.loyalty + deltaTime * 2);
    }
    
    updateWildBehavior(deltaTime) {
        // Check for nearby threats or targets
        const nearbyEntities = this.findNearbyEntities();
        
        if (this.isAggressive) {
            const player = nearbyEntities.find(e => e.type === 'player');
            if (player && this.getDistanceTo(player) < this.aggroRange) {
                this.aiState = 'attacking';
                this.target = player;
                return;
            }
        } else {
            // Flee from threats
            const threats = nearbyEntities.filter(e => 
                (e.type === 'player' || (e.type !== this.animalType && e.isAggressive)) &&
                this.getDistanceTo(e) < this.aggroRange
            );
            
            if (threats.length > 0) {
                this.aiState = 'fleeing';
                this.target = threats[0];
                return;
            }
        }
        
        // Default wandering behavior
        if (this.aiState !== 'wandering' || this.stateTimer > 5) {
            this.aiState = 'wandering';
            this.wanderDirection = Math.random() * Math.PI * 2;
            this.stateTimer = 0;
        }
    }
    
    updateMovement(deltaTime) {
        let targetVelocity = { x: 0, y: 0 };
        
        switch (this.aiState) {
            case 'following':
                if (this.target) {
                    const distance = this.getDistanceTo(this.target);
                    if (distance > 30) {
                        const angle = this.getAngleTo(this.target);
                        targetVelocity.x = Math.cos(angle) * this.speed;
                        targetVelocity.y = Math.sin(angle) * this.speed;
                    }
                }
                break;
                
            case 'attacking':
                if (this.target) {
                    const distance = this.getDistanceTo(this.target);
                    if (distance > this.attackRange) {
                        const angle = this.getAngleTo(this.target);
                        targetVelocity.x = Math.cos(angle) * this.speed;
                        targetVelocity.y = Math.sin(angle) * this.speed;
                    } else {
                        this.attemptAttack();
                    }
                }
                break;
                
            case 'fleeing':
                if (this.target) {
                    const angle = this.getAngleTo(this.target) + Math.PI; // Opposite direction
                    targetVelocity.x = Math.cos(angle) * this.speed * 1.2;
                    targetVelocity.y = Math.sin(angle) * this.speed * 1.2;
                }
                break;
                
            case 'wandering':
                this.wanderTimer += deltaTime;
                if (this.wanderTimer > 2) {
                    this.wanderDirection += (Math.random() - 0.5) * 0.5;
                    this.wanderTimer = 0;
                }
                
                targetVelocity.x = Math.cos(this.wanderDirection) * this.speed * 0.3;
                targetVelocity.y = Math.sin(this.wanderDirection) * this.speed * 0.3;
                break;
        }
        
        // Apply movement with smoothing
        this.velocity.x += (targetVelocity.x - this.velocity.x) * deltaTime * 5;
        this.velocity.y += (targetVelocity.y - this.velocity.y) * deltaTime * 5;
        
        // Apply velocity
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        
        // Update direction and movement state
        if (Math.abs(this.velocity.x) > 10 || Math.abs(this.velocity.y) > 10) {
            this.direction = Math.atan2(this.velocity.y, this.velocity.x);
            this.isMoving = true;
        } else {
            this.isMoving = false;
        }
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
    
    updateStatusEffects(deltaTime) {
        for (const [effect, data] of this.statusEffects) {
            data.duration -= deltaTime;
            
            if (data.duration <= 0) {
                this.statusEffects.delete(effect);
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
    
    findNearbyEntities() {
        // This would be implemented by the game system
        // For now, return empty array
        return [];
    }
    
    attemptAttack() {
        if (this.attackCooldown > 0 || !this.target) return;
        
        const distance = this.getDistanceTo(this.target);
        if (distance <= this.attackRange) {
            this.target.takeDamage(this.attackDamage, this);
            this.attackCooldown = this.maxAttackCooldown;
            
            // Add attack effect
            this.addEffect('attack', this.target.x, this.target.y, { duration: 0.3 });
        }
    }
    
    useAbility(abilityName) {
        if (!this.abilities.includes(abilityName)) return false;
        if (this.abilityTimers.has(abilityName) && this.abilityTimers.get(abilityName) > 0) return false;
        
        switch (abilityName) {
            case 'howl':
                this.howl();
                this.abilityTimers.set(abilityName, 30);
                break;
            case 'charge':
                this.charge();
                this.abilityTimers.set(abilityName, 15);
                break;
            case 'quick_escape':
                this.quickEscape();
                this.abilityTimers.set(abilityName, 10);
                break;
            case 'leap':
                this.leap();
                this.abilityTimers.set(abilityName, 8);
                break;
            case 'roar':
                this.roar();
                this.abilityTimers.set(abilityName, 25);
                break;
        }
        
        return true;
    }
    
    howl() {
        // Buff nearby allied animals
        this.addEffect('howl', this.x, this.y, { duration: 2.0 });
        // TODO: Find nearby allied animals and buff them
    }
    
    charge() {
        if (this.target) {
            const angle = this.getAngleTo(this.target);
            this.velocity.x = Math.cos(angle) * this.speed * 3;
            this.velocity.y = Math.sin(angle) * this.speed * 3;
            this.addStatusEffect('charging', 1.0);
        }
    }
    
    quickEscape() {
        // Temporary speed boost and invulnerability
        this.addStatusEffect('speed_boost', 3.0, 2.0);
        this.addStatusEffect('invulnerable', 1.0);
    }
    
    leap() {
        if (this.target) {
            // Leap towards or away from target
            const angle = this.aiState === 'fleeing' ? 
                this.getAngleTo(this.target) + Math.PI : 
                this.getAngleTo(this.target);
            
            this.velocity.x = Math.cos(angle) * this.speed * 2;
            this.velocity.y = Math.sin(angle) * this.speed * 2;
        }
    }
    
    roar() {
        // Fear effect on nearby enemies
        this.addEffect('roar', this.x, this.y, { duration: 1.5 });
        // TODO: Apply fear effect to nearby enemies
    }
    
    takeDamage(amount, source = null) {
        // Check for invulnerability
        if (this.statusEffects.has('invulnerable')) return;
        
        super.takeDamage(amount, source);
        
        // Add damage effect
        this.addEffect('damage', this.x, this.y, { 
            duration: 0.5,
            amount: amount
        });
        
        // Reduce loyalty if tamed and damaged by owner
        if (this.isTamed && source === this.owner) {
            this.loyalty -= 10;
            if (this.loyalty <= 0) {
                this.untame();
            }
        }
        
        // Become aggressive if attacked
        if (!this.isTamed && source && source.type === 'player') {
            this.isAggressive = true;
            this.aiState = 'attacking';
            this.target = source;
        }
    }
    
    die() {
        super.die();
        
        // Drop resources
        this.dropResources();
        
        // Add death effect
        this.addEffect('death', this.x, this.y, { duration: 2.0 });
    }
    
    dropResources() {
        this.drops.forEach(drop => {
            if (Math.random() < drop.chance) {
                // TODO: Create resource drop in world
                console.log(`Dropped ${drop.amount} ${drop.type}`);
            }
        });
    }
    
    untame() {
        this.isTamed = false;
        this.owner = null;
        this.loyalty = 0;
        this.aiState = 'wandering';
        this.target = null;
    }
    
    addStatusEffect(type, duration, strength = 1) {
        this.statusEffects.set(type, {
            duration: duration,
            strength: strength,
            startTime: Date.now()
        });
    }
    
    applyStatusEffect(type, data, deltaTime) {
        switch (type) {
            case 'speed_boost':
                // Applied in movement calculation
                break;
            case 'charging':
                // Visual effect during charge
                break;
            case 'invulnerable':
                // Handled in takeDamage
                break;
            case 'fear':
                // Force fleeing behavior
                this.aiState = 'fleeing';
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
    
    constrainToWorld() {
        const worldWidth = 2000;
        const worldHeight = 2000;
        
        this.x = Math.max(this.radius, Math.min(worldWidth - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(worldHeight - this.radius, this.y));
    }
    
    render(ctx) {
        // Render status effects aura
        this.renderStatusEffects(ctx);
        
        // Render animal body
        this.renderBody(ctx);
        
        // Render health bar if damaged or tamed
        if (this.health < this.maxHealth || this.isTamed) {
            this.renderHealthBar(ctx);
        }
        
        // Render taming progress
        if (this.tamingProgress > 0 && this.tamingProgress < 100) {
            this.renderTamingBar(ctx);
        }
        
        // Render loyalty indicator if tamed
        if (this.isTamed) {
            this.renderLoyaltyIndicator(ctx);
        }
        
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
        ctx.ellipse(2, 6, this.radius * 0.8, this.radius * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Render based on animal type
        switch (this.animalType) {
            case 'wolf':
                this.renderWolf(ctx);
                break;
            case 'bear':
                this.renderBear(ctx);
                break;
            case 'rabbit':
                this.renderRabbit(ctx);
                break;
            case 'deer':
                this.renderDeer(ctx);
                break;
            case 'boar':
                this.renderBoar(ctx);
                break;
            default:
                this.renderGenericAnimal(ctx);
        }
        
        ctx.restore();
    }
    
    renderWolf(ctx) {
        // Body
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, '#8b8b8b');
        gradient.addColorStop(0.7, '#696969');
        gradient.addColorStop(1, '#2f2f2f');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.fillStyle = '#2f2f2f';
        ctx.beginPath();
        ctx.moveTo(-8, -this.radius);
        ctx.lineTo(-12, -this.radius - 8);
        ctx.lineTo(-4, -this.radius - 5);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(8, -this.radius);
        ctx.lineTo(12, -this.radius - 8);
        ctx.lineTo(4, -this.radius - 5);
        ctx.closePath();
        ctx.fill();
        
        // Snout
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.ellipse(0, this.radius - 5, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#ff4500';
        ctx.beginPath();
        ctx.arc(-5, -3, 2, 0, Math.PI * 2);
        ctx.arc(5, -3, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Tail
        if (this.isTamed) {
            ctx.strokeStyle = '#696969';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(-this.radius, 0, 8, -Math.PI/4, Math.PI/4);
            ctx.stroke();
        }
    }
    
    renderBear(ctx) {
        // Body
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, '#8b4513');
        gradient.addColorStop(0.7, '#654321');
        gradient.addColorStop(1, '#3e2723');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.arc(-10, -this.radius + 5, 6, 0, Math.PI * 2);
        ctx.arc(10, -this.radius + 5, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Snout
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.ellipse(0, this.radius - 8, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-6, -5, 3, 0, Math.PI * 2);
        ctx.arc(6, -5, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderRabbit(ctx) {
        // Body
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, '#f5f5dc');
        gradient.addColorStop(0.7, '#deb887');
        gradient.addColorStop(1, '#d2b48c');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Long ears
        ctx.fillStyle = '#deb887';
        ctx.beginPath();
        ctx.ellipse(-6, -this.radius - 5, 3, 12, -0.3, 0, Math.PI * 2);
        ctx.ellipse(6, -this.radius - 5, 3, 12, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-4, -2, 2, 0, Math.PI * 2);
        ctx.arc(4, -2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose
        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        ctx.arc(0, 2, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Tail
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-this.radius + 2, 0, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderDeer(ctx) {
        // Body
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, '#deb887');
        gradient.addColorStop(0.7, '#cd853f');
        gradient.addColorStop(1, '#a0522d');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Antlers (if not tamed or male)
        if (!this.isTamed || Math.random() > 0.5) {
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-8, -this.radius);
            ctx.lineTo(-12, -this.radius - 10);
            ctx.moveTo(-10, -this.radius - 5);
            ctx.lineTo(-15, -this.radius - 8);
            
            ctx.moveTo(8, -this.radius);
            ctx.lineTo(12, -this.radius - 10);
            ctx.moveTo(10, -this.radius - 5);
            ctx.lineTo(15, -this.radius - 8);
            ctx.stroke();
        }
        
        // Ears
        ctx.fillStyle = '#a0522d';
        ctx.beginPath();
        ctx.arc(-8, -this.radius + 3, 4, 0, Math.PI * 2);
        ctx.arc(8, -this.radius + 3, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-5, -3, 2, 0, Math.PI * 2);
        ctx.arc(5, -3, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderBoar(ctx) {
        // Body
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, '#8b4513');
        gradient.addColorStop(0.7, '#654321');
        gradient.addColorStop(1, '#2f1b14');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Tusks
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-3, this.radius - 3, 2, 6, 0.3, 0, Math.PI * 2);
        ctx.ellipse(3, this.radius - 3, 2, 6, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Snout
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.ellipse(0, this.radius - 5, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(-6, -4, 2, 0, Math.PI * 2);
        ctx.arc(6, -4, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderGenericAnimal(ctx) {
        // Default animal appearance
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, '#deb887');
        gradient.addColorStop(0.7, '#cd853f');
        gradient.addColorStop(1, '#8b7355');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Simple eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(-5, -3, 2, 0, Math.PI * 2);
        ctx.arc(5, -3, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderHealthBar(ctx) {
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 12;
        
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
    
    renderTamingBar(ctx) {
        const barWidth = this.radius * 2;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.radius - 20;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Taming progress
        const tamingPercent = this.tamingProgress / 100;
        ctx.fillStyle = '#5f27cd';
        ctx.fillRect(barX, barY, barWidth * tamingPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    renderLoyaltyIndicator(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y - this.radius - 25);
        
        // Heart background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Heart
        const loyaltyPercent = this.loyalty / this.maxLoyalty;
        const heartColor = loyaltyPercent > 0.7 ? '#ff69b4' : 
                          loyaltyPercent > 0.4 ? '#ffa502' : '#ff4757';
        
        ctx.fillStyle = heartColor;
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♥', 0, 0);
        
        ctx.restore();
    }
    
    renderStatusEffects(ctx) {
        for (const [effect, data] of this.statusEffects) {
            const alpha = Math.min(1, data.duration);
            ctx.globalAlpha = alpha;
            
            switch (effect) {
                case 'speed_boost':
                    this.renderSpeedBoostEffect(ctx);
                    break;
                case 'charging':
                    this.renderChargingEffect(ctx);
                    break;
                case 'invulnerable':
                    this.renderInvulnerableEffect(ctx);
                    break;
                case 'fear':
                    this.renderFearEffect(ctx);
                    break;
            }
        }
        
        ctx.globalAlpha = 1.0;
    }
    
    renderSpeedBoostEffect(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const time = Date.now() * 0.01;
        ctx.strokeStyle = '#00d2d3';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.lineDashOffset = time;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore();
    }
    
    renderChargingEffect(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    renderInvulnerableEffect(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        const time = Date.now() * 0.02;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = time;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.restore();
    }
    
    renderFearEffect(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.fillStyle = 'rgba(139, 69, 19, 0.4)';
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
                case 'attack':
                    this.renderAttackEffect(ctx, effect, progress);
                    break;
                case 'howl':
                    this.renderHowlEffect(ctx, effect, progress);
                    break;
                case 'roar':
                    this.renderRoarEffect(ctx, effect, progress);
                    break;
                case 'death':
                    this.renderDeathEffect(ctx, effect, progress);
                    break;
                case 'damage':
                    this.renderDamageEffect(ctx, effect, progress);
                    break;
            }
        });
        
        ctx.globalAlpha = 1.0;
    }
    
    renderAttackEffect(ctx, effect, progress) {
        const size = 15 + progress * 10;
        
        ctx.strokeStyle = '#ff4757';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    renderHowlEffect(ctx, effect, progress) {
        const radius = 20 + progress * 40;
        
        for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = '#8b8b8b';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, radius + i * 10, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.setLineDash([]);
    }
    
    renderRoarEffect(ctx, effect, progress) {
        const size = 30 + progress * 30;
        
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
        ctx.stroke();
        
        // Sound waves
        for (let i = 0; i < 5; i++) {
            const waveRadius = size + i * 8;
            ctx.strokeStyle = `rgba(255, 107, 107, ${0.5 - i * 0.1})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, waveRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    renderDeathEffect(ctx, effect, progress) {
        // Fade out effect
        ctx.save();
        ctx.translate(effect.x, effect.y);
        
        ctx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * (1 + progress), 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    renderDamageEffect(ctx, effect, progress) {
        const y = effect.y - progress * 30;
        
        ctx.fillStyle = '#ff4757';
        ctx.font = 'bold 14px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`-${Math.floor(effect.amount)}`, effect.x, y);
    }
}