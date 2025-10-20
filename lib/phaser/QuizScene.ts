import Phaser from 'phaser';
import { Quiz } from '@/lib/processors/ai-generator';

// a phaser scene for displaying the quiz questions and a simple player character
export default class QuizScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private quizData!: Quiz;

  constructor() {
    super({ key: 'QuizScene' });
  }

  // called when scene starts, gets quiz data
  init(data: { quiz: Quiz }) {
    this.quizData = data.quiz;
  }

  // preload assets
  preload() {
    // load player sprites
    this.load.image('player-front', '/assets/game/front.PNG');
    this.load.image('player-back', '/assets/game/back.PNG');
  }

  // create game objects
  create() {
    // set background color
    this.cameras.main.setBackgroundColor('#fffaf2');

    // display quiz questions and options
    let yPos = 30;
    const textStyle = {
      fontSize: '18px',
      color: '#473025', // brown
      fontFamily: 'Quicksand, sans-serif',
      wordWrap: { width: 1200, useAdvancedWrap: true }
    };

    this.quizData.questions.forEach((q, index) => {
      // question
      this.add.text(40, yPos, `Q${index + 1}: ${q.question}`, { ...textStyle, fontStyle: 'bold' }).setOrigin(0);
      yPos += 30;

      // options
      q.options.forEach((option, optIndex) => {
        this.add.text(60, yPos, `${String.fromCharCode(65 + optIndex)}. ${option}`, textStyle).setOrigin(0);
        yPos += 25;
      });

      yPos += 20; // space between questions
    });


    // create a platform
    const platforms = this.physics.add.staticGroup();
    const ground = this.add.rectangle(640, 700, 1280, 40, 0x473025); // brown platform
    platforms.add(ground);


    // create player sprite with front image
    this.player = this.physics.add.sprite(100, 650, 'player-front');
    this.player.setBounce(0);
    this.player.setCollideWorldBounds(true);

    // scale the player to a smaller size (200% smaller than before)
    this.player.setScale(0.15);


    // add collision between player and platform
    this.physics.add.collider(this.player, platforms);

    // setup keyboard input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
    }
  }

  // game loop, runs every frame
  update() {
    // player movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
      // show front image when moving left
      this.player.setTexture('player-front');
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
      // show back image when moving right
      this.player.setTexture('player-back');
    } else {
      this.player.setVelocityX(0);
    }
  }
}