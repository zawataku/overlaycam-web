import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

// `--mode lan` (npm run dev:lan) のときだけ自己署名証明書でHTTPS化し、
// LAN内の実機 (スマホ) から https://<PCのIP>:5173 で確認できるようにする。
// getUserMedia はセキュアコンテキスト必須のため、実機確認にはHTTPSが要る。
export default defineConfig(({ mode }) => ({
  plugins: mode === "lan" ? [basicSsl()] : [],
  server: {
    host: mode === "lan",
  },
}));
