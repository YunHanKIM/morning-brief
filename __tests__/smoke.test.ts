describe('jest 환경', () => {
  it('TypeScript 테스트를 실행한다', () => {
    const add = (a: number, b: number): number => a + b
    expect(add(1, 2)).toBe(3)
  })
})
