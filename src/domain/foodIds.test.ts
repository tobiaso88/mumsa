import { customFoodId, idMatchesSource, isSlvFoodId, offFoodId, slvFoodId } from './foodIds'

describe('livsmedels-id', () => {
  it('har källan som prefix', () => {
    expect(slvFoodId(702)).toBe('slv:702')
    expect(offFoodId('7310865000018')).toBe('off:7310865000018')
    expect(customFoodId('abc')).toBe('custom:abc')
  })
  it('känner igen Livsmedelsverkets id', () => {
    expect(isSlvFoodId(slvFoodId(1))).toBe(true)
    expect(isSlvFoodId(offFoodId('123456'))).toBe(false)
    expect(isSlvFoodId(customFoodId('slv:1'))).toBe(false)
  })
  it('kontrollerar att prefixet stämmer med källan', () => {
    expect(idMatchesSource(customFoodId('abc'), 'custom')).toBe(true)
    expect(idMatchesSource(offFoodId('123456'), 'off')).toBe(true)
    expect(idMatchesSource(slvFoodId(1), 'slv')).toBe(true)
    expect(idMatchesSource('slv:1', 'custom')).toBe(false)
    expect(idMatchesSource('food-1', 'custom')).toBe(false)
    expect(idMatchesSource('custom:', 'custom')).toBe(false)
  })
})
