export class World {
    constructor() {
        this.width = 2000;
        this.height = 2000;
        this.resources = [];
        this.trees = [];
        this.rocks = [];
        this.bushes = [];
        this.terrain = [];
        
        this.resourceSpawnTimer = 0;
        this.resourceSpawnInterval = 5; // seconds
    }
    
    async init() {
        this.generateTerrain();
        this.generateResources();
        console.log('World initialized');
    }
    
    generateTerrain() {
        // Generate grass patches
        for (let i = 0; i < 100; i++) {
            this.terrain.push({
                type: 'grass',
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: 20 + Math.random() * 30
            });
        }
        
        // Generate dirt patches
        for (let i = 0; i < 50; i++) {
            this.terrain.push({
                type: 'dirt',
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: 15 + Math.random() * 25
            });
        }
    }
    
    generateResources() {
        // Generate trees
        for (let i = 0; i < 50; i++) {
            this.trees.push({
                type: 'tree',
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                health: 100,
                maxHealth: 100,
                size: 25 + Math.random() * 15,
                resourceType: 'wood',
                resourceAmount: 5 + Math.floor(Math.random() * 10)
            });
        }
        
        // Generate rocks
        for (let i = 0; i < 30; i++) {
            this.rocks.push({
                type: 'rock',
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                health: 80,
                maxHealth: 80,
                size: 20 + Math.random() * 10,
                resourceType: 'stone',
                resourceAmount: 3 + Math.floor(Math.random() * 7)
            });
        }
        
        // Generate berry bushes
        for (let i = 0; i < 40; i++) {
            this.bushes.push({
                type: 'bush',
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                health: 50,
                maxHealth: 50,
                size: 15 + Math.random() * 10,
                resourceType: 'berry',
                resourceAmount: 2 + Math.floor(Math.random() * 5),
                regrowTimer: 0,
                regrowTime: 30 // seconds
            });
        }
        
        this.resources = [...this.trees, ...this.rocks, ...this.bushes];
    }
    
    update(deltaTime) {
        this.resourceSpawnTimer += deltaTime;
        
        // Respawn resources periodically
        if (this.resourceSpawnTimer >= this.resourceSpawnInterval) {
            this.respawnResources();
            this.resourceSpawnTimer = 0;
        }
        
        // Update berry bush regrowth
        this.bushes.forEach(bush => {
            if (bush.health <= 0) {
                bush.regrowTimer += deltaTime;
                if (bush.regrowTimer >= bush.regrowTime) {
                    bush.health = bush.maxHealth;
                    bush.resourceAmount = 2 + Math.floor(Math.random() * 5);
                    bush.regrowTimer = 0;
                }
            }
        });
    }
    
    respawnResources() {
        // Respawn trees if below minimum
        if (this.trees.filter(t => t.health > 0).length < 30) {
            this.trees.push({
                type: 'tree',
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                health: 100,
                maxHealth: 100,
                size: 25 + Math.random() * 15,
                resourceType: 'wood',
                resourceAmount: 5 + Math.floor(Math.random() * 10)
            });
        }
        
        // Respawn rocks if below minimum
        if (this.rocks.filter(r => r.health > 0).length < 20) {
            this.rocks.push({
                type: 'rock',
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                health: 80,
                maxHealth: 80,
                size: 20 + Math.random() * 10,
                resourceType: 'stone',
                resourceAmount: 3 + Math.floor(Math.random() * 7)
            });
        }
        
        this.resources = [...this.trees, ...this.rocks, ...this.bushes];
    }
    
    getResourcesNear(x, y, radius) {
        return this.resources.filter(resource => {
            if (resource.health <= 0) return false;
            
            const dx = resource.x - x;
            const dy = resource.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= radius;
        });
    }
    
