import localFont from "next/font/local";

export const pretendard = localFont({
  src: [
    { path: "../../public/fonts/pretendard/Pretendard-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/pretendard/Pretendard-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/pretendard/Pretendard-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/pretendard/Pretendard-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

export const schoolSafety = localFont({
  src: [
    { path: "../../public/fonts/school-safety/HakgyoansimDunggeunmisoTTF-R.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/school-safety/HakgyoansimDunggeunmisoTTF-B.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-school-safety",
  display: "swap",
});

