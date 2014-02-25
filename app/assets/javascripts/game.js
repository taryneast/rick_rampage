Rick.Game = function (game) {

  // When a State is added to Phaser it automatically has the following properties set on it, even if they already exist:

  this.game; // a reference to the currently running game
  this.add; // used to add sprites, text, groups, etc
  this.camera; // a reference to the game camera
  this.cache; // the game cache
  this.input; // the global input manager (you can access this.input.keyboard, this.input.mouse, as well from it)
  this.load; // for preloading assets
  this.math; // lots of useful common math operations
  this.sound; // the sound manager - add a sound, play one, set-up markers, etc
  this.stage; // the game stage
  this.time; // the clock
  this.tweens; // the tween manager
  this.world; // the game world
  this.particles; // the particle manager
  this.physics; // the physics manager
  this.rnd; // the repeatable random number generator

  this.background;

  this.platforms;
  this.player;
  this.keybord;
  this.fireButton;
  this.generatedLedge;
  this.jumpcount = 0;
  this.jumpTimeBegin;

  // bullets
  this.bullets;
  this.bullet;
  this.bulletTime  = 0;

  // enemies
  this.enemies;
  this.enemiesTime = 0;

  // explosion
  this.explosions;

  //	You can use any of these from any function within this State.
  //	But do consider them as being 'reserved words', i.e. don't create a property for your own game called "world" or you'll over-write the world reference.

};

Rick.Game.prototype = {

  preload: function () {
    this.game.load.image('ground', 'assets/platform4.png');
    this.game.load.image('bullet', 'assets/bullet.png');
    this.game.load.image('desert', 'assets/desert.png');
    this.game.load.spritesheet('wasp', 'assets/wasp-rough.png', 183, 125);
    this.game.load.spritesheet('rick', 'assets/rick.png', 94, 100);
    this.game.load.spritesheet('explosion', 'assets/enemy_explosion.png', 53, 105);
  },

  create: function () {

    // TODO delete when the boot.js will be activated
    // because must be there
    this.game.stage.disableVisibilityChange = true;
    // TODO

    // The scrolling background
    this.background = this.game.add.sprite(0, 0, 'desert');

    //  Our bullet group
    this.bullets = this.game.add.group();
    this.bullets.createMultiple(30, 'bullet');
    this.bullets.setAll('anchor.x', 0.5);
    this.bullets.setAll('anchor.y', 1);
    this.bullets.setAll('outOfBoundsKill', true);

    //  The platforms group contains the ground and the 2 ledges we can jump on
    this.platforms = this.game.add.group();

    // here are preset ledges
    var ledge = this.platforms.create(50, 200, 'ground');
    // ledge.scale.setTo(4,1);
    ledge.body.velocity.x = -190;
    ledge.body.immovable = true;

    ledge = this.platforms.create(350, 400, 'ground');
    ledge.scale.setTo(3,1);
    ledge.body.velocity.x = -190;
    ledge.body.immovable = true;

    ledge = this.platforms.create(700, 400, 'ground');
    ledge.scale.setTo(2.5,1);
    ledge.body.velocity.x = -190;
    ledge.body.immovable = true;

    // here are the generated ledges
    setInterval(this.buildLedge.bind(this), 3000);


    // Create player
    this.player = this.game.add.sprite(32, 0, 'rick');
    this.player.anchor.setTo(0.5, 0.5);

    // this.player.body.bounce.y = 0.3;

    // this.player.body.bounce.y = 0.3;
    this.player.body.gravity.y = 10;
    // set collideWorldBounds to left only, or kill player on touching bottom
    this.player.body.collideWorldBounds = true;

    this.player.animations.add('right', [0,1,2,3,4,5,6,7], 10, true);
    this.player.animations.add('jump', [8], 10, false);

    // Adds Keyboard controls
    this.keybord = this.game.input.keyboard.createCursorKeys();
    this.fireButton = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    // Add Enemies
    this.enemiesTime = this.game.time.now + 5000;
    this.enemies = this.game.add.group();

    // An explosion pool
    this.explosions = this.game.add.group();
    this.explosions.createMultiple(30, 'explosion');
    this.explosions.forEach(this.setUpExplosions, this);
  },

  update: function () {

    this.createEnemy();

    // collisions
    this.game.physics.collide(this.bullets, this.enemies, this.collisionHandler, null, this);
    this.game.physics.collide(this.player, this.platforms);

    if (this.player.body.touching.down) {
    	this.player.animations.play('right');
    }

    this.checkPlayerJump();

    //  Firing?
    if (this.fireButton.isDown) {
      this.fireBullet();
    }

  },

  checkPlayerJump: function() {
    if (this.keybord.up.isDown && this.player.body.touching.down){
      this.jumpcount = 0;
      this.player.animations.play('jump');
      this.player.body.velocity.y = -350;
      this.jumpcount++
      this.jumpTimeBegin = this.game.time.now + 300;
    } else if (this.keybord.up.isDown && this.game.time.now > this.jumpTimeBegin && this.jumpcount === 1){
      this.player.body.velocity.y = -400;
      this.jumpcount++
    }
  },

  collisionHandler: function(bullet, enemy) {
    //  When a bullet hits an alien we kill them both
    bullet.kill();
    enemy.kill();

    //  And create an explosion :)
    var explosion = this.explosions.getFirstDead();
    explosion.reset(enemy.body.x + 50, enemy.body.y + 30);
    explosion.play('explosion', 30, false, true);
  },

  setUpExplosions: function(explosion) {
    explosion.anchor.x = 0.5;
    explosion.anchor.y = 0.5;
    explosion.animations.add('explosion');
  },

  quitGame: function (pointer) {

    // Here you should destroy anything you no longer need.
    // Stop music, delete sprites, purge caches, free resources, all that good stuff.

    //	Then let's go back to the main menu.
    this.game.state.start('Game');
  },

  createEnemy: function () {
    if (this.game.time.now > this.enemiesTime) {
      this.enemy = this.game.add.sprite(600, 100, 'wasp');
      this.enemy.animations.add('left', [0,1,2], 10, true);
      this.enemy.animations.play('left');
      this.enemy.outOfBoundsKill =  true;

      this.enemies.add(this.enemy);

      if (this.enemy) {
        // And fire it
        this.enemy.body.velocity.x = -200;
        this.enemiesTime = this.game.time.now + 3000;
      }
    }
  },

  getRandom: function (min, max) {
    return Math.random() * (max - min) + min;
  },

  buildLedge: function () {
    this.generatedLedge = this.platforms.create(this.getRandom(800, 1000), this.getRandom(250, 450), 'ground');
    this.generatedLedge.scale.setTo(this.getRandom(2,3),1);
    this.generatedLedge.body.velocity.x = -190;
    this.generatedLedge.body.immovable = true;
  },

  fireBullet: function() {

    //  To avoid them being allowed to fire too fast we set a time limit
    if (this.game.time.now > this.bulletTime) {
      //  Grab the first bullet we can from the pool
      this.bullet = this.bullets.getFirstExists(false);

      if (this.bullet) {
        //  And fire it
        this.bullet.reset(this.player.x + 40, this.player.y + 10);
        this.bullet.body.velocity.x = 600;
        this.bulletTime = this.game.time.now + 300;
      }
    }

  }

};
