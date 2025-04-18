/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    // 폼 스타일링이 필요한 경우 @tailwindcss/forms 패키지를 설치 후 아래 줄의 주석을 제거하세요
    // require('@tailwindcss/forms'),
  ],
}
