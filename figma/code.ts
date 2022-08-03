const synchColours = (payload: AddColorsPayload): boolean => {
  // new set of colours coming from API
  const newColors = payload.colors
  try {
    // check if colours are already mapped.
    let localColorStyles = figma.getLocalPaintStyles()
    let localStyles = [...localColorStyles]
    
    const mappedColours: Array<string> = JSON.parse(figma.root.getPluginData('geenesColours').length ? figma.root.getPluginData('geenesColours') : '[]')
    //  If any of the objects has the keyvalue associated to a uid
    //  Then update the existing color retrieved by figma.getLocalPaintStyles()
    //  if the keyvalue don't exist in the localColors then add the colour and update the keyValue on mappedColours
    let style: PaintStyle
    let create: boolean = false
    let updateMappedColours: boolean = false

    // handle colours to be removed
    const coloursToRemove = mappedColours.filter(e => !newColors.map(c => c.uid).includes(e.split(' ')[1]))
    coloursToRemove.forEach(color => {
      const key = color.split(' ')[0]
      localStyles.find(s => s.key === key)!.remove()
      const indexToRemove = mappedColours.findIndex(mappedColour => mappedColour.split(' ')[0] === key)
      mappedColours.splice(indexToRemove, 1)
    })

    // handle addition and updates
    newColors.forEach((color, i) => {
      const index = mappedColours.findIndex(mappedColour => mappedColour.split(' ')[1] === color.uid)
      if (index < 0) {
        // colour don't exist in mappedColours
        // so create it
        style = figma.createPaintStyle()
        create = true
      } else {
        // colour exist in mappedColours but let's check if it exist in localstyle
        const j = localStyles.findIndex(style => style.key === mappedColours[index].split(' ')[0])
        if (j < 0) {
          // it means that the colour was mapped but then manually cancelled in the styles from figma
          // mappedColours must be update with the new localstyle
          style = figma.createPaintStyle()
          create = true
          updateMappedColours = true

        } else {
          // it means that the mappedColour exist also in the local style so update the local style
          style = localStyles[j]
          create = false
          updateMappedColours = false
        }
      }

      style.name = color.name
      if (color.description) {
        style.description = color.description
      }
      const rgbColor: RGB = { r: color.rgb.r, g: color.rgb.g, b: color.rgb.b }
      const alpha: number = 1
      const solidPaint: SolidPaint = {
        type: "SOLID",
        color: rgbColor,
        opacity: alpha
      }

      style.paints = [solidPaint]
      // update the map
      const lastIndex: number = figma.getLocalPaintStyles().length - 1
      if (create) {
        //  check if the uid is already present and at that point don't push but update
        if (updateMappedColours) {
          const key = mappedColours[index].split(' ')[0]
          mappedColours[index] = mappedColours[index].replace(key, figma.getLocalPaintStyles()[lastIndex].key)
        } else {
          mappedColours.push(`${figma.getLocalPaintStyles()[lastIndex].key} ${color.uid}`)
        }
      }
      figma.root.setPluginData('geenesColours', JSON.stringify(mappedColours))
    })

    let lastSynchDates: Array<lastSynchDate> = JSON.parse(figma.root.getPluginData('geenesLastSynchDate').length ? figma.root.getPluginData('geenesLastSynchDate') : '[]')
    let index = lastSynchDates.findIndex(data => data.id === payload.id)
    if (index < 0) {
      lastSynchDates.push({ id: payload.id, lastSynch: new Date(Date.now()) })
    } else {
      lastSynchDates[index].lastSynch = new Date(Date.now())
    }

    figma.root.setPluginData('geenesLastSynchDate', JSON.stringify(lastSynchDates))

    figma.notify("✔ Color synched")
    return true
  } catch (error) {
    figma.notify("✘ There was a problem synching the colours")
    return false
  }

}

