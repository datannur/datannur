import escapeHtml from 'escape-html'
import markdownRender from '@lib/markdown'
import Render from '@lib/render'
import { getEntityName } from '@i18n/constant-labels'
import { entityNames, entityToIcon } from '@lib/constant'
import { getLinkUrl } from '@lib/url'

type DiagramNode = {
  id: string
  label: string
  entity?: string
  recursive?: boolean
  href?: string
}

type DiagramEdge = {
  from: string
  to: string
  type: 'directed' | 'bidirectional' | 'dotted'
  label?: string
}

type Diagram = {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
  direction: 'LR' | 'TB'
}

type PositionedNode = DiagramNode & {
  x: number
  y: number
  width: number
  height: number
}

type LayoutSize = {
  nodeWidth: number
  nodeHeight: number
  horizontalGap: number
  verticalGap: number
  minNodeWidth?: number
  maxNodeWidth?: number
}

type Point = {
  x: number
  y: number
}

const defaultLayoutSize: LayoutSize = {
  nodeWidth: 164,
  nodeHeight: 56,
  horizontalGap: 112,
  verticalGap: 92,
  minNodeWidth: 132,
  maxNodeWidth: 240,
}
const compactLayoutSize: LayoutSize = {
  nodeWidth: 124,
  nodeHeight: 34,
  horizontalGap: 54,
  verticalGap: 54,
  minNodeWidth: 88,
  maxNodeWidth: 138,
}
const pairLayoutSize: LayoutSize = {
  nodeWidth: 124,
  nodeHeight: 34,
  horizontalGap: 60,
  verticalGap: 36,
  minNodeWidth: 88,
  maxNodeWidth: 138,
}
const padding = 36
const entityOrder = [
  'organization',
  'folder',
  'tag',
  'concept',
  'dataset',
  'variable',
  'enumeration',
  'value',
  'frequency',
  'doc',
]
const edgePattern =
  /^(.+?)\s+(<--\s*(.*?)\s*-->|<-->|--\s*(.*?)\s*-->|-->|-.->)\s+(.+)$/
const edgeSplitPattern =
  /\s+(?:<--\s*.*?\s*-->|<-->|--\s*.*?\s*-->|-->|-.->)\s+/

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function renderMarkdown(markdown: string): string {
  const html = markdownRender(markdown)
  if (typeof html === 'string') return html
  throw new Error('Async markdown rendering is not supported here')
}

function parseNodeRef(rawValue: string): DiagramNode {
  const raw = rawValue.trim()
  const entityMatch = raw.match(/^\$([a-zA-Z][\w-]*)(?:\s+\$recursive)?$/)
  if (entityMatch) {
    const entity = entityMatch[1]
    return {
      id: entity,
      entity,
      label:
        entity in entityNames
          ? getEntityName(entity as keyof typeof entityNames)
          : entity,
      recursive: raw.includes('$recursive'),
      href: `metaDataset/${entity}`,
    }
  }

  const labelMatch = raw.match(/^([a-zA-Z][\w-]*)\["(.+)"\]$/)
  if (labelMatch) {
    return { id: labelMatch[1], label: labelMatch[2] }
  }

  const cleanId = raw.replaceAll('$', '').replace(/[^a-zA-Z0-9_-]/g, '')
  return { id: cleanId, label: cleanId }
}

function getEdge(rawLine: string): DiagramEdge | null {
  const line = rawLine.trim().replace(/;$/, '')
  const match = line.match(edgePattern)
  if (!match) return null

  const from = parseNodeRef(match[1]).id
  const to = parseNodeRef(match[5]).id
  const operator = match[2]
  const label = cleanEdgeLabel((match[3] ?? match[4])?.trim())
  if (operator === '<-->' || operator.startsWith('<--')) {
    return { from, to, type: 'bidirectional', label }
  }
  if (operator === '-.->') return { from, to, type: 'dotted', label }
  return { from, to, type: 'directed', label }
}

function cleanEdgeLabel(label: string | undefined): string | undefined {
  if (!label) return undefined
  return label
    .replaceAll('manager', getEntityName('manager'))
    .replaceAll('owner', getEntityName('owner'))
}

