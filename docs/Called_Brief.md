Project 3 — Called (Verifiable Forecasting Arena)
Nama produk: Called. Peramal AI bawaan produk bernama Cassandra (disingkat "C" pada ruang sempit).

PRD lengkap. Semua fitur di dokumen ini wajib selesai; tidak ada pembagian fase. Di section 24 ada urutan pengerjaan yang disarankan sebagai saran teknis saja.

1. Ringkasan
   Called adalah arena publik untuk ramalan yang bisa dibuktikan. Setiap prediksi disegel dengan hash sebelum hasilnya ada, hash rantai terakhirnya ditanam di Robinhood Chain, lalu prediksi dinilai dengan aturan penilaian yang adil (Brier score) ketika jawabannya datang. Hasilnya papan peringkat peramal yang jujur: manusia, agen AI, dan pembanding sederhana bersaing pada pertanyaan yang sama.

Pertanyaan acuan: harga saham token di Robinhood Chain, misalnya "Apakah token NVDA ditutup di atas $210,00 pada 3 Okt 2026?". Sumber data dan tes penyelesaiannya ditetapkan saat pertanyaan dibuat.

Tidak ada uang, taruhan, atau hadiah tunai. Produk ini hanya membangun rekam jejak yang tidak bisa diedit.

Pembeda utama:

Segel sebelum tahu hasil, dengan tanggal dari blok chain (jam yang tidak dimiliki peramal).
Skor keahlian dibanding pembanding, dengan n selalu tampil, sehingga skor bagus di pertanyaan yang mudah tidak menipu.
Satu peramal AI bawaan (Cassandra) dengan prompt terbuka dan cadangan berlapis, ditambah agen milik pengguna (BYOK), sehingga biaya API kita nyaris nol.
Referensi konsep: brier (github.com/Noisyxl/brier, lisensi MIT), CLI lokal untuk peneliti LLM. Called mengambil logikanya (gerbang pertanyaan, rantai hash, penilaian, kalibrasi, jangkar) dan membangun sisi web, akun, dan arena sendiri.

2. Target User
   Peramal manusia yang ingin rekam jejak yang bisa dibuktikan atas penilaiannya sendiri.
   Pembuat agen AI yang ingin mengukur seberapa jujur modelnya menyatakan keyakinan, dengan aturan main yang adil.
   Pembaca yang ingin tahu siapa (atau model apa) yang benar-benar layak dipercaya, tanpa harus percaya klaim orang lain.
3. Prinsip Produk
   Segel dulu, baru tahu. Prediksi tidak bisa diedit dan tidak bisa dilihat orang lain sampai pertanyaan ditutup.
   Pertanyaan harus bisa diselesaikan orang yang tidak hadir. Tanpa tanggal masa depan, sumber, dan tes ya/tidak, sebuah pertanyaan ditolak.
   Jawaban tanpa angka bukan jawaban. Dicatat sebagai kegagalan, tidak diubah diam-diam menjadi 0,5.
   Jujur soal statistik. n tampil di samping setiap skor; peserta dengan kurang dari 20 pertanyaan selesai berlabel "provisional" dan tidak masuk peringkat.
   Bukan saran keuangan, tanpa uang. Semua angka menyatakan tentang peramal, bukan tentang masa depan.
   Bukti bisa dicek siapa saja, dari HP, lewat explorer dan halaman verifikasi.
4. Referensi dan Pola Penamaan
   4.1 Kebijakan orisinalitas
   brier berlisensi MIT: logika dan potongan kode boleh diadaptasi asalkan atribusi dan teks lisensi dipertahankan.

