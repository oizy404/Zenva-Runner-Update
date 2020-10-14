var Coin = function(game, x, y, key, frame){ //the same parameters as sprite does
    key = 'coins';
    Phaser.Sprite.call(this, game, x, y, key, frame);

    this.scale.setTo(0.5);
    this.anchor.setTo(0.5);

    this.animations.add('spin'); // name this animation as 'spin', see preload.js

    this.game.physics.arcade.enableBody(this); //enable physics
    this.body.allowGravity = false; //not allow coins to fall

    this.checkWorldBounds = true; //Phaser will check if coins is inside the gameworld or not
    this.onOutOfBoundsKill = true; //hide or kill the coin when it goes off screen

    this.events.onKilled.add(this.onKilled, this); //see function below
    this.events.onRevived.add(this.onRevived, this); //see function below
};
//standard javascript inheritance
Coin.prototype = Object.create(Phaser.Sprite.prototype);
Coin.prototype.constructor = Coin;

Coin.prototype.onRevived = function(){
    this.body.velocity.x = -400; //horizontal speed of the coin
    this.animations.play('spin', 10, true); //spin animation at 10fps
};

Coin.prototype.onKilled = function(){
    this.animations.frame = 0; //the coin will face the screen when it spin
};