export function parseSimpleDiagram(code: string): Diagram {
  const nodesById: { [id: string]: DiagramNode } = {}
  const edges: DiagramEdge[] = []
  let direction: Diagram['direction'] = 'LR'

  for (const rawLine of code.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.startsWith('flowchart ')) {
      direction = line.includes('TB') ? 'TB' : 'LR'
      continue
    }

    const edge = getEdge(line)
    if (edge) {
      const parts = line
        .replace(/;$/, '')
        .split(edgeSplitPattern)
        .filter(part => part !== undefined)
      for (const part of parts) {
        const node = parseNodeRef(part)
        nodesById[node.id] = { ...nodesById[node.id], ...node }
      }
      edges.push(edge)
      continue
    }

    const node = parseNodeRef(line)
    if (node.id) nodesById[node.id] = { ...nodesById[node.id], ...node }
  }

  return { nodes: Object.values(nodesById), edges, direction }
}

function getNodeLevel(
  nodeId: string,
  edges: DiagramEdge[],
  cache: { [id: string]: number } = {},
  visited: string[] = [],
): number {
  if (nodeId in cache) return cache[nodeId]
  if (visited.includes(nodeId)) return 0

  const incoming = edges.filter(
    edge => edge.to === nodeId && edge.from !== nodeId,
  )
  if (incoming.length === 0) {
    cache[nodeId] = 0
    return 0
  }

  const level = Math.min(
    3,
    Math.max(
      ...incoming.map(
        edge => getNodeLevel(edge.from, edges, cache, [...visited, nodeId]) + 1,
      ),
    ),
  )
  cache[nodeId] = level
  return level
}

function getLayoutSize(diagram: Diagram): LayoutSize {
  if (diagram.nodes.length === 2) return pairLayoutSize
  return diagram.nodes.length <= 5 ? compactLayoutSize : defaultLayoutSize
}

function layoutColumnX(
  index: number,
  nodeWidth: number,
  width: number,
): number {
  return padding + index * nodeWidth + (nodeWidth - width) / 2
}

function getLayoutDirection(diagram: Diagram): Diagram['direction'] {
  return diagram.nodes.length === 2 ? 'LR' : diagram.direction
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getNodeWidth(node: DiagramNode, layoutSize: LayoutSize): number {
  const isCompact = layoutSize.nodeHeight <= compactLayoutSize.nodeHeight
  const iconWidth =
    node.entity && node.entity in entityToIcon ? (isCompact ? 16 : 24) : 0
  const recursiveWidth = node.recursive ? (isCompact ? 14 : 22) : 0
  const textWidth = node.label.length * (isCompact ? 6.2 : 8.2)
  const contentWidth =
    textWidth + iconWidth + recursiveWidth + (isCompact ? 34 : 40)
  return clamp(
    contentWidth,
    layoutSize.minNodeWidth ?? layoutSize.nodeWidth,
    layoutSize.maxNodeWidth ?? layoutSize.nodeWidth,
  )
}

function getLayout(diagram: Diagram): PositionedNode[] {
  const layoutDirection = getLayoutDirection(diagram)
  const layoutSize = getLayoutSize(diagram)
  const { nodeWidth, nodeHeight, horizontalGap, verticalGap } = layoutSize
  const nodeIds = diagram.nodes.map(node => node.id)
  const knownEntityIds = entityOrder.filter(entity => nodeIds.includes(entity))
  const otherIds = nodeIds.filter(id => !knownEntityIds.includes(id))

  if (diagram.nodes.length >= 7 && knownEntityIds.length >= 7) {
    const positions: { [id: string]: [number, number] } = {
      organization: [5, 0],
      folder: [5, 1],
      dataset: [4, 2],
      tag: [5, 4],
      doc: [4, 5],
      concept: [3, 2],
      variable: [2, 3],
      enumeration: [1, 4],
      value: [1, 5],
      frequency: [0, 4],
    }
    return diagram.nodes.map(node => {
      const [col, row] = positions[node.id] ?? [0, 0]
      const width = getNodeWidth(node, layoutSize)
      return {
        ...node,
        x: padding + col * (nodeWidth + horizontalGap),
        y: padding + row * (nodeHeight + verticalGap),
        width,
        height: nodeHeight,
      }
    })
  }

  const groupedIds = new Map<number, string[]>()
  const levelCache: { [id: string]: number } = {}
  for (const id of [...knownEntityIds, ...otherIds]) {
    const level = getNodeLevel(id, diagram.edges, levelCache)
    groupedIds.set(level, [...(groupedIds.get(level) ?? []), id])
  }

  const positionedNodes: PositionedNode[] = []
  const sortedGroups = [...groupedIds.entries()].sort(([a], [b]) => a - b)
  for (const [level, ids] of sortedGroups) {
    ids.forEach((id, row) => {
      const node = diagram.nodes.find(item => item.id === id)
      if (!node) return
      const width = getNodeWidth(node, layoutSize)
      const rowOffset = ((ids.length - 1) * (nodeWidth + horizontalGap)) / 2
      positionedNodes.push({
        ...node,
        x:
          layoutDirection === 'TB'
            ? layoutColumnX(row, nodeWidth + horizontalGap, width) -
              rowOffset +
              2 * (nodeWidth + horizontalGap)
            : layoutColumnX(level, nodeWidth + horizontalGap, width),
        y:
          layoutDirection === 'TB'
            ? padding + level * (nodeHeight + verticalGap)
            : padding + row * (nodeHeight + verticalGap),
        width,
        height: nodeHeight,
      })
    })
  }
  return positionedNodes
}

function normalizeLayout(nodes: PositionedNode[]): PositionedNode[] {
  if (nodes.length === 0) return nodes
  const minX = Math.min(...nodes.map(node => node.x))
  const minY = Math.min(...nodes.map(node => node.y))
  return nodes.map(node => ({
    ...node,
    x: node.x - minX + padding,
    y: node.y - minY + padding,
  }))
}

function colorKey(node: DiagramNode): string {
  if (node.entity && node.entity in entityToIcon) return node.entity
  return 'diagram'
}

function nodeHtml(node: DiagramNode): string {
  const iconName = node.entity && node.entity in entityToIcon ? node.entity : ''
  const icon = iconName ? Render.icon(iconName) : ''
  const recursiveIcon = node.recursive ? ' ' + Render.icon('recursive') : ''
  return `${icon}<span>${escapeHtml(node.label)}</span>${recursiveIcon}`
}

function nodeIdClass(node: DiagramNode): string {
  return node.id.replace(/[^a-zA-Z0-9_-]/g, '')
}

function getNodeCenter(node: PositionedNode): Point {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  }
}

