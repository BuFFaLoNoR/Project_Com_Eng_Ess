

import { sendScoreToBackend } from './api.js'; // Import the function from api.js

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Get skin settings from query parameters
const background = getQueryParam('background') || 'bg1';
const objects = getQueryParam('objects') || 'set1';
const basketSkin = getQueryParam('basket') || 'basket1';

const assetPaths = {
  background: `asset/back/${background}.png`,
  basket: `asset/monkey/${basketSkin}.png`,
  object: `asset/${objects}/Banana.png`,
  potion: `asset/${objects}/Potion.png`,
  speedup: `asset/${objects}/Speedup.png`,
  bonus: `asset/${objects}/Bonus.png`,
  bomb: `asset/${objects}/Bomb.png`,
};
const config = {
  type: Phaser.AUTO,
  width: 600,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#e0f7fa',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
    },
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

const game = new Phaser.Game(config);

let basket; 
let scoreText, hpText, fallingObjects, isGameOver = false, isPaused = false;
let score = 0, hp = 3, basketSpeed = 400, objectSpeed = 200, scoreMultiplier = 1;
let hearts = [], continueButton, pausedText,returnButton;
let speedBuffDuration = 0;
let scoreBuffDuration = 0;
let isSpeedBuffActive = false;
let speedBuffText, scoreBuffText;
let extraSpawners = 0;

let speedIncreaseRate = 20;
let speedIncreaseInterval = 10000;

function preload() {
  this.load.image('background', assetPaths.background);
  //this.load.image('basket', assetPaths.basket);
  this.load.spritesheet('basket-sprites', assetPaths.basket, {
    frameWidth: 120,
    frameHeight: 120
  });
  this.load.image('background', assetPaths.background);
  this.load.image('basket', assetPaths.basket);
  this.load.image('object', assetPaths.object);
  this.load.image('bonus', assetPaths.bonus);
  this.load.image('potion', assetPaths.potion);
  this.load.image('speedup', assetPaths.speedup);
  this.load.image('bomb', assetPaths.bomb);
  this.load.image('heart', 'asset/Heart.png');
  this.load.audio('pickupSound', 'asset/sound/sound.mp3');
}

function create() {
  score = 0;
  hp = 3;
  isGameOver = false;
  isPaused = false;
  extraSpawners = 0;

  //Background
  this.add.image(300, 300, 'background').setDisplaySize(600, 600);

  // UI elements
  scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '20px', fill: '#ffffff' });
  scoreText.setStyle({
    fontFamily: 'Fredoka One, sans-serif',
  });
  speedBuffText = this.add.text(10, 40, '', { fontSize: '20px', fill: '#ff0000' });
  speedBuffText.setStyle({
    fontFamily: 'Fredoka One, sans-serif',
  });
  scoreBuffText = this.add.text(10, 70, '', { fontSize: '20px', fill: '#00ff00' });
  scoreBuffText.setStyle({
    fontFamily: 'Fredoka One, sans-serif',
  });

  // Basket setup
  basket = this.physics.add.sprite(300, 520, 'basket-sprites').setImmovable();
  basket.setDisplaySize(120, 120);
  basket.body.allowGravity = false
   // Add setSkin method to basket
  basket.setSkin = function (skin) {
  this.setTexture(skin);
  }
  // Define animations
  this.anims.create({
    key: 'idle',
    frames: this.anims.generateFrameNumbers('basket-sprites', { start: 0, end: 1 }),
    frameRate: 2,
    repeat: -1
  })
  this.anims.create({
    key: 'walk-left',
    frames: this.anims.generateFrameNumbers('basket-sprites', { start: 4, end: 5 }),
    frameRate: 8,
    repeat: -1
  })
  this.anims.create({
    key: 'walk-right',
    frames: this.anims.generateFrameNumbers('basket-sprites', { start: 2, end: 3 }),
    frameRate: 8,
    repeat: -1
  })
  basket.play('idle');

  // Hearts for HP
  hearts = [];
  for (let i = 0; i < 3; i++) {
    let heart = this.add.image(450 + i * 58, 30, 'heart').setDisplaySize(60, 60);
    hearts.push(heart);
  }

  // Falling objects group
  fallingObjects = this.physics.add.group();

  // Add controls
  this.input.keyboard.on('keydown-LEFT', () => {
    basket.setVelocityX(-basketSpeed);
    basket.play('walk-left', true);
  });
  this.input.keyboard.on('keydown-RIGHT', () => {
    basket.setVelocityX(basketSpeed);
    basket.play('walk-right', true);
  });
  this.input.keyboard.on('keyup', () => {
    basket.setVelocityX(0);
    basket.play('idle', true);
  });

  // Escape key to pause
  this.input.keyboard.on('keydown-ESC', () => {
    if (!isGameOver) {
      isPaused = !isPaused;
      if (isPaused) {
        pauseGame.call(this);
      } else {
        resumeGame.call(this);
      }
    }
  });

  // Collision handling
  this.physics.add.collider(basket, fallingObjects, onObjectCatch, null, this);

  // Spawn objects
  this.time.addEvent({
    delay: 1000,
    callback: spawnObject,
    callbackScope: this,
    loop: true,
  });

  // Gradually increase object speed
  this.speedIncreaseEvent = this.time.addEvent({
    delay: speedIncreaseInterval,
    callback: increaseSpeed,
    callbackScope: this,
    loop: true,
  });
}

