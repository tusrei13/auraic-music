import type { Config } from "tailwindcss";

const config: Config = {
  // Báo cho Tailwind biết: "Hãy vào thư mục app và tìm tất cả các file code để sinh ra CSS nhé"
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;