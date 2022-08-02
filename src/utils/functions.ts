export const areArraysEqual = (array1: Array<any>, array2: Array<any>): boolean => {
  if (array1.length === array2.length) {
    return array1.every((element, index) => {
      if (element === array2[index]) {
        return true
      }
      return false
    });
  }
  return false
}

//
// http://easings.net/#easeOutCubic https://kodhus.com/easings/
//  t: current time
//  b: beginning value
//  c: change in value
//  d: duration
//
export const easeOutCubic = (t: number, b: number, c: number, d: number) => {
  return c * ((t = t / d - 1) * t * t + 1) + b;
}