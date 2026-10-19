import type { ReactNode } from 'react'

// 모든 화면이 공유하는 바깥 틀: 신문 제호 같은 머리말 + 내용
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-10 sm:px-8">
      <header className="border-b-4 border-double border-ink pb-3">
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Morning Brief</h1>
        <p className="mt-2 text-sm text-muted">오늘 아침 알아둘 것을 한 장으로</p>
      </header>
      {children}
    </main>
  )
}
