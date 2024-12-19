class Player extends PIXI.AnimatedSprite
{
    constructor
    (walkLeft, walkRight, walkUp, walkDown, 
     idleLeft, idleRight, idleUp, idleDown,  
     shootLeft, shootRight, shootUp, shootDown,
     x = 0, y = 0)
    {
        super(idleRight);
        this.anchor.set(0,0);
        this.scale.set(0.8);
        this.x = x;
        this.y = y;
        this.animationSpeed = 0.3; // Speed of the animation
        this.isMove = false;
        this.isShoot = false;

        this.walkAnimations = { // Store animations for each direction
            up: walkUp,
            down: walkDown,
            left: walkLeft,
            right: walkRight,
        };

        this.idleAnimations = {
            up: idleUp,
            down: idleDown,
            left: idleLeft,
            right: idleRight,
        }

        this.shootAnimations = {
            up: shootUp,
            down: shootDown,
            left: shootLeft,
            right: shootRight,
        }
        this.currentDirection = "right"; // Default direction
        this.play(); // Start with the default animation
    }

    // Switch animation based on direction
    switchAnimation(direction) {
        if (this.currentDirection !== direction) {
            this.currentDirection = direction;
        }

        if (this.isMove = true && !this.isShoot)
        {
            this.textures = this.walkAnimations[direction];
            this.animationSpeed = 0.15;
        }
        else if (this.isShoot = true)
        {
            this.textures = this.shootAnimations[direction];
            this.animationSpeed = 0.3;
        }
        else
        {
            this.textures = this.idleAnimations[direction];
        }
        this.play();
    }

    attack(targetX, targetY, attackTexture, stage) {
        const attack = new Attack(attackTexture, this.x, this.y);
        if (player.currentDirection === "down")
        {
            attack.x += 40;
            attack.y += 50;
        }
        else if (player.currentDirection === "left")
        {
            attack.y += 55;
            attack.x += 35;
        }
        else if (player.currentDirection === "right")
        {
            attack.x += 30;
        }
        // Offset calculations to start from the center of the attack sprite
        const centerOffsetX = attack.width / 2;
        const centerOffsetY = attack.height / 2;

        // Calculate the angle between the player and the mouse position
        const deltaX = targetX - (this.x + centerOffsetX);
        const deltaY = targetY - (this.y + centerOffsetY);
        const angle = Math.atan2(deltaY, deltaX);

        // Rotate the attack sprite
        attack.rotation = angle;

        // Set the attack's velocity based on the angle
        attack.vx = Math.cos(angle) * 7; 
        attack.vy = Math.sin(angle) * 7;

        // Add the attack to the game scene
        stage.addChild(attack);

        return attack; // Return the attack object for further tracking
    }
}

class Attack extends PIXI.AnimatedSprite
{
    constructor(attackTexture, x = 0, y = 0)
    {
        super(attackTexture)
        this.anchor.set(0,0);
        this.scale.set(0.6);
        this.x = x;
        this.y = y;
        this.animationSpeed = 0.25;
        this.play(); // Start with the default animation

        this.vx = 0;
        this.vy = 0;
    }
}

class Ghost extends PIXI.AnimatedSprite
{
    constructor(ghostTexture, x = 0, y = 0)
    {
        super(ghostTexture)
        this.anchor.set(0,0);
        this.scale.set(0.8);
        this.x = x;
        this.y = y;
        this.speed = 1.5;
        this.animationSpeed = 0.15;
        this.target = null; 
        this.isAlive = true;
        this.play(); 
    }

    setTarget(target) {
        this.target = target; // Set the player (or any other object) as the target
    }

    update() {
        if (this.target != null) {
            // Calculate the distance between the ghost and the target
            const dx = this.target.x + 32 - this.x;
            const dy = this.target.y + 32 - this.y;

            // Normalize the direction
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0 && dt != 0) {
                const directionX = dx / distance;
                const directionY = dy / distance;

                // Move the ghost towards the target
                this.x += directionX * this.speed ;
                this.y += directionY * this.speed ;
            }
        }
    }
}

class Portal extends PIXI.AnimatedSprite
{
    constructor(portalTexture, x = 0, y = 0)
    {
        super(portalTexture)
        this.anchor.set(0,0);
        this.scale.set(0.2);
        this.x = x;
        this.y = y;
        this.animationSpeed = 0.15;
        this.play(); 
    }
}

class Heart extends PIXI.Sprite
{
    constructor(texture, x = 0, y = 0)
    {
        super(texture);
        this.anchor.set(0,0);
        this.scale.set(0.07);
        this.x = x;
        this.y = y;
    }
}

