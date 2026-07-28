/**
 * Image Sharpness & Blur Analysis Service:
 * Computes Laplacian Variance on raw frame pixel buffers to prevent automated
 * snapshot triggers on blurry or out-of-focus camera frames.
 */

export const SHARPNESS_THRESHOLD = 10.0;

/**
 * Calculates Laplacian Variance of a grayscale image buffer.
 * Higher values indicate crisp focus; values < 10.0 indicate severe motion blur.
 */
export function calculateLaplacianVariance(
  buffer: Float32Array,
  width: number,
  height: number
): number {
  'worklet';
  if (!buffer || width <= 2 || height <= 2) return 0;

  const step = 4;
  let count = 0;
  let sum = 0;
  let sumSq = 0;

  // In a planar buffer, the R channel is contiguous at the start: buffer[0 ... width*height-1]
  const rowStride = width;

  for (let y = 1; y < height - 1; y += step) {
    const yOffset = y * rowStride;
    const yAbove = (y - 1) * rowStride;
    const yBelow = (y + 1) * rowStride;

    for (let x = 1; x < width - 1; x += step) {
      // Direct indexing without * 3 because it's planar
      const center = buffer[yOffset + x];
      const left = buffer[yOffset + (x - 1)];
      const right = buffer[yOffset + (x + 1)];
      const up = buffer[yAbove + x];
      const down = buffer[yBelow + x];

      const laplacian = up + down + left + right - 4 * center;

      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }

  if (count === 0) return 0;

  const mean = sum / count;
  const variance = sumSq / count - mean * mean;

  // Since values are [0,1] instead of [0,255], variance will be much smaller.
  // Multiply by 255^2 to keep the returned score comparable to the original [0,255] scale.
  return Math.max(0, variance * 65025.0);
}
