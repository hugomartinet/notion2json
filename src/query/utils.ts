import type { PartitionOptions } from './types'

export function getPartitionBetween(a: number, b: number, count: number = 10) {
  const [min, max] = [Math.min(a, b), Math.max(a, b)]
  if (count <= 0) return [min, max]
  const step = (max - min) / (count + 1)

  const steps = [min]
  for (let i = 1; i <= count; i++) {
    steps.push(Math.round(min + i * step))
  }
  steps.push(max)
  return steps
}

export function getDecreasingSizePartitionBetween(a: number, b: number, options?: PartitionOptions) {
  const exponent = options?.decreaseRatio || 2
  const relativeSquaredSteps = getPartitionBetween(0, (b - a) ** exponent, options?.count)
  return relativeSquaredSteps.map(step => a + Math.round(step ** (1 / exponent)))
}

export function getIntervals<T>(steps: T[]) {
  if (steps.length < 2) throw new Error('Cannot get interval from less than 2 steps')
  return steps.slice(0, -1).map((step, index) => [step, steps[index + 1]])
}