function getEdgePoints(
  edge: DiagramEdge,
  nodes: PositionedNode[],
  direction: Diagram['direction'],
  edges: DiagramEdge[],
) {
  const from = nodes.find(node => node.id === edge.from)
  const to = nodes.find(node => node.id === edge.to)
  if (!from || !to) return undefined

  const fromCenter = getNodeCenter(from)
  const toCenter = getNodeCenter(to)
  const deltaX = toCenter.x - fromCenter.x
  const deltaY = toCenter.y - fromCenter.y
  if (direction === 'TB') {
    const startY =
      fromCenter.y + (deltaY >= 0 ? from.height / 2 : -from.height / 2)
    const endY = toCenter.y + (deltaY >= 0 ? -to.height / 2 : to.height / 2)
    const outgoingEdges = edges
      .filter(item => item.from === edge.from)
      .map(item => ({
        edge: item,
        to: nodes.find(node => node.id === item.to),
      }))
      .filter(
        (item): item is { edge: DiagramEdge; to: PositionedNode } =>
          item.to !== undefined &&
          Math.sign(getNodeCenter(item.to).y - fromCenter.y) ===
            Math.sign(deltaY),
      )
      .sort((a, b) => getNodeCenter(a.to).x - getNodeCenter(b.to).x)
    const incomingEdges = edges
      .filter(item => item.to === edge.to)
      .map(item => ({
        edge: item,
        from: nodes.find(node => node.id === item.from),
      }))
      .filter(
        (item): item is { edge: DiagramEdge; from: PositionedNode } =>
          item.from !== undefined &&
          Math.sign(toCenter.y - getNodeCenter(item.from).y) ===
            Math.sign(deltaY),
      )
      .sort((a, b) => getNodeCenter(a.from).x - getNodeCenter(b.from).x)
    const outgoingIndex = outgoingEdges.findIndex(item => item.edge === edge)
    const incomingIndex = incomingEdges.findIndex(item => item.edge === edge)
    const startStep = Math.min(
      32,
      from.width / Math.max(3, outgoingEdges.length + 1),
    )
    const endStep = Math.min(
      32,
      to.width / Math.max(3, incomingEdges.length + 1),
    )
    const startOffset =
      outgoingIndex >= 0
        ? (outgoingIndex - (outgoingEdges.length - 1) / 2) * startStep
        : 0
    const endOffset =
      incomingIndex >= 0
        ? (incomingIndex - (incomingEdges.length - 1) / 2) * endStep
        : 0
    return {
      start: { x: fromCenter.x + startOffset, y: startY },
      end: { x: toCenter.x + endOffset, y: endY },
      horizontal: false,
    }
  }

  const horizontal = Math.abs(deltaX) >= Math.abs(deltaY)

  if (horizontal) {
    const startX =
      fromCenter.x + (deltaX >= 0 ? from.width / 2 : -from.width / 2)
    const endX = toCenter.x + (deltaX >= 0 ? -to.width / 2 : to.width / 2)
    return {
      start: { x: startX, y: fromCenter.y },
      end: { x: endX, y: toCenter.y },
      horizontal,
    }
  }

  const startY =
    fromCenter.y + (deltaY >= 0 ? from.height / 2 : -from.height / 2)
  const endY = toCenter.y + (deltaY >= 0 ? -to.height / 2 : to.height / 2)
  return {
    start: { x: fromCenter.x, y: startY },
    end: { x: toCenter.x, y: endY },
    horizontal,
  }
}

