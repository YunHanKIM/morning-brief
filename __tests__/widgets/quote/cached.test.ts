import { cacheLife } from 'next/cache'
import { getKoreanTranslation, getTodayQuote } from '../../../src/widgets/quote/cached'

// cacheLife는 Next 런타임 밖(Jest)에서 던지므로 가짜로 바꾸고 어떤 유효 기간을 골랐는지만 본다
jest.mock('next/cache', () => ({ cacheLife: jest.fn() }))
const cacheLifeMock = jest.mocked(cacheLife)

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })
const quoteBody = [{ q: 'Those who know, do.', a: 'Aristotle' }]
const translationBody = { responseData: { translatedText: '아는 사람은 행동한다.' }, responseStatus: 200 }

describe('getTodayQuote', () => {
  beforeEach(() => cacheLifeMock.mockClear())
  afterEach(() => jest.restoreAllMocks())

  it('성공하면 명언을 반환하고 몇 시간 동안 저장한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(json(quoteBody))

    expect(await getTodayQuote()).toEqual({ quote: 'Those who know, do.', author: 'Aristotle' })
    expect(cacheLifeMock).toHaveBeenCalledTimes(1)
    expect(cacheLifeMock).toHaveBeenCalledWith('hours')
  })

  it('실패하면 던지지 않고 null을 반환하며 아주 짧게만 저장한다 (한도 초과 시 계속 두드리지 않도록)', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('slow down', { status: 429 }))

    expect(await getTodayQuote()).toBeNull()
    expect(cacheLifeMock).toHaveBeenCalledTimes(1)
    expect(cacheLifeMock).toHaveBeenCalledWith('minutes')
  })
})

describe('getKoreanTranslation', () => {
  beforeEach(() => cacheLifeMock.mockClear())
  afterEach(() => jest.restoreAllMocks())

  it('번역에 성공하면 번역문을 반환하고 하루 동안 저장한다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(json(translationBody))

    expect(await getKoreanTranslation('Those who know, do.')).toBe('아는 사람은 행동한다.')
    expect(cacheLifeMock).toHaveBeenCalledTimes(1)
    expect(cacheLifeMock).toHaveBeenCalledWith('days')
  })

  it('번역에 실패하면 null을 반환하고 짧게만 저장한다 (일시적 실패가 하루 동안 굳지 않도록)', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))

    expect(await getKoreanTranslation('Those who know, do.')).toBeNull()
    expect(cacheLifeMock).toHaveBeenCalledTimes(1)
    expect(cacheLifeMock).toHaveBeenCalledWith('minutes')
  })
})
