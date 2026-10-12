// 한국 시간 기준 날짜 YYYY-MM-DD (sv-SE 로케일이 이 형식으로 출력한다)
export function kstDate(now: Date): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(now)
}