function getParallelOffset(edge: DiagramEdge, nodes: PositionedNode[]): number {
  const from = nodes.find(node => node.id === edge.from)
  const to = nodes.find(node => node.id === edge.to)
  if (!from || !to) return 0

  const fromCenter = getNodeCenter(from)
  const toCenter = getNodeCenter(to)
  const deltaX = toCenter.x - fromCenter.x
  const deltaY = toCenter.y - fromCenter.y
  if (Math.abs(deltaX) >= Math.abs(deltaY)) return 0

  if (edge.type === 'bidirectional') return 34
  if (Math.abs(deltaX) < from.width * 0.55) return -34
  return 0
}

function edgePath(
  edge: DiagramEdge,
  nodes: PositionedNode[],
  direction: Diagram['direction'],
  edges: DiagramEdge[],
): string {
  const from = nodes.find(node => node.id === edge.from)
  if (from && edge.from === edge.to) {
    const start = { x: from.x + from.width * 0.68, y: from.y }
    const end = { x: from.x + from.width * 0.68, y: from.y + from.height }
    const curveX = from.x + from.width + 76
    return `M ${start.x} ${start.y} C ${curveX} ${from.y - 30}, ${curveX} ${from.y + from.height + 30}, ${end.x} ${end.y}`
  }

  const points = getEdgePoints(edge, nodes, direction, edges)
  if (!points) return ''

  const { start, end, horizontal } = points
  if (horizontal) {
    const curve = Math.max(28, Math.abs(end.x - start.x) * 0.42)
    const direction = end.x >= start.x ? 1 : -1
    return `M ${start.x} ${start.y} C ${start.x + curve * direction} ${start.y}, ${end.x - curve * direction} ${end.y}, ${end.x} ${end.y}`
  }

  const offset = getParallelOffset(edge, nodes)
  if (offset) {
    const direction = end.y >= start.y ? 1 : -1
    return `M ${start.x} ${start.y} C ${start.x + offset} ${start.y + 34 * direction}, ${end.x + offset} ${end.y - 34 * direction}, ${end.x} ${end.y}`
  }

  const curve = Math.max(28, Math.abs(end.y - start.y) * 0.42)
  const verticalDirection = end.y >= start.y ? 1 : -1
  return `M ${start.x} ${start.y} C ${start.x} ${start.y + curve * verticalDirection}, ${end.x} ${end.y - curve * verticalDirection}, ${end.x} ${end.y}`
}

function labelPosition(
  edge: DiagramEdge,
  nodes: PositionedNode[],
  direction: Diagram['direction'],
  edges: DiagramEdge[],
): [number, number] | null {
  const from = nodes.find(node => node.id === edge.from)
  const to = nodes.find(node => node.id === edge.to)
  if (!from || !to) return null
  if (edge.from === edge.to) {
    return [from.x + from.width + 58, from.y + from.height / 2]
  }
  const points = getEdgePoints(edge, nodes, direction, edges)
  if (!points) return null
  const fromCenter = getNodeCenter(from)
  const toCenter = getNodeCenter(to)
  const isFlatLink = Math.abs(toCenter.y - fromCenter.y) < from.height * 0.7
  if (points.horizontal && isFlatLink) {
    return [
      (points.start.x + points.end.x) / 2,
      Math.min(points.start.y, points.end.y) - 12,
    ]
  }
  return [
    (points.start.x + points.end.x) / 2,
    (points.start.y + points.end.y) / 2 - 14,
  ]
}