Semua kode yang diadaptasi dicatat di THIRD_PARTY.md (file asal, lisensi, lokasi di repo kita).
Arsitektur beda: web Next.js, Postgres, sesi SIWE, dan penyimpanan server (brier: CLI lokal dengan ledger.jsonl).
Tidak menyalin aset visual, nama, atau teks UI brier; tampilan mengikuti section 22 dan prototipe.
Jangan menyalin peramal fox dari brier. Di brier, fox sengaja diberi pandangan sempit dan berisik ke jawaban agar terkalibrasi. Di arena dengan pertanyaan masa depan yang nyata, pembanding tidak boleh punya akses ke hasil. Semua pembanding memakai definisi di section 10.2.
4.2 Pola penamaan (brier ke Called)
brier Called Catatan
ask Ask Gerbang pertanyaan (tanggal, sumber, tes)
seal Seal Prediksi dikunci dan dirantai hash
wait Wait Tahap tunggu; tidak bisa dipercepat
settle Settle Resolver membaca satu angka dan menerapkan tes
panel The Field Kumpulan peramal pada satu pertanyaan
ledger.jsonl Ledger Rantai hash publik di Postgres dan ekspor JSONL
anchor Anchor Hash kepala rantai ditanam di Robinhood Chain
score, scoreboard Leaderboard Peringkat berdasarkan skill vs pembanding
calibrate Calibration Diagram "bilang 70%, benar berapa kali"
ledger --verify Verify Hitung ulang semua hash dan sebut baris yang rusak
almanac (dunia sampel) Sample world Hanya untuk demo dan test, dilabeli jelas
hedgehog, parrot, drunk Hedgehog, Parrot, Drunk Pembanding, definisi sendiri (10.2)
fox Drift Pembanding baru berbasis momentum harga; bukan fox milik brier
always-yes Always-yes Garis acuan pada setiap papan
kuitansi (tidak ada) Receipt Bukti bertanda tangan per prediksi
(tidak ada) Cassandra Peramal AI bawaan (disingkat "C"), dengan tim cadangan berlapis 5. Tech Stack
Area Pilihan
Frontend Next.js (App Router), TypeScript, Tailwind CSS, SVG untuk diagram
Wallet dan sesi wagmi + viem, SIWE, cookie httpOnly
Database Postgres (Neon atau Supabase), Drizzle ORM
Hash dan tanda tangan SHA-256, Ed25519 untuk kuitansi
Chain Robinhood Chain (chain ID 4663), viem, transaksi biasa untuk jangkar
LLM (House model dan BYOK) OpenRouter (model gratis untuk Cassandra); penyedia lain untuk BYOK
Hosting Vercel (serverless) + cron terjadwal Vercel untuk penyelesaian dan jangkar
Test Vitest, Playwright 6. Arsitektur
Pekerjaan Di mana Catatan
Seal, ledger, kuitansi Server + Postgres Server menyegel; kuitansi bertanda tangan dan jangkar chain membatasi kepercayaan pada server
Hash dan verifikasi Browser dan server Fungsi hash yang sama di kedua sisi; halaman Verify menghitung di browser
Cassandra dan pembanding Cron server Dijalankan sekali per pertanyaan saat dibuka
Agen BYOK Server, sementara Kunci hanya untuk satu panggilan, tidak disimpan dan tidak masuk log (section 17)
Settle Cron server Pada waktu yang tetap, membaca satu angka dari satu sumber
Anchor Cron server Harian dan pada setiap penutupan pertanyaan
Papan peringkat, kalibrasi Server, di-cache Fungsi murni atas data yang sudah selesai 7. Peta Halaman
Rute Halaman
/ Beranda arena (section 8)
/questions Daftar pertanyaan: terbuka, ditutup, selesai
/q/[id] Halaman pertanyaan: form Seal, hitung mundur; setelah selesai: hasil dan sebaran
/leaderboard Papan peringkat dengan filter jenis peramal
/f/[handle] Profil peramal: skill, kalibrasi, riwayat
/ledger Penampil rantai publik dan tombol Verify
/receipt/[id] Halaman verifikasi kuitansi
/agents Daftarkan dan jalankan agen BYOK
/method, /faq Cara kerja dan pertanyaan yang benar-benar ditanyakan
/result Hasil pertanyaan terbaru
/me Handle, kuitansi saya, agen saya
/receipts Daftar kuitansi saya
/agents/edit Form register dan run agen
/admin Pembuat pertanyaan dan penyelesai (allowlist)
Header: wordmark, navigasi (Question, Result, Ledger, Leaderboard, Method, FAQ), dan status wallet. Tidak ada tautan ke halaman yang belum ada.

8. Beranda (/)
   Mengikuti prototipe (section 22). Urutan bagian:

Hero: judul dot-matrix yang bisa didorong ("Say it before it happens."), latar cakrawala karakter heksadesimal, dua CTA: Seal a forecast dan Verify the ledger, baris Session head (hash kepala rantai terbaru dan status jangkar).
Open question: pertanyaan aktif dengan teks besar, meta (sumber, tes, tanggal, ID), kotak reword yang memperlihatkan ID berubah, dan slip Your forecast (slider 1-99%, satu kalimat alasan, tombol Seal).
Result (sampel bila belum ada yang selesai): kata besar YES/NO, plot sebaran posisi tiap peramal pada skala 0-100 dengan penanda hasil, dan tabel skor.
Ledger: 5 rekaman terakhir publik, dengan tombol Verify.
Leaderboard: tabel dan panel Calibration dengan pemilih peramal.
Method: log bertanggal (Ask, Seal, Wait, Settle) dan Receipt contoh di slip kertas.
FAQ dan footer (wordmark besar, tautan nyata, atribusi ke brier).
Bila tidak ada data nyata untuk sebuah bagian, tampil state kosong yang jujur, bukan angka karangan.

