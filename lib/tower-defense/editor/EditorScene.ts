
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Scene extends Phaser.Scene {

  constructor() {
    super("EditorScene");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {

    // text_1
    const text_1 = this.add.text(450, 275, "", {});
    text_1.text = "New text";
    text_1.setStyle({  });

    // arcadeimage_1
    const arcadeimage_1 = this.physics.add.image(720, 430, "_MISSING");
    arcadeimage_1.body.setSize(32, 32, false);

    this.events.emit("scene-awake");
  }

  /* START-USER-CODE */

  // Write your code here

  create() {

    this.editorCreate();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
