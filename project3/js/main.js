"use strict";
const app = new PIXI.Application();

let sceneWidth, sceneHeight;

// aliases
let stage;
let assets;

// scene
let startScene;
let gameScene, scoreLabel, healthLabel, player;
let gameOverScene, gameOverScoreLabel;

// attributes
let score = 0;
let health = 100;

let attacks = []; // Array to keep track of active attacks

let healthBarBackground;
let healthBarForeground;

let ghostSpawnTimer = 0;
let ghostSpawnTimerThreshold = 1.5;

//animation
let dt;

let playerWalkLeft;
let playerWalkRight;
let playerWalkUp;
let playerWalkDown;

let playerIdleLeft;
let playerIdleRight;
let playerIdleUp;
let playerIdleDown;

let playerShootLeft;
let playerShootRight;
let playerShootUp;
let playerShootDown;
let canShoot = true;
let shootTimer = 0;
const timerThreshold = 0.4;

let explosions = [];
let explosionTexture;

let portal;
let portal2;
let portalTexture;

let hearts = [];
let heartTexture;

let attack;
let attackTexture;

let ghosts = [];
let ghostTexture;

// input
let keys; //track keys
let mousePosition; // track mouse
let isLeftMouseClicked; 


loadImages();

async function loadImages()
{
    PIXI.Assets.addBundle("sprites", {
        attack: "images/attack.png",
        player: "images/player.png",
        ghost: "images/ghost-Sheet.png",
        crossHair: "images/crossHair.png",
        smoke: "images/smoke.png",
        portal: "images/portal.png",
        heart: "images/heart.png",
        });

    assets = await PIXI.Assets.loadBundle("sprites", (progress) => {
    
    });

    setup();
}