9. Pertanyaan (Ask)
   9.1 Gerbang
   Sebuah pertanyaan hanya sah bila memenuhi semuanya, dan pesan penolakan menyebut mana yang kurang:

Tanggal penyelesaian di masa depan (dan tanggal tutup segel sebelum tanggal itu).
Sumber yang bisa dibaca (section 12).
Tes yang menghasilkan ya atau tidak.
Panjang 15-240 karakter.
Tidak memuat kata samar: significant, soon, major, roughly, probably, likely, better, worse, dan padanannya; daftar di config/vague.ts.
9.2 ID pertanyaan
q-<tanggal>-<6 hex pertama dari sha256(teks|tanggal|sumber|tes)>. Mengubah satu kata mengubah ID: itu pertanyaan lain dan tidak memiliki prediksi. Halaman pertanyaan menampilkan kotak "reword" yang menunjukkan ini (terbukti di prototipe).

9.3 Tata bahasa tes
gte N, lte N, gt N, lt N, eq N, neq N, between LO HI. Tes yang tidak bisa di-parse ditolak saat dibuat (bukan pada hari penyelesaian).

9.4 Pembuatan dan pasokan
Pertanyaan dibuat oleh admin dari templat: "Will the <TICKER> token close at or above $X on <tanggal>?" dengan beberapa ambang di sekitar harga saat ini supaya tidak semuanya mudah. Aturan: jendela terbuka minimal 24 jam, maksimal 5 pertanyaan terbuka bersamaan, waktu baca tetap pada 21:00 UTC. Arsip semua pertanyaan (termasuk yang batal) publik.

9.5 Spesifikasi (JSON)
{
"id": "q-2026-10-03-9b128f",
"text": "Will the NVDA token close at or above $210.00 on 3 Oct 2026?",
"source": "dex.twap:<pool>:30m",
"test": "gte 210",
"opens_at": "2026-09-26T00:00:00Z",
"closes_at": "2026-10-03T19:00:00Z",
"resolves_at": "2026-10-03T21:00:00Z"
} 10. Peramal (The Field)
10.1 Jenis entri
Jenis Siapa Label
House model Cassandra: satu model utama milik produk, dengan cadangan berlapis House model
Baseline Aturan sederhana tanpa akses ke hasil Baseline
Agent (BYOK) Model milik pengguna, dijalankan dengan kunci mereka Agent (self-run)
Human Login wallet Human
10.2 Pembanding (definisi sendiri, tanpa akses ke hasil)
Nama Perilaku Fungsi
Always-yes Selalu 0,99 Garis acuan: terlihat brilian pada set pertanyaan yang kebetulan banyak "ya"
Parrot Base rate historis dari pertanyaan selesai dengan kelas serupa Reliabilitas sempurna, resolusi nol
Hedgehog Satu ide dipegang keras: mendekati 0,9 atau 0,1 berdasar momentum harga Menunjukkan celah overconfidence
Drift Pembaruan kecil dari momentum harga dalam rentang 0,35-0,75 Pembanding yang jujur dan sederhana
Drunk Acak seragam dengan seed yang tercatat Lantai: skor lebih buruk berarti menyesatkan
Semua pembanding hanya memakai data yang tersedia pada saat segel, dan setiap rekamannya berlabel "baseline rule, not a model".
10.3 Peramal AI bawaan: Cassandra
Nama Cassandra: peramal dalam mitologi yang selalu benar tetapi tidak dipercaya. Di Called, kuitansi yang menyediakan buktinya. Disingkat "C" pada ruang sempit (mis. penanda di plot).

Satu model utama, dipin (ID dan versi tercatat pada setiap rekaman), lewat OpenRouter (model gratis), suhu 0, seed diturunkan dari ID pertanyaan.
Prompt terbuka di repo (prompts/forecaster.md): peramal melihat pertanyaan sendirian dan mengembalikan tepat dua hal, probabilitas dan satu kalimat (JSON {"p":0.00,"why":"..."}; memakai keluaran terstruktur bila model mendukung, jika tidak di-parse dengan ketat). Hanya isi jawaban akhir yang dibaca; penalaran internal model dibuang.
Dijalankan sekali per pertanyaan saat dibuka.
Jawaban mentah disimpan. Jawaban tanpa angka yang bisa di-parse dicatat sebagai kegagalan dan tidak memicu fallback.
Mengganti model utama atau prompt membuat peramal baru ("Cassandra v2"), tidak mencampur skor.
Fallback berlapis (model gratis OpenRouter)
Daftar diverifikasi terhadap API OpenRouter per 25 Sep 2026 (24 model gratis dari 460). Tiap lapis memakai vendor berbeda agar gangguan satu penyedia tidak menjatuhkan semuanya. Tiap lapis adalah peramal terpisah (skornya tidak dicampur dengan Cassandra).

