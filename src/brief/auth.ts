import { createHash, timingSafeEqual } from 'node:crypto'

const digest = (value: string) => createHash('sha256').update(value).digest()

// 비밀값과 토큰을 같은 길이의 해시로 바꿔 상수 시간으로 비교한다 (길이·내용 차이가 응답 시간에 드러나지 않게)
function sameSecret(token: string, secret: string): boolean {
  return timingSafeEqual(digest(token), digest(secret))
}

// `Authorization: Bearer <토큰>` 헤더가 비밀값과 같은지.
// 토큰은 공백 없는 한 글자 이상이라, 비밀값이 비어 있으면 어떤 헤더도 통과하지 못한다
export function isAuthorized(authorization: string | null, secret: string): boolean {
  const match = authorization?.match(/^bearer ([^\s]+)$/i)
  if (!match) return false
  return sameSecret(match[1], secret)
}
