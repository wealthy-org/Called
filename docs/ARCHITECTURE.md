# Architecture — Called

Gambaran arsitektur level tinggi untuk engineer baru. Aturan produk ada di `prd.md`; detail visual ada di `design.md`.

---

## 1. Tech Stack

| Area                     | Pilihan                                                              | Alasan singkat                                     |
| ------------------------ | -------------------------------------------------------------------- | -------------------------------------------------- |
| Frontend                 | Next.js (App Router), TypeScript, Tailwind CSS; SVG untuk diagram    | Diagram kalibrasi dan sebaran digambar sebagai SVG |
| Wallet & sesi            | wagmi + viem, SIWE, cookie httpOnly                                  | Identitas manusia hanya wallet dan handle          |
| Database                 | Postgres (Neon atau Supabase), Drizzle ORM                           | —                                                  |
| Hash & tanda tangan      | SHA-256 untuk rantai; Ed25519 untuk kuitansi                         | Kuitansi bisa diverifikasi tanpa memanggil server  |
| Chain                    | Robinhood Chain testnet (chain ID 46630), viem; transaksi biasa untuk jangkar | Tanpa kontrak, ABI, atau token                     |
| LLM (House model & BYOK) | OpenRouter (model gratis) untuk Cassandra; penyedia lain untuk BYOK  | Biaya API produk nyaris nol                        |
| Hosting                  | Vercel (serverless) + cron terjadwal Vercel                          | Cron dipakai untuk penyelesaian dan jangkar        |
| Test                     | Vitest, Playwright                                                   | —                                                  |

---

## 2. System Architecture Overview

### 2.1 Komponen dan interaksi

```
Browser ──► Web app / server (Next.js, serverless) ──► Postgres
   │              │   ▲                                   ▲
   │              │   └── Cron jobs (Vercel) ─────────────┤
   │              │            │        │                 │
   │              ▼            ▼        ▼                 │
   │        Penyedia LLM   Robinhood Chain (RPC)  ◄───────┘
   │        (OpenRouter / BYOK)   ▲ baca harga (Settle), tulis jangkar (Anchor)
   └─────────► Explorer chain (verifikasi jangkar oleh siapa saja)
```

- **Web app / server:** melayani halaman, menerima Seal, menerbitkan kuitansi, dan menjalankan agen BYOK.
- **Postgres:** menyimpan data pertanyaan, rantai hash publik, kuitansi, skor, dan log audit.
- **Cron jobs:** pekerjaan terjadwal untuk membuka pertanyaan (Cassandra dan pembanding), menutup pertanyaan (pengungkapan), Settle, dan Anchor. Setiap endpoint cron dilindungi rahasia.
- **Chain:** dipakai untuk dua hal saja: dibaca oleh resolver (Settle) dan ditulis oleh jangkar (Anchor).
- **Penyedia LLM:** OpenRouter untuk Cassandra dan cadangannya; penyedia pilihan pengguna untuk BYOK.
- **Browser:** selain klien, browser adalah verifier independen untuk rantai hash.

Papan peringkat dan kalibrasi adalah fungsi murni atas data yang sudah selesai; hasilnya di-cache di server.

### 2.2 Seal, Ledger, dan Kuitansi: di server

Proses Seal, penambahan rekaman ke Ledger, dan penerbitan kuitansi terjadi di **server + Postgres**. Alasannya: rantai bersifat global dan append-only, sehingga urutan rekaman harus ditentukan satu pihak yang konsisten. Konsekuensinya, sebelum jangkar terbit, klaim "ada sebelum hasil" bergantung pada server. Kepercayaan itu dibatasi dua hal: **kuitansi bertanda tangan** (pemilik bisa membuktikan isi dan waktu segel) dan **jangkar chain** (setelah jangkar, waktu berasal dari blok). Salt dibuat di sisi peramal (browser atau server agen) dan hanya diberikan kembali kepada pemilik lewat kuitansi. Isi prediksi yang belum diungkap disimpan terenkripsi di server sampai pertanyaan ditutup.

### 2.3 Hash: satu fungsi, dua sisi

Fungsi hash yang sama (SHA-256, dibagikan sebagai satu modul) dipakai di browser dan server. Server menghitung hash saat menyegel; halaman Verify **menghitung ulang seluruh rantai di browser** dan menyebut nomor rekaman pertama yang tidak cocok. Server juga menyediakan verifikasi rantai sebagai pembanding hasil browser. Tujuannya agar pembaca tidak perlu mempercayai server: cukup mempercayai perhitungan di perangkatnya sendiri, ditambah jangkar di chain.

### 2.4 Cassandra dan pembanding: cron saat pertanyaan dibuka

Cassandra dan semua pembanding dijalankan oleh **cron server, sekali per pertanyaan, saat pertanyaan dibuka**. Cassandra memanggil OpenRouter dengan prompt yang hanya berisi teks pertanyaan publik. Bila terjadi kegagalan teknis, pemanggilan turun ke lapis cadangan berikutnya (dikelola sebagai konfigurasi, lengkap dengan pemeriksaan harian atas ketersediaan model). Pembanding hanya membaca data yang tersedia pada saat segel, tidak pernah hasil pertanyaan. Hasil mereka disegel lewat jalur yang sama dengan peramal lain.

### 2.5 Agen BYOK: kunci transien

Pengguna menekan "Run my agent" dan memasukkan kunci API di browser. Kunci dikirim lewat TLS ke server **hanya untuk satu panggilan**: server memakainya untuk memanggil penyedia LLM, lalu membuangnya. Kunci tidak ditulis ke database, log, maupun error report. Server hanya mencatat bahwa satu percobaan (agen, pertanyaan) telah terjadi dan menyimpan jawaban mentahnya; hasilnya disegel seperti prediksi lain. Karena server tidak bisa membuktikan pengguna tidak mencoba beberapa model di luar, entri diberi label "Agent (self-run)". Alternatif: panggilan langsung dari browser, sehingga kunci tidak melewati server, dengan label "self-reported".

### 2.6 Settle dan Anchor: cron, terpisah dari alur utama

- **Settle** berjalan sebagai cron pada waktu tetap (21:00 UTC). Resolver membaca **satu angka dari satu sumber** di chain lalu menerapkan tes pertanyaan. Ia sengaja dipisahkan dari alur Seal agar **tidak punya akses ke prediksi apa pun** dan jam bacanya tetap, bukan dipicu aksi pengguna. Bila sumber tidak terbaca, hasilnya void, bukan tebakan.
- **Anchor** berjalan sebagai cron **harian dan pada setiap penutupan pertanyaan**. Ia menanam hash kepala rantai lewat transaksi biasa di Robinhood Chain, memakai dompet khusus bersaldo kecil. Ia dipisahkan dari Seal agar latensi dan biaya chain tidak menghambat pengguna menyegel; selisih waktunya ditampilkan jujur sebagai status rekaman: _sealed_, _pending anchor_, atau _anchored_.

Karena keduanya berjalan di lingkungan serverless, kunci penanda tangan dan kunci jangkar hanya ada di sisi server (idealnya di KMS).
