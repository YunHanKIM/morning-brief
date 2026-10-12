import { translateToKorean } from '../../../src/widgets/quote/translate'

const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status })
const ok = (translatedText: string) =>
  json({ responseData: { translatedText, match: 0.85 }, responseStatus: 200 })

describe('translateToKorean', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('MyMemory에 영어→한국어로 요청하고 번역문을 반환한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(ok('아는 사람은 행동한다.'))

    const result = await translateToKorean('Those who know, do.')

    const url = new URL(String(spy.mock.calls[0][0]))
    expect(url.origin + url.pathname).toBe('https://api.mymemory.translated.net/get')
    expect(url.searchParams.get('q')).toBe('Those who know, do.')
    expect(url.searchParams.get('langpair')).toBe('en|ko')
    expect(result).toBe('아는 사람은 행동한다.')
  })

  it('특수문자가 들어간 문장도 검색어 하나로만 인코딩된다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(ok('번역'))

    await translateToKorean('a&langpair=ko|en #x')

    const url = new URL(String(spy.mock.calls[0][0]))
    expect(url.searchParams.get('q')).toBe('a&langpair=ko|en #x')
    expect(url.searchParams.get('langpair')).toBe('en|ko')
  })

  it('5초 타임아웃 신호(AbortSignal)를 함께 전달한다', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(ok('번역'))
    const timeoutSpy = jest.spyOn(AbortSignal, 'timeout')

    await translateToKorean('Hello')

    expect(timeoutSpy).toHaveBeenCalledWith(5000)
    expect(spy.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
  })

  it('번역문 앞뒤 공백을 지운다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(ok('  번역  '))

    expect(await translateToKorean('Hello')).toBe('번역')
  })

  describe('번역을 못 쓰면 던지지 않고 null을 반환한다', () => {
    it('HTTP 오류', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('fail', { status: 500 }))
      expect(await translateToKorean('Hello')).toBeNull()
    })

    it('네트워크 오류', async () => {
      jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))
      expect(await translateToKorean('Hello')).toBeNull()
    })

    it('상태가 200이 아님(하루 한도 초과 429)', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        json({ responseData: { translatedText: 'MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY.' }, responseStatus: 429 }),
      )
      expect(await translateToKorean('Hello')).toBeNull()
    })

    it('상태 코드가 200이어도 번역문이 한도 경고문이면', async () => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(
        ok('MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY.'),
      )
      expect(await translateToKorean('Hello')).toBeNull()
    })

    it.each([
      ['빈 번역', ''],
      ['공백만', '   '],
      ['원문 그대로(번역 안 됨)', 'Hello'],
    ])('%s', async (_name, text) => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(ok(text))
      expect(await translateToKorean('Hello')).toBeNull()
    })

    it.each([
      ['responseData 누락', { responseStatus: 200 }],
      ['번역문이 숫자', { responseData: { translatedText: 1 }, responseStatus: 200 }],
      ['JSON이 배열', []],
    ])('응답 모양이 다르면: %s', async (_name, value) => {
      jest.spyOn(globalThis, 'fetch').mockResolvedValue(json(value))
      expect(await translateToKorean('Hello')).toBeNull()
    })
  })

  it('상태가 문자열 "200"이어도 정상으로 본다', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      json({ responseData: { translatedText: '번역' }, responseStatus: '200' }),
    )
    expect(await translateToKorean('Hello')).toBe('번역')
  })

  it.each([
    ['빈 문자열', ''],
    ['공백만', '   '],
    ['500자 초과', 'a'.repeat(501)],
  ])('번역할 수 없는 입력은 호출 없이 null을 반환한다: %s', async (_name, text) => {
    const spy = jest.spyOn(globalThis, 'fetch')

    expect(await translateToKorean(text)).toBeNull()
    expect(spy).not.toHaveBeenCalled()
  })
})
