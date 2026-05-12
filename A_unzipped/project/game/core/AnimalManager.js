import { Animal } from '../entities/Animal.js';

export class AnimalManager {
    constructor() {
        this.animals = [];
        this.maxAnimals = 50;
        this.spawnTimer = 0;
        this.spawnInterval = 10; // seconds
        this.animalTypes = ['wolf', 'bear', 'rabbit', 'deer', 'boar'];
        this.spawnAreas = [
            { x: 200, y: 200, radius: 100 },
            { x: 1800, y: 200, radius: 100 },
            { x: 200, y: 1800, radius: 100 },
            { x: 1800, y: 1800, radius: 100 },
            { x: 1000, y: 1000, radius: 200 }
        ];
    }
    
    async init() {
        // Spawn initial animals
        this.spawnInitialAnimals();
        console.log('AnimalManager initialized');
    }
    
    spawnInitialAnimals() {
        for (let i = 0; i < 30; i++) {
            this.spawnRandomAnimal();
        }
    }
    
    update(deltaTime) {
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        if (this.spawnTimer >= this.spawnInterval && this.animals.length < this.maxAnimals) {
            this.spawnRandomAnimal();
            this.spawnTimer = 0;
        }
        
        // Update all animals
        this.animals.forEach(animal => {
            if (animal.isAlive) {
                animal.update(deltaTime);
            }
        });
        
        // Remove dead animals
        this.animals = this.animals.filter(animal => animal.isAlive);
        
        // Update animal AI with nearby entities
        this.updateAnimalAI();
    }
    
    updateAnimalAI() {
        this.animals.forEach(animal => {
            // Find nearby entities for each animal
            const nearbyEntities = this.findNearbyEntities(animal, 150);
            animal.nearbyEntities = nearbyEntities;
            
            // Update pack behavior for wolves
            if (animal.animalType === 'wolf' && !animal.isTamed) {
                this.updatePackBehavior(animal);
            }
        });
    }
    
    updatePackBehavior(wolf) {
        const nearbyWolves = this.animals.filter(animal => 
            animal.animalType === 'wolf' && 
            !animal.isTamed && 
            animal !== wolf &&
            wolf.getDistanceTo(animal) < 100
        );
        
        if (nearbyWolves.length > 0 && wolf.target && wolf.target.type === 'player') {
            // Coordinate pack attack
            nearbyWolves.forEach(packWolf => {
                if (packWolf.aiState !== 'attacking') {
                    packWolf.aiState = 'attacking';
                    packWolf.target = wolf.target;
                }
            });
        }
    }
    
    findNearbyEntities(animal, radius) {
        const nearby = [];
        
        // Find nearby animals
        this.animals.forEach(other => {
            if (other !== animal && animal.getDistanceTo(other) < radius) {
                nearby.push(other);
            }
        });
        
        return nearby;
    }
    
    spawnRandomAnimal() {
        const spawnArea = this.spawnAreas[Math.floor(Math.random() * this.spawnAreas.length)];
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * spawnArea.radius;
        
        const x = spawnArea.x + Math.cos(angle) * distance;
        const y = spawnArea.y + Math.sin(angle) * distance;
        
        // Choose animal type based on rarity
        const animalType = this.chooseAnimalType();
        
        const animal = new Animal(x, y, animalType);
        this.animals.push(animal);
        
        return animal;
    }
    
    chooseAnimalType() {
        const rarities = {
            'rabbit': 0.3,
            'deer': 0.25,
            'boar': 0.2,
            'wolf': 0.15,
            'bear': 0.1
        };
        
        const random = Math.random();
        let cumulative = 0;
        
        for (const [type, rarity] of Object.entries(rarities)) {
            cumulative += rarity;
            if (random < cumulative) {
                return type;
            }
        }
        
        return 'rabbit'; // fallback
    }
    
    spawnAnimal(type, x, y) {
        const animal = new Animal(x, y, type);
        this.animals.push(animal);
        return animal;
    }
    
    getAnimalsNear(x, y, radius) {
        return this.animals.filter(animal => {
            if (!animal.isAlive) return false;
            
            const dx = animal.x - x;
            const dy = animal.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= radius;
        });
    }
    
    tameAnimal(animal, owner) {
        animal.isTamed = true;
        animal.owner = owner;
        animal.loyalty = 50;
        animal.aiState = 'following';
        animal.target = owner;
        
        // Add to owner's tamed animals list
        if (owner.tamedAnimals && !owner.tamedAnimals.includes(animal)) {
            owner.tamedAnimals.push(animal);
        }
    }
    
