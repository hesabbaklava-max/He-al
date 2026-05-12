export class CraftingSystem {
    constructor() {
        this.recipes = new Map();
        this.initializeRecipes();
    }
    
    initializeRecipes() {
        // Weapons
        this.addRecipe('wooden_spear', {
            name: 'Wooden Spear',
            description: 'A basic weapon for hunting',
            materials: { wood: 3, stone: 1 },
            result: {
                type: 'weapon',
                damage: 15,
                durability: 100,
                range: 70
            },
            category: 'weapons',
            unlockLevel: 1
        });
        
        this.addRecipe('stone_axe', {
            name: 'Stone Axe',
            description: 'Better for gathering and combat',
            materials: { wood: 2, stone: 3 },
            result: {
                type: 'weapon',
                damage: 25,
                durability: 150,
                range: 60,
                gatherBonus: 1.5
            },
            category: 'weapons',
            unlockLevel: 2
        });
        
        this.addRecipe('iron_sword', {
            name: 'Iron Sword',
            description: 'A powerful melee weapon',
            materials: { stone: 5, bone: 3, hide: 2 },
            result: {
                type: 'weapon',
                damage: 40,
                durability: 200,
                range: 65
            },
            category: 'weapons',
            unlockLevel: 5
        });
        
        // Armor
        this.addRecipe('leather_vest', {
            name: 'Leather Vest',
            description: 'Basic protection from attacks',
            materials: { hide: 4, bone: 2 },
            result: {
                type: 'armor',
                protection: 0.15,
                durability: 100
            },
            category: 'armor',
            unlockLevel: 3
        });
        
        this.addRecipe('bone_armor', {
            name: 'Bone Armor',
            description: 'Strong protection made from bones',
            materials: { bone: 8, hide: 6, stone: 2 },
            result: {
                type: 'armor',
                protection: 0.25,
                durability: 180
            },
            category: 'armor',
            unlockLevel: 6
        });
        
        // Tools
        this.addRecipe('gathering_bag', {
            name: 'Gathering Bag',
            description: 'Increases resource gathering efficiency',
            materials: { hide: 3, wood: 1 },
            result: {
                type: 'tool',
                gatherBonus: 1.3,
                durability: 120
            },
            category: 'tools',
            unlockLevel: 2
        });
        
        this.addRecipe('taming_rope', {
            name: 'Taming Rope',
            description: 'Improves animal taming success rate',
            materials: { hide: 2, wood: 1 },
            result: {
                type: 'tool',
                tamingBonus: 1.5,
                durability: 80
            },
            category: 'tools',
            unlockLevel: 3
        });
        
        // Food and Consumables
        this.addRecipe('cooked_meat', {
            name: 'Cooked Meat',
            description: 'Restores health and hunger',
            materials: { meat: 1, wood: 1 },
            result: {
                type: 'food',
                hungerRestore: 40,
                healthRestore: 20,
                statusEffects: [
                    { type: 'regeneration', duration: 10, strength: 2 }
                ]
            },
            category: 'consumables',
            unlockLevel: 1
        });
        
        this.addRecipe('berry_juice', {
            name: 'Berry Juice',
            description: 'Restores thirst and provides energy',
            materials: { berry: 3 },
            result: {
                type: 'drink',
                thirstRestore: 50,
                statusEffects: [
                    { type: 'speed_boost', duration: 30, strength: 1.2 }
                ]
            },
            category: 'consumables',
            unlockLevel: 1
        });
        
        this.addRecipe('healing_potion', {
            name: 'Healing Potion',
            description: 'Powerful healing elixir',
            materials: { berry: 5, meat: 2, bone: 1 },
            result: {
                type: 'consumable',
                healthRestore: 60,
                statusEffects: [
                    { type: 'regeneration', duration: 20, strength: 3 }
                ]
            },
            category: 'consumables',
            unlockLevel: 4
        });
        
        // Structures
        this.addRecipe('wooden_fence', {
            name: 'Wooden Fence',
            description: 'Basic defensive structure',
            materials: { wood: 5, stone: 2 },
            result: {
                type: 'structure',
                health: 100,
                defense: true
            },
            category: 'structures',
            unlockLevel: 3
        });
        
        this.addRecipe('animal_pen', {
            name: 'Animal Pen',
            description: 'Houses tamed animals safely',
            materials: { wood: 10, stone: 5, hide: 3 },
            result: {
                type: 'structure',
                health: 150,
                animalCapacity: 5
            },
            category: 'structures',
            unlockLevel: 5
        });
        
        this.addRecipe('campfire', {
            name: 'Campfire',
            description: 'Provides warmth and cooking',
            materials: { wood: 4, stone: 3 },
            result: {
                type: 'structure',
                health: 80,
                cookingStation: true,
                warmth: true
            },
            category: 'structures',
            unlockLevel: 2
        });
    }
    
    addRecipe(id, recipe) {
        this.recipes.set(id, { id, ...recipe });
    }
    
    getAvailableRecipes(player) {
        const available = [];
        
        for (const [id, recipe] of this.recipes) {
            if (player.level >= recipe.unlockLevel) {
                const canCraft = this.canCraft(recipe, player);
                available.push({
                    ...recipe,
                    canCraft: canCraft,
                    missingMaterials: this.getMissingMaterials(recipe, player)
                });
            }
        }
        
        return available;
    }
    
    getRecipesByCategory(player, category) {
        return this.getAvailableRecipes(player).filter(recipe => recipe.category === category);
    }
    
    canCraft(recipe, player) {
        for (const [material, amount] of Object.entries(recipe.materials)) {
            if (!player.hasResource(material, amount)) {
                return false;
            }
        }
        return true;
    }
    
    getMissingMaterials(recipe, player) {
        const missing = {};
        
        for (const [material, required] of Object.entries(recipe.materials)) {
            const available = player.inventory[material] || 0;
            if (available < required) {
                missing[material] = required - available;
            }
        }
        
        return missing;
    }
    
    craft(recipeId, player) {
        const recipe = this.recipes.get(recipeId);
        if (!recipe) {
            return { success: false, message: 'Recipe not found' };
        }
        
        if (player.level < recipe.unlockLevel) {
            return { success: false, message: 'Level too low' };
        }
        
        if (!this.canCraft(recipe, player)) {
            return { success: false, message: 'Insufficient materials' };
        }
        
        // Consume materials
        for (const [material, amount] of Object.entries(recipe.materials)) {
            player.removeResource(material, amount);
        }
        
        // Create item
        const item = this.createItem(recipe);
        
        // Add to player inventory or equip
        if (item.type === 'weapon') {
            player.weapon = item;
        } else if (item.type === 'armor') {
            player.armor = item;
        } else if (item.type === 'food' || item.type === 'drink' || item.type === 'consumable') {
            // Consume immediately for now
            player.consume(item);
        } else {
            // Add to inventory (would need inventory system expansion)
            console.log('Crafted item:', item);
        }
        
        // Gain experience
        player.gainExperience(recipe.unlockLevel * 10);
        
        return { 
            success: true, 
            message: `Crafted ${recipe.name}!`,
            item: item
        };
    }
    
    createItem(recipe) {
        const item = {
            id: Math.random().toString(36).substr(2, 9),
            name: recipe.name,
            description: recipe.description,
            ...recipe.result
        };
        
        // Add random quality bonus for some items
        if (recipe.category === 'weapons' || recipe.category === 'armor') {
            const qualityRoll = Math.random();
            if (qualityRoll > 0.9) {
                item.quality = 'legendary';
                item.qualityBonus = 1.5;
                item.name = `Legendary ${item.name}`;
            } else if (qualityRoll > 0.7) {
                item.quality = 'rare';
                item.qualityBonus = 1.2;
                item.name = `Rare ${item.name}`;
            } else if (qualityRoll > 0.4) {
                item.quality = 'uncommon';
                item.qualityBonus = 1.1;
                item.name = `Uncommon ${item.name}`;
            } else {
                item.quality = 'common';
                item.qualityBonus = 1.0;
            }
            
            // Apply quality bonus
            if (item.damage) item.damage = Math.floor(item.damage * item.qualityBonus);
            if (item.protection) item.protection *= item.qualityBonus;
            if (item.durability) item.durability = Math.floor(item.durability * item.qualityBonus);
        }
        
        return item;
    }
    
    getRecipeInfo(recipeId) {
        return this.recipes.get(recipeId);
    }
    
    getAllCategories() {
        const categories = new Set();
        for (const recipe of this.recipes.values()) {
            categories.add(recipe.category);
        }
        return Array.from(categories);
    }
    
    // Advanced crafting features
    getUpgradeRecipes(item) {
        const upgrades = [];
        
        // Find recipes that upgrade the current item
        for (const [id, recipe] of this.recipes) {
            if (recipe.upgradeFrom === item.name) {
                upgrades.push(recipe);
            }
        }
        
        return upgrades;
    }
    
    repairItem(item, player) {
        if (!item.durability || item.durability >= item.maxDurability) {
            return { success: false, message: 'Item does not need repair' };
        }
        
        const repairCost = this.getRepairCost(item);
        
        // Check if player has materials
        for (const [material, amount] of Object.entries(repairCost)) {
            if (!player.hasResource(material, amount)) {
                return { success: false, message: 'Insufficient repair materials' };
            }
        }
        
        // Consume materials
        for (const [material, amount] of Object.entries(repairCost)) {
            player.removeResource(material, amount);
        }
        
        // Repair item
        item.durability = item.maxDurability || item.durability;
        
        return { success: true, message: `Repaired ${item.name}!` };
    }
    
    getRepairCost(item) {
        const baseCost = {
            wood: 1,
            stone: 1
        };
        
        // Scale cost based on item quality and damage
        const damagePercent = 1 - (item.durability / (item.maxDurability || 100));
        const costMultiplier = Math.max(0.2, damagePercent);
        
        const cost = {};
        for (const [material, amount] of Object.entries(baseCost)) {
            cost[material] = Math.ceil(amount * costMultiplier);
        }
        
        return cost;
    }
    
    // Batch crafting
    craftMultiple(recipeId, quantity, player) {
        const results = [];
        
        for (let i = 0; i < quantity; i++) {
            const result = this.craft(recipeId, player);
            results.push(result);
            
            if (!result.success) {
                break; // Stop if we can't craft more
            }
        }
        
        return results;
    }
    
    // Recipe discovery system
    discoverRecipe(player, discoveryType, context = {}) {
        // Discover recipes based on actions or items found
        const newRecipes = [];
        
        switch (discoveryType) {
            case 'kill_animal':
                if (context.animalType === 'bear' && player.level >= 4) {
                    // Discover bear-related recipes
                    newRecipes.push('bear_hide_armor');
                }
                break;
                
            case 'gather_rare_material':
                if (context.material === 'rare_stone') {
                    newRecipes.push('enchanted_weapon');
                }
                break;
                
            case 'level_up':
                // Unlock recipes based on level
                for (const [id, recipe] of this.recipes) {
                    if (recipe.unlockLevel === player.level) {
                        newRecipes.push(id);
                    }
                }
                break;
        }
        
        return newRecipes;
    }
}