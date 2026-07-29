import { scaleAndPadBox, enhanceImageForOcr, cleanTempEnhancedFiles } from '../imageEnhancer';
import * as FileSystem from 'expo-file-system/legacy';

jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
  copyAsync: jest.fn().mockResolvedValue(undefined),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  cacheDirectory: 'file:///tmp/cache/',
}));

describe('OpenCV Image Enhancement Service & Coordinate Scaling', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scaleAndPadBox', () => {
    it('returns null if boxDetails or frame bounds are missing/invalid', () => {
      expect(scaleAndPadBox(undefined, 4000, 3000)).toBeNull();
      expect(scaleAndPadBox({ box: { left: 0, top: 0, width: 100, height: 100 }, frameWidth: 0, frameHeight: 0 }, 4000, 3000)).toBeNull();
    });

    it('accurately scales view coordinates to full image dimensions and applies 10% safety margin padding', () => {
      const boxDetails = {
        box: { left: 100, top: 200, width: 200, height: 300 },
        frameWidth: 1000,
        frameHeight: 1000,
      };

      // scaleX = 4000/1000 = 4; scaleY = 3000/1000 = 3
      // rawLeft = 400, rawTop = 600, rawWidth = 800, rawHeight = 900
      // padX = 800 * 0.10 = 80, padY = 900 * 0.10 = 90
      // finalLeft = 400 - 80 = 320, finalTop = 600 - 90 = 510
      // finalRight = min(4000, 400 + 800 + 80) = 1280 => finalWidth = 1280 - 320 = 960
      // finalBottom = min(3000, 600 + 900 + 90) = 1590 => finalHeight = 1590 - 510 = 1080

      const result = scaleAndPadBox(boxDetails, 4000, 3000);
      expect(result).not.toBeNull();
      expect(result?.left).toBe(320);
      expect(result?.top).toBe(510);
      expect(result?.width).toBe(960);
      expect(result?.height).toBe(1080);
    });

    it('clamps crop bounds cleanly at 0 and full image borders', () => {
      const boxDetails = {
        box: { left: 10, top: 10, width: 980, height: 980 },
        frameWidth: 1000,
        frameHeight: 1000,
      };

      const result = scaleAndPadBox(boxDetails, 1000, 1000);
      expect(result).not.toBeNull();
      expect(result?.left).toBe(0);
      expect(result?.top).toBe(0);
      expect(result?.width).toBe(1000);
      expect(result?.height).toBe(1000);
    });
  });

  describe('enhanceImageForOcr & cleanTempEnhancedFiles', () => {
    it('enhances snapshot image path and returns new enhanced cached URI', async () => {
      const rawPath = 'file:///tmp/snapshot.jpg';
      const result = await enhanceImageForOcr(rawPath, {
        box: { left: 10, top: 10, width: 100, height: 100 },
        frameWidth: 100,
        frameHeight: 100,
      });

      expect(result).toContain('file:///tmp/cache/enhanced_roi_');
      expect(FileSystem.copyAsync).toHaveBeenCalledWith({
        from: rawPath,
        to: result,
      });
    });

    it('purges temporary ROI cached files asynchronously using deleteAsync', async () => {
      const enhancedUri = 'file:///tmp/cache/enhanced_roi_12345.jpg';
      await cleanTempEnhancedFiles(enhancedUri);

      expect(FileSystem.deleteAsync).toHaveBeenCalledWith(enhancedUri, { idempotent: true });
    });

    it('safely ignores non-enhanced files during cache cleanup', async () => {
      const rawUri = 'file:///tmp/snapshot.jpg';
      await cleanTempEnhancedFiles(rawUri);

      expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
    });
  });
});