async function setup()
{
    await app.init({ width: 1000, height: 600 });

    document.body.appendChild(app.canvas);

    stage = app.stage;
    sceneWidth = app.renderer.width;
    sceneHeight = app.renderer.height;

    // Add a resize listener
    window.addEventListener("resize", resizeGame);

    // Trigger initial resize to fit the window
    resizeGame();

    // Resize function to handle window resizing
    function resizeGame() {
        // Get the new window dimensions
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;

        // Update renderer size
        app.renderer.resize(newWidth, newHeight);

        // Calculate scale to maintain the original aspect ratio
        const scaleX = newWidth / sceneWidth;
        const scaleY = newHeight / sceneHeight;
        const scale = Math.min(scaleX, scaleY);

        // Scale the stage
        stage.scale.set(scale);

        // Center the stage
        stage.x = (newWidth - sceneWidth * scale) / 2;
        stage.y = (newHeight - sceneHeight * scale) / 2;
    }

    // #1 - Create the `start` scene
    startScene = new PIXI.Container();
    stage.addChild(startScene);

    // #2 - Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    stage.addChild(gameScene);

    // #3 - Create the `gameOver` scene and make it invisible
    gameOverScene = new PIXI.Container();
    gameOverScene.visible = false;
    stage.addChild(gameOverScene);

    // #4 - Create labels for all 3 scenes
    createLabelsAndButtons();

    // health bar
    healthBarBackground = new PIXI.Graphics();
    healthBarBackground.beginFill(16777215); // Black background
    healthBarBackground.drawRect(10, 50, 200, 20); // Position and size
    healthBarBackground.endFill();
    gameScene.addChild(healthBarBackground);

    healthBarForeground = new PIXI.Graphics();
    healthBarForeground = new PIXI.Graphics();
    healthBarForeground.beginFill(0xff0000); // Red for health
    healthBarForeground.drawRect(0, 0, 200, 20); // Full size initially
    healthBarForeground.endFill();
    healthBarForeground.x = 10; // Position relative to the background
    healthBarForeground.y = 50;
    gameScene.addChild(healthBarForeground);

    

    // walk animation
    playerWalkLeft = loadPlayerAnimation(64, 64, 7, 9, 64, true, 0 , false, 0); // Skip first frame
    playerWalkRight = loadPlayerAnimation(64, 64, 7, 11, 64, true, 0, false, 0); // Skip first frame
    playerWalkUp = loadPlayerAnimation(64, 64, 7, 8, 64, true, 0, false, 0); // Skip first frame
    playerWalkDown = loadPlayerAnimation(64, 64, 7, 10, 64, true, 0, false, 0); // Skip first frame


    // idle animation
    playerIdleLeft = loadPlayerAnimation(64, 64, 1, 9, 0, false, 0, false, 0); // Use only the first frame
    playerIdleRight = loadPlayerAnimation(64, 64, 1, 11, 0, false, 0, false, 0); // Use only the first frame
    playerIdleUp = loadPlayerAnimation(64, 64, 1, 8, 0, false, 0, false, 0); // Use only the first frame
    playerIdleDown = loadPlayerAnimation(64, 64, 1, 10, 0, false, 0, false, 0); // Use only the first frame

    // attack animation
    playerShootUp = loadPlayerAnimation (64, 84 , 8 , 47, 0, true, 128, true, 0);
    playerShootLeft = loadPlayerAnimation (64, 84 , 8 , 50, 0, true, 128, true , -18);
    playerShootDown = loadPlayerAnimation (64, 84, 8 , 53, 0, true, 128 , true, 0);
    playerShootRight = loadPlayerAnimation (64, 84, 8 , 56, 0 , true, 128, true, 18);

    // create player
    player = new Player (
        playerWalkLeft, playerWalkRight, playerWalkUp, playerWalkDown,
        playerIdleLeft, playerIdleRight, playerIdleUp, playerIdleDown,
        playerShootLeft, playerShootRight, playerShootUp, playerShootDown,
        200,200)
    gameScene.addChild(player);
    
    // load texture
    attackTexture = loadAnimation(126, 78, 4, 1280, 0, "images/attack.png");
    
    ghostTexture = loadAnimation (32, 32, 4, 0, 0, "images/ghost-Sheet.png");
    
    explosionTexture = loadAnimation (64,68, 10, 124, 0, "images/smoke.png");

    portalTexture = loadAnimation (250, 592 , 4 , 0 , 0, "images/portal.png");
    
    // add portal
    portal = new Portal (portalTexture, 800, 300);
    portal2 = new Portal (portalTexture, 100,300);
    portal2.scale.y = -0.2;
    gameScene.addChild(portal);
    gameScene.addChild(portal2);

    

    // Setup keyboard controls for the player
    keys = setupKeyboard(player); // Initialize key tracking
    requestAnimationFrame(gameLoop); // Start the game loop

    


}

function createLabelsAndButtons()
{
    let buttonStyle = {
        fill: 0xff0000,
        fontSize: 48,
        fontFamily: "Creepster",
    };

    let textStyle = {
        fill: 0xffffff,
        fontSize: 18,
        fontFamily: "Creepster",
        stroke: 0xff0000,
        strokeThickness: 4,
    }

    let startLabel1 = new PIXI.Text("Wit's End",{
        fill: 0xffffff,
        fontSize: 96,
        fontFamily: "Creepster",
        stroke: 0xff0000,
        strokeThickness: 6,
    })
    startLabel1.x = 330;
    startLabel1.y = 120;
    startScene.addChild(startLabel1);

    let startButton = new PIXI.Text("Face your fear!", buttonStyle);
    startButton.x = sceneWidth/2 - startButton.width/2;
    startButton.y = sceneHeight - 100;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", startGame);
    startButton.on("pointover", (e) => (e.target.alpha = 0.7));
    startButton.on("pointerout", (e) => (e.currentTarget.alpha = 1.0));
    startScene.addChild(startButton);

    // make score label
    scoreLabel = new PIXI.Text("", textStyle);
    scoreLabel.x = 5;
    scoreLabel.y = 5;
    gameScene.addChild(scoreLabel);
    increaseScoreBy(0);

    // make health label
    healthLabel = new PIXI.Text("", textStyle);
    healthLabel.x = 5;
    healthLabel.y = 26;
    gameScene.addChild(healthLabel);
    decreaseLifeBy(0);

    let gameOverText = new PIXI.Text("Game Over!", {
        fill: 0xffffff,
        fontSize: 64,
        fontFamily: "Creepster",
        stroke: 0xff0000,
        strokeThickness: 6,
      });
      gameOverText.x = sceneWidth / 2 - gameOverText.width / 2;
      gameOverText.y = sceneHeight / 2 - 160;
      gameOverScene.addChild(gameOverText);
      
      // 3B - make "play again?" button
      let playAgainButton = new PIXI.Text("Play Again?", buttonStyle);
      playAgainButton.x = sceneWidth / 2 - playAgainButton.width / 2;
      playAgainButton.y = sceneHeight - 100;
      playAgainButton.interactive = true;
      playAgainButton.buttonMode = true;
      playAgainButton.on("pointerup", startGame); // startGame is a function reference
      playAgainButton.on("pointerover", (e) => (e.target.alpha = 0.7)); // concise arrow function with no brackets
      playAgainButton.on("pointerout", (e) => (e.currentTarget.alpha = 1.0)); // ditto
      gameOverScene.addChild(playAgainButton);

      // make final score label
    gameOverScoreLabel = new PIXI.Text("", {
        fill: 0xffffff,
        fontSize: 36,
        fontFamily: "Futura",
        stroke: 0xff0000,
        strokeThickness: 4,
        align: "center",
    });
    gameOverScoreLabel.x = sceneWidth / 2 - 150;
    gameOverScoreLabel.y = sceneHeight / 2;
    gameOverScene.addChild(gameOverScoreLabel);
}