function update() {
  if (isGameOver || isPaused) {
    basket.anims.stop();
    return;
  }

  // Update speed buff duration
  if (speedBuffDuration > 0) {
    speedBuffDuration -= 1/60;
    if (!isSpeedBuffActive) {
      basketSpeed *= 2;
      isSpeedBuffActive = true;
    }
  } else {
    if (isSpeedBuffActive) {
      basketSpeed = 400;
      isSpeedBuffActive = false;
    }
  }

  if (speedBuffDuration > 0) {
    speedBuffText.setText(`Speed x2 : ` + Math.floor(speedBuffDuration/2));
    // Apply font and outline to the text
  } else {
      speedBuffText.setText('');
  }

  if (scoreBuffDuration > 0) {
      scoreBuffDuration -= 1/60;
  } else {
      scoreMultiplier = 1;
      scoreBuffText.setText('');
  }

  if (scoreBuffDuration > 0) {
      scoreBuffText.setText(`Score x2 : ` + Math.floor(scoreBuffDuration/2));
      // Apply font and outline to the text
  }


  basket.x = Phaser.Math.Clamp(basket.x, 30, 570);

  fallingObjects.getChildren().forEach((object) => {
    if (object.y > 600) {
      object.destroy();
      if (object.isBanana  || object.isObject) {
        hp--;
        updateHearts();
        if (hp <= 0) endGame.call(this);
      }
    }
  });

  checkExtraSpawner.call(this);
}

function spawnObject() {
  if (isGameOver || isPaused) return;

  const x = Phaser.Math.Between(20, 580);
  const type = Math.random();

  let object;
  if (type < 0.1) {
    object = fallingObjects.create(x, 0, 'potion');
    object.isPotion = true;
  } else if (type < 0.2) {
    object = fallingObjects.create(x, 0, 'speedup');
    object.isSpeedup = true;
  } else if (type < 0.3) {
    object = fallingObjects.create(x, 0, 'bomb');
    object.isBomb = true;
  } else if (type < 0.4) {
    object = fallingObjects.create(x, 0, 'bonus');
    object.isBonus = true;
  } else if (type < 0.5) {
    object = fallingObjects.create(x, 0, 'object');
    object.isObject = true;
  } else {
    object = fallingObjects.create(x, 0, 'object');
    object.isBanana = true;
  }
  object.setVelocityY(objectSpeed);
  object.setDisplaySize(50, 50);
}

