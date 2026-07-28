import React, { createContext, useContext, ReactNode } from "react";
import { useTensorflowModel, TensorflowPlugin } from "react-native-fast-tflite";
import { useResizer, ResizerState } from "react-native-vision-camera-resizer";

interface TFLiteContextType {
  tfModel: TensorflowPlugin;
  gpuResizer: ResizerState;
}

const TFLiteContext = createContext<TFLiteContextType | undefined>(undefined);

export function TFLiteProvider({ children }: { children: ReactNode }) {
  // Pre-load TFLite model at app startup
  const tfModel = useTensorflowModel(require("../../assets/models/best.tflite"), []);

  const gpuResizer = useResizer({
    width: 640,
    height: 640,
    channelOrder: "rgb",
    dataType: "uint8",
    scaleMode: "contain",
    pixelLayout: "planar",
  });

  return (
    <TFLiteContext.Provider value={{ tfModel, gpuResizer }}>
      {children}
    </TFLiteContext.Provider>
  );
}

export function useTFLite() {
  const context = useContext(TFLiteContext);
  if (!context) {
    throw new Error("useTFLite must be used within a TFLiteProvider");
  }
  return context;
}
