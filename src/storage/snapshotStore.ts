import { z } from 'zod'
import type { Brief } from '../brief/generateBrief'

// 하루치 브리핑(스냅샷)을 넣고 꺼내는 세 동작. 저장소가 무엇이든(Upstash, 메모리) 이 모양만 지키면 된다
export interface SnapshotStore {
  save(brief: Brief): Promise<void>
  get(date: string): Promise<Brief | null>
  // 최근 날짜부터 limit개
  listDates(limit: number): Promise<string[]>
}

const dateSchema = z.iso.date()

// 실제로 존재하는 YYYY-MM-DD만 통과한다. 저장소 키에 들어가는 값이라 엄격하게 본다
export function isValidDate(value: unknown): value is string {
  return dateSchema.safeParse(value).success
}

export function assertDate(value: unknown): asserts value is string {
  if (!isValidDate(value)) throw new Error('올바르지 않은 날짜입니다')
}

export function assertLimit(value: number): void {
  if (!Number.isInteger(value) || value < 1) throw new Error('올바르지 않은 개수입니다')
}