const preflightColors = (payload: AddColorsPayload): Array<any> | false => {
  // new set of colours coming from API
  const newColors = payload.colors
  try {
    // check if colours are already mapped.
    let localColorStyles = figma.getLocalPaintStyles()
    let localStyles = [...localColorStyles]
    const result: Array<any> = []
    const mappedColours: Array<string> = JSON.parse(figma.root.getPluginData('geenesColours').length ? figma.root.getPluginData('geenesColours') : '[]')
    //  If any of the objects has the keyvalue associated to a uid
    //  Then update the existing color retrieved by figma.getLocalPaintStyles()
    //  if the keyvalue don't exist in the localColors then add the colour and update the keyValue on mappedColours

    // handle colours to be removed
    const coloursToRemove = mappedColours.filter(e => !newColors.map(c => c.uid).includes(e.split(' ')[1]))
    coloursToRemove.forEach(color => {
      const key = color.split(' ')[0]
      const indexToRemove = mappedColours.findIndex(mappedColour => mappedColour.split(' ')[0] === key)
      const j = localStyles.findIndex(style => style.key === mappedColours[indexToRemove].split(' ')[0])
      if (j >= 0 ) { 
        const paint = localStyles[j].paints[0] as SolidPaint
        result.push({ 
          colorId: mappedColours[indexToRemove].split(' ')[1],
          value: {old: paint.color},
          action: 'delete' })
       }
    })
    // handle addition and updates
    newColors.forEach((color, i) => {
      const index = mappedColours.findIndex(mappedColour => mappedColour.split(' ')[1] === color.uid)
      if (index < 0) {
        // colour don't exist in mappedColours
        // so create it
        result.push({ 
          colorId: color.uid,
          value: {
            new: color.rgb
          }, 
        action: 'create'
       })
      } else {
        // colour exist in mappedColours but let's check if it exist in localstyle
        const j = localStyles.findIndex(style => style.key === mappedColours[index].split(' ')[0])
        if (j < 0) {
          // it means that the colour was mapped but then manually cancelled in the styles from figma
          // mappedColours must be update with the new localstyle
          result.push({ 
            colorId: color.uid,
            value: {
              new: color.rgb
            }, 
          action: 'create'
         })
        } else {
          // it means that the mappedColour exist also in the local style so update the local style
          // check if name OR description OR color variants has changed compared to localstyle in that case update
          const { name, description, paints } = localStyles[j]
          if (name !== color.name
            || description !== (color.description ? color.description : '')
            || (
                Math.round((paints[0] as SolidPaint).color.r*100000) !== Math.round(color.rgb.r*100000)
                ||
                Math.round((paints[0] as SolidPaint).color.g*100000) !== Math.round(color.rgb.g*100000)
                ||
                Math.round((paints[0] as SolidPaint).color.b*100000) !== Math.round(color.rgb.b*100000)
              )
            ) {
            result.push({ 
              colorId: color.uid,
              value: {
                old: (paints[0] as SolidPaint).color,
                new: color.rgb
              },
              action: 'update' })
          }

        }
      }
    })
    return result
  } catch (error) {
    console.error(error)
    return false
  }
}
const a = null
let windowSize = {
  width: 320,
  height: 520,
}

figma.showUI(__html__, windowSize)

figma.ui.onmessage = (msg: PluginMessage) => {
  // console.log('Got message:', msg)
  const { type, payload } = msg

  switch (type) {
    case 'getToken':
      figma.clientStorage.getAsync('accessToken').then(
        value => figma.ui.postMessage({ type: 'getToken', value }),
        () => figma.ui.postMessage({ type: 'getToken', value: null })
      )
      break

    case 'setToken':
      figma.clientStorage.setAsync('accessToken', payload).then(
        () => figma.ui.postMessage({ type: 'setToken', success: true }),
        () => figma.ui.postMessage({ type: 'setToken', success: false })
      )
      break

    case 'getExpiryDate':
      figma.clientStorage.getAsync('expiryDate').then(
        value => figma.ui.postMessage({ type: 'getExpiryDate', value }),
        () => figma.ui.postMessage({ type: 'getExpiryDate', value: null })
      )
      break

    case 'setExpiryDate':
      figma.clientStorage.setAsync('expiryDate', payload).then(
        () => figma.ui.postMessage({ type: 'setExpiryDate', success: true }),
        () => figma.ui.postMessage({ type: 'setExpiryDate', success: false })
      )
      break

    case 'getCurrentProject':
      figma.clientStorage.getAsync('currentProjectID').then(
        value => figma.ui.postMessage({ type: 'getCurrentProject', value }),
        () => figma.ui.postMessage({ type: 'getCurrentProject', value: null })
      )
      break

    case 'setCurrentProject':
      figma.clientStorage.setAsync('currentProjectID', payload).then(
        () => figma.ui.postMessage({ type: 'setCurrentProject', success: true }),
        () => figma.ui.postMessage({ type: 'setCurrentProject', success: false })
      )

      break

    case 'synchColours':
      synchColours(<AddColorsPayload>payload)
      // figma.closePlugin()
      break

    case 'getLastSynch':
      const lastSynchDates: Array<lastSynchDate> = JSON.parse(figma.root.getPluginData('geenesLastSynchDate').length ? figma.root.getPluginData('geenesLastSynchDate') : '[]')
      figma.ui.postMessage({ type: 'getLastSynch', value: lastSynchDates })
      break

    case 'preflightColors':
      figma.ui.postMessage({ type: 'preflightColors', value: preflightColors(<AddColorsPayload>payload) })
      break

    case 'readFigmaTokens':
      figma.ui.postMessage({ type: 'readFigmaTokens', value: JSON.parse(figma.root.getSharedPluginData("tokens", "values")) })
      figma.root.setSharedPluginData("tokens", "values", JSON.stringify({ global: [{ name: 'ciao', value: '40%', type: 'opacity' }] }))
      break
  }
}