export class InputManager {
    constructor() {
        this.events = {};
        this.joysticks = {
            move: { active: false, x: 0, y: 0 },
            action: { active: false, x: 0, y: 0 }
        };
        
        this.setupJoysticks();
        this.setupButtons();
        this.setupKeyboard();
    }
    
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }
    
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => callback(data));
        }
    }
    
    setupJoysticks() {
        this.setupJoystick('moveJoystick', 'move');
        this.setupJoystick('actionJoystick', 'action');
    }
    
    setupJoystick(elementId, type) {
        const joystick = document.getElementById(elementId);
        const knob = joystick.querySelector('.joystick-knob');
        const rect = joystick.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const maxDistance = centerX - 25; // knob radius
        
        let isDragging = false;
        
        const updateJoystick = (clientX, clientY) => {
            const rect = joystick.getBoundingClientRect();
            const x = clientX - rect.left - centerX;
            const y = clientY - rect.top - centerY;
            
            const distance = Math.sqrt(x * x + y * y);
            const angle = Math.atan2(y, x);
            
            let finalX = x;
            let finalY = y;
            
            if (distance > maxDistance) {
                finalX = Math.cos(angle) * maxDistance;
                finalY = Math.sin(angle) * maxDistance;
            }
            
            knob.style.transform = `translate(${finalX}px, ${finalY}px)`;
            
            // Normalize values
            const normalizedX = finalX / maxDistance;
            const normalizedY = finalY / maxDistance;
            
            this.joysticks[type] = {
                active: distance > 5,
                x: normalizedX,
                y: normalizedY
            };
            
            if (type === 'move') {
                this.emit('move', { x: normalizedX, y: normalizedY });
            } else if (type === 'action') {
                if (distance > 5) {
                    this.emit('action', { 
                        type: this.getActionType(angle),
                        x: normalizedX, 
                        y: normalizedY 
                    });
                }
            }
        };
        
        const resetJoystick = () => {
            knob.style.transform = 'translate(0px, 0px)';
            this.joysticks[type] = { active: false, x: 0, y: 0 };
            
            if (type === 'move') {
                this.emit('move', { x: 0, y: 0 });
            }
        };
        
        // Touch events
        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isDragging = true;
            const touch = e.touches[0];
            updateJoystick(touch.clientX, touch.clientY);
        });
        
        joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (isDragging) {
                const touch = e.touches[0];
                updateJoystick(touch.clientX, touch.clientY);
            }
        });
        
        joystick.addEventListener('touchend', (e) => {
            e.preventDefault();
            isDragging = false;
            resetJoystick();
        });
        
        // Mouse events for desktop testing
        joystick.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateJoystick(e.clientX, e.clientY);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                updateJoystick(e.clientX, e.clientY);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                resetJoystick();
            }
        });
    }
    
    getActionType(angle) {
        // Convert angle to action type based on direction
        const degrees = (angle * 180 / Math.PI + 360) % 360;
        
        if (degrees >= 315 || degrees < 45) {
            return 'gather'; // Right
        } else if (degrees >= 45 && degrees < 135) {
            return 'attack'; // Down
        } else if (degrees >= 135 && degrees < 225) {
            return 'tame'; // Left
        } else {
            return 'gather'; // Up
        }
    }
    
    setupButtons() {
        const attackBtn = document.getElementById('attackBtn');
        const tameBtn = document.getElementById('tameBtn');
        const gatherBtn = document.getElementById('gatherBtn');
        
        attackBtn.addEventListener('click', () => {
            this.emit('attack');
            this.addButtonFeedback(attackBtn);
        });
        
        tameBtn.addEventListener('click', () => {
            this.emit('tame');
            this.addButtonFeedback(tameBtn);
        });
        
        gatherBtn.addEventListener('click', () => {
            this.emit('gather');
            this.addButtonFeedback(gatherBtn);
        });
        
        // Touch events for better mobile experience
        [attackBtn, tameBtn, gatherBtn].forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.click();
            });
        });
    }
    
    addButtonFeedback(button) {
        button.style.transform = 'scale(0.9)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 100);
    }
    
    setupKeyboard() {
        const keys = {};
        
        document.addEventListener('keydown', (e) => {
            keys[e.code] = true;
            
            // Action keys
            if (e.code === 'Space') {
                e.preventDefault();
                this.emit('attack');
            } else if (e.code === 'KeyE') {
                this.emit('gather');
            } else if (e.code === 'KeyF') {
                this.emit('tame');
            }
        });
        
        document.addEventListener('keyup', (e) => {
            keys[e.code] = false;
        });
        
        // Continuous movement for keyboard
        setInterval(() => {
            let x = 0;
            let y = 0;
            
            if (keys['KeyW'] || keys['ArrowUp']) y -= 1;
            if (keys['KeyS'] || keys['ArrowDown']) y += 1;
            if (keys['KeyA'] || keys['ArrowLeft']) x -= 1;
            if (keys['KeyD'] || keys['ArrowRight']) x += 1;
            
            // Normalize diagonal movement
            if (x !== 0 && y !== 0) {
                x *= 0.707;
                y *= 0.707;
            }
            
            this.emit('move', { x, y });
        }, 16); // ~60fps
    }
}