export function renderSimpleDiagram(code: string): string {
  const diagram = parseSimpleDiagram(code)
  const layoutDirection = getLayoutDirection(diagram)
  const nodes = normalizeLayout(getLayout(diagram))
  const { nodeWidth, nodeHeight } = getLayoutSize(diagram)
  const hasLabeledSelfLoop = diagram.edges.some(
    edge => edge.from === edge.to && edge.label,
  )
  const maxX = Math.max(...nodes.map(node => node.x + node.width), nodeWidth)
  const maxY = Math.max(...nodes.map(node => node.y + node.height), nodeHeight)
  const width = maxX + padding + (hasLabeledSelfLoop ? 128 : 0)
  const height = maxY + padding
  const compactClass =
    diagram.nodes.length <= 5 ? ' simple-diagram-compact' : ''
  const edgeIds = unique(
    diagram.edges.map(edge =>
      colorKey(
        nodes.find(node => node.id === edge.from) ?? {
          id: edge.from,
          label: edge.from,
        },
      ),
    ),
  )

  const markers = edgeIds
    .map(
      id =>
        `<marker id="arrow-${id}" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto"><path class="simple-diagram-arrow simple-diagram-arrow-${id}" d="M 0 0 L 6 3 L 0 6 z" /></marker><marker id="arrow-start-${id}" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto-start-reverse"><path class="simple-diagram-arrow simple-diagram-arrow-${id}" d="M 0 0 L 6 3 L 0 6 z" /></marker>`,
    )
    .join('')

  const edgeSvg = diagram.edges
    .map(edge => {
      const path = edgePath(edge, nodes, layoutDirection, diagram.edges)
      const fromNode = nodes.find(node => node.id === edge.from)
      const color = colorKey(fromNode ?? { id: edge.from, label: edge.from })
      const markerEnd =
        edge.type === 'directed' || edge.type === 'dotted'
          ? ` marker-end="url(#arrow-${color})"`
          : ''
      const markerStart =
        edge.type === 'bidirectional'
          ? ` marker-start="url(#arrow-start-${color})" marker-end="url(#arrow-${color})"`
          : ''
      const dotted = edge.type === 'dotted' ? ' simple-diagram-edge-dotted' : ''
      return `<path class="simple-diagram-edge simple-diagram-edge-${color}${dotted}" d="${path}"${markerEnd}${markerStart} />`
    })
    .join('')

  const labelSvg = diagram.edges
    .map(edge => {
      const labelPos = edge.label
        ? labelPosition(edge, nodes, layoutDirection, diagram.edges)
        : null
      const labelText = edge.label ?? ''
      const labelWidth = Math.max(92, Math.min(170, labelText.length * 6 + 20))
      const labelHeight = 20
      return labelPos
        ? `<rect class="simple-diagram-label-bg" x="${labelPos[0] - labelWidth / 2}" y="${labelPos[1] - labelHeight / 2}" width="${labelWidth}" height="${labelHeight}" rx="10" ry="10" /><text class="simple-diagram-label-text" x="${labelPos[0]}" y="${labelPos[1]}" text-anchor="middle" dominant-baseline="middle">${escapeHtml(labelText)}</text>`
        : ''
    })
    .join('')

  const nodeSvg = nodes
    .map(node => {
      const color = colorKey(node)
      const content = nodeHtml(node)
      const nodeContent = `<foreignObject x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"><div xmlns="http://www.w3.org/1999/xhtml" class="simple-diagram-node simple-diagram-node-${color} simple-diagram-node-id-${nodeIdClass(node)}">${content}</div></foreignObject>`
      if (!node.href) return nodeContent
      const href = escapeHtml(node.href)
      const url = escapeHtml(getLinkUrl(node.href))
      return `<a class="internal-link" data-href="${href}" href="${url}">${nodeContent}</a>`
    })
    .join('')

  return `<svg class="simple-diagram${compactClass}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img"><defs>${markers}</defs>${edgeSvg}${labelSvg}${nodeSvg}</svg>`
}

function splitMermaidParts(mdWithDiagram: string): string[] {
  const parts: string[] = []
  for (const partLevel1 of mdWithDiagram.split('mermaid(')) {
    for (const partLevel2 of partLevel1.split('```mermaid')) {
      parts.push(partLevel2)
    }
  }
  return parts
}

export function mdWithSimpleDiagramToHtml(mdWithDiagram: string): string {
  let content = ''
  const parts = splitMermaidParts(mdWithDiagram)
  if (parts.length === 1) return renderMarkdown(parts[0])

  let partNum = 0
  for (const part of parts) {
    partNum += 1
    if (partNum === 1) {
      content += renderMarkdown(part)
      continue
    }

    let separator = '```'
    let diagramCodePrefix = ''
    if (part.includes(');')) {
      separator = ');'
      diagramCodePrefix = 'flowchart TB\n'
    }
    const [diagramCode, markdownCode] = part.split(separator)
    content += `<div class="simple-diagram-block">${renderSimpleDiagram(diagramCodePrefix + diagramCode)}</div>`
    content += renderMarkdown(markdownCode)
  }
  return content
}
