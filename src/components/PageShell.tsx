import type { ReactNode } from 'react'

// 모든 화면이 공유하는 바깥 틀: 제목 + 내용
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Morning Brief</h1>
      {children}
    </main>
  )
}
