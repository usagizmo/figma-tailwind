figma.showUI(__html__)

type SceneNodeSet = [SceneNode, SceneNode]
type Spacing = [string, string]

const DEFAULT_MAX_SIZE_AS_PX = 28

const is = (a, b) => JSON.stringify(a) === JSON.stringify(b)

type GetSpacingPayload = {
  maxSizeAsPx?: number
  isPxOnly?: boolean
}

const px2spacing = (px: number, { maxSizeAsPx, isPxOnly }: GetSpacingPayload = {}): Spacing => {
  maxSizeAsPx = maxSizeAsPx || DEFAULT_MAX_SIZE_AS_PX
  isPxOnly = isPxOnly === true

  if (px === 0) {
    return ['0', '0']
  }
  if ((px <= maxSizeAsPx && px % 4 !== 0) || isPxOnly) {
    return [`${px}px`, `${px / 16}rem`]
  }
  const unit = Math.round(px / 4)
  return [`${unit}`, `${(unit * 4) / 16}rem`]
}

const intersect = <T>(as: T[], bs: T[]): [T, T][] =>
  (as.map((a) => bs.map((b) => [a, b])) as any).flat()

const updateList = (list, spacing) => {
  list[spacing[0]] = spacing[1]
}

const getSpacings = (nodes, payload: GetSpacingPayload) => {
  const list = {}
  nodes.forEach((node) => {
    updateList(list, px2spacing(node.width, payload))
    updateList(list, px2spacing(node.height, payload))
  })

  const nodeSets = intersect(nodes, nodes)
  nodeSets.forEach(([a, b]: SceneNodeSet) => {
    if (is(a, b)) {
      return
    }
    const diffX = Math.abs(b.x - a.x)
    const diffY = Math.abs(b.y - a.y)
    updateList(list, px2spacing(diffX, payload))
    updateList(list, px2spacing(Math.abs(diffX - a.width), payload))
    updateList(list, px2spacing(diffY, payload))
    updateList(list, px2spacing(Math.abs(diffY - a.height), payload))
  })

  return list
}

figma.ui.onmessage = ({ type, payload }) => {
  if (type === 'get-spacings') {
    const spacings = getSpacings(figma.currentPage.selection, payload)
    figma.ui.postMessage({ type: 'result', payload: { spacings } })
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
console.assert(is(px2spacing(0), ['0', '0']), `px2spacing(0) => ['0', '0']`)
console.assert(is(px2spacing(1), ['1px', '0.0625rem']), `px2spacing(1) => ['1px', '0.0625rem']`)
console.assert(is(px2spacing(2), ['2px', '0.125rem']), `px2spacing(2) => ['2px', '0.125rem']`)
console.assert(is(px2spacing(3), ['3px', '0.1875rem']), `px2spacing(3) => ['3px', '0.1875rem']`)
console.assert(is(px2spacing(4), ['1', '0.25rem']), `px2spacing(4) => ['1', '0.25rem']`)
console.assert(is(px2spacing(26), ['26px', '1.625rem']), `px2spacing(26) => ['26px', '1.625rem']`)
console.assert(is(px2spacing(27), ['27px', '1.6875rem']), `px2spacing(27) => ['27px', '1.6875rem']`)
console.assert(is(px2spacing(28), ['7', '1.75rem']), `px2spacing(28) => ['7', '1.75rem']`)
console.assert(is(px2spacing(29), ['7', '1.75rem']), `px2spacing(29) => ['7', '1.75rem']`)
console.assert(is(px2spacing(30), ['8', '2rem']), `px2spacing(30) => ['8', '2rem']`)

console.assert(
  is(px2spacing(29, { maxSizeAsPx: 29 }), ['29px', '1.8125rem']),
  `px2spacing(29, { maxSizeAsPx: 29 }) => ['29px', '1.8125rem']`
)
console.assert(
  is(px2spacing(29, { isPxOnly: true }), ['29px', '1.8125rem']),
  `px2spacing(29, { isPxOnly: true }) => ['29px', '1.8125rem']`
)

console.assert(is(intersect([], []), []), `intersect([], []) => []`)
console.assert(
  is(intersect([0, 1, 2], [0, 1]), [
    [0, 0],
    [0, 1],
    [1, 0],
    [1, 1],
    [2, 0],
    [2, 1],
  ]),
  `intersect([0, 1, 2], [0, 1]) => [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]]`
)
