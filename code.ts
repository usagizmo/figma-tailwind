figma.showUI(__html__)
figma.ui.resize(320, 260)

type SceneNodeSet = [SceneNode, SceneNode]
type Spacing = [string, string]

const IS_PRODUCTION = false
const DEFAULT_MAX_SIZE_AS_PX = 28

const is = (a, b) => JSON.stringify(a) === JSON.stringify(b)

type GetSpacingPayload = {
  maxSizeAsPx?: number
  isPxOnly?: boolean
}

const px2spacing = (px: number, { maxSizeAsPx, isPxOnly }: GetSpacingPayload = {}): Spacing => {
  maxSizeAsPx = maxSizeAsPx ?? DEFAULT_MAX_SIZE_AS_PX
  isPxOnly = isPxOnly === true

  if (px === 0) {
    return ['0', '0']
  }

  if (isPxOnly || (px <= maxSizeAsPx && px % 4 !== 0)) {
    return [`${px}px`, `${px / 16}rem`]
  }

  const unit = Math.round(px / 4)
  return [`${unit}`, `${(unit * 4) / 16}rem`]
}

const intersect = <T>(as: T[], bs: T[]): [T, T][] =>
  (as.map((a) => bs.map((b) => [a, b])) as any).flat()

const updateSpacing = (list, spacing) => {
  list[spacing[0]] = spacing[1]
}

const getSpacingAndSizes = (nodes, payload: GetSpacingPayload) => {
  const spacing = {}
  const width = {}
  const height = {}

  nodes.forEach((node) => {
    const widthSpacing = px2spacing(node.width, payload)
    updateSpacing(spacing, widthSpacing)
    updateSpacing(width, widthSpacing)

    const heightSpacing = px2spacing(node.height, payload)
    updateSpacing(spacing, heightSpacing)
    updateSpacing(height, heightSpacing)
  })

  const nodeSets = intersect(nodes, nodes)
  nodeSets.forEach(([a, b]: SceneNodeSet) => {
    if (is(a, b)) {
      return
    }
    const diffX = Math.abs(b.x - a.x)
    const diffY = Math.abs(b.y - a.y)
    updateSpacing(spacing, px2spacing(diffX, payload))
    updateSpacing(spacing, px2spacing(Math.abs(diffX - a.width), payload))
    updateSpacing(spacing, px2spacing(Math.abs(diffX + b.width), payload))
    updateSpacing(spacing, px2spacing(diffY, payload))
    updateSpacing(spacing, px2spacing(Math.abs(diffY - a.height), payload))
    updateSpacing(spacing, px2spacing(Math.abs(diffY + b.height), payload))
  })

  return {
    spacing,
    width,
    height,
  }
}

const getFontSize = (nodes) => {
  const fontSize = {}

  nodes.forEach((node) => {
    updateSpacing(fontSize, px2spacing(node.fontSize, { isPxOnly: true }))
  })

  return fontSize
}

figma.ui.onmessage = ({ type, payload }) => {
  if (type === 'get-spacings') {
    const { spacing, width, height } = getSpacingAndSizes(figma.currentPage.selection, payload)
    const fontSize = getFontSize(figma.currentPage.selection.filter((node) => node.type === 'TEXT'))

    figma.ui.postMessage({
      type: 'result',
      payload: {
        spacing,
        width,
        height,
        fontSize,
      },
    })
  }

  // if (msg.type === 'create-rectangles') {
  //   const nodes: SceneNode[] = [];
  //   for (let i = 0; i < msg.count; i++) {
  //     const rect = figma.createRectangle();
  //     rect.x = i * 150;
  //     rect.fills = [{type: 'SOLID', color: {r: 1, g: 0.5, b: 0}}];
  //     figma.currentPage.appendChild(rect);
  //     nodes.push(rect);
  //   }
  //   figma.currentPage.selection = nodes;
  //   figma.viewport.scrollAndZoomIntoView(nodes);
  // }

  if (type === 'cancel') {
    figma.closePlugin()
  }
}

/** --------------------
 * Instant test
 -------------------- */
if (!IS_PRODUCTION) {
  const assert = (a, b, inputText) => {
    console.assert(is(a, b), `\`${inputText}\` is ${a}. not ${b}`)
  }

  assert(px2spacing(0), ['0', '0'], `px2spacing(0)`)
  assert(px2spacing(1), ['1px', '0.0625rem'], `px2spacing(1)`)
  assert(px2spacing(2), ['2px', '0.125rem'], `px2spacing(2)`)
  assert(px2spacing(3), ['3px', '0.1875rem'], `px2spacing(3)`)
  assert(px2spacing(4), ['1', '0.25rem'], `px2spacing(4)`)
  assert(px2spacing(26), ['26px', '1.625rem'], `px2spacing(26)`)
  assert(px2spacing(27), ['27px', '1.6875rem'], `px2spacing(27)`)
  assert(px2spacing(28), ['7', '1.75rem'], `px2spacing(28)`)
  assert(px2spacing(29), ['7', '1.75rem'], `px2spacing(29)`)
  assert(px2spacing(30), ['8', '2rem'], `px2spacing(30)`)

  assert(
    px2spacing(29, { maxSizeAsPx: 29 }),
    ['29px', '1.8125rem'],
    `px2spacing(29, { maxSizeAsPx: 29 })`
  )
  assert(
    px2spacing(29, { isPxOnly: true }),
    ['29px', '1.8125rem'],
    `px2spacing(29, { isPxOnly: true })`
  )

  assert(px2spacing(21, { maxSizeAsPx: 0 }), ['5', '1.25rem'], `px2spacing(21, { maxSizeAsPx: 0 })`)

  assert(intersect([], []), [], `intersect([], [])`)
  assert(
    intersect([0, 1, 2], [0, 1]),
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
      [2, 0],
      [2, 1],
    ],
    `intersect([0, 1, 2], [0, 1])`
  )
}