function startGame()
{
    startScene.visible = false;
    gameOverScene.visible = false;
    gameScene.visible = true;

    health = 100;
    score = 0;
    ghostSpawnTimerThreshold = 1.5;

    decreaseLifeBy(0);
    increaseScoreBy(0);
}

function increaseScoreBy(value)
{
    score += value;
    scoreLabel.text = `Score:   ${score}`;
}

function decreaseLifeBy(value)
{
    health -= value;

    // avoid health to go below 0 or above 100
    health = Math.max(0, health); 
    health = Math.min(health,100);
    healthLabel.text = `HP: ${health.toFixed(0)}%`;

    // Update health bar width based on health percentage
    let healthPercentage = health / 100;
    if (healthBarForeground != null)
    {
        healthBarForeground.width = 200 * healthPercentage; // Scale the foreground width
        
    }
    
}

function loadPlayerAnimation(width, height, Frames, offSetY, offSetX, skipFirstFrame = false, xSkip, firstSkip = false, toSkipX) {
    const spriteSheet = PIXI.Texture.from("images/player.png");
    let widthRec = width; // frame width
    let heightRec = height; // frame height
    let numFrames = Frames;
    let yOffSet = offSetY;
    let xOffSet = offSetX;
    let skipX = xSkip;
    let firstSkipX;
    if (firstSkip = true)
    {
        firstSkipX = 64 + toSkipX;
    }
    else
    {
        firstSkipX = 0;
    }
    let textures = [];
    let startFrame = skipFirstFrame ? 1 : 0; // Skip the first frame if requested

    for (let i = startFrame; i < numFrames; i++)
        {
          let frame = new PIXI.Texture(
            {
              source: spriteSheet,
              frame: new PIXI.Rectangle(i * widthRec + xOffSet + (i* skipX) + firstSkipX, 64 * yOffSet, widthRec, heightRec),
            }
          )
          textures.push(frame);
        }

    return textures;
}

function loadAnimation(width, height, Frames, offSetY, offSetX, source = "")
{
    let attackSpriteSheet = PIXI.Texture.from(source);
    let widthRec = width; 
    let heightRec = height; 
    let numFrames = Frames;
    let yOffSet = offSetY;
    let xOffSet = offSetX;

    let textures = [];

    for (let i = 0; i < numFrames; i++)
    {
        let frame = new PIXI.Texture(
        {
            source: attackSpriteSheet,
            frame: new PIXI.Rectangle(i * widthRec + xOffSet, yOffSet, widthRec, heightRec),
        }
        )
        textures.push(frame);
    }
    return textures;
}


function setupKeyboard(player) {
    const keys = {}; // Track pressed keys

    window.addEventListener("keydown", (e) => {
        keys[e.key] = true; // Set key as pressed
    });

    window.addEventListener("keyup", (e) => {
        keys[e.key] = false; // Set key as released
    });

    return keys; // Return the keys object to be used in the game loop
}

function updatePlayerMovement(player, keys, mouseX, mouseY, leftMouseClicked) {
    let isMoving = false;
    
    // use WASD to move
    if (!player.isShoot)
    {
        if (keys["w"]) {
            if (player.currentDirection != "up")
            {
                player.switchAnimation("up");
            }
            player.y -= 5; // Move up
            player.isMove = true;
            isMoving = true;

        } else if (keys["s"]) {
            if (player.currentDirection != "down")
            {
                player.switchAnimation("down");
            }
            player.y += 5; // Move down
            player.isMove = true;
            isMoving = true;

        } else if (keys["a"]) {
            if (player.currentDirection != "left")
            {
                player.switchAnimation("left");
            }
            player.x -= 5; // Move left
            player.isMove = true;
            isMoving = true;

        } else if (keys["d"]) {
            if (player.currentDirection != "right")
                {
                    player.switchAnimation("right");
                }
            player.x += 5; // Move right
            player.isMove = true;
            isMoving = true;
        }
        else
        {
            player.isMove = false;
            player.switchAnimation(player.currentDirection);
            isMoving = false;
        }
    }

    if (isLeftMouseClicked && canShoot && !player.isShoot) {
        player.isShoot = true;
        player.isMove = false;
        isMoving = false;
        player.switchAnimation(player.currentDirection);
    }
    
    
    // Determine direction based on angle
    const minDistance = 10; // Stabilize small distances
    const adjustedDeltaX = Math.max(Math.abs(mouseX - player.x), minDistance) * Math.sign(mouseX - player.x);
    const adjustedDeltaY = Math.max(Math.abs(mouseY - player.y), minDistance) * Math.sign(mouseY - player.y);
    const angle = (Math.atan2(adjustedDeltaY, adjustedDeltaX) * 180) / Math.PI;
    if (!isMoving )
    {
        if (angle >= -30 && angle <= 45) {
            if (player.currentDirection !== "right") {
                player.switchAnimation("right");
            }
        } else if (angle > 45 && angle < 110) {
            if (player.currentDirection !== "down") {
                player.switchAnimation("down");
            }
        } else if (angle >= 110 || angle <= -135) {
            if (player.currentDirection !== "left") {
                player.switchAnimation("left");
            }
        } else if (angle < -30 && angle > -135) {
            if (player.currentDirection !== "up") {
                player.switchAnimation("up");
            }
        }
        
    }

    
}