    gatherResource(resource) {
        if (resource.health <= 0) return null;
        
        resource.health -= 25;
        
        if (resource.health <= 0) {
            const gathered = {
                type: resource.resourceType,
                amount: resource.resourceAmount
            };
            
            // Remove from resources array if it's a tree or rock
            if (resource.type === 'tree') {
                const index = this.trees.indexOf(resource);
                if (index > -1) this.trees.splice(index, 1);
            } else if (resource.type === 'rock') {
                const index = this.rocks.indexOf(resource);
                if (index > -1) this.rocks.splice(index, 1);
            }
            
            this.resources = [...this.trees, ...this.rocks, ...this.bushes];
            return gathered;
        }
        
        return {
            type: resource.resourceType,
            amount: Math.floor(resource.resourceAmount / 4)
        };
    }
    
    render(ctx, camera) {
        // Render terrain
        this.renderTerrain(ctx, camera);
        
        // Render resources
        this.renderResources(ctx, camera);
    }
    
    renderTerrain(ctx, camera) {
        this.terrain.forEach(patch => {
            // Only render if in camera view
            if (this.isInView(patch, camera)) {
                if (patch.type === 'grass') {
                    ctx.fillStyle = '#4a7c59';
                } else if (patch.type === 'dirt') {
                    ctx.fillStyle = '#8b4513';
                }
                
                ctx.beginPath();
                ctx.arc(patch.x, patch.y, patch.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    
    renderResources(ctx, camera) {
        this.resources.forEach(resource => {
            if (!this.isInView(resource, camera) || resource.health <= 0) return;
            
            if (resource.type === 'tree') {
                this.renderTree(ctx, resource);
            } else if (resource.type === 'rock') {
                this.renderRock(ctx, resource);
            } else if (resource.type === 'bush') {
                this.renderBush(ctx, resource);
            }
            
            // Render health bar if damaged
            if (resource.health < resource.maxHealth) {
                this.renderResourceHealthBar(ctx, resource);
            }
        });
    }
    
    renderTree(ctx, tree) {
        // Tree trunk
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(tree.x - 5, tree.y - 10, 10, 20);
        
        // Tree crown
        const gradient = ctx.createRadialGradient(tree.x, tree.y - 15, 0, tree.x, tree.y - 15, tree.size);
        gradient.addColorStop(0, '#228b22');
        gradient.addColorStop(1, '#006400');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(tree.x, tree.y - 15, tree.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Tree shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(tree.x, tree.y + 10, tree.size * 0.8, tree.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderRock(ctx, rock) {
        // Rock gradient
        const gradient = ctx.createRadialGradient(rock.x - 5, rock.y - 5, 0, rock.x, rock.y, rock.size);
        gradient.addColorStop(0, '#d3d3d3');
        gradient.addColorStop(1, '#696969');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(rock.x, rock.y, rock.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Rock highlights
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath();
        ctx.arc(rock.x - 5, rock.y - 5, rock.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Rock shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(rock.x, rock.y + rock.size * 0.7, rock.size * 0.9, rock.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderBush(ctx, bush) {
        if (bush.health <= 0) {
            // Dead bush
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.arc(bush.x, bush.y, bush.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
            return;
        }
        
        // Bush leaves
        const gradient = ctx.createRadialGradient(bush.x, bush.y, 0, bush.x, bush.y, bush.size);
        gradient.addColorStop(0, '#32cd32');
        gradient.addColorStop(1, '#228b22');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(bush.x, bush.y, bush.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Berries
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const berryX = bush.x + Math.cos(angle) * bush.size * 0.6;
            const berryY = bush.y + Math.sin(angle) * bush.size * 0.6;
            
            ctx.fillStyle = '#dc143c';
            ctx.beginPath();
            ctx.arc(berryX, berryY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderResourceHealthBar(ctx, resource) {
        const barWidth = resource.size * 1.5;
        const barHeight = 6;
        const barX = resource.x - barWidth / 2;
        const barY = resource.y - resource.size - 15;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = resource.health / resource.maxHealth;
        const healthColor = healthPercent > 0.6 ? '#2ed573' : 
                           healthPercent > 0.3 ? '#ffa502' : '#ff4757';
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
    
    isInView(object, camera) {
        const margin = 100;
        return object.x > camera.x - margin &&
               object.x < camera.x + window.innerWidth + margin &&
               object.y > camera.y - margin &&
               object.y < camera.y + window.innerHeight + margin;
    }
}