export class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = document.getElementById('notifications');
        this.maxNotifications = 5;
    }
    
    show(message, type = 'info', duration = 3000) {
        const notification = this.createNotification(message, type, duration);
        this.addNotification(notification);
        
        // Auto remove
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
        
        return notification;
    }
    
    createNotification(message, type, duration) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Add icon based on type
        const icon = this.getTypeIcon(type);
        
        notification.innerHTML = `
            <span class="notification-icon">${icon}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Add close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        // Add progress bar for duration
        if (duration > 0) {
            const progressBar = document.createElement('div');
            progressBar.className = 'notification-progress';
            progressBar.style.animationDuration = `${duration}ms`;
            notification.appendChild(progressBar);
        }
        
        return notification;
    }
    
    getTypeIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️',
            'level': '⭐',
            'craft': '🔨',
            'tame': '🤝',
            'combat': '⚔️',
            'gather': '⛏️'
        };
        return icons[type] || 'ℹ️';
    }
    
    addNotification(notification) {
        // Remove oldest if at max capacity
        if (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.removeNotification(oldest);
        }
        
        this.notifications.push(notification);
        this.container.appendChild(notification);
        
        // Trigger entrance animation
        requestAnimationFrame(() => {
            notification.classList.add('notification-enter');
        });
    }
    
    removeNotification(notification) {
        if (!notification.parentNode) return;
        
        const index = this.notifications.indexOf(notification);
        if (index > -1) {
            this.notifications.splice(index, 1);
        }
        
        // Trigger exit animation
        notification.classList.add('notification-exit');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    clear() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
        this.notifications = [];
    }
    
    // Specialized notification methods
    showSuccess(message, duration = 3000) {
        return this.show(message, 'success', duration);
    }
    
    showError(message, duration = 4000) {
        return this.show(message, 'error', duration);
    }
    
    showWarning(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    }
    
    showInfo(message, duration = 3000) {
        return this.show(message, 'info', duration);
    }
    
    showLevelUp(level, duration = 5000) {
        return this.show(`🎉 Level Up! You are now level ${level}!`, 'level', duration);
    }
    
    showCraft(itemName, duration = 3000) {
        return this.show(`Crafted ${itemName}!`, 'craft', duration);
    }
    
    showTame(animalType, duration = 4000) {
        return this.show(`Successfully tamed a ${animalType}!`, 'tame', duration);
    }
    
    showCombat(message, duration = 2000) {
        return this.show(message, 'combat', duration);
    }
    
    showGather(resource, amount, duration = 2000) {
        return this.show(`+${amount} ${resource}`, 'gather', duration);
    }
    
    // Batch notifications for multiple similar events
    showBatchGather(resources, duration = 3000) {
        const resourceText = Object.entries(resources)
            .map(([type, amount]) => `+${amount} ${type}`)
            .join(', ');
        
        return this.show(`Gathered: ${resourceText}`, 'gather', duration);
    }
    
    // Persistent notifications (don't auto-remove)
    showPersistent(message, type = 'info') {
        const notification = this.createNotification(message, type, 0);
        
        // Add dismiss button
        const dismissBtn = document.createElement('button');
        dismissBtn.className = 'notification-dismiss';
        dismissBtn.textContent = 'Dismiss';
        dismissBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        notification.appendChild(dismissBtn);
        this.addNotification(notification);
        
        return notification;
    }
    
    // Achievement-style notifications
    showAchievement(title, description, duration = 6000) {
        const notification = document.createElement('div');
        notification.className = 'notification achievement';
        
        notification.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-content">
                <div class="achievement-title">${title}</div>
                <div class="achievement-description">${description}</div>
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
        
        this.addNotification(notification);
        
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
        
        return notification;
    }
    
    // Status update notifications (replace existing of same type)
    showStatus(message, statusType, duration = 0) {
        // Remove existing status of same type
        const existing = this.notifications.find(n => 
            n.classList.contains('status') && 
            n.dataset.statusType === statusType
        );
        
        if (existing) {
            this.removeNotification(existing);
        }
        
        const notification = this.createNotification(message, 'info', duration);
        notification.classList.add('status');
        notification.dataset.statusType = statusType;
        
        this.addNotification(notification);
        
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }
        
        return notification;
    }
}