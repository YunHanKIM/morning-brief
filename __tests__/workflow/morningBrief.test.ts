import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { load } from 'js-yaml'

interface Step {
  name?: string
  uses?: string
  env?: Record<string, string>
  run?: string
}

interface Workflow {
  name: string
  on: { workflow_dispatch: unknown }
  permissions: Record<string, string>
  concurrency: { group: string; 'cancel-in-progress': boolean }
  jobs: Record<string, { 'runs-on': string; 'timeout-minutes': number; steps: Step[] }>
}

const file = readFileSync(join(process.cwd(), '.github', 'workflows', 'morning-brief.yml'), 'utf8')
// 실제 YAML 문법으로 해석한다 (GitHub이 거부할 문법 오류나 잘못된 위치를 글자 매칭으로는 못 잡는다)
const workflow = load(file) as Workflow
const step = workflow.jobs.brief.steps[0]
const script = step.run ?? ''

describe('.github/workflows/morning-brief.yml', () => {
  describe('구조', () => {
    it('올바른 YAML이고 최상위 항목이 정해진 것뿐이다', () => {
      expect(Object.keys(workflow).sort()).toEqual(['concurrency', 'jobs', 'name', 'on', 'permissions'])
    })

    it('job은 brief 하나, 단계는 하나뿐이다', () => {
      expect(Object.keys(workflow.jobs)).toEqual(['brief'])
      expect(workflow.jobs.brief.steps).toHaveLength(1)
      expect(workflow.jobs.brief['runs-on']).toBe('ubuntu-latest')
    })
  })

  describe('언제 실행되나', () => {
    it('예약 실행은 없다 (매일 실행은 Cloudflare Worker가 맡고, 겹치면 Telegram이 중복 전송된다)', () => {
      expect(Object.keys(workflow.on)).not.toContain('schedule')
    })

    it('수동 실행(workflow_dispatch)만 가능하다', () => {
      expect(Object.keys(workflow.on)).toEqual(['workflow_dispatch'])
    })

    it('겹쳐 실행되지 않는다 (같은 그룹, 진행 중인 것을 취소하지 않음)', () => {
      expect(workflow.concurrency).toEqual({ group: 'morning-brief', 'cancel-in-progress': false })
    })

    it('5분 안에 끝난다 (timeout-minutes)', () => {
      expect(workflow.jobs.brief['timeout-minutes']).toBe(5)
    })
  })

  describe('권한과 공급망', () => {
    it('저장소에 대한 권한을 전혀 주지 않는다 (permissions: {})', () => {
      expect(workflow.permissions).toEqual({})
    })

    it('외부 액션(uses:)을 쓰지 않는다 (curl만 사용)', () => {
      for (const s of workflow.jobs.brief.steps) expect(s.uses).toBeUndefined()
    })
  })

  describe('비밀값 다루기', () => {
    it('비밀값은 단계의 env로만 받는다', () => {
      expect(step.env).toEqual({
        BRIEF_URL: '${{ secrets.BRIEF_URL }}',
        CRON_SECRET: '${{ secrets.CRON_SECRET }}',
      })
    })

    it('스크립트 본문에는 ${{ }} 식을 넣지 않는다 (스크립트 주입 방지)', () => {
      expect(script).not.toContain('${{')
    })

    it('비밀값을 로그로 찍지 않는다 (echo·set -x·verbose 없음)', () => {
      expect(script).not.toMatch(/echo[^\n]*\$\{?CRON_SECRET/)
      expect(script).not.toMatch(/set -[a-z]*x/)
      expect(script).not.toMatch(/--verbose|\s-v\s|--trace/)
    })

    it('비밀값이 파일에 직접 적혀 있지 않다', () => {
      expect(file).not.toMatch(/Bearer [A-Za-z0-9]{16,}/)
    })
  })

  describe('호출', () => {
    it('Bearer 토큰으로 /api/cron/brief를 POST한다', () => {
      expect(script).toMatch(/--request POST/)
      expect(script).toContain('/api/cron/brief')
      expect(script).toContain('Authorization: Bearer ${CRON_SECRET}')
    })

    it('HTTP 오류(401·500·502)면 작업이 실패로 끝나고 응답 본문은 로그에 남긴다', () => {
      expect(script).toContain('--fail-with-body')
      expect(script).toMatch(/set -euo pipefail/)
    })

    it('시간 제한이 있다 (--max-time)', () => {
      expect(script).toMatch(/--max-time \d+/)
    })

    it('재시도하지 않는다 (재시도하면 이미 성공한 Telegram이 중복 전송된다)', () => {
      expect(script).not.toMatch(/--retry|until |while |for /)
    })

    it('설정이 빠졌거나 https가 아닌 주소면 호출 전에 실패한다', () => {
      expect(script).toMatch(/-z "\$BRIEF_URL"/)
      expect(script).toMatch(/-z "\$CRON_SECRET"/)
      expect(script).toMatch(/https:\/\/\*/)
    })

    it('주소 끝의 슬래시가 있어도 경로가 겹치지 않는다', () => {
      expect(script).toContain('${BRIEF_URL%/}/api/cron/brief')
    })
  })
})