function gameLoop() {
    dt = 1 / app.ticker.FPS;
    if (dt > 1 / 12) dt = 1 / 12;

    mousePosition = app.renderer.events.pointer.global;
    if (gameScene.visible === true)
    {
        isLeftMouseClicked = app.renderer.events.pointer.buttons === 1;

        ghostSpawnTimer += dt;
        updatePlayerMovement(player, keys, mousePosition.x, mousePosition.y);
        
        increaseDifficulty();

        if (ghostSpawnTimer > ghostSpawnTimerThreshold)
        {
            let randomNum = getRandom(0,2);
            if (randomNum <= 1)
            {
                const ghost = new Ghost (ghostTexture, 800, 310);
                gameScene.addChild(ghost);
                ghosts.push(ghost);
                ghostSpawnTimer = 0;
            }
            else
            {
                const ghost = new Ghost (ghostTexture, 100, 250);
                gameScene.addChild(ghost);
                ghosts.push(ghost);
                ghostSpawnTimer = 0;
            }
        }

        ghosts.forEach((ghost) =>
        {
            ghost.setTarget(player);
            ghost.update(dt);
            
            if (rectsIntersect(ghost,player) && ghost.isAlive === true)
            {
                decreaseLifeBy(0.07);
            }
        });
        
        
        // Handle shooting
        if (player.isShoot && canShoot) {
            
            shootTimer += dt;
            if (shootTimer > 0.33 && shootTimer < 0.35) {
                // Transform mouse position from screen to game world coordinates
                const gameMousePos = stage.toLocal(mousePosition);
        
                const attack = player.attack(gameMousePos.x, gameMousePos.y, attackTexture, gameScene);
                attacks.push(attack);
            }
        }
        
        attacks.forEach((attack, attackIndex) => {
            attack.x += attack.vx;
            attack.y += attack.vy;
        
            // Remove attack if it goes off-screen
            if (
                attack.x < 0 || attack.x > sceneWidth ||
                attack.y < 0 || attack.y > sceneHeight
            ) {
                gameScene.removeChild(attack);
                attacks.splice(attackIndex, 1);
                return; // Stop processing this attack
            }
        
            let attackConsumed = false; // Track if this attack is used
            const toRemove = []; // Track ghosts to remove
        
            // Sort ghosts by distance from the attack
            const sortedGhosts = ghosts.slice().sort((a, b) => {
                const distanceA = Math.hypot(attack.x - a.x, attack.y - a.y);
                const distanceB = Math.hypot(attack.x - b.x, attack.y - b.y);
                return distanceA - distanceB;
            });
        
            for (let ghost of sortedGhosts) {
                if (rectsIntersect(attack, ghost) && ghost.isAlive) {
                    // Handle ghost collision
                    createExplosion(ghost.x, ghost.y, 64, 64);
                    toRemove.push(ghost); // Mark this ghost for removal
                    ghost.isAlive = false;
                    increaseScoreBy(10);
        
                    // Drop heart with some chance
                    let randomDrop = getRandom(0, 10);
                    if (randomDrop > 9) {
                        const heart = new Heart(assets.heart, ghost.x, ghost.y);
                        gameScene.addChild(heart);
                        hearts.push(heart);
                    }
        
                    // Consume attack and exit loop
                    gameScene.removeChild(attack);
                    attacks.splice(attackIndex, 1);
                    attackConsumed = true;
                    break;
                }
            }
        
            if (!attackConsumed) return;
        
            // Remove ghosts marked for deletion
            toRemove.forEach(ghost => {
                const ghostIndex = ghosts.indexOf(ghost);
                if (ghostIndex !== -1) {
                    gameScene.removeChild(ghost);
                    ghosts.splice(ghostIndex, 1);
                }
            });
        });

        hearts.forEach((heart, heartIndex) =>
        {
            if (rectsIntersect(player, heart))
            {
                decreaseLifeBy(-5);
                hearts.splice(heartIndex,1);
                gameScene.removeChild(heart);
            }
        });

        
        
        if (shootTimer > timerThreshold) {
            canShoot = true;
            player.isShoot = false;
            shootTimer = 0;
        }

        if (health <= 0)
        {
            end();
        }
    }
    


    // Other game updates go here...
    requestAnimationFrame(gameLoop); // Continue the game loop
}

function end()
{
    gameOverScoreLabel.text = `Your Final Score: ${score}`;

    // Switch scenes
    gameOverScene.visible = true;
    gameScene.visible = false;

    ghosts.forEach((ghost) => gameScene.removeChild(ghost));
    ghosts = [];
    attacks.forEach((attack) => gameScene.removeChild(attack));
    attacks = [];
    hearts.forEach((heart) => gameScene.removeChild(heart));
    hearts = [];
}

function createExplosion(x,y,frameWidth,frameHeight)
{
  let w2 = frameWidth / 2;
  let h2 = frameHeight / 2;
  let expl = new PIXI.AnimatedSprite(explosionTexture);
  expl.x = x - w2 + 16;
  expl.y = y - h2 + 16;
  expl.animationSpeed = 0.3;
  expl.loop = false;
  expl.onComplete = () => gameScene.removeChild(expl);
  explosions.push(expl);
  gameScene.addChild(expl);
  expl.play();
}

function increaseDifficulty()
{
    if (score > 50 && score <= 150)
    {
        ghostSpawnTimerThreshold = 1;
    }
    else if (score > 150 && score <= 400)
    {
        ghostSpawnTimerThreshold = 0.7;
    }
    else if (score > 400)
    {
        ghostSpawnTimerThreshold = 0.5;
    }
    else
    {
        ghostSpawnTimerThreshold = 1.5;
    }
}