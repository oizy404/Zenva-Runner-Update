ZenvaRunner.Game = function(){
    this.playerMinAngle = -20; //minimum player rotation
    this.playerMaxAngle = 20; //maximum player rotation

    this.coinRate = 1000; //generate coins every 1000ms
    this.coinTimer = 0; //create a coin every game loop

    this.enemyRate = 500; //this will spawn enemy every 500ms
    this.enemyTimer = 0; //create an enemy every game loop
    this.bulletTime=0;// create a bullet every game loop

    this.score = 0;
    this.kill=0;
};
ZenvaRunner.Game.prototype = {
    create: function(){
        //show the same animation when user tap the screen
        this.background = this.game.add.tileSprite(0, 0, this.game.width, 512, 'background');
        this.background.autoScroll(-100, 0);
        this.foreground = this.game.add.tileSprite(0, 470, this.game.width, this.game.height -533, 'foreground');
        this.foreground.autoScroll(-100,0);
        this.ground = this.game.add.tileSprite(0, this.game.height -73, this.game.width, 73, 'ground');
        this.ground.autoScroll(-400, 0);
        this.player = this.add.sprite(200, this.game.height/2, 'player');
        this.player.anchor.setTo(0.5);
        this.player.scale.setTo(0.3);

        this.player.animations.add('fly', [0,1,2,3,2,1]);
        this.player.animations.play('fly', 8, true);

        //this will enable physics to our game
        this.game.physics.startSystem(Phaser.Physics.ARCADE);

        //Using the arcade physics system,we are setting the gravity in the horizontal direction of 400, the higher the value the more gravity
        this.game.physics.arcade.gravity.y = 400;

        this.game.physics.arcade.enableBody(this.ground); //add gravity to our ground (remember the ground key value we set in preload.js)
        this.ground.body.allowGravity = false; // we don't want our ground affected by gravity
        this.ground.body.immovable = true; // this will keep the ground stay in place

        this.game.physics.arcade.enableBody(this.player); //apply physics to our player
        this.player.body.collideWorldBounds = true; // mahulog ang playeer(mawala sa screen) kung dili i-enable
        this.player.body.bounce.set(0.25); // we want our player to bounce when it runs

        this.coins = this.game.add.group();
        this.enemies = this.game.add.group();
        this.bullets = game.add.group(); //add bullet
        this.bullets.enableBody = true; //enable ang physics sa bullet along with the player

        //enable physics sa bullet
        this.bullets.physicsBodyType = Phaser.Physics.ARCADE; 

        this.bullets.createMultiple(1, 'bullet');// how many bullet mugawas every press sa key
        this.bullets.callAll('events.onOutOfBounds.add', 'events.onOutOfBounds', this.resetBullet, this); //mg generate ug bullet kada press e call ang function na(resetBullet)
        this.bullets.setAll('checkWorldBounds', true); //extending sprite object

        //  Register the key.
        this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        this.scoreText = this.game.add.bitmapText(0,0, 'minecraftia', 'Score: 0', 32);
        this.killText = this.game.add.bitmapText(50,50, 'minecraftia', 'Kill: 0', 32); //add killtext same with sa scoretext position below Scoretext

        this.jetSound = this.game.add.audio('rocket');
        this.coinSound = this.game.add.audio('coin');
        this.deathSound = this.game.add.audio('death');
        this.shotSound = this.game.add.audio('shot'); //add audio
        this.gameMusic = this.game.add.audio('gameMusic');
        this.gameMusic.play('', 0, true);
        
    },
    update: function(){
        if (this.game.input.activePointer.isDown) { //active pointer can be a mouse or touch movement
            this.player.body.velocity.y -=25; //this will move our player to the upward notion
        }
        if (this.player.body.velocity.y < 0 || this.game.input.activePointer.isDown) { //change player angle if we are trying to move it up
            if (this.player.angle > 0) {
                this.player.angle = 0; //reset angle
            }
            if (this.player.angle > this.playerMinAngle) {
                this.player.angle -= 0.5; //lean backward
            }
        }
        else if (this.player.body.velocity.y >=0 && !this.game.input.activePointer.isDown) {
            if (this.player.angle < this.playerMaxAngle) {
                this.player.angle += 0.5; //lean forward
            }
        }
        if (this.coinTimer < this.game.time.now) {
            this.createCoin(); //create a coin
            this.coinTimer = this.game.time.now + this.coinRate; //increment the coin
        }
        if (this.enemyTimer < this.game.time.now) {
            this.createEnemy(); //create an enemy
            this.enemyTimer = this.game.time.now + this.enemyRate; //increment the enemy
        }
        if (this.spaceKey.isDown){
            this.fireBullet(); //fire bullet when key is press(isDown) call function(fireBullet)
        }
        //we are tellin to the arcade physics to check for collision and apply appropriate physics
        this.game.physics.arcade.collide(this.player, this.ground, this.groundHit, null, this);

        //this will check when player and coins overlap, refer to coinHit function below
        this.game.physics.arcade.overlap(this.player, this.coins, this.coinHit, null, this);

        //this will check when player and coins overlap, refer to coinHit function below
        this.game.physics.arcade.overlap(this.player, this.enemies, this.enemyHit, null, this);

        this.game.physics.arcade.overlap(this.enemies, this.bullets, this.enemyShot, null, this);
    },
    shutdown: function(){
        this.coins.destroy();
        this.enemies.destroy();
        this.bullets.destroy();
        this.score = 0;
        this.kill= 0;
        this.coinTimer = 0;
        this.enemyTimer = 0;
    },
    //recycle coin and add to coin group
    createCoin: function(){
        var x = this.game.width; // x position
        //random coin y position, relative to the height of the ground
        var y = this.game.rnd.integerInRange(50, this.game.world.height - 192);

        var coin = this.coins.getFirstExists(false);
        if (!coin) {
            coin = new Coin(this.game, 0, 0); //x,y
            this.coins.add(coin); //add coin if not exist
        }
        coin.reset(x, y); //set sprite
        coin.revive();
    },
    createEnemy: function(){
        var x = this.game.width; // x position
        //random enemy y position, relative to the height of the ground
        var y = this.game.rnd.integerInRange(50, this.game.world.height - 192);

        var enemy = this.enemies.getFirstExists(false);
        if (!enemy) {
            enemy = new Enemy(this.game, 0, 0); //x,y
            this.enemies.add(enemy); //add enemy if not exist
        }
        enemy.reset(x, y); //set sprite
        enemy.revive();
    },
    fireBullet:function(){ //recycle bullet and add to bullet group
        if (this.game.time.now > this.bulletTime){
        bullet = this.bullets.getFirstExists(false);

            if (bullet){
                bullet.reset(this.player.x + 6, this.player.y - 8); // position sa bullet from player
                bullet.body.velocity.x =50000; //position of bullet ug ang velocity sa ground
            }
        }
    },
    groundHit: function(player, ground){
        player.body.velocity.y = -100; //bounce the player when hit the ground
    },
    coinHit: function(player, coin){
        this.score++; // increase our score
        this.coinSound.play();
        coin.kill();// will hide the coin

        var dummyCoin = new Coin(this.game, coin.x, coin.y);// get the position o the coins and save it to dummycins
        this.game.add.existing(dummyCoin);

        dummyCoin.animations.play('spin', 40, true);// animation when the coin get hit. ''animation name'', "speed", "loop"

        //transition to the upper left when the coin get hit
        var scoreTween = this.game.add.tween(dummyCoin).to({x: 50, y:50}, 300, Phaser.Easing.Linear.NONE, true);

        scoreTween.onComplete.add(function(){
            dummyCoin.destroy(); // destroy coin
            this.scoreText.text = 'Score: ' + this.score; //show the score when the coin flies towards upper left
        }, this);
    },
    enemyHit: function(player, enemy){
        player.kill(); //will kill the player
        enemy.kill(); // will kill the enemy

        this.deathSound.play(); //play the hit sound when the player hit the enemy
        this.gameMusic.stop(); //end the game music

        this.ground.stopScroll(); //will stop ground from scrolling
        this.background.stopScroll(); // will stop bg from scrolling
        this.foreground.stopScroll(); //will stop fground from scrolling
       
        this.enemies.setAll('body.velocity.x', 0);// we stop enemies from moving forward
        this.coins.setAll('body.velocity.x', 0); //the same with coins

        this.enemyTimer = Number.MAX_VALUE; //stop generating enemies
        this.coinTimer = Number.MIN_VALUE; //stop generating cointimer
        var scoreboard = new Scoreboard(this.game);
        scoreboard.show(this.score, this.kill); //new
    },
    resetBullet: function(bullet){
        bullet.kill();
        this.shotSound.play();
    },
    enemyShot: function(bullet, enemy){
        this.score+=2; // add 2points to the scoree
        this.kill++; //increase our kill
        this.coinSound.play(); //sfx
        bullet.kill(); //will hide the bullet
        enemy.kill(); //will hide the enemy
        this.scoreText.text = 'Score: ' + this.score; //add the score to the board
        this.killText.text='Kill: '+ this.kill; // add the kill to the board
    }
};