Lapis Nama Model Vendor Catatan
1 (utama) Cassandra nvidia/nemotron-3-super-120b-a12b:free NVIDIA Serba guna; keluaran terstruktur, JSON, seed; konteks 262 ribu
2 Helenus google/gemma-4-31b-it:free Google JSON dan seed
3 Pythia qwen/qwen3.8-27b:free Alibaba Keluaran terstruktur; tanpa seed
4 Tiresias nex-agi/nex-n2.5-pro:free Nex Terstruktur dan JSON; tanpa seed
5 Calchas nvidia/nemotron-3-ultra-550b-a55b:free NVIDIA Model besar; teks biasa (di-parse); seed
6 (darurat) Stray openrouter/free router OpenRouter Tidak dipin: model yang benar-benar dipakai dicatat; tidak pernah masuk peringkat
Nama cadangan diambil dari peramal mitologi (Helenus adalah kembaran Cassandra).

Aturan fallback:

Pindah ke lapis berikutnya hanya karena kegagalan teknis: HTTP 429, 5xx, timeout, atau model tidak tersedia. Setelah maksimal 3 percobaan ulang dengan jeda eksponensial pada lapis yang sama.
Tidak pernah pindah lapis karena jawaban jelek, tidak berformat, atau tanpa angka.
Setiap rekaman menyimpan model yang benar-benar menjawab. UI menuliskannya, mis. "Cassandra tidak tersedia, Helenus menjawab".
Bila semua lapis gagal, pertanyaan dicatat tanpa jawaban bawaan (kegagalan, bukan angka pengganti).
Pada peringkat, Cassandra dihitung dari lapis 1 saja; lapis cadangan tampil sebagai entri "House model" terpisah dengan label reserve.
Konfigurasi dan pemeriksaan:

Semua lapis ada di config/house-models.ts (ID model, nama, urutan, parameter). Mengubahnya tidak memerlukan perubahan kode.
Cron harian check-house-models membaca GET https://openrouter.ai/api/v1/models, memastikan tiap ID masih ada dan harganya nol; lapis yang hilang atau berbayar dilewati otomatis dan admin diberi tahu.
Parameter tetap: suhu 0, seed dari ID pertanyaan (hanya berlaku pada model yang mendukungnya, dan dicatat pada rekaman), batas token keluaran.
Batas kuota OpenRouter (model gratis): 20 permintaan per menit; 50 per hari bila total kredit yang pernah dibeli kurang dari $10, dan 1.000 per hari setelah membeli minimal $10 sekali (model tetap gratis). Dengan maksimal 5 pertanyaan terbuka dan 6 lapis, skenario terburuk sekitar 30 panggilan per hari; membeli kredit $10 sekali direkomendasikan agar tidak terkena batas saat fallback berjalan. Prompt hanya berisi teks pertanyaan publik.

Mode bayangan: kualitas meramal model-model ini belum diuji. Selama 2 minggu pertama semua lapis menjawab pertanyaan nyata tanpa masuk peringkat; model utama dipilih berdasarkan kalibrasi, kecepatan, dan ketersediaan, lalu dikunci.

10.4 Manusia
Login SIWE, handle unik, satu prediksi per pertanyaan, tidak bisa melihat prediksi orang lain sampai pertanyaan ditutup, dibatasi laju.

11. Seal, Ledger, dan Anchor
    11.1 Commit-reveal (agar prediksi tersembunyi tapi tetap dirantai)
    Karena prediksi harus tersembunyi sampai tutup, rantai menyimpan komitmen:

payload = { q, forecaster, p, note, sealed_at }
commit = sha256(payload_json | salt)
record = { i, commit, prev, hash = sha256(i | commit | sealed_at | prev) }
salt dibuat di peramal (browser atau server agen) dan diberikan ke pemilik di kuitansi.
Setelah pertanyaan ditutup, payload dan salt diungkap dan siapa pun bisa memeriksa bahwa commit cocok.
Rantai bersifat global dan append-only; rekaman pertama memakai prev = 64 nol.
11.2 Kuitansi
Berisi: ID pertanyaan, probabilitas, salt, commit, hash rekaman, waktu segel, dan tanda tangan Ed25519 dari kunci publikasi Called. Pemilik dapat memverifikasi sendiri tanpa server.

11.3 Verify
Halaman /ledger menghitung ulang seluruh rantai di browser. Bila ada baris yang tidak cocok, halaman menyebut nomor rekaman pertama yang rusak (perilaku ini sudah terbukti pada prototipe, termasuk demo "Tamper").

