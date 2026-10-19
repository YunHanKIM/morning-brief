import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";

// 두 글꼴 모두 SIL Open Font License 1.1 (상업적 이용·웹 임베딩 가능). 빌드 때 내려받아 직접 서빙한다
const notoSans = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  preload: false,
});

const notoSerif = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Morning Brief",
  description: "날씨, 환율, 개발 뉴스, 오늘의 한마디를 아침마다 한 장으로 모아 보여주고 Telegram으로 보내 주는 서비스",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${notoSans.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
