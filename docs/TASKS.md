# TASKS — Called

Pemecahan PRD + Architecture menjadi task granular. Kerangka fase mengikuti PRD §24. Nomor test merujuk PRD §25.

## Fase 1: Fondasi

| ID | Judul | Deskripsi | Dependency | File/area terdampak | Acceptance criteria | Estimasi |
|----|-------|-----------|------------|---------------------|--------------------|----|
| T-001 | [CRITICAL] Buat skema database (Drizzle) | Definisikan seluruh tabel dari PRD §6: `users`, `forecasters`, `questions`, `seals`, `failures`, `receipts`, `anchors`, `scores`, `agent_runs`, `admin_log`. Tambah constraint: `seals` append-only (tolak UPDATE/DELETE), `UNIQUE(question_id, forecaster_id)`, `record_index` UNIQUE, `prev_hash` chain. | - | `db/schema.ts`, `drizzle.config.ts` | Schema compile; migration generate berhasil; constraint `UNIQUE(question_id, forecaster_id)` ada. Test terkait: §25 #7. | M |
| T-002 | Implementasikan fungsi hash SHA-256 bersama | Satu modul SHA-256 yang dipakai browser dan server, hasil identik di kedua sisi. | - | `lib/hash.ts` | Cocok dengan vektor standar (`abc`, string kosong) di Node dan browser. Test terkait: §25 #1. | S |
| T-003 | Tulis test vektor SHA-256 | Test yang menjalankan `lib/hash.ts` di environment Node dan membandingkan dengan vektor standar. | T-002 | `lib/hash.test.ts` | Lulus untuk vektor `abc` dan string kosong. Test terkait: §25 #1. | XS |
| T-004 | Buat generator ID pertanyaan | ID berbentuk `q-<date>-<6 hex pertama sha256(text\|date\|source\|test)>`. Perubahan satu kata mengubah ID; input sama menghasilkan ID sama. | T-002 | `lib/question-id.ts` | ID deterministik; satu karakter beda → ID beda. Test terkait: §25 #2. | S |
| T-005 | Tulis test generator ID pertanyaan | Test determinisme dan perubahan ID saat teks/source/test/tanggal diubah. | T-004 | `lib/question-id.test.ts` | Semua kasus §25 #2 tercakup. | XS |
| T-006 | Buat parser tes pertanyaan | Parse `gte N`, `lte N`, `gt N`, `lt N`, `eq N`, `neq N`, `between LO HI`. Tes tidak parseable ditolak saat pembuatan. | - | `lib/test-grammar.ts` | Semua bentuk valid ter-parse; bentuk invalid ditolak dengan error jelas. Test terkait: §25 #3. | S |
| T-007 | Buat gerbang pertanyaan (Ask gate) | Validasi: tanggal masa depan, sumber ada, tes valid, 15–240 karakter, tanpa kata samar (`config/vague.ts`). Pesan penolakan menyebut bagian yang kurang. | T-004, T-006 | `lib/ask-gate.ts`, `config/vague.ts` | Tiap pelanggaran ditolak dengan pesan spesifik. Test terkait: §25 #3. | M |
| T-008 | Tulis test gerbang pertanyaan | Test semua cabang penolakan + kasus valid. | T-007 | `lib/ask-gate.test.ts` | Semua acceptance §25 #3 tercakup. | XS |
| T-009 | [OPS] Setup SIWE auth (nonce/verify/logout) | Endpoint `POST /api/auth/nonce`, `/verify`, `/logout` + cookie httpOnly/secure/SameSite. | - | `app/api/auth/*/route.ts`, `lib/auth.ts` | Login wallet berhasil; cookie httpOnly ter-set. | M |
| T-010 | [OPS] Buat `.env.example` dan validasi env | Dokumentasi semua env dari PRD §26 (DATABASE_URL, ANCHOR_PRIVATE_KEY, RECEIPT_SIGNING_KEY, OPENROUTER_API_KEY, ADMIN_WALLETS, CRON_SECRET, SESSION_SECRET, dll). | - | `.env.example`, `lib/env.ts` | Semua env tercantum; startup gagal cepat jika wajib kurang. | S |

## Fase 2: Seal, Ledger, Kuitansi

| ID | Judul | Deskripsi | Dependency | File/area terdampak | Acceptance criteria | Estimasi |
|----|-------|-----------|------------|---------------------|--------------------|----|
| T-011 | [CRITICAL] Implementasikan commit-reveal + hashing rantai | `commit = sha256(payload_json\|salt)`; `record.hash = sha256(i\|commit\|sealed_at\|prev)`; genesis `prev` = 64 nol. | T-002 | `lib/seal.ts` | Hash record cocok saat dihitung ulang dari komponen; genesis prev benar. | M |
| T-012 | Tulis test commit-reveal dan rantai | Test ulang hash dari komponen, verifikasi commit terhadap payload+salt yang diungkap, dan rantai dengan genesis 64 nol. | T-011 | `lib/seal.test.ts` | Semua kasus §25 #5 (setelah tutup commit cocok) dan #6 (validasi hash). | S |
| T-013 | [CRITICAL] Buat endpoint `POST /api/seal` | Terima seal; validasi gerbang, satu seal per (question, forecaster), prediksi belum diungkap disimpan terenkripsi; tolak seal kedua. | T-001, T-007, T-011 | `app/api/seal/route.ts` | Seal kedua ditolak; prediksi terenkripsi. Test terkait: §25 #4, #5. | M |
| T-014 | [CRITICAL] Buat tanda tangan Ed25519 kuitansi | Kuitansi berisi qid, p, salt, commit, hash record, sealed_at + signature Ed25519 kunci publikasi. Kunci publik di `/.well-known/`. | T-013 | `lib/receipt.ts`, `app/.well-known/*/route.ts` | Verifikasi offline dengan kunci publik berhasil tanpa server. Test terkait: §25 #8. | M |
| T-015 | Implementasikan Verify rantai (browser + server) | Fungsi murni hitung ulang seluruh rantai; kembalikan VALID atau nomor rekaman pertama yang rusak. Dipakai `/ledger` (browser) dan `/api/verify` (server). | T-011 | `lib/verify.ts` | VALID pada rantai utuh; BROKEN pada nomor yang tepat. Test terkait: §25 #6. | S |
| T-016 | Tulis test Verify rantai | Test VALID utuh, BROKEN pada index spesifik setelah satu nilai diubah. | T-015 | `lib/verify.test.ts` | Cocok §25 #6. | XS |
| T-017 | Buat endpoint reveal + export JSONL | `GET /api/ledger?from=` dengan payload yang sudah diungkap setelah close; export JSONL. | T-013 | `app/api/ledger/route.ts` | Sebelum close: tidak ada prediksi; setelah close: commit cocok. Test terkait: §25 #5. | M |
| T-018 | Tulis test endpoint seal (integration) | Test seal pertama berhasil, seal kedua ditolak, data terenkripsi di DB. | T-013 | `app/api/seal/route.test.ts` | §25 #4, #5, #7. | M |

## Fase 3: Halaman Pertanyaan, Form Seal, Ledger, Kuitansi

| ID | Judul | Deskripsi | Dependency | File/area terdampak | Acceptance criteria | Estimasi |
|----|-------|-----------|------------|---------------------|--------------------|----|
| T-019 | Buat halaman `/questions` | Daftar pertanyaan: terbuka, ditutup, selesai. Data nyata atau state kosong jujur. | T-001 | `app/questions/page.tsx` | Render dari API; empty state benar. | S |
| T-020 | Buat halaman `/q/[id]` (detail + countdown) | Tampilkan teks, meta (sumber, tes, tanggal, ID), hitung mundur ke close dan resolve, status. | T-019 | `app/q/[id]/page.tsx` | Countdown akurat; status open/closed/settled benar. | M |
| T-021 | Buat form Seal (slider 1–99 + alasan) | Slider 1–99%, textarea 1 kalimat maks 140 char dengan counter, tombol Seal, hitung commit di browser, kirim ke `/api/seal`. | T-020, T-013 | `app/q/[id]/seal-form.tsx` | Commit terkirim; error tampil dengan `role="alert"`. | M |
| T-022 | Buat kotak reword (ID hidup) | Input yang mengubah ID pertanyaan secara live; ID berubah warna saat berbeda dari asli. | T-020 | `app/q/[id]/reword-box.tsx` | ID berubah saat ketik; beda saat teks beda. Test terkait: §25 #2. | S |
| T-023 | Buat slip kuitansi pasca-Seal | Setelah seal tampil slip: border putus-putus, hash dengan efek scramble 700ms, meta. | T-021 | `app/q/[id]/receipt-slip.tsx` | Hash tampil; scramble jalan; reduced-motion menampilkan langsung. | S |
| T-024 | Buat halaman `/ledger` publik + Verify | Tampilkan 5 rekaman terakhir, tombol Verify (hitung ulang di browser), status VALID/BROKEN + nomor rekaman pertama rusak. | T-015 | `app/ledger/page.tsx` | Verify cocok dengan server; BROKEN menyebut index. Test terkait: §25 #6. | M |
| T-025 | Buat halaman `/receipt/[id]` | Tampilkan kuitansi (slip kertas), status Verify (valid/rusak), status Anchor (block + link explorer), hasil bila sudah selesai. | T-014, T-017 | `app/receipt/[id]/page.tsx` | Verify offline menampilkan hasil yang sama; anchor menampilkan blok. | M |
| T-026 | Buat komponen slip kuitansi (visual) | Slip kertas satu-satunya permukaan terang: judul RECEIPT Doto, baris data grid, stempel, gerigi bawah, tilt. | - | `components/receipt-slip.tsx` | Visual sesuai DESIGN §4.9; `aria-live="polite"`; reduced-motion tanpa tilt. | M |

## Fase 4: Resolver, Settle, Void, Audit

| ID | Judul | Deskripsi | Dependency | File/area terdampak | Acceptance criteria | Estimasi |
|----|-------|-----------|------------|---------------------|--------------------|----|
| T-027 | Buat resolver `dex.twap` | Baca TWAP pool via RPC pada jendela sebelum resolve; terapkan tes pertanyaan. | T-001 | `lib/resolver/dex-twap.ts` | Satu angka dari satu sumber; pool di bawah liquidity threshold → void. | M |
| T-028 | Buat resolver `oracle` | Baca on-chain price feed; verifikasi alamat sebelum dipakai. | T-001 | `lib/resolver/oracle.ts` | Alamat terverifikasi; satu angka; unreadable → void. | M |
| T-029 | Buat resolver manual + audit log | Input angka dengan link bukti; wajib 2 persetujuan admin; tercatat di `admin_log`. | T-001 | `lib/resolver/manual.ts` | Satu persetujuan ditolak; dua persetujuan lolos; audit tercatat. Test terkait: §25 #11. | M |
| T-030 | Buat fungsi Settle + void | Terapkan tes terhadap angka; unreadable = `void`, bukan tebakan; pertanyaan tanpa prediksi tidak bisa diselesaikan. | T-027, T-028, T-029 | `lib/settle.ts` | Void saat sumber gagal; no-prediction settle ditolak; hasil (angka, blok, tes) disimpan. Test terkait: §25 #10. | M |
| T-031 | Tulis test Settle + void | Mock resolver: source gagal → void; resolver tidak bisa akses prediksi; no-prediction ditolak. | T-030 | `lib/settle.test.ts` | §25 #10 tercakup penuh (mock prediksi). | S |
| T-032 | [OPS] Buat cron close-questions dan settle | Cron: tutup pertanyaan (reveal payload), settle 21:00 UTC. Proteksi `CRON_SECRET`. | T-017, T-030 | `app/api/cron/*/route.ts`, `vercel.json` | Cron hanya jalan dengan secret; reveal hanya setelah close. | M |
| T-033 | Buat UI halaman hasil pertanyaan | Setelah settle: tampilkan angka, blok, hasil tes, kata YES/NO (Doto besar, bone). | T-030 | `app/q/[id]/result.tsx` | Angka/blok/tes tampil; kata hasil benar. | S |

## Fase 5: Penilaian, Kalibrasi, Leaderboard, Profil

| ID | Judul | Deskripsi | Dependency | File/area terdampak | Acceptance criteria | Estimasi |
|----|-------|-----------|------------|---------------------|--------------------|----|
| T-034 | Buat fungsi murni Brier score | `(p - outcome)^2` per prediksi; lebih rendah lebih baik. | - | `lib/scoring/brier.ts` | Cocok perhitungan tangan pada fixture. Test terkait: §25 #12. | XS |
| T-035 | Tulis test Brier score | Fixture perhitungan tangan. | T-034 | `lib/scoring/brier.test.ts` | §25 #12 (bagian Brier). | XS |
| T-036 | Buat fungsi murni skill vs baseline | `(Brier_alwaysyes - Brier) / Brier_alwaysyes × 100` pada set yang sama untuk kedua sisi. | T-034 | `lib/scoring/skill.ts` | Komparasi pada shared set; tidak ada mixing di luar set. | S |
| T-037 | Buat fungsi murni dekomposisi Murphy | Reliability, resolution, uncertainty, plus suku sisa. | T-034 | `lib/scoring/murphy.ts` | Nilai sama dengan fixture referensi. Test terkait: §25 #13. | M |
| T-038 | Tulis test dekomposisi Murphy | Fixture referensi. | T-037 | `lib/scoring/murphy.test.ts` | §25 #13. | S |
| T-039 | Buat fungsi murni kalibrasi | 5–10 bin; titik ukuran menurut n; reference line. | T-034 | `lib/scoring/calibration.ts` | Nilai sama fixture; bin count benar. Test terkait: §25 #13. | M |
| T-040 | Tulis test kalibrasi | Fixture referensi. | T-039 | `lib/scoring/calibration.test.ts` | §25 #13. | S |
| T-041 | [CRITICAL] Buat query leaderboard + shared set | Peringkat berdasarkan skill; `n<20` = `provisional` dan tidak masuk peringkat; tampilan shared set; void dikecualikan. | T-036, T-030 | `lib/scoring/leaderboard.ts` | Provisional tidak muncul; void tidak dihitung. Test terkait: §25 #12. | M |
| T-042 | Buat halaman `/leaderboard` + filter + bar | Tabel + filter (All/House/Baselines/Agents/Humans), bar skill bone/seal, state loading/error/empty/ready, baris Cassandra aksen. | T-041 | `app/leaderboard/page.tsx` | State loading/error/empty/ready; filter kosong pesan jujur. Test terkait: §25 #17. | M |
| T-043 | Buat diagram kalibrasi (SVG) | SVG 360×330, kurva stroke seal, titik ukuran menurut n, garis acuan putus-putus, `role="img"` + `aria-label`. | T-039 | `components/calibration-plot.tsx` | `role="img"` + summary; reduced-motion gambar langsung penuh. Test terkait: §25 #19. | M |
| T-044 | Buat halaman `/f/[handle]` profil peramal | Skill, Brier, n, jumlah failure, dekomposisi Murphy, kalibrasi, tabel riwayat; untuk Cassandra/agen: model, versi, hash prompt. | T-036, T-037, T-039 | `app/f/[handle]/page.tsx` | Semua metrik tampil; failure count tidak dihitung sebagai skor. | M |
| T-045 | Buat plot sebaran hasil peramal | Plot 0–100 tiap peramal dengan penanda outcome di 100%, `role="img"` + `aria-label`, penanda di atas/bawah bergantian. | T-030 | `components/spread-plot.tsx` | A11y label memuat posisi tiap peramal; reduced-motion statis. | M |

## Fase 6: Cassandra + Baseline + BYOK

| ID | Judul | Deskripsi | Dependency | File/area terdampak | Acceptance criteria | Estimasi |
|----|-------|-----------|------------|---------------------|--------------------|----|
| T-046 | [OPS] Buat config `config/house-models.ts` | Daftar 6 lapis: ID model, nama (Cassandra, Helenus, Pythia, Tiresias, Calchas, Stray), vendor, urutan, parameter. | - | `config/house-models.ts` | Semua lapis tercantum; perubahan config tanpa kode. | S |
| T-047 | Buat runner Cassandra (sekali per question) | Panggil OpenRouter temp 0, seed dari qid, prompt hanya teks pertanyaan publik, output `{"p","why"}`, raw response disimpan. Sekali per pertanyaan saat dibuka. | T-046, T-001 | `lib/cassandra/runner.ts` | Tepat sekali per pertanyaan; model + versi tersimpan. Test terkait: §25 #14. | M |
| T-048 | [CRITICAL] Implementasikan fallback berlapis | Pindah lapis hanya pada 429/5xx/timeout/unavailable, maks 3 retry eksponensial per lapis; jawaban unparseable = failure; tiap lapis forecaster terpisah; Stray tidak pernah ranked. | T-047 | `lib/cassandra/fallback.ts` | Unparseable tidak trigger fallback; 3 retry; tiap lapis terpisah. Test terkait: §25 #23, #24, #26. | L |
| T-049 | [OPS] Buat cron `check-house-models` | Panggil `GET openrouter.ai/api/v1/models` harian; tandai lapis hilang/berbayar, skip otomatis, notifikasi admin. | T-046 | `app/api/cron/check-house-models/route.ts` | Lapis hilang ter-skip; admin diberi tahu. Test terkait: §25 #25. | M |
| T-050 | Buat pembanding (baselines) | Always-yes (0.99), Parrot (base rate), Hedgehog (momentum), Drift (0.35–0.75), Drunk (uniform seeded). Hanya data saat segel; label "baseline rule, not a model". | T-001 | `lib/baselines/*` | Uji shuffle: hasil diacak, output tidak berubah. Test terkait: §25 #15. | M |
| T-051 | Tulis test pembanding tanpa akses hasil | Acak outcome; output pembanding tidak berubah. | T-050 | `lib/baselines/*.test.ts` | §25 #15. | S |
| T-052 | [CRITICAL] Buat endpoint `POST /api/agents` dan `/api/agents/:id/run` | Daftar agen (nama, model, provider, hash prompt opsional). Run: kunci via TLS satu panggilan, dibuang, tidak masuk DB/log/error-report; satu percobaan per (agen, question); label "Agent (self-run)". | T-013, T-001 | `app/api/agents/*/route.ts`, `lib/byok.ts` | Kunci tidak muncul di DB/log (uji pemindaian); percobaan kedua ditolak. Test terkait: §25 #16. | M |
| T-053 | Buat halaman `/agents` (daftar + Run my agent) | Form input kunci dengan warning batas biaya, status run, riwayat agen. | T-052 | `app/agents/page.tsx` | Warning kunci tampil; satu attempt per pertanyaan. | S |

## Fase 7: Anchor

| ID | Judul | Deskripsi | Dependency | File/area terdampak | Acceptance criteria | Estimasi |
|----|-------|-----------|------------|---------------------|--------------------|----|
| T-054 | [CRITICAL] Implementasikan Anchor on-chain | Hash kepala ditanam sebagai calldata 44 byte pada zero-value tx di Robinhood Chain testnet (ID 46630): `0x + tag ASCII + 32 byte hash + 8 byte record count`. Tanpa kontrak/ABI/token. | T-001 | `lib/anchor.ts` | Calldata 44 byte benar; tx zero-value; tanpa ABI. Test terkait: §25 #9. | M |
| T-055 | Tulis test Anchor calldata | Test format calldata 44 byte dan kesamaan hash kepala dengan hasil hitung ulang. | T-054 | `lib/anchor.test.ts` | §25 #9 (format + isi). | S |
| T-056 | [OPS] Buat cron anchor (harian + saat close) | Jalankan harian dan saat pertanyaan tutup; simpan tx_hash, block_number, block_time di `anchors`; dompet khusus saldo kecil + alarm. | T-054 | `app/api/cron/anchor/route.ts` | Anchor jalan harian dan saat close; status tercatat. | M |
| T-057 | Implementasikan status rekaman (sealed/pending anchor/anchored) | Setiap rekaman menampilkan status; "proven" hanya untuk yang sudah anchored. | T-056 | `lib/anchor-status.ts` | Label status benar; anchored menampilkan block. Test terkait: §25 #9. | S |
| T-058 | Buat halaman verifikasi anchor (link explorer) | Tampilkan tx hash, block, waktu, dan link explorer; verifikasi manual: buang 10 karakter awal, bandingkan 64 karakter berikutnya dengan hash kepala. | T-056 | `app/anchor/[id]/page.tsx` | Link explorer benar; verifikasi manual cocok. | S |

## Fase 8: Beranda, API Publik, Halaman Pendukung

| ID | Judul | Deskripsi | Dependency | File/area terdampak | Acceptance criteria | Estimasi |
|----|-------|-----------|------------|---------------------|--------------------|----|
| T-059 | Buat API publik read-only | `GET /api/questions`, `/api/questions/:id`, `/api/leaderboard`, `/api/forecasters/:handle`, `/api/receipts/:id`, `/api/anchors`. Tanpa auth, rate-limited. | T-017, T-041 | `app/api/*/route.ts` | Semua endpoint mengembalikan JSON benar; rate limit aktif. | M |
| T-060 | Buat hero beranda (dot-matrix + cakrawala) | Judul dot-matrix interaktif (dorong/seret), cakrawala karakter hex, dua CTA, Session head (hash kepala + status anchor). | T-057 | `app/page.tsx`, `components/hero.tsx` | CTA nyata; canvas `aria-hidden`; reduced-motion statis. | L |
| T-061 | Buat bagian Question beranda (pertanyaan aktif + slip) | Pertanyaan aktif dengan meta, kotak reword, slip Your forecast. | T-021, T-022 | `app/page.tsx` | Semua elemen dari DESIGN §4.3 tampil. | M |
| T-062 | Buat bagian Result + Ledger + Leaderboard + Method di beranda | Result YES/NO + spread plot + skor; 5 rekaman ledger + Verify; tabel leaderboard + kalibrasi; Method log + kuitansi contoh. | T-024, T-042, T-043, T-045 | `app/page.tsx` | Semua bagian PRD §5.2 tampil; data kosong jujur. Test terkait: §25 #18. | L |
| T-063 | Buat kartu berbagi (OG image) | Kartu: "Saya menyegel 68% pada 26 Sep, sebelum hasilnya ada" + link verifikasi. "Proven" hanya untuk anchored. | T-057 | `app/api/og/*/route.ts`, `lib/share.ts` | Kartu memuat link verifikasi; tidak menyebut "proven" untuk non-anchored. Test terkait: §25 #22. | M |
| T-064 | Buat halaman `/method` dan `/faq` | Method: log bertanggal Ask/Seal/Wait/Settle + slip kuitansi. FAQ: `details/summary`, honesty limits (n kecil, masa lalu, prompt, transferabilitas). | T-026 | `app/method/page.tsx`, `app/faq/page.tsx` | Kejujuran wajib ada; ringkasan FAQ keyboard accessible. | M |
| T-065 | Buat halaman `/me` (akun) | Handle, kuitansi saya, agen saya. | T-009, T-017, T-052 | `app/me/page.tsx` | Kuitansi dan agen milik user tampil. | S |
| T-066 | [OPS] Buat halaman `/admin` (allowlist) | Buat pertanyaan (dari templat, lolos Ask gate), settle (2 approvals), lihat audit log. Proteksi ADMIN_WALLETS. | T-007, T-030 | `app/admin/page.tsx`, `app/api/admin/*/route.ts` | Non-admin ditolak; pertanyaan ke-6 ditolak saat 5 terbuka; settle wajib 2 approvals. | L |
| T-067 | Buat THIRD_PARTY.md + audit atribusi brier | Catat semua adaptasi dari brier: file asal, lisensi MIT, lokasi di repo. Jangan pakai `fox`. | - | `THIRD_PARTY.md` | Semua adaptasi tercatat dengan teks lisensi; `fox` tidak dipakai. Test terkait: §25 #21. | S |

## Ringkasan

| Fase | Task | XS | S | M | L |
|------|------|----|----|----|----|
| Fase 1: Fondasi | T-001 – T-010 (10) | 3 | 4 | 3 | 0 |
| Fase 2: Seal/Ledger/Kuitansi | T-011 – T-018 (8) | 1 | 2 | 5 | 0 |
| Fase 3: Halaman Pertanyaan | T-019 – T-026 (8) | 0 | 3 | 5 | 0 |
| Fase 4: Resolver/Settle | T-027 – T-033 (7) | 0 | 2 | 5 | 0 |
| Fase 5: Penilaian/Leaderboard | T-034 – T-045 (12) | 2 | 3 | 7 | 0 |
| Fase 6: Cassandra/BYOK | T-046 – T-053 (8) | 0 | 3 | 4 | 1 |
| Fase 7: Anchor | T-054 – T-058 (5) | 0 | 3 | 2 | 0 |
| Fase 8: Beranda/API | T-059 – T-067 (9) | 0 | 2 | 4 | 3 |
| **Total** | **67 task** | **6** | **22** | **35** | **4** |
