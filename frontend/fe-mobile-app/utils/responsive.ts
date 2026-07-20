import { useWindowDimensions, PixelRatio } from "react-native"

const guidelineBaseWidth = 375

export const useScale = () => {
  const { width } = useWindowDimensions()

  const scale = (size: number) =>
    (width / guidelineBaseWidth) * size

  const moderateScale = (size: number, factor = 0.3) =>
    size + (scale(size) - size) * factor

  const fontScale = (size: number) =>
    size * PixelRatio.getFontScale()

  return {
    scale,
    moderateScale,
    fontScale,
  }
}