11.4 Anchor
Hash kepala rantai ditanam sebagai calldata 44 byte pada transaksi nol-nilai di Robinhood Chain: 0x + tag ASCII + 32 byte hash kepala + 8 byte jumlah rekaman. Tanpa kontrak, ABI, atau token. Dijalankan harian dan pada setiap penutupan pertanyaan. Tabel anchors menyimpan hash transaksi, nomor blok, dan waktu blok. Verifikasi: buka transaksi di explorer, buang 10 karakter awal, bandingkan 64 karakter berikutnya dengan hash kepala. Dompet jangkar khusus dengan saldo kecil dan alarm saldo rendah.

11.5 Kejujuran tentang kepercayaan
Server menyegel, jadi sebelum jangkar, klaim "ada sebelum hasil" bergantung pada server. Setelah jangkar, waktu berasal dari blok. UI selalu menunjukkan status tiap rekaman: sealed, anchored (dengan blok), atau pending anchor. Rekaman yang belum di-anchor tidak boleh disebut "terbukti".

12. Penyelesaian (Settle) dan Sumber
    Resolver membaca satu angka dari satu sumber dan menerapkan tes yang ditetapkan sejak pertanyaan dibuat. Resolver tidak bisa melihat prediksi apa pun.

Sumber Deskripsi Aturan
dex.twap:<pool>:<window> Harga rata-rata berbobot waktu dari pool tertentu, dibaca lewat RPC pada jendela sebelum waktu penyelesaian Pool harus memenuhi ambang likuiditas minimum; ambang dan pool tertulis di pertanyaan
oracle:<feed> Umpan harga on-chain bila tersedia untuk aset tsb Alamat umpan diverifikasi di chain sebelum dipakai
manual Dibaca manusia dengan tautan bukti Wajib dua persetujuan admin, tercatat di log audit
Aturan tegas:

Bila sumber tidak bisa dibaca pada waktu penyelesaian, pertanyaan menjadi void dan dikecualikan dari penilaian. Tidak pernah ditebak.
Hasil (angka, blok, dan tes) disimpan dan ditampilkan pada halaman pertanyaan.
Penyelesaian tidak dapat dijalankan pada pertanyaan yang tidak punya satu pun prediksi. 13. Penilaian
Semua fungsi murni atas data yang sudah selesai (tanpa I/O), dengan test.

Brier score per prediksi: (p - outcome)^2 (outcome 1 atau 0). Lebih rendah lebih baik.
Skill vs baseline: (Brier_alwaysyes - Brier) / Brier_alwaysyes \* 100, dihitung pada set pertanyaan yang sama untuk kedua sisi.
Dekomposisi Murphy: reliability, resolution, uncertainty, plus suku sisa yang biasanya dibuang; ditampilkan pada profil.
Kalibrasi: 5-10 bin; titik berukuran menurut jumlah sampel; garis putus-putus sebagai acuan.
Provisional: peserta dengan n < 20 pertanyaan selesai tidak masuk peringkat dan berlabel provisional.
Kegagalan menjawab dihitung dan ditampilkan, tidak dijadikan nilai apa pun.
Skor hanya dapat dibandingkan pada set pertanyaan yang sama; papan menyediakan tampilan "shared set" untuk perbandingan adil. 14. Leaderboard
Baris: peringkat, peramal, jenis, skill vs baseline (bar), Brier, n. Filter: All, House model, Baselines, Agents (BYOK), Humans. Bar animasi saat data siap. State: loading (skeleton), error (dengan tombol coba lagi), kosong (mis. "Humans join once wallet login ships" bila belum ada), dan ready. Baris Cassandra ditandai dengan aksen. Disclaimer tetap: data contoh atau nyata dan definisi skill.

15. Profil Peramal (/f/[handle])
    Skill, Brier, n, hitungan kegagalan menjawab, dekomposisi Murphy, diagram kalibrasi (SVG, titik menurut n, garis kurva menggambar sendiri saat masuk layar), dan tabel riwayat (pertanyaan, prediksi, hasil, skor). Untuk Cassandra, cadangannya, dan agen: model, versi, dan hash prompt.

16. Kuitansi dan Berbagi
    Halaman /receipt/[id]: menampilkan kuitansi (slip kertas), status Verify (valid/rusak), status Anchor (blok dan tautan explorer), dan hasil bila sudah selesai.
    Kartu berbagi (gambar OG): "Saya menyegel 68% pada 26 Sep, sebelum hasilnya ada" dengan tautan verifikasi. Setelah selesai: hasil dan skor.
    Kartu tidak menyebut "terbukti" untuk rekaman yang belum di-anchor.
17. Agen BYOK
    Pengguna mendaftarkan agen (nama, model, penyedia, hash prompt opsional). Saat pertanyaan terbuka, pengguna menekan Run my agent dan memasukkan kunci API.
    Kunci tidak pernah disimpan: dikirim lewat TLS untuk satu panggilan, dipakai, lalu dibuang; tidak masuk log, tidak masuk error report. Peringatan jelas di UI: pakai kunci dengan batas biaya.
    Satu percobaan per (agen, pertanyaan). Hasil mentah disimpan.
    Entri diberi label "Agent (self-run)" dan tampil terpisah dari Cassandra, karena server tidak bisa membuktikan pengguna tidak mencoba beberapa model di luar.
    Alternatif yang boleh ditawarkan: panggilan dari browser (kunci tidak melewati server) dengan label "self-reported".
18. API Publik
    GET /api/questions, GET /api/questions/:id, GET /api/ledger?from= (JSONL rantai, dengan payload yang sudah diungkap), GET /api/leaderboard, GET /api/forecasters/:handle, GET /api/receipts/:id, GET /api/anchors. Tanpa auth, dengan rate limit. Kunci publik penanda tangan kuitansi diterbitkan di /.well-known/.

19. Data (Postgres)
    users(wallet_address PK, handle UNIQUE, created_at)
    forecasters(id, kind[house|baseline|agent|human], owner_wallet, name, model, model_version,
    prompt_hash, created_at)
    questions(id PK, text, source, test, opens_at, closes_at, resolves_at, status[open|closed|settled|void],
    outcome, reading_value, reading_block, created_by, created_at)
    seals(id, question_id, forecaster_id, commit, salt_revealed, payload_json_revealed,
    sealed_at, record_index UNIQUE, prev_hash, hash,
    UNIQUE(question_id, forecaster_id))
    failures(id, question_id, forecaster_id, raw_response, reason, at)
    receipts(id, seal_id, signature, created_at)
    anchors(id, head_hash, record_count, tx_hash, block_number, block_time, created_at)
    scores(question_id, forecaster_id, p, outcome, brier, PRIMARY KEY(...))
    agent_runs(id, forecaster_id, question_id, attempted_at) -- tanpa kunci apa pun
    admin_log(id, actor_wallet, action, question_id, evidence_json, at)
    payload_json belum-diungkap disimpan terenkripsi di sisi server sampai penutupan.

20. Endpoint (aplikasi)
    Method Path Fungsi
    POST /api/auth/nonce, /verify, /logout SIWE
    POST /api/seal Segel prediksi (validasi gerbang, satu per peramal per pertanyaan)
    POST /api/agents Daftarkan agen
    POST /api/agents/:id/run Jalankan agen BYOK sekali (kunci transien)
    POST /api/admin/questions Buat pertanyaan (allowlist)
    POST /api/admin/questions/:id/settle Selesaikan, dengan bukti dan persetujuan kedua
    GET /api/verify Verifikasi rantai di server (pembanding hasil browser)
    Cron: open-questions (jalankan Cassandra dan pembanding), close-questions (ungkap payload), settle, anchor.

21. Non-Fungsional
    Keamanan: kunci BYOK tidak pernah disimpan atau di-log; cookie sesi httpOnly, secure, SameSite; rate limit pada seal dan API; validasi zod; kunci penanda tangan dan kunci jangkar hanya di variabel lingkungan server (idealnya KMS).
    Integritas: rantai append-only (tanpa UPDATE/DELETE pada seals), dijaga constraint dan test.
    Aksesibilitas: kontras WCAG AA, navigasi keyboard penuh, fokus terlihat, target sentuh 44px, prefers-reduced-motion menonaktifkan gerak.
    Responsif: desktop, tablet, ponsel; tanpa overflow horizontal.
    Ikon: SVG, bukan emoji.
    Privasi: tanpa nama asli; handle dan wallet saja; tidak ada pelacak pihak ketiga.
    Kejujuran: halaman Method dan FAQ menyebut batas: skor dari n kecil hanyalah noise, pertanyaan tentang masa lalu mengukur hafalan bukan ramalan, hasil model bergantung pada prompt dan suhu, dan tidak ada nilai transferabel antar set pertanyaan.
22. Arah Visual (dari prototipe)
    Prototipe HTML yang menjadi acuan visual dan perilaku: September/23/project-3-arena-prototype.html. Arah desain (dari referensi pilihan owner, dipakai sebagai inspirasi, bukan ditiru):

Design Read: arena prediksi untuk peramal manusia dan agen AI, bahasa visual gelap ala buku besar dan tekstur karakter; dial ENERGY 3 / RHYTHM 3 / MOTION 2.
Warna: dasar hampir hitam (#0a0a0b), teks bone (#ece9e4), abu redup (#a19d95), satu aksen vermilion #ff5a36 (warna segel lilin) hanya untuk hal yang tersegel, terverifikasi, atau bisa diklik. Satu permukaan terang (kertas #e9e4d8) hanya untuk kuitansi.
Tipografi: Doto (dot-matrix) untuk judul dan angka besar; IBM Plex Sans untuk teks; IBM Plex Mono untuk hash dan data.
Motif: judul hero berupa butiran yang bisa didorong dan diseret (butiran yang bergeser berubah warna segel lalu kembali); latar cakrawala dari karakter heksadesimal (ukuran membesar ke bawah, punggung bukit menyala, langit jarang, kursor menyorot huruf); memudar ke gelap di bagian bawah.
Komponen kunci: slip forecast, kotak reword dengan ID hidup, Ledger dengan Tamper dan Verify, tabel leaderboard dengan bar, diagram kalibrasi, plot sebaran hasil, slip kuitansi, log Method bertanggal.
Gerak: reveal sekali per blok saat masuk layar, baris ledger baru berkedip aksen, bar leaderboard tumbuh, kurva kalibrasi menggambar sendiri; seluruhnya nonaktif untuk reduced motion.
Dilarang (antislop): tombol pill di mana-mana, badge kapsul di atas judul, deretan statistik karangan, ikon perpustakaan generik, gradien dekoratif, dan tautan ke halaman yang belum ada.
Semua angka pada prototipe berlabel SAMPLE; implementasi harus memakai data nyata atau state kosong yang jujur. 23. Bukti Prototipe (sudah diverifikasi)
Prototipe dijalankan di Chromium dan lulus 45+ pengecekan tanpa error console, antara lain: SHA-256 cocok dengan vektor standar, ID pertanyaan berubah saat teks diubah, Seal menambah rekaman dan kuitansi, Verify menyatakan VALID lalu BROKEN pada rekaman 1 setelah Tamper dan kembali VALID setelah dibatalkan, ledger bertahan setelah reload, filter leaderboard dan state loading/error/kosong berfungsi, kalibrasi menggambar untuk 4 peramal, reveal semua blok, tanpa overflow horizontal pada 1440 dan 390, target sentuh minimal 44px.
Yang belum ada di prototipe (dan wajib di produk): login wallet, penyimpanan server, commit-reveal, kuitansi bertanda tangan, jangkar on-chain, resolver, Cassandra dan BYOK.

24. Urutan Pengerjaan yang Disarankan (semua wajib selesai)
    Bukan fase; hanya urutan agar dependensi tidak terbalik.

Fondasi: proyek, Drizzle, SIWE, fungsi hash bersama, gerbang pertanyaan dan test.
Seal dengan commit-reveal, rantai, kuitansi bertanda tangan, Verify.
Halaman pertanyaan, form Seal, ledger publik, halaman kuitansi.
Resolver (dex.twap, oracle, manual), Settle, void, log audit.
Penilaian, kalibrasi, leaderboard, profil.
Cassandra (dengan fallback berlapis) dan pembanding via cron; BYOK.
Anchor terjadwal dan halaman verifikasi.
Beranda dan halaman pendukung mengikuti prototipe, kartu berbagi, API publik. 25. Acceptance Test

# Test

1 SHA-256 cocok dengan vektor standar (abc, string kosong) di browser dan server.
2 Mengubah satu kata pada pertanyaan mengubah ID; teks yang sama menghasilkan ID yang sama.
3 Pertanyaan tanpa tanggal masa depan, tanpa sumber, tanpa tes yang valid, atau memuat kata samar ditolak dengan pesan yang menyebut bagian yang kurang.
4 Seal kedua dari peramal yang sama pada pertanyaan yang sama ditolak. Prediksi tidak dapat diedit setelah disegel.
5 Prediksi orang lain tidak terbaca (API maupun UI) sebelum penutupan; setelah penutupan, commit cocok dengan payload dan salt yang diungkap.
6 Verify menyatakan VALID pada rantai utuh, dan BROKEN pada nomor rekaman yang tepat bila satu nilai diubah.
7 Tabel seals tidak dapat di-UPDATE atau DELETE lewat aplikasi (constraint dan test).
8 Kuitansi bertanda tangan dapat diverifikasi dengan kunci publik tanpa memanggil server.
9 Anchor menulis transaksi calldata 44 byte; hash kepala pada transaksi sama dengan hasil hitung ulang; rekaman tanpa anchor berlabel "pending anchor" dan tidak disebut terbukti.
10 Resolver tidak dapat mengakses prediksi (uji dengan mock); sumber yang tidak terbaca menghasilkan void, tidak pernah tebakan.
11 Penyelesaian pertanyaan manual tanpa persetujuan kedua ditolak.
12 Brier score dan skill vs baseline cocok dengan perhitungan tangan pada fixture; peserta n < 20 berlabel provisional dan tidak masuk peringkat.
13 Kalibrasi dan dekomposisi Murphy menghasilkan nilai yang sama dengan fixture referensi.
14 Cassandra dijalankan tepat sekali per pertanyaan; jawaban tanpa angka dicatat sebagai kegagalan (tidak diubah jadi 0,5); ID model dan versi tersimpan.
15 Pembanding tidak memakai hasil pertanyaan apa pun (uji: hasil diacak, keluaran pembanding tidak berubah).
16 BYOK: kunci tidak muncul di database, log, atau error report (uji dengan pemindaian); percobaan kedua pada pertanyaan yang sama ditolak.
17 Leaderboard menampilkan state loading, error (dengan coba lagi), kosong, dan ready; filter Humans dan Agents menampilkan pesan kosong yang jujur bila belum ada data.
18 Beranda menampilkan judul dot-matrix interaktif, cakrawala karakter, dan seluruh bagian di section 8; tanpa angka karangan.
19 Diagram kalibrasi dan plot sebaran hasil dapat dibaca pembaca layar (label ARIA berisi ringkasan).
20 Tidak ada overflow horizontal di 1440 dan 390; target sentuh minimal 44px; navigasi keyboard menjangkau semua kontrol; prefers-reduced-motion menonaktifkan seluruh gerak.
21 THIRD_PARTY.md mencatat semua adaptasi dari brier beserta lisensi MIT-nya, dan fox milik brier tidak dipakai.
22 Kartu berbagi hanya menyebut "terbukti" untuk rekaman yang sudah di-anchor.
23 Fallback hanya dipicu oleh kegagalan teknis (429, 5xx, timeout, model tidak tersedia) setelah maksimal 3 percobaan ulang; jawaban tanpa angka atau tidak berformat tidak memicu fallback.
24 Setiap lapis adalah peramal terpisah: rekaman menyimpan model yang menjawab, dan skor Cassandra tidak bercampur dengan lapis cadangan.
25 Cron check-house-models menandai lapis yang modelnya hilang atau tidak lagi gratis, melewatinya otomatis, dan memberi tahu admin.
26 Lapis Stray (router tidak dipin) tidak pernah masuk peringkat, dan model yang benar-benar dipakai tercatat. 26. Konfigurasi (.env)
Variabel Fungsi
DATABASE_URL Postgres
NEXT_PUBLIC_ROBINHOOD_CHAIN_ID, ROBINHOOD_RPC_URL Chain dan RPC
ANCHOR_PRIVATE_KEY Dompet jangkar (hanya server, saldo kecil)
RECEIPT_SIGNING_KEY Kunci Ed25519 penanda tangan kuitansi
OPENROUTER_API_KEY Untuk Cassandra dan cadangannya
HOUSE_TEMPERATURE Suhu Cassandra (default 0); daftar model ada di config/house-models.ts
ADMIN_WALLETS Allowlist admin
CRON_SECRET Melindungi endpoint cron
SESSION_SECRET Rahasia sesi 27. Risiko dan Catatan
Kepercayaan ke server sebelum jangkar. Dibatasi oleh kuitansi bertanda tangan, jangkar harian, dan pelabelan status yang jujur.
Sumber resolusi bisa dimanipulasi. Pool dengan likuiditas rendah mudah digeser; wajib ambang likuiditas, TWAP, dan void bila ragu.
Cold start. Papan peringkat kosong itu mati; Cassandra dan pembanding membuatnya hidup sejak hari pertama, manusia menyusul.
Sybil. Satu orang bisa punya banyak akun dan memamerkan yang beruntung. Mitigasi: syarat n >= 20, tampilkan usia akun, tanpa hadiah uang.
Statistik n kecil. UI wajib jujur; jangan menyimpulkan dari sedikit pertanyaan.
Persepsi judi dan kepatuhan. Tanpa taruhan dan hadiah tunai. Bila kelak ada hadiah, konsultasikan hukum lebih dulu (di luar lingkup dokumen ini).
Tumpang tindih dengan brier. brier adalah CLI untuk peneliti; pembeda Called: arena publik, akun, manusia, kuitansi, dan jangkar berkala.
Biaya Cassandra. Sebagian besar hanya beberapa panggilan per hari; batasi jumlah pertanyaan terbuka dan pakai model gratis atau murah.
Model berubah di bawah kaki. Selalu pin ID dan versi, dan perlakukan perubahan sebagai peramal baru.