    updateBehaviors(player) {
        this.animals.forEach(animal => {
            // Set player reference for AI
            animal.player = player;
            
            // Update animal abilities
            this.updateAnimalAbilities(animal);
            
            // Check for automatic ability usage
            this.checkAutomaticAbilities(animal);
        });
    }
    
    updateAnimalAbilities(animal) {
        // Reduce ability cooldowns
        for (const [ability, timer] of animal.abilityTimers) {
            if (timer > 0) {
                animal.abilityTimers.set(ability, timer - 0.016); // ~60fps
            }
        }
    }
    
    checkAutomaticAbilities(animal) {
        if (!animal.isAlive) return;
        
        // Auto-use abilities based on situation
        if (animal.aiState === 'attacking' && animal.target) {
            const distance = animal.getDistanceTo(animal.target);
            
            // Use charge ability when far from target
            if (distance > 60 && animal.abilities.includes('charge')) {
                animal.useAbility('charge');
            }
            
            // Use roar when surrounded
            if (animal.abilities.includes('roar')) {
                const nearbyEnemies = this.getAnimalsNear(animal.x, animal.y, 80)
                    .filter(a => a !== animal && !a.isTamed);
                if (nearbyEnemies.length >= 3) {
                    animal.useAbility('roar');
                }
            }
        }
        
        // Use escape abilities when low health
        if (animal.health < animal.maxHealth * 0.3) {
            if (animal.abilities.includes('quick_escape')) {
                animal.useAbility('quick_escape');
            } else if (animal.abilities.includes('leap')) {
                animal.useAbility('leap');
            }
        }
        
        // Pack behavior for wolves
        if (animal.animalType === 'wolf' && !animal.isTamed) {
            const nearbyWolves = this.getAnimalsNear(animal.x, animal.y, 100)
                .filter(a => a.animalType === 'wolf' && !a.isTamed);
            
            if (nearbyWolves.length >= 2 && animal.abilities.includes('howl')) {
                animal.useAbility('howl');
            }
        }
    }
    
    getAnimalStats() {
        const stats = {
            total: this.animals.length,
            alive: this.animals.filter(a => a.isAlive).length,
            tamed: this.animals.filter(a => a.isTamed).length,
            byType: {}
        };
        
        this.animalTypes.forEach(type => {
            stats.byType[type] = this.animals.filter(a => a.animalType === type && a.isAlive).length;
        });
        
        return stats;
    }
    
    render(ctx, camera) {
        // Sort animals by y position for proper depth
        const sortedAnimals = [...this.animals].sort((a, b) => a.y - b.y);
        
        sortedAnimals.forEach(animal => {
            if (animal.isAlive && this.isInView(animal, camera)) {
                animal.render(ctx);
            }
        });
        
        // Render animal trails for tamed animals
        this.renderTamedAnimalTrails(ctx, camera);
    }
    
    renderTamedAnimalTrails(ctx, camera) {
        this.animals.forEach(animal => {
            if (animal.isTamed && animal.owner && this.isInView(animal, camera)) {
                const distance = animal.getDistanceTo(animal.owner);
                
                if (distance > 50) {
                    ctx.strokeStyle = 'rgba(95, 39, 205, 0.3)';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(animal.x, animal.y);
                    ctx.lineTo(animal.owner.x, animal.owner.y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            }
        });
    }
    
    isInView(animal, camera) {
        const margin = 100;
        return animal.x > camera.x - margin &&
               animal.x < camera.x + window.innerWidth + margin &&
               animal.y > camera.y - margin &&
               animal.y < camera.y + window.innerHeight + margin;
    }
    
    // Debug methods
    getDebugInfo() {
        return {
            totalAnimals: this.animals.length,
            aliveAnimals: this.animals.filter(a => a.isAlive).length,
            tamedAnimals: this.animals.filter(a => a.isTamed).length,
            animalsByState: this.getAnimalsByState(),
            animalsByType: this.getAnimalsByType()
        };
    }
    
    getAnimalsByState() {
        const states = {};
        this.animals.forEach(animal => {
            if (animal.isAlive) {
                states[animal.aiState] = (states[animal.aiState] || 0) + 1;
            }
        });
        return states;
    }
    
    getAnimalsByType() {
        const types = {};
        this.animals.forEach(animal => {
            if (animal.isAlive) {
                types[animal.animalType] = (types[animal.animalType] || 0) + 1;
            }
        });
        return types;
    }
}