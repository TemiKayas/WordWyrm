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
    // no assets to load for this basic scene
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


    // create a simple player sprite
    this.player = this.physics.add.sprite(100, 650, 'player');
    this.player.setBounce(0);
    this.player.setCollideWorldBounds(true);

    // create player texture dynamically
    const playerGraphics = this.make.graphics({ fillStyle: { color: 0x96b902 } }); // lime color
    playerGraphics.fillRect(0, 0, 40, 60);
    playerGraphics.generateTexture('player', 40, 60);
    playerGraphics.destroy();
    this.player.setTexture('player');


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
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
    } else {
      this.player.setVelocityX(0);
    }
  }
}