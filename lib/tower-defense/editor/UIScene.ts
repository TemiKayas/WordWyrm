// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ResponsiveText } from '@/lib/tower-defense/utils/ResponsiveText';
import { LAYOUT } from '@/lib/tower-defense/config/LayoutConfig';
/* END-USER-IMPORTS */

export default class UIScene extends Phaser.Scene {

  public startGameButtonBg!: Phaser.GameObjects.Rectangle;
  public startGameButtonText!: Phaser.GameObjects.Text;
  public sidebar!: Phaser.GameObjects.Rectangle;
  public backButtonBg!: Phaser.GameObjects.Rectangle;
  public backButtonText!: Phaser.GameObjects.Text;
  public livesBg!: Phaser.GameObjects.Rectangle;
  public livesText!: Phaser.GameObjects.Text;
  public waveCounterText!: Phaser.GameObjects.Text;
  public waveButtonBg!: Phaser.GameObjects.Rectangle;
  public waveButtonText!: Phaser.GameObjects.Text;
  public goldBg!: Phaser.GameObjects.Rectangle;
  public goldText!: Phaser.GameObjects.Text;
  public ballistaBtnBg!: Phaser.GameObjects.Rectangle;
  public ballistaBtnName!: Phaser.GameObjects.Text;
  public ballistaBtnCost!: Phaser.GameObjects.Text;
  public trebuchetBtnBg!: Phaser.GameObjects.Rectangle;
  public trebuchetBtnName!: Phaser.GameObjects.Text;
  public trebuchetBtnCost!: Phaser.GameObjects.Text;
  public knightBtnBg!: Phaser.GameObjects.Rectangle;
  public knightBtnName!: Phaser.GameObjects.Text;
  public knightBtnCost!: Phaser.GameObjects.Text;
  public trainingCampBtnBg!: Phaser.GameObjects.Rectangle;
  public trainingCampBtnName!: Phaser.GameObjects.Text;
  public trainingCampBtnCost!: Phaser.GameObjects.Text;
  public archmageBtnBg!: Phaser.GameObjects.Rectangle;
  public archmageBtnName!: Phaser.GameObjects.Text;
  public archmageBtnCost!: Phaser.GameObjects.Text;
  public lightningBtnBg!: Phaser.GameObjects.Rectangle;
  public lightningBtnName!: Phaser.GameObjects.Text;
  public lightningBtnCost!: Phaser.GameObjects.Text;
  public freezeBtnBg!: Phaser.GameObjects.Rectangle;
  public freezeBtnName!: Phaser.GameObjects.Text;
  public freezeBtnCost!: Phaser.GameObjects.Text;
  public quizBuffBtnBg!: Phaser.GameObjects.Rectangle;
  public quizBuffBtnName!: Phaser.GameObjects.Text;
  public quizBuffBtnCost!: Phaser.GameObjects.Text;

  constructor() {
    super("UIScene");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {

    // startGameButtonBg
    const startGameButtonBg = this.add.rectangle(960, 540, 540, 150);
    startGameButtonBg.scaleX = 0.5;
    startGameButtonBg.scaleY = 0.5;
    startGameButtonBg.isFilled = true;
    startGameButtonBg.fillColor = 9811463;
    startGameButtonBg.isStroked = true;
    startGameButtonBg.strokeColor = 24617;
    startGameButtonBg.lineWidth = 3;
    startGameButtonBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 540, 150), Phaser.Geom.Rectangle.Contains);

    // startGameButtonText
    const startGameButtonText = this.add.text(960, 540, "", {});
    startGameButtonText.scaleX = 0.5;
    startGameButtonText.scaleY = 0.5;
    startGameButtonText.setOrigin(0.5, 0.5);
    startGameButtonText.text = "START GAME";
    startGameButtonText.setStyle({ "color": "#ffffff", "fontFamily": "Quicksand", "fontSize": "60px", "fontStyle": "bold" });

    // sidebar
    const sidebar = this.add.rectangle(1820, 100, 200, 200);
    sidebar.isFilled = true;
    sidebar.fillColor = 16775922;

    // backButtonBg
    const backButtonBg = this.add.rectangle(113, 45, 150, 60);
    backButtonBg.isFilled = true;
    backButtonBg.fillColor = 16776440;
    backButtonBg.isStroked = true;
    backButtonBg.strokeColor = 4665381;
    backButtonBg.lineWidth = 2;
    backButtonBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 150, 60), Phaser.Geom.Rectangle.Contains);

    // backButtonText
    const backButtonText = this.add.text(113, 45, "", {});
    backButtonText.setOrigin(0.5, 0.5);
    backButtonText.text = "← Back";
    backButtonText.setStyle({ "color": "#473025", "fontFamily": "Quicksand", "fontStyle": "bold" });

    // livesBg
    const livesBg = this.add.rectangle(128, 128, 180, 60);
    livesBg.isFilled = true;
    livesBg.fillColor = 16775922;
    livesBg.isStroked = true;
    livesBg.strokeColor = 12887151;
    livesBg.lineWidth = 2;

    // livesText
    const livesText = this.add.text(128, 128, "", {});
    livesText.setOrigin(0.5, 0.5);
    livesText.text = "Lives: 10";
    livesText.setStyle({ "color": "#e74c3c", "fontFamily": "Quicksand", "fontSize": "27px", "fontStyle": "600" });

    // waveCounterText
    const waveCounterText = this.add.text(1822, 38, "", {});
    waveCounterText.scaleX = 0.8;
    waveCounterText.scaleY = 0.8;
    waveCounterText.setOrigin(0.5, 0.5);
    waveCounterText.text = "Round 0";
    waveCounterText.setStyle({ "color": "#473025", "fontFamily": "Quicksand", "fontSize": "30px", "fontStyle": "600" });

    // waveButtonBg
    const waveButtonBg = this.add.rectangle(1821, 76, 170, 35);
    waveButtonBg.isFilled = true;
    waveButtonBg.fillColor = 9811463;
    waveButtonBg.isStroked = true;
    waveButtonBg.strokeColor = 24617;
    waveButtonBg.lineWidth = 3;
    waveButtonBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 170, 35), Phaser.Geom.Rectangle.Contains);

    // waveButtonText
    const waveButtonText = this.add.text(1821, 78, "", {});
    waveButtonText.scaleX = 0.8;
    waveButtonText.scaleY = 0.8;
    waveButtonText.setOrigin(0.5, 0.5);
    waveButtonText.text = "Start Wave 1";
    waveButtonText.setStyle({ "color": "#ffffff", "fontFamily": "Quicksand", "fontSize": "27px", "fontStyle": "bold" });

    // goldBg
    const goldBg = this.add.rectangle(1821, 143, 170, 35);
    goldBg.isFilled = true;
    goldBg.fillAlpha = 0.95;
    goldBg.isStroked = true;
    goldBg.strokeColor = 12887151;
    goldBg.lineWidth = 2;

    // goldText
    const goldText = this.add.text(1821, 143, "", {});
    goldText.setOrigin(0.5, 0.5);
    goldText.text = "Gold: 100";
    goldText.setStyle({ "color": "#ff9f22", "fontFamily": "Quicksand", "fontSize": "27px", "fontStyle": "600" });

    // ballistaBtnBg
    const ballistaBtnBg = this.add.rectangle(548, 980, 100, 100);
    ballistaBtnBg.isFilled = true;
    ballistaBtnBg.fillColor = 16776440;
    ballistaBtnBg.isStroked = true;
    ballistaBtnBg.strokeColor = 12887151;
    ballistaBtnBg.lineWidth = 3;
    ballistaBtnBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 100), Phaser.Geom.Rectangle.Contains);

    // ballistaBtnIcon
    const ballistaBtnIcon = this.add.image(548, 980, "icon_ballista");
    ballistaBtnIcon.scaleX = 0.08;
    ballistaBtnIcon.scaleY = 0.08;

    // ballistaBtnName
    const ballistaBtnName = this.add.text(548, 940, "", {});
    ballistaBtnName.setOrigin(0.5, 0.5);
    ballistaBtnName.text = "Ballista";
    ballistaBtnName.setStyle({ "color": "#473025", "fontFamily": "Quicksand", "fontSize": "18px", "fontStyle": "600" });

    // ballistaBtnCost
    const ballistaBtnCost = this.add.text(548, 1018, "", {});
    ballistaBtnCost.setOrigin(0.5, 0.5);
    ballistaBtnCost.text = "50g";
    ballistaBtnCost.setStyle({ "color": "#ff9f22", "fontFamily": "Quicksand", "fontSize": "17px", "fontStyle": "bold" });

    // trebuchetBtnBg
    const trebuchetBtnBg = this.add.rectangle(663, 980, 100, 100);
    trebuchetBtnBg.isFilled = true;
    trebuchetBtnBg.fillColor = 16776440;
    trebuchetBtnBg.isStroked = true;
    trebuchetBtnBg.strokeColor = 12887151;
    trebuchetBtnBg.lineWidth = 3;
    trebuchetBtnBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 100), Phaser.Geom.Rectangle.Contains);

    // trebuchetBtnIcon
    const trebuchetBtnIcon = this.add.image(663, 980, "icon_catapult");
    trebuchetBtnIcon.scaleX = 0.08;
    trebuchetBtnIcon.scaleY = 0.08;

    // trebuchetBtnName
    const trebuchetBtnName = this.add.text(663, 940, "", {});
    trebuchetBtnName.setOrigin(0.5, 0.5);
    trebuchetBtnName.text = "Trebuchet";
    trebuchetBtnName.setStyle({ "color": "#473025", "fontFamily": "Quicksand", "fontSize": "18px", "fontStyle": "600" });

    // trebuchetBtnCost
    const trebuchetBtnCost = this.add.text(663, 1018, "", {});
    trebuchetBtnCost.setOrigin(0.5, 0.5);
    trebuchetBtnCost.text = "100g";
    trebuchetBtnCost.setStyle({ "color": "#ff9f22", "fontFamily": "Quicksand", "fontSize": "17px", "fontStyle": "bold" });

    // knightBtnBg
    const knightBtnBg = this.add.rectangle(778, 980, 100, 100);
    knightBtnBg.isFilled = true;
    knightBtnBg.fillColor = 16776440;
    knightBtnBg.isStroked = true;
    knightBtnBg.strokeColor = 12887151;
    knightBtnBg.lineWidth = 3;
    knightBtnBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 100), Phaser.Geom.Rectangle.Contains);

    // knightBtnIcon
    const knightBtnIcon = this.add.image(778, 980, "icon_melee");
    knightBtnIcon.scaleX = 0.08;
    knightBtnIcon.scaleY = 0.08;

    // knightBtnName
    const knightBtnName = this.add.text(778, 940, "", {});
    knightBtnName.setOrigin(0.5, 0.5);
    knightBtnName.text = "Knight";
    knightBtnName.setStyle({ "color": "#473025", "fontFamily": "Quicksand", "fontSize": "18px", "fontStyle": "600" });

    // knightBtnCost
    const knightBtnCost = this.add.text(778, 1018, "", {});
    knightBtnCost.setOrigin(0.5, 0.5);
    knightBtnCost.text = "75g";
    knightBtnCost.setStyle({ "color": "#ff9f22", "fontFamily": "Quicksand", "fontSize": "17px", "fontStyle": "bold" });

    // trainingCampBtnBg
    const trainingCampBtnBg = this.add.rectangle(893, 980, 100, 100);
    trainingCampBtnBg.isFilled = true;
    trainingCampBtnBg.fillColor = 16776440;
    trainingCampBtnBg.isStroked = true;
    trainingCampBtnBg.strokeColor = 12887151;
    trainingCampBtnBg.lineWidth = 3;
    trainingCampBtnBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 100), Phaser.Geom.Rectangle.Contains);

    // trainingCampBtnName
    const trainingCampBtnName = this.add.text(893, 940, "", {});
    trainingCampBtnName.setOrigin(0.5, 0.5);
    trainingCampBtnName.text = "Training";
    trainingCampBtnName.setStyle({ "color": "#473025", "fontFamily": "Quicksand", "fontSize": "18px", "fontStyle": "600" });

    // trainingCampBtnCost
    const trainingCampBtnCost = this.add.text(893, 1018, "", {});
    trainingCampBtnCost.setOrigin(0.5, 0.5);
    trainingCampBtnCost.text = "60g";
    trainingCampBtnCost.setStyle({ "color": "#ff9f22", "fontFamily": "Quicksand", "fontSize": "17px", "fontStyle": "bold" });

    // archmageBtnBg
    const archmageBtnBg = this.add.rectangle(1008, 980, 100, 100);
    archmageBtnBg.isFilled = true;
    archmageBtnBg.fillColor = 16776440;
    archmageBtnBg.isStroked = true;
    archmageBtnBg.strokeColor = 12887151;
    archmageBtnBg.lineWidth = 3;
    archmageBtnBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 100), Phaser.Geom.Rectangle.Contains);

    // archmageBtnName
    const archmageBtnName = this.add.text(1008, 940, "", {});
    archmageBtnName.setOrigin(0.5, 0.5);
    archmageBtnName.text = "Archmage";
    archmageBtnName.setStyle({ "color": "#473025", "fontFamily": "Quicksand", "fontSize": "18px", "fontStyle": "600" });

    // archmageBtnCost
    const archmageBtnCost = this.add.text(1008, 1018, "", {});
    archmageBtnCost.setOrigin(0.5, 0.5);
    archmageBtnCost.text = "100g";
    archmageBtnCost.setStyle({ "color": "#ff9f22", "fontFamily": "Quicksand", "fontSize": "17px", "fontStyle": "bold" });

    // icon_wizard
    const icon_wizard = this.add.image(1008, 980, "icon_wizard");
    icon_wizard.scaleX = 0.08;
    icon_wizard.scaleY = 0.08;

    // lightningBtnBg
    const lightningBtnBg = this.add.rectangle(1137, 980, 100, 100);
    lightningBtnBg.isFilled = true;
    lightningBtnBg.fillColor = 16776440;
    lightningBtnBg.isStroked = true;
    lightningBtnBg.strokeColor = 12887151;
    lightningBtnBg.lineWidth = 3;
    lightningBtnBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 100), Phaser.Geom.Rectangle.Contains);

    // lightningBtnName
    const lightningBtnName = this.add.text(1137, 1000, "", {});
    lightningBtnName.setOrigin(0.5, 0.5);
    lightningBtnName.text = "Lightning";
    lightningBtnName.setStyle({ "color": "#473025", "fontFamily": "Quicksand", "fontSize": "18px", "fontStyle": "600" });

    // lightningBtnCost
    const lightningBtnCost = this.add.text(1137, 1017, "", {});
    lightningBtnCost.setOrigin(0.5, 0.5);
    lightningBtnCost.text = "75g";
    lightningBtnCost.setStyle({ "color": "#ff9f22", "fontFamily": "Quicksand", "fontSize": "17px", "fontStyle": "bold" });

    // icon_lightning
    const icon_lightning = this.add.image(1137, 964, "icon_lightning");
    icon_lightning.scaleX = 0.08;
    icon_lightning.scaleY = 0.08;

    // freezeBtnBg
    const freezeBtnBg = this.add.rectangle(1251, 980, 100, 100);
    freezeBtnBg.isFilled = true;
    freezeBtnBg.fillColor = 16776440;
    freezeBtnBg.isStroked = true;
    freezeBtnBg.strokeColor = 12887151;
    freezeBtnBg.lineWidth = 3;
    freezeBtnBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 100), Phaser.Geom.Rectangle.Contains);

    // freezeBtnName
    const freezeBtnName = this.add.text(1251, 1000, "", {});
    freezeBtnName.setOrigin(0.5, 0.5);
    freezeBtnName.text = "Freeze";
    freezeBtnName.setStyle({ "color": "#473025", "fontFamily": "Quicksand", "fontSize": "18px", "fontStyle": "600" });

    // freezeBtnCost
    const freezeBtnCost = this.add.text(1251, 1017, "", {});
    freezeBtnCost.setOrigin(0.5, 0.5);
    freezeBtnCost.text = "100g";
    freezeBtnCost.setStyle({ "color": "#ff9f22", "fontFamily": "Quicksand", "fontSize": "17px", "fontStyle": "bold" });

    // icon_freeze
    const icon_freeze = this.add.image(1251, 964, "icon_freeze");
    icon_freeze.scaleX = 0.08;
    icon_freeze.scaleY = 0.08;

    // quizBuffBtnBg
    const quizBuffBtnBg = this.add.rectangle(1368, 980, 100, 100);
    quizBuffBtnBg.isFilled = true;
    quizBuffBtnBg.fillColor = 16776440;
    quizBuffBtnBg.isStroked = true;
    quizBuffBtnBg.strokeColor = 12887151;
    quizBuffBtnBg.lineWidth = 3;
    quizBuffBtnBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 100, 100), Phaser.Geom.Rectangle.Contains);

    // quizBuffBtnName
    const quizBuffBtnName = this.add.text(1369, 1000, "", {});
    quizBuffBtnName.setOrigin(0.5, 0.5);
    quizBuffBtnName.text = "Quiz Buff";
    quizBuffBtnName.setStyle({ "color": "#473025", "fontFamily": "Quicksand", "fontSize": "18px", "fontStyle": "600" });

    // quizBuffBtnCost
    const quizBuffBtnCost = this.add.text(1369, 1017, "", {});
    quizBuffBtnCost.setOrigin(0.5, 0.5);
    quizBuffBtnCost.text = "25g";
    quizBuffBtnCost.setStyle({ "color": "#ff9f22", "fontFamily": "Quicksand", "fontSize": "17px", "fontStyle": "bold" });

    // icon_powerup_quizbuff
    const icon_powerup_quizbuff = this.add.image(1368, 964, "icon_powerup");
    icon_powerup_quizbuff.scaleX = 0.08;
    icon_powerup_quizbuff.scaleY = 0.08;

    // icon_powerup_quizbuff_1
    const icon_powerup_quizbuff_1 = this.add.image(893, 979, "icon_powerup");
    icon_powerup_quizbuff_1.scaleX = 0.08;
    icon_powerup_quizbuff_1.scaleY = 0.08;

    this.startGameButtonBg = startGameButtonBg;
    this.startGameButtonText = startGameButtonText;
    this.sidebar = sidebar;
    this.backButtonBg = backButtonBg;
    this.backButtonText = backButtonText;
    this.livesBg = livesBg;
    this.livesText = livesText;
    this.waveCounterText = waveCounterText;
    this.waveButtonBg = waveButtonBg;
    this.waveButtonText = waveButtonText;
    this.goldBg = goldBg;
    this.goldText = goldText;
    this.ballistaBtnBg = ballistaBtnBg;
    this.ballistaBtnName = ballistaBtnName;
    this.ballistaBtnCost = ballistaBtnCost;
    this.trebuchetBtnBg = trebuchetBtnBg;
    this.trebuchetBtnName = trebuchetBtnName;
    this.trebuchetBtnCost = trebuchetBtnCost;
    this.knightBtnBg = knightBtnBg;
    this.knightBtnName = knightBtnName;
    this.knightBtnCost = knightBtnCost;
    this.trainingCampBtnBg = trainingCampBtnBg;
    this.trainingCampBtnName = trainingCampBtnName;
    this.trainingCampBtnCost = trainingCampBtnCost;
    this.archmageBtnBg = archmageBtnBg;
    this.archmageBtnName = archmageBtnName;
    this.archmageBtnCost = archmageBtnCost;
    this.lightningBtnBg = lightningBtnBg;
    this.lightningBtnName = lightningBtnName;
    this.lightningBtnCost = lightningBtnCost;
    this.freezeBtnBg = freezeBtnBg;
    this.freezeBtnName = freezeBtnName;
    this.freezeBtnCost = freezeBtnCost;
    this.quizBuffBtnBg = quizBuffBtnBg;
    this.quizBuffBtnName = quizBuffBtnName;
    this.quizBuffBtnCost = quizBuffBtnCost;

    this.events.emit("scene-awake");
  }

  /* START-USER-CODE */

  create() {
    this.editorCreate();

    // Make camera background transparent so TowerDefenseScene shows through
    this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0)');

    // Listen for resize events (responsive scaling)
    this.scale.on('resize', this.handleResize, this);

    // Initial resize to ensure proper layout
    this.handleResize(this.scale.gameSize);
  }

  /**
   * Handle window/canvas resize events
   * Updates UI element positions and font sizes for responsiveness
   */
  handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;

    // Use responsive utilities from imports

    // Update text font sizes (clamped for readability)
    this.livesText.setFontSize(ResponsiveText.getClampedFontSize(
      LAYOUT.FONT_SIZE_LARGE, width, height, LAYOUT.FONT_MIN_LARGE, LAYOUT.FONT_MAX_LARGE
    ));
    this.goldText.setFontSize(ResponsiveText.getClampedFontSize(
      LAYOUT.FONT_SIZE_LARGE, width, height, LAYOUT.FONT_MIN_LARGE, LAYOUT.FONT_MAX_LARGE
    ));
    this.waveCounterText.setFontSize(ResponsiveText.getClampedFontSize(
      LAYOUT.FONT_SIZE_XLARGE, width, height, LAYOUT.FONT_MIN_XLARGE, LAYOUT.FONT_MAX_XLARGE
    ));
    this.waveButtonText.setFontSize(ResponsiveText.getClampedFontSize(
      LAYOUT.FONT_SIZE_LARGE, width, height, LAYOUT.FONT_MIN_LARGE, LAYOUT.FONT_MAX_LARGE
    ));
    this.startGameButtonText.setFontSize(ResponsiveText.getClampedFontSize(
      LAYOUT.FONT_SIZE_HUGE, width, height, LAYOUT.FONT_MIN_HUGE, LAYOUT.FONT_MAX_HUGE
    ));

    // Update tower button text sizes
    [this.ballistaBtnName, this.trebuchetBtnName, this.knightBtnName,
     this.trainingCampBtnName, this.archmageBtnName].forEach(text => {
      text.setFontSize(ResponsiveText.getClampedFontSize(
        LAYOUT.FONT_SIZE_MEDIUM, width, height, LAYOUT.FONT_MIN_MEDIUM, LAYOUT.FONT_MAX_MEDIUM
      ));
    });

    [this.ballistaBtnCost, this.trebuchetBtnCost, this.knightBtnCost,
     this.trainingCampBtnCost, this.archmageBtnCost].forEach(text => {
      text.setFontSize(ResponsiveText.getClampedFontSize(
        LAYOUT.FONT_SIZE_SMALL, width, height, LAYOUT.FONT_MIN_SMALL, LAYOUT.FONT_MAX_SMALL
      ));
    });

    // Power-up button text sizes
    if (this.lightningBtnName) {
      this.lightningBtnName.setFontSize(ResponsiveText.getClampedFontSize(
        LAYOUT.FONT_SIZE_MEDIUM, width, height, LAYOUT.FONT_MIN_MEDIUM, LAYOUT.FONT_MAX_MEDIUM
      ));
    }
    if (this.lightningBtnCost) {
      this.lightningBtnCost.setFontSize(ResponsiveText.getClampedFontSize(
        LAYOUT.FONT_SIZE_SMALL, width, height, LAYOUT.FONT_MIN_SMALL, LAYOUT.FONT_MAX_SMALL
      ));
    }
    if (this.freezeBtnName) {
      this.freezeBtnName.setFontSize(ResponsiveText.getClampedFontSize(
        LAYOUT.FONT_SIZE_MEDIUM, width, height, LAYOUT.FONT_MIN_MEDIUM, LAYOUT.FONT_MAX_MEDIUM
      ));
    }
    if (this.freezeBtnCost) {
      this.freezeBtnCost.setFontSize(ResponsiveText.getClampedFontSize(
        LAYOUT.FONT_SIZE_SMALL, width, height, LAYOUT.FONT_MIN_SMALL, LAYOUT.FONT_MAX_SMALL
      ));
    }
    if (this.quizBuffBtnName) {
      this.quizBuffBtnName.setFontSize(ResponsiveText.getClampedFontSize(
        LAYOUT.FONT_SIZE_MEDIUM, width, height, LAYOUT.FONT_MIN_MEDIUM, LAYOUT.FONT_MAX_MEDIUM
      ));
    }
    if (this.quizBuffBtnCost) {
      this.quizBuffBtnCost.setFontSize(ResponsiveText.getClampedFontSize(
        LAYOUT.FONT_SIZE_SMALL, width, height, LAYOUT.FONT_MIN_SMALL, LAYOUT.FONT_MAX_SMALL
      ));
    }

    // Note: Positions remain fixed since FIT mode maintains aspect ratio
    // Elements are already positioned correctly for the 1920x1080 coordinate system
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
