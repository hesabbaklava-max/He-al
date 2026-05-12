export class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = 'entity';
        this.radius = 10;
        this.health = 100;
        this.maxHealth = 100;
        this.isAlive = true;
        this.lastUpdate = Date.now();
    }
    
    update(deltaTime) {
        // Base entity update logic
    }
    
    takeDamage(amount, source = null) {
        this.health -= amount;
        this.health = Math.max(0, this.health);
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    die() {
        this.isAlive = false;
    }
    
    getDistanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getAngleTo(other) {
        return Math.atan2(other.y - this.y, other.x - this.x);
    }
    
    moveTowards(target, speed, deltaTime) {
        const angle = this.getAngleTo(target);
        this.x += Math.cos(angle) * speed * deltaTime;
        this.y += Math.sin(angle) * speed * deltaTime;
    }
    
    render(ctx) {
        // Base rendering - override in subclasses
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}