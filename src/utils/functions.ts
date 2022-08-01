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
