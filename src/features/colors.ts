import { state } from '../utils/state'

interface Variation {
  id: string
  name: string
  hex: string
}
interface Color {
  id: string
  name: string
  description: string
  variations: Array<Variation>
}
const fetchColors = () => {
  function hexToRgb(hex: string) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : null;
  }
  function flatten(a: any): any { return Array.isArray(a) ? [].concat(...a.map(flatten)) : a }

  function extractAllColors(container: { colors: Array<Color>; groups: Array<any> }): any {
    return [container.colors, ...(container.groups || []).map(extractAllColors)]
  }
  const allColors = flatten(state.currentProject.palette.map(extractAllColors)).filter((color: Color) => color)
  return flatten(allColors.map((color: Color) => color.variations.map((variation: Variation) => {
    return { rgb: hexToRgb(variation.hex), name: `${color.name}/${variation.name}`, description: color.description, uid: `${color.id}_${variation.id}` }
  })))
}

export const importColors = (): void => {
  parent.postMessage({
    pluginMessage: {
      type: 'synchColours', payload: {
        lastUpdate: state.currentProject.updateDate._seconds,
        colors: fetchColors(),
        id: state.currentProject.id
      }
    },
  }, '*')
}

export const preflightColors = (): Promise<Array<any>> => {
  return new Promise((resolve, reject) => {
    onmessage = ({ data }) => {
      if (data.pluginMessage && data.pluginMessage.type === 'preflightColors') {
        resolve(data.pluginMessage.value)
      }
    }
    parent.postMessage({
      pluginMessage: {
        type: 'preflightColors', payload: {
          lastUpdate: state.currentProject.updateDate._seconds,
          colors: fetchColors(),
          id: state.currentProject.id
        }
      },
    }, '*')
  })
}