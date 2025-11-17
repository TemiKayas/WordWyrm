import Phaser from 'phaser';

/**
 * Utility class for responsive text sizing and positioning
 * Ensures text remains readable across different screen resolutions
 */
export class ResponsiveText {
  /**
   * Calculate clamped font size based on screen dimensions
   * Scales font size proportionally but clamps to min/max for readability
   *
   * @param baseFontSize - Font size at 1920x1080 (in pixels)
   * @param sceneWidth - Current scene width
   * @param sceneHeight - Current scene height
   * @param minSize - Minimum font size (default: 12px)
   * @param maxSize - Maximum font size (default: 32px)
   * @returns Clamped font size as string (e.g., "24px")
   */
  static getClampedFontSize(
    baseFontSize: number,
    sceneWidth: number,
    sceneHeight: number,
    minSize: number = 12,
    maxSize: number = 32
  ): string {
    // Calculate scale factor based on both dimensions (use smaller to avoid overflow)
    const widthFactor = sceneWidth / 1920;
    const heightFactor = sceneHeight / 1080;
    const scaleFactor = Math.min(widthFactor, heightFactor);

    // Scale font size
    const scaledSize = baseFontSize * scaleFactor;

    // Clamp to min/max for readability
    const clampedSize = Phaser.Math.Clamp(scaledSize, minSize, maxSize);

    return `${Math.round(clampedSize)}px`;
  }

  /**
   * Get scaled position based on screen dimensions
   * Useful for repositioning UI elements proportionally
   *
   * @param baseX - X position at 1920x1080
   * @param baseY - Y position at 1920x1080
   * @param sceneWidth - Current scene width
   * @param sceneHeight - Current scene height
   * @returns Scaled position { x, y }
   */
  static getScaledPosition(
    baseX: number,
    baseY: number,
    sceneWidth: number,
    sceneHeight: number
  ): { x: number; y: number } {
    return {
      x: baseX * (sceneWidth / 1920),
      y: baseY * (sceneHeight / 1080)
    };
  }

  /**
   * Get scaled dimension (width or height) based on screen size
   *
   * @param baseDimension - Dimension at 1920x1080
   * @param isWidth - true for width, false for height
   * @param sceneWidth - Current scene width
   * @param sceneHeight - Current scene height
   * @returns Scaled dimension
   */
  static getScaledDimension(
    baseDimension: number,
    isWidth: boolean,
    sceneWidth: number,
    sceneHeight: number
  ): number {
    const factor = isWidth ? sceneWidth / 1920 : sceneHeight / 1080;
    return baseDimension * factor;
  }

  /**
   * Apply responsive font size to a Phaser text object
   *
   * @param textObject - Phaser.GameObjects.Text to update
   * @param baseFontSize - Base font size in pixels
   * @param sceneWidth - Current scene width
   * @param sceneHeight - Current scene height
   * @param minSize - Minimum font size
   * @param maxSize - Maximum font size
   */
  static applyResponsiveFontSize(
    textObject: Phaser.GameObjects.Text,
    baseFontSize: number,
    sceneWidth: number,
    sceneHeight: number,
    minSize?: number,
    maxSize?: number
  ): void {
    const fontSize = this.getClampedFontSize(
      baseFontSize,
      sceneWidth,
      sceneHeight,
      minSize,
      maxSize
    );
    textObject.setFontSize(fontSize);
  }
}
