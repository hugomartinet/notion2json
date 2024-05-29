import { describe, it, expect } from 'bun:test'
import { getDecreasingSizePartitionBetween, getIntervals, getPartitionBetween } from './utils'

describe('getPartitionBetween()', () => {
  it('returns boundaries if count is negative', () => {
    const result = getPartitionBetween(10, 20, -1)
    expect(result).toEqual([10, 20])
  })

  it('returns boundaries if count equals 0', () => {
    const result = getPartitionBetween(10, 20, 0)
    expect(result).toEqual([10, 20])
  })

  it('orders boundaries', () => {
    const result = getPartitionBetween(20, 10, 0)
    expect(result).toEqual([10, 20])
  })

  it('splits array in steps', () => {
    const result = getPartitionBetween(10, 20, 1)
    expect(result).toEqual([10, 15, 20])
  })

  it('splits array in multiple steps', () => {
    const result = getPartitionBetween(10, 20, 9)
    expect(result).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
  })

  it('returns only integer steps', () => {
    const result = getPartitionBetween(10, 40, 7)
    expect(result).toEqual([10, 14, 18, 21, 25, 29, 33, 36, 40])
  })
})

describe('getDecreasingSizePartitionBetween()', () => {
  it('returns steps of decreasing interval', () => {
    const result = getDecreasingSizePartitionBetween(10, 100, { decreaseRatio: 2, count: 8 })
    expect(result).toEqual([10, 40, 52, 62, 70, 77, 83, 89, 95, 100])
  })

  it('changes decresing rate with exponent', () => {
    const result = getDecreasingSizePartitionBetween(10, 100, { decreaseRatio: 3, count: 8 })
    expect(result).toEqual([10, 53, 65, 72, 79, 84, 89, 93, 97, 100])
  })

  it('still decreases step size considerably when min and max are big numbers', () => {
    const result = getDecreasingSizePartitionBetween(10000000, 20000000, { decreaseRatio: 2, count: 8 })
    expect(result).toEqual([10000000, 13333333, 14714045, 15773503, 16666667, 17453560, 18164966, 18819171, 19428090, 20000000])
  })
})

describe('getIntervals()', () => {
  it('returns intervals between steps', () => {
    const result = getIntervals(['a', 'b', 'c', 'd'])
    expect(result).toEqual([
      ['a', 'b'],
      ['b', 'c'],
      ['c', 'd'],
    ])
  })

  it('throws if less than 2 steps', () => {
    expect(() => getIntervals(['a'])).toThrow()
  })
})