function onObjectCatch(basket, object) {
  this.sound.play('pickupSound');
  if (object.isObject) {
    score += 1 * scoreMultiplier;
  } else if (object.isBonus) {
    scoreMultiplier = 2;
    scoreBuffDuration = 10;
  } else if (object.isPotion && hp < 3) {
    hp++;
    updateHearts();
  } else if (object.isBomb) {
    hp--;
    updateHearts();
  } else if (object.isSpeedup) {
    speedBuffDuration = 10;
  } else if (object.isBanana) {
    score += 1 * scoreMultiplier;
  }

  scoreText.setText(`Score: ${score}`);
  object.destroy();

  if (hp <= 0) endGame.call(this);
}

function updateHearts() {
  for (let i = 0; i < 3; i++) {
    if (i < hp) {
      hearts[i].setAlpha(1);
    } else {
      hearts[i].setAlpha(0.2);
    }
  }
}

function endGame() {
    isGameOver = true;
    this.physics.pause();
    // Stop all physics and timers.

    // Get the center of the screen for positioning
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Add styled 'Game Over' text centered on the screen
    this.add.text(centerX, centerY - 50, 'Game Over', {
        fontSize: '30px',
        fill: '#ff0000',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5); // Center text at the specified position

    // Add 'New Game' button centered below the 'Game Over' text
    const newGameButton = this.add.text(centerX, centerY, 'New Game', {
        fontSize: '30px',
        fill: '#007bff',
        fontStyle: 'bold',
        backgroundColor: '#fff',
        stroke: '#000000',
        strokeThickness: 4
    }).setInteractive().setOrigin(0.5); // Center button text at the specified position

    newGameButton.on('pointerdown', () => {
        window.location.href = 'main.html';
    });

    // Add a 'Return to Menu' button centered below the 'New Game' button
    const returnToMenuButton = this.add.text(centerX, centerY + 50, 'Return to Menu', {
        fontSize: '30px',
        fill: '#28a745', // Green color
        fontStyle: 'bold',
        backgroundColor: '#fff',
        stroke: '#000000',
        strokeThickness: 4
    }).setInteractive().setOrigin(0.5); // Center the return button text

    returnToMenuButton.on('pointerdown', () => {
        window.location.href = 'menu.html'; // Redirect to the menu page
    });
    sendScoreToBackend(score);
}




function pauseGame() {
    this.physics.pause();
    isPaused = true;

    // Get the center of the screen for positioning
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Add styled paused text centered on the screen
    pausedText = this.add.text(centerX, centerY - 50, 'Game Paused', {
      fontSize: '30px',
      fill: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5); // Center text at the specified position

    // Add continue button centered below the paused text
    continueButton = this.add.text(centerX, centerY, 'Continue', {
      fontSize: '30px',
      fill: '#007bff',
      fontStyle: 'bold',
      backgroundColor: '#fff',
      stroke: '#000000',
      strokeThickness: 4
    }).setInteractive().setOrigin(0.5); // Center button text at the specified position

    continueButton.on('pointerdown', () => resumeGame.call(this));

    // Add a "Return to Menu" button centered below the continue button
    returnButton = this.add.text(centerX, centerY + 50, 'Return to Menu', {
      fontSize: '30px',
      fill: '#28a745', // Green color
      fontStyle: 'bold',
      backgroundColor: '#fff',
      stroke: '#000000',
      strokeThickness: 4
    }).setInteractive().setOrigin(0.5); // Center the return button text

    returnButton.on('pointerdown', function() {
      window.location.href = 'menu.html'; // Redirect to the menu page
    });
}

function resumeGame() {
    this.physics.resume();
    isPaused = false;

    // Remove paused text and buttons
    pausedText.destroy();
    continueButton.destroy();
    returnButton.destroy();
}



function checkExtraSpawner() {
  if (isGameOver) return;
  while (score >= 30 * (extraSpawners + 1)) {
    extraSpawners++;
    this.time.addEvent({
      delay: 1000,
      callback: spawnObject,
      callbackScope: this,
      loop: true,
    });
  }
}

function increaseSpeed() {
  if (isGameOver) return;
  //baseSpeed += speedIncreaseRate;
  //basketSpeed = baseSpeed * 1.5;
  objectSpeed +=speedIncreaseRate;
  basketSpeed +=(speedIncreaseRate*1.5);
}
