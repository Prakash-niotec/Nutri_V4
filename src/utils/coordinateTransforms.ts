"worklet";

export interface LetterboxDetails {
  scale: number;
  padX: number;
  padY: number;
  scaledW: number;
  scaledH: number;
}

export interface BoxCoords {
  xMin: number;
  yMin: number;
  width: number;
  height: number;
}

export interface ScreenCoords {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Orientation = 'portrait' | 'portrait-upside-down' | 'landscape-left' | 'landscape-right';

export function calculateLetterboxDetails(frameWidth: number, frameHeight: number): LetterboxDetails {
  if (frameWidth <= 0 || frameHeight <= 0) {
    return { scale: 1, padX: 0, padY: 0, scaledW: 0, scaledH: 0 };
  }
  const scale = Math.min(640 / frameWidth, 640 / frameHeight);
  const scaledW = Math.round(frameWidth * scale);
  const scaledH = Math.round(frameHeight * scale);
  const padX = Math.floor((640 - scaledW) / 2);
  const padY = Math.floor((640 - scaledH) / 2);

  return { scale, padX, padY, scaledW, scaledH };
}

export function unletterboxCoords(
  cx: number,
  cy: number,
  w: number,
  h: number,
  details: LetterboxDetails
): BoxCoords {
  const { scale, padX, padY } = details;

  const frameCx = (cx - padX) / scale;
  const frameCy = (cy - padY) / scale;
  const frameW = w / scale;
  const frameH = h / scale;

  return {
    xMin: frameCx - frameW / 2,
    yMin: frameCy - frameH / 2,
    width: frameW,
    height: frameH,
  };
}

export function mapBoxToScreen(
  box: BoxCoords,
  orientation: Orientation,
  frameWidth: number,
  frameHeight: number,
  screenWidth: number,
  screenHeight: number
): ScreenCoords {
  let finalX = 0;
  let finalY = 0;
  let finalW = 0;
  let finalH = 0;

  if (orientation === 'portrait') {
    const scaleX = screenWidth / frameHeight;
    const scaleY = screenHeight / frameWidth;
    finalX = box.yMin * scaleX;
    finalY = (frameWidth - (box.xMin + box.width)) * scaleY;
    finalW = box.height * scaleX;
    finalH = box.width * scaleY;
  } else if (orientation === 'portrait-upside-down') {
    const scaleX = screenWidth / frameHeight;
    const scaleY = screenHeight / frameWidth;
    finalX = (frameHeight - (box.yMin + box.height)) * scaleX;
    finalY = box.xMin * scaleY;
    finalW = box.height * scaleX;
    finalH = box.width * scaleY;
  } else if (orientation === 'landscape-right') {
    const scaleX = screenWidth / frameWidth;
    const scaleY = screenHeight / frameHeight;
    finalX = (frameWidth - (box.xMin + box.width)) * scaleX;
    finalY = (frameHeight - (box.yMin + box.height)) * scaleY;
    finalW = box.width * scaleX;
    finalH = box.height * scaleY;
  } else {
    // landscape-left (Native sensor matching baseline)
    const scaleX = screenWidth / frameWidth;
    const scaleY = screenHeight / frameHeight;
    finalX = box.xMin * scaleX;
    finalY = box.yMin * scaleY;
    finalW = box.width * scaleX;
    finalH = box.height * scaleY;
  }

  return { x: finalX, y: finalY, width: finalW, height: finalH };
}

export function scaleCoordinatesToImage(
  box: BoxCoords,
  frameWidth: number,
  frameHeight: number,
  imageWidth: number,
  imageHeight: number
) {
  const isImagePortrait = imageWidth < imageHeight;
  
  // 1. Identify long and short sides of frame and image
  const frameLong = Math.max(frameWidth, frameHeight);
  const frameShort = Math.min(frameWidth, frameHeight);
  
  const imageLong = Math.max(imageWidth, imageHeight);
  const imageShort = Math.min(imageWidth, imageHeight);

  // 2. Calculate the crop padding offset (since 16:9 preview crops 4:3 sensor short-side centered)
  const previewRatio = frameLong / frameShort;
  const activePhotoShort = imageLong / previewRatio;
  const padPhotoShort = (imageShort - activePhotoShort) / 2;

  let originX = 0;
  let originY = 0;
  let width = 0;
  let height = 0;

  if (isImagePortrait) {
    // Photo is Portrait (imageWidth x imageHeight) where imageWidth is short side
    // Photo X maps to Sensor Y (short side)
    originX = padPhotoShort + (box.yMin / frameHeight) * activePhotoShort;
    width = (box.height / frameHeight) * activePhotoShort;

    // Photo Y maps to Sensor X (long side) inverted due to clockwise rotation
    originY = (1.0 - (box.xMin + box.width) / frameWidth) * imageLong;
    height = (box.width / frameWidth) * imageLong;
  } else {
    // Photo is Landscape (imageWidth x imageHeight) where imageHeight is short side
    // Photo X maps to Sensor X (long side)
    originX = (box.xMin / frameWidth) * imageLong;
    width = (box.width / frameWidth) * imageLong;

    // Photo Y maps to Sensor Y (short side)
    originY = padPhotoShort + (box.yMin / frameHeight) * activePhotoShort;
    height = (box.height / frameHeight) * activePhotoShort;
  }

  // 3. Add asymmetric padding: generous horizontally to prevent text cutoff, tight vertically to exclude address
  const padW = width * 0.35;
  const padH = height * 0.02;

  const finalOriginX = Math.max(0, Math.round(originX - padW));
  const finalOriginY = Math.max(0, Math.round(originY - padH));
  const finalWidth = Math.min(imageWidth - finalOriginX, Math.round(width + 2 * padW));
  const finalHeight = Math.min(imageHeight - finalOriginY, Math.round(height + 2 * padH));

  return { 
    originX: finalOriginX, 
    originY: finalOriginY, 
    width: finalWidth, 
    height: finalHeight 
  };
}
