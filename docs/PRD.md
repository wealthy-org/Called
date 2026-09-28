# PRD — Called (Verifiable Forecasting Arena)

**Produk:** Called
**Peramal AI bawaan:** Cassandra (disingkat "C" pada ruang sempit)
**Cakupan:** Semua fitur di dokumen ini wajib selesai. Tidak ada pembagian fase.

> Dokumen ini hanya memuat _apa_ dan _mengapa_. Detail teknis (stack, endpoint, variabel lingkungan, skema mentah) ada di `architecture.md`; detail visual (warna, tipografi, motif) ada di `design.md`.

---

## 1. Overview & Problem Statement

### 1.1 Ringkasan Produk

Called adalah arena publik untuk ramalan yang bisa dibuktikan. Setiap prediksi disegel dengan hash sebelum hasilnya ada. Hash rantai terakhirnya ditanam (di-_anchor_) di Robinhood Chain. Ketika jawabannya datang, prediksi dinilai dengan aturan penilaian yang adil (Brier score). Hasilnya adalah papan peringkat peramal yang jujur: manusia, agen AI, dan pembanding sederhana bersaing pada pertanyaan yang sama.

Pertanyaan acuan adalah harga saham token di Robinhood Chain, misalnya: _"Apakah token NVDA ditutup di atas $210,00 pada 3 Okt 2026?"_. Sumber data dan tes penyelesaian ditetapkan saat pertanyaan dibuat.

Produk ini tidak melibatkan uang, taruhan, atau hadiah tunai. Tujuannya hanya membangun rekam jejak yang tidak bisa diedit.

### 1.2 Problem Statement

- Klaim ramalan mudah dibuat setelah kejadian. Tanpa bukti waktu yang independen, siapa pun bisa mengaku "sudah menduga".
- Skor yang bagus bisa menipu: bagus karena pertanyaannya mudah, karena sampelnya kecil, atau karena hanya akun yang beruntung yang dipamerkan.
- Pembuat agen AI kesulitan mengukur seberapa jujur modelnya menyatakan keyakinan, karena tidak ada aturan main bersama dan pembanding yang adil.
- Pembaca tidak punya cara mudah memeriksa siapa (atau model apa) yang benar-benar layak dipercaya tanpa harus percaya pada klaim orang lain.

### 1.3 Pembeda Utama

1. **Segel sebelum tahu hasil**, dengan tanggal dari blok chain (jam yang tidak dimiliki peramal).
2. **Skor keahlian dibanding pembanding**, dengan _n_ selalu tampil, sehingga skor bagus pada pertanyaan yang mudah tidak menipu.
3. **Satu peramal AI bawaan (Cassandra)** dengan prompt terbuka dan cadangan berlapis, ditambah agen milik pengguna (BYOK), sehingga biaya API produk nyaris nol.

### 1.4 Referensi dan Kebijakan Orisinalitas

Called terinspirasi dari **brier** (lisensi MIT), sebuah CLI lokal untuk peneliti LLM. Called mengambil logikanya (gerbang pertanyaan, rantai hash, penilaian, kalibrasi, jangkar) dan membangun sisi web, akun, dan arena sendiri. Aturan bisnisnya:

- Semua adaptasi dari brier wajib dicatat di `THIRD_PARTY.md` (file asal, lisensi, lokasi di repo kita), dengan atribusi dan teks lisensi dipertahankan.
- Tidak menyalin aset visual, nama, atau teks UI brier.
- **Peramal "fox" milik brier tidak boleh dipakai.** Di brier, fox sengaja diberi pandangan sempit ke jawaban. Di arena dengan pertanyaan masa depan yang nyata, pembanding tidak boleh punya akses ke hasil. Called memakai pembanding dengan definisi sendiri (bagian 4.9).

### 1.5 Pola Penamaan (brier → Called)

| brier                   | Called                  | Catatan                                            |
| ----------------------- | ----------------------- | -------------------------------------------------- |
| ask                     | Ask                     | Gerbang pertanyaan (tanggal, sumber, tes)          |
| seal                    | Seal                    | Prediksi dikunci dan dirantai hash                 |
| wait                    | Wait                    | Tahap tunggu; tidak bisa dipercepat                |
| settle                  | Settle                  | Resolver membaca satu angka dan menerapkan tes     |
| panel                   | The Field               | Kumpulan peramal pada satu pertanyaan              |
| ledger.jsonl            | Ledger                  | Rantai hash publik dan ekspor JSONL                |
| anchor                  | Anchor                  | Hash kepala rantai ditanam di Robinhood Chain      |
| score, scoreboard       | Leaderboard             | Peringkat berdasarkan skill vs pembanding          |
| calibrate               | Calibration             | Diagram "bilang 70%, benar berapa kali"            |
| ledger --verify         | Verify                  | Hitung ulang semua hash dan sebut baris yang rusak |
| almanac                 | Sample world            | Hanya untuk demo dan test, dilabeli jelas          |
| hedgehog, parrot, drunk | Hedgehog, Parrot, Drunk | Pembanding, definisi sendiri                       |
| fox                     | Drift                   | Pembanding baru berbasis momentum harga            |
| always-yes              | Always-yes              | Garis acuan pada setiap papan                      |
| (tidak ada)             | Receipt                 | Bukti bertanda tangan per prediksi                 |
| (tidak ada)             | Cassandra               | Peramal AI bawaan dengan tim cadangan berlapis     |

---

## 2. Target Users

| Persona             | Kebutuhan                                                                               |
| ------------------- | --------------------------------------------------------------------------------------- |
| **Peramal manusia** | Rekam jejak yang bisa dibuktikan atas penilaiannya sendiri.                             |
| **Pembuat agen AI** | Mengukur seberapa jujur modelnya menyatakan keyakinan, dengan aturan main yang adil.    |
| **Pembaca**         | Tahu siapa (atau model apa) yang layak dipercaya, tanpa harus percaya klaim orang lain. |

---

## 3. Product Principles

1. **Segel dulu, baru tahu.** Prediksi tidak bisa diedit dan tidak bisa dilihat orang lain sampai pertanyaan ditutup.
2. **Pertanyaan harus bisa diselesaikan orang yang tidak hadir.** Tanpa tanggal masa depan, sumber, dan tes ya/tidak, sebuah pertanyaan ditolak.
3. **Jawaban tanpa angka bukan jawaban.** Dicatat sebagai kegagalan, tidak diubah diam-diam menjadi 0,5.
4. **Jujur soal statistik.** _n_ tampil di samping setiap skor. Peserta dengan kurang dari 20 pertanyaan selesai berlabel "provisional" dan tidak masuk peringkat.
5. **Bukan saran keuangan, tanpa uang.** Semua angka menyatakan sesuatu tentang peramal, bukan tentang masa depan.
6. **Bukti bisa dicek siapa saja**, dari ponsel, lewat explorer dan halaman verifikasi.

---

## 4. Core Features

### 4.1 Ask — Gerbang Pertanyaan

**User story**

- Sebagai _admin_, saya ingin membuat pertanyaan dari templat dengan beberapa ambang di sekitar harga saat ini, agar pertanyaan tidak semuanya mudah.
- Sebagai _peramal atau pembaca_, saya ingin setiap pertanyaan bisa diselesaikan secara objektif oleh orang yang tidak hadir, agar hasilnya tidak bisa diperdebatkan.

**Aturan bisnis**

- Sebuah pertanyaan sah hanya bila memenuhi **semua** syarat berikut. Pesan penolakan wajib menyebut bagian mana yang kurang:
  1. Tanggal penyelesaian di masa depan, dan tanggal tutup segel sebelum tanggal itu.
  2. Sumber yang bisa dibaca (lihat 4.4).
  3. Tes yang menghasilkan ya atau tidak.
  4. Panjang teks 15–240 karakter.
  5. Tidak memuat kata samar (_significant, soon, major, roughly, probably, likely, better, worse_, dan padanannya; daftar dikelola sebagai konfigurasi).
- **ID pertanyaan** berbentuk `q-<tanggal>-<6 hex pertama dari hash(teks|tanggal|sumber|tes)>`. Mengubah satu kata mengubah ID; itu pertanyaan lain dan tidak memiliki prediksi. Halaman pertanyaan menampilkan kotak "reword" yang memperlihatkan perubahan ID ini.
- **Tata bahasa tes:** `gte N`, `lte N`, `gt N`, `lt N`, `eq N`, `neq N`, `between LO HI`. Tes yang tidak bisa di-parse ditolak saat pertanyaan dibuat, bukan pada hari penyelesaian.
- **Spesifikasi pertanyaan** memuat: ID, teks, sumber, tes, waktu buka, waktu tutup, dan waktu penyelesaian.
- **Pasokan:** jendela terbuka minimal 24 jam; maksimal 5 pertanyaan terbuka bersamaan; waktu baca tetap pada 21:00 UTC. Arsip semua pertanyaan (termasuk yang batal) bersifat publik.

**Acceptance criteria**

- [ ] Mengubah satu kata pada teks pertanyaan mengubah ID; teks yang sama menghasilkan ID yang sama.
- [ ] Pertanyaan tanpa tanggal masa depan, tanpa sumber, tanpa tes yang valid, atau memuat kata samar ditolak dengan pesan yang menyebut bagian yang kurang.
- [ ] Tes yang tidak bisa di-parse ditolak saat pembuatan.
- [ ] Pertanyaan ke-6 tidak bisa dibuka selama sudah ada 5 pertanyaan terbuka.
- [ ] Arsip publik menampilkan semua pertanyaan, termasuk yang batal.

---

### 4.2 Seal — Segel Prediksi (Commit-Reveal)

**User story**

- Sebagai _peramal_, saya ingin menyegel probabilitas dan satu kalimat alasan sebelum hasil diketahui, agar saya bisa membuktikan bahwa prediksi saya ada lebih dulu.
- Sebagai _peramal_, saya ingin prediksi saya tersembunyi dari orang lain sampai pertanyaan ditutup, agar tidak ada yang menyalin.
- Sebagai _pemilik prediksi_, saya ingin menerima kuitansi yang bisa saya verifikasi sendiri tanpa bergantung pada server.

**Aturan bisnis**

- Satu prediksi per peramal per pertanyaan. Prediksi tidak bisa diedit setelah disegel.
- Prediksi peramal lain tidak terbaca (baik lewat UI maupun API) sebelum pertanyaan ditutup.
- **Commit-reveal:** rantai menyimpan komitmen (commit) atas isi prediksi + salt. Setelah pertanyaan ditutup, isi prediksi dan salt diungkap, dan siapa pun bisa memeriksa bahwa commit cocok. Salt dibuat di sisi peramal dan diberikan ke pemilik lewat kuitansi.
- Rantai bersifat **global dan append-only**; rekaman pertama memakai `prev` berisi 64 nol.
- **Kuitansi** memuat: ID pertanyaan, probabilitas, salt, commit, hash rekaman, waktu segel, dan tanda tangan digital dari kunci publikasi Called. Pemilik dapat memverifikasi tanpa memanggil server.
- Manusia: login wallet, handle unik, tidak bisa melihat prediksi orang lain sampai tutup, dibatasi laju.

**Acceptance criteria**

- [ ] Seal kedua dari peramal yang sama pada pertanyaan yang sama ditolak; prediksi tidak dapat diedit setelah disegel.
- [ ] Prediksi orang lain tidak terbaca sebelum penutupan; setelah penutupan, commit cocok dengan isi dan salt yang diungkap.
- [ ] Data segel tidak dapat diubah atau dihapus lewat aplikasi (dijaga constraint dan test).
- [ ] Kuitansi bertanda tangan dapat diverifikasi dengan kunci publik tanpa memanggil server.
- [ ] Fungsi hash memberi hasil sama di browser dan server, dan cocok dengan vektor standar (mis. `abc` dan string kosong).

---

### 4.3 Wait — Tahap Tunggu

**User story**

- Sebagai _peramal_, saya ingin melihat hitung mundur menuju penutupan dan penyelesaian, agar saya tahu kapan prediksi terungkap dan kapan hasil keluar.

**Aturan bisnis**

- Tahap tunggu tidak bisa dipercepat.
- Saat pertanyaan ditutup, isi prediksi semua peserta diungkap.

**Acceptance criteria**

- [ ] Halaman pertanyaan menampilkan hitung mundur dan status (terbuka, ditutup, selesai).
- [ ] Sebelum penutupan, tidak ada jalur untuk melihat prediksi peserta lain.

---

### 4.4 Settle — Penyelesaian dan Sumber

**User story**

- Sebagai _pembaca_, saya ingin hasil pertanyaan ditentukan dari satu angka pada satu sumber yang sudah ditetapkan sejak awal, agar tidak ada ruang untuk menebak atau mengubah aturan.
- Sebagai _admin_, saya ingin penyelesaian manual memerlukan persetujuan kedua dan tercatat, agar tidak ada satu orang yang bisa menentukan hasil sendirian.

**Aturan bisnis**

- Resolver membaca **satu angka dari satu sumber** dan menerapkan tes yang ditetapkan sejak pertanyaan dibuat. Resolver tidak bisa melihat prediksi apa pun.
- Jenis sumber:
  - **Harga rata-rata berbobot waktu dari pool** pada jendela sebelum waktu penyelesaian. Pool wajib memenuhi ambang likuiditas minimum; ambang dan pool tertulis di pertanyaan.
  - **Umpan harga on-chain** bila tersedia; alamat umpan diverifikasi sebelum dipakai.
  - **Manual**: dibaca manusia dengan tautan bukti; wajib dua persetujuan admin, tercatat di log audit.
- Bila sumber tidak bisa dibaca pada waktu penyelesaian, pertanyaan menjadi **void** dan dikecualikan dari penilaian. Tidak pernah ditebak.
- Hasil (angka, blok, dan tes) disimpan dan ditampilkan pada halaman pertanyaan.
- Penyelesaian tidak dapat dijalankan pada pertanyaan yang tidak punya satu pun prediksi.

**Acceptance criteria**

- [ ] Resolver tidak dapat mengakses prediksi (diuji dengan mock).
- [ ] Sumber yang tidak terbaca menghasilkan void, tidak pernah tebakan.
- [ ] Penyelesaian manual tanpa persetujuan kedua ditolak.
- [ ] Halaman pertanyaan yang sudah selesai menampilkan angka, blok, dan hasil tes.
- [ ] Pertanyaan tanpa prediksi tidak dapat diselesaikan.

---

### 4.5 Ledger — Rantai Publik dan Verify

**User story**

- Sebagai _pembaca_, saya ingin melihat seluruh rantai rekaman dan memverifikasinya sendiri dari ponsel, agar saya tidak perlu percaya pada klaim siapa pun.

**Aturan bisnis**

- Halaman Ledger menghitung ulang seluruh rantai di browser. Bila ada baris yang tidak cocok, halaman menyebut **nomor rekaman pertama yang rusak**.
- Rantai dapat diekspor dalam format JSONL, dengan isi prediksi yang sudah diungkap.
- Setiap rekaman menampilkan statusnya: **sealed**, **anchored** (dengan nomor blok), atau **pending anchor**.
- Server yang menyegel, sehingga sebelum di-anchor klaim "ada sebelum hasil" masih bergantung pada server. **Rekaman yang belum di-anchor tidak boleh disebut "terbukti".**
- Halaman verifikasi kuitansi menampilkan kuitansi, status Verify (valid/rusak), status Anchor (blok dan tautan explorer), serta hasil bila sudah selesai.

**Acceptance criteria**

- [ ] Verify menyatakan VALID pada rantai utuh, dan BROKEN pada nomor rekaman yang tepat bila satu nilai diubah.
- [ ] Verifikasi di browser dan verifikasi di server memberi hasil yang sama.
- [ ] Setiap rekaman menampilkan status sealed / anchored / pending anchor.
- [ ] Rekaman tanpa anchor tidak pernah diberi label "terbukti".

---

### 4.6 Anchor — Jangkar di Robinhood Chain

**User story**

- Sebagai _pembaca dan peramal_, saya ingin hash kepala rantai ditanam di chain publik, agar waktu segel berasal dari blok dan bukan dari klaim server.

**Aturan bisnis**

- Hash kepala rantai ditanam pada transaksi bernilai nol di Robinhood Chain, tanpa kontrak dan tanpa token.
- Dijalankan **harian** dan **pada setiap penutupan pertanyaan**.
- Setiap anchor mencatat: hash transaksi, nomor blok, waktu blok, hash kepala, dan jumlah rekaman.
- Siapa pun dapat memverifikasi lewat explorer dengan membandingkan data transaksi dengan hash kepala.
- Dompet jangkar bersifat khusus, bersaldo kecil, dengan alarm saldo rendah.
- Kartu berbagi hanya boleh menyebut "terbukti" untuk rekaman yang sudah di-anchor.

**Acceptance criteria**

- [ ] Anchor menulis transaksi yang memuat hash kepala; hash pada transaksi sama dengan hasil hitung ulang.
- [ ] Rekaman tanpa anchor berlabel "pending anchor" dan tidak disebut terbukti.
- [ ] Anchor berjalan harian dan saat pertanyaan ditutup.
- [ ] Kartu berbagi hanya menyebut "terbukti" untuk rekaman yang sudah di-anchor.
- [ ] Alarm muncul saat saldo dompet jangkar rendah.

---

### 4.7 Leaderboard — Penilaian dan Peringkat

**User story**

- Sebagai _pembaca_, saya ingin peringkat yang membandingkan peramal dengan pembanding sederhana pada pertanyaan yang sama, agar saya tidak tertipu oleh skor dari pertanyaan yang mudah.
- Sebagai _peramal_, saya ingin profil dengan skill, Brier, _n_, jumlah kegagalan menjawab, dan riwayat lengkap.

**Aturan bisnis**

- **Brier score** per prediksi: `(p − outcome)²` (outcome 1 atau 0). Lebih rendah lebih baik.
- **Skill vs baseline:** `(Brier_alwaysyes − Brier) / Brier_alwaysyes × 100`, dihitung pada set pertanyaan yang sama untuk kedua sisi.
- **Provisional:** peserta dengan _n_ < 20 pertanyaan selesai berlabel "provisional" dan **tidak masuk peringkat**.
- Kegagalan menjawab dihitung dan ditampilkan, tidak dijadikan nilai apa pun.
- Skor hanya dapat dibandingkan pada set pertanyaan yang sama; papan menyediakan tampilan **"shared set"** untuk perbandingan adil.
- Pertanyaan void dikecualikan dari penilaian.
- Baris tabel: peringkat, peramal, jenis, skill vs baseline, Brier, _n_. Filter: All, House model, Baselines, Agents (BYOK), Humans. Baris Cassandra ditandai khusus.
- Kondisi tampilan: loading, error (dengan tombol coba lagi), kosong (pesan jujur, mis. "Humans join once wallet login ships"), dan ready.
- Disclaimer tetap: data contoh atau nyata, dan definisi skill.
- **Profil peramal** memuat: skill, Brier, _n_, hitungan kegagalan menjawab, dekomposisi Murphy (reliability, resolution, uncertainty, plus suku sisa), diagram kalibrasi, dan tabel riwayat (pertanyaan, prediksi, hasil, skor). Untuk Cassandra, cadangannya, dan agen: model, versi, dan hash prompt.

**Acceptance criteria**

- [ ] Brier score dan skill vs baseline cocok dengan perhitungan tangan pada fixture.
- [ ] Peserta _n_ < 20 berlabel provisional dan tidak masuk peringkat.
- [ ] Leaderboard menampilkan state loading, error (dengan coba lagi), kosong, dan ready.
- [ ] Filter Humans dan Agents menampilkan pesan kosong yang jujur bila belum ada data.
- [ ] Jumlah kegagalan menjawab tampil pada profil dan tidak dihitung sebagai nilai.
- [ ] Tampilan "shared set" tersedia untuk perbandingan pada set pertanyaan yang sama.

---

### 4.8 Calibration — Kalibrasi

**User story**

- Sebagai _pembuat agen dan peramal_, saya ingin melihat apakah "bilang 70%" benar sekitar 70% kali, agar saya tahu seberapa jujur keyakinan yang dinyatakan.

**Aturan bisnis**

- Kalibrasi memakai 5–10 bin; ukuran titik menurut jumlah sampel; garis putus-putus sebagai acuan kalibrasi sempurna.
- Dekomposisi Murphy ditampilkan pada profil.
- Semua fungsi penilaian dan kalibrasi adalah fungsi murni atas data yang sudah selesai.
- Diagram dan plot sebaran hasil harus dapat dibaca pembaca layar (label ringkasan).

**Acceptance criteria**

- [ ] Kalibrasi dan dekomposisi Murphy menghasilkan nilai yang sama dengan fixture referensi.
- [ ] Diagram kalibrasi dan plot sebaran hasil memiliki label aksesibilitas berisi ringkasan.
- [ ] Ukuran titik mencerminkan jumlah sampel per bin.

---

### 4.9 The Field — Jenis Peramal dan Pembanding

**User story**

- Sebagai _pembaca_, saya ingin setiap peramal berlabel jelas menurut jenisnya, agar saya tahu apa yang sedang saya bandingkan.

**Jenis entri**

| Jenis        | Siapa                                                | Label            |
| ------------ | ---------------------------------------------------- | ---------------- |
| House model  | Cassandra dan lapis cadangannya                      | House model      |
| Baseline     | Aturan sederhana tanpa akses ke hasil                | Baseline         |
| Agent (BYOK) | Model milik pengguna, dijalankan dengan kunci mereka | Agent (self-run) |
| Human        | Login wallet                                         | Human            |

**Pembanding (tanpa akses ke hasil)**

| Nama       | Perilaku                                                                | Fungsi                                                                  |
| ---------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Always-yes | Selalu 0,99                                                             | Garis acuan; terlihat brilian bila set pertanyaan kebetulan banyak "ya" |
| Parrot     | Base rate historis dari pertanyaan selesai dengan kelas serupa          | Reliabilitas sempurna, resolusi nol                                     |
| Hedgehog   | Satu ide dipegang keras: mendekati 0,9 atau 0,1 berdasar momentum harga | Menunjukkan celah overconfidence                                        |
| Drift      | Pembaruan kecil dari momentum harga dalam rentang 0,35–0,75             | Pembanding yang jujur dan sederhana                                     |
| Drunk      | Acak seragam dengan seed yang tercatat                                  | Lantai: skor lebih buruk berarti menyesatkan                            |

**Aturan bisnis**

- Semua pembanding hanya memakai data yang tersedia pada saat segel. Setiap rekamannya berlabel _"baseline rule, not a model"_.

**Acceptance criteria**

- [ ] Pembanding tidak memakai hasil pertanyaan apa pun (uji: hasil diacak, keluaran pembanding tidak berubah).
- [ ] Setiap rekaman pembanding berlabel "baseline rule, not a model".
- [ ] Pembanding dijalankan sekali per pertanyaan saat dibuka.

---

### 4.10 Cassandra dan Fallback Berlapis

**User story**

- Sebagai _pembaca_, saya ingin ada peramal AI bawaan dengan prompt terbuka, agar papan peringkat hidup sejak hari pertama dan cara kerjanya bisa diperiksa.
- Sebagai _admin_, saya ingin ada cadangan berlapis dari penyedia berbeda, agar gangguan satu penyedia tidak menjatuhkan seluruh peramal bawaan.

**Aturan bisnis: Cassandra**

- Nama Cassandra diambil dari peramal mitologi yang selalu benar tetapi tidak dipercaya; di Called, kuitansi yang menyediakan buktinya.
- Satu model utama, **dipin** (ID dan versi tercatat pada setiap rekaman), memakai model gratis, hasil deterministik (suhu 0, seed diturunkan dari ID pertanyaan bila model mendukung).
- **Prompt terbuka** di repo. Peramal melihat pertanyaan sendirian dan mengembalikan tepat dua hal: probabilitas dan satu kalimat alasan. Hanya isi jawaban akhir yang dibaca; penalaran internal model dibuang.
- Dijalankan **sekali per pertanyaan** saat dibuka.
- Jawaban mentah disimpan. **Jawaban tanpa angka yang bisa di-parse dicatat sebagai kegagalan dan tidak memicu fallback.**
- Mengganti model utama atau prompt membuat **peramal baru** ("Cassandra v2"); skor tidak dicampur.

**Aturan bisnis: Fallback berlapis**

| Lapis       | Nama      | Catatan                                                                                      |
| ----------- | --------- | -------------------------------------------------------------------------------------------- |
| 1 (utama)   | Cassandra | Peramal utama                                                                                |
| 2           | Helenus   | Cadangan, vendor berbeda                                                                     |
| 3           | Pythia    | Cadangan, vendor berbeda                                                                     |
| 4           | Tiresias  | Cadangan, vendor berbeda                                                                     |
| 5           | Calchas   | Cadangan, model besar                                                                        |
| 6 (darurat) | Stray     | Router tidak dipin; model yang benar-benar dipakai dicatat; **tidak pernah masuk peringkat** |

- Tiap lapis memakai vendor berbeda dan merupakan **peramal terpisah** (skornya tidak dicampur dengan Cassandra).
- **Pindah ke lapis berikutnya hanya karena kegagalan teknis**: HTTP 429, 5xx, timeout, atau model tidak tersedia, setelah maksimal 3 percobaan ulang dengan jeda eksponensial pada lapis yang sama.
- **Tidak pernah pindah lapis karena jawaban jelek, tidak berformat, atau tanpa angka.**
- Setiap rekaman menyimpan model yang benar-benar menjawab. UI menuliskannya (mis. "Cassandra tidak tersedia, Helenus menjawab").
- Bila semua lapis gagal, pertanyaan dicatat tanpa jawaban bawaan (kegagalan, bukan angka pengganti).
- Pada peringkat, Cassandra dihitung dari lapis 1 saja; lapis cadangan tampil sebagai entri "House model" terpisah berlabel _reserve_.
- Daftar lapis dikelola sebagai konfigurasi; mengubahnya tidak memerlukan perubahan kode. Pemeriksaan harian memastikan tiap model masih tersedia dan gratis; lapis yang hilang atau berbayar dilewati otomatis dan admin diberi tahu.
- Prompt hanya berisi teks pertanyaan publik.
- **Mode bayangan:** kualitas meramal model-model ini belum diuji. Selama 2 minggu pertama semua lapis menjawab pertanyaan nyata **tanpa masuk peringkat**. Model utama dipilih berdasarkan kalibrasi, kecepatan, dan ketersediaan, lalu dikunci.

**Acceptance criteria**

- [ ] Cassandra dijalankan tepat sekali per pertanyaan.
- [ ] Jawaban tanpa angka dicatat sebagai kegagalan (tidak diubah jadi 0,5); ID model dan versi tersimpan.
- [ ] Fallback hanya dipicu oleh kegagalan teknis (429, 5xx, timeout, model tidak tersedia) setelah maksimal 3 percobaan ulang; jawaban tanpa angka atau tidak berformat tidak memicu fallback.
- [ ] Setiap lapis adalah peramal terpisah: rekaman menyimpan model yang menjawab, dan skor Cassandra tidak bercampur dengan lapis cadangan.
- [ ] Pemeriksaan harian menandai lapis yang modelnya hilang atau tidak lagi gratis, melewatinya otomatis, dan memberi tahu admin.
- [ ] Lapis Stray tidak pernah masuk peringkat, dan model yang benar-benar dipakai tercatat.
- [ ] Selama mode bayangan, tidak ada lapis yang masuk peringkat.

---

### 4.11 BYOK Agents — Agen Milik Pengguna

**User story**

- Sebagai _pembuat agen AI_, saya ingin mendaftarkan agen saya dan menjalankannya pada pertanyaan terbuka dengan kunci API saya sendiri, agar saya bisa mengukur kalibrasi model saya tanpa membebani biaya produk.

**Aturan bisnis**

- Pengguna mendaftarkan agen (nama, model, penyedia, hash prompt opsional). Saat pertanyaan terbuka, pengguna menekan **Run my agent** dan memasukkan kunci API.
- **Kunci tidak pernah disimpan:** dipakai untuk satu panggilan lalu dibuang; tidak masuk log dan tidak masuk error report. UI menampilkan peringatan jelas: pakai kunci dengan batas biaya.
- **Satu percobaan per (agen, pertanyaan).** Hasil mentah disimpan.
- Entri berlabel **"Agent (self-run)"** dan tampil terpisah dari Cassandra, karena produk tidak bisa membuktikan pengguna tidak mencoba beberapa model di luar.
- Alternatif yang boleh ditawarkan: panggilan dari browser (kunci tidak melewati server) dengan label **"self-reported"**.

**Acceptance criteria**

- [ ] Kunci tidak muncul di database, log, atau error report (diuji dengan pemindaian).
- [ ] Percobaan kedua pada pertanyaan yang sama untuk agen yang sama ditolak.
- [ ] Entri agen berlabel "Agent (self-run)" (atau "self-reported" untuk panggilan dari browser) dan terpisah dari Cassandra.
- [ ] UI menampilkan peringatan penggunaan kunci dengan batas biaya.

---

### 4.12 Kuitansi dan Berbagi

**User story**

- Sebagai _peramal_, saya ingin membagikan kartu yang menyatakan "Saya menyegel 68% pada 26 Sep, sebelum hasilnya ada" beserta tautan verifikasi, agar orang lain bisa memeriksanya sendiri.

**Aturan bisnis**

- Kartu berbagi menampilkan pernyataan segel dengan tautan verifikasi; setelah pertanyaan selesai, menampilkan hasil dan skor.
- Kartu tidak menyebut "terbukti" untuk rekaman yang belum di-anchor.

**Acceptance criteria**

- [ ] Kartu berbagi memuat tautan verifikasi yang berfungsi.
- [ ] Kartu berbagi hanya menyebut "terbukti" untuk rekaman yang sudah di-anchor.
- [ ] Setelah pertanyaan selesai, kartu menampilkan hasil dan skor.

---

## 5. Page Map / User Flows

### 5.1 Peta Halaman

| Rute              | Halaman                     | Isi                                                             |
| ----------------- | --------------------------- | --------------------------------------------------------------- |
| `/`               | Beranda arena               | Lihat 5.2                                                       |
| `/questions`      | Daftar pertanyaan           | Terbuka, ditutup, selesai                                       |
| `/q/[id]`         | Halaman pertanyaan          | Form Seal dan hitung mundur; setelah selesai: hasil dan sebaran |
| `/leaderboard`    | Papan peringkat             | Filter jenis peramal                                            |
| `/f/[handle]`     | Profil peramal              | Skill, kalibrasi, riwayat                                       |
| `/ledger`         | Penampil rantai publik      | Tombol Verify                                                   |
| `/receipt/[id]`   | Halaman verifikasi kuitansi | Kuitansi, status Verify, status Anchor, hasil                   |
| `/result`         | Hasil pertanyaan terbaru     | Hasil dan sebaran peramal                                       |
| `/agents`         | Agen BYOK                   | Daftarkan dan jalankan agen                                     |
| `/method`, `/faq` | Cara kerja dan FAQ          | Termasuk batas-batas kejujuran (lihat bagian 7)                 |
| `/me`             | Akun                        | Handle, kuitansi saya, agen saya                                |
| `/receipts`       | Kuitansi saya               | Daftar kuitansi prediksi                                       |
| `/agents`          | Agen BYOK (list)             | Daftar agen yang terdaftar                                     |
| `/agents/edit`     | Kelola agen                  | Form register dan run satu kali                                |
| `/admin`           | Admin (allowlist)            | Pembuat pertanyaan dan penyelesai                               |

**Header:** wordmark, navigasi (Question, Result, Ledger, Leaderboard, Method, FAQ), dan status wallet. Tidak ada tautan ke halaman yang belum ada.

### 5.2 Beranda (`/`)

Urutan bagian:

1. **Hero:** judul "Say it before it happens.", dua CTA (Seal a forecast, Verify the ledger), dan baris _Session head_ (hash kepala rantai terbaru dan status jangkar).
2. **Open question:** pertanyaan aktif dengan meta (sumber, tes, tanggal, ID), kotak reword yang memperlihatkan ID berubah, dan slip _Your forecast_ (slider 1–99%, satu kalimat alasan, tombol Seal).
3. **Result:** hasil YES/NO, plot sebaran posisi tiap peramal pada skala 0–100 dengan penanda hasil, dan tabel skor (sampel bila belum ada yang selesai).
4. **Ledger:** 5 rekaman terakhir publik, dengan tombol Verify.
5. **Leaderboard:** tabel dan panel Calibration dengan pemilih peramal.
6. **Method:** log bertanggal (Ask, Seal, Wait, Settle) dan contoh Receipt.
7. **FAQ dan footer:** tautan nyata dan atribusi ke brier.

**Aturan:** bila tidak ada data nyata untuk sebuah bagian, tampilkan state kosong yang jujur, bukan angka karangan. Data contoh wajib berlabel SAMPLE.

### 5.3 Alur Pengguna Utama

**Peramal manusia**

1. Login dengan wallet dan memilih handle unik.
2. Membuka pertanyaan terbuka, membaca sumber dan tes.
3. Menyegel probabilitas dan satu kalimat alasan; menerima kuitansi.
4. Menunggu; status rekaman berubah dari _sealed_ menjadi _pending anchor_, lalu _anchored_.
5. Setelah pertanyaan ditutup, prediksi diungkap dan commit dapat diperiksa.
6. Setelah diselesaikan, melihat hasil, skor, dan pembaruan profil.

**Pembuat agen AI**

1. Mendaftarkan agen (nama, model, penyedia, hash prompt opsional).
2. Pada pertanyaan terbuka, menekan Run my agent dan memasukkan kunci (satu percobaan).
3. Entri muncul sebagai "Agent (self-run)" pada peringkat setelah memenuhi _n_ ≥ 20.

**Pembaca**

1. Membuka `/ledger` dan menekan Verify; hasil VALID atau nomor rekaman pertama yang rusak.
2. Membuka `/receipt/[id]` untuk memeriksa kuitansi dan status Anchor lewat explorer.

**Admin**

1. Membuat pertanyaan dari templat (lolos gerbang Ask).
2. Setelah waktu penyelesaian, menyelesaikan pertanyaan; untuk sumber manual, dengan bukti dan persetujuan kedua.

---

## 6. Data Model (Ringkas)

Skema rinci ada di `architecture.md`. Berikut entitas utama dan relasinya.

| Entitas        | Deskripsi                                                                                                  | Relasi utama                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **User**       | Akun manusia (wallet + handle unik)                                                                        | Memiliki banyak Forecaster (manusia/agen)                                                                 |
| **Forecaster** | Peramal dari jenis house, baseline, agent, atau human; mencatat model, versi, dan hash prompt bila relevan | Milik satu User (untuk agent/human); punya banyak Seal, Failure, Score                                    |
| **Question**   | Pertanyaan dengan sumber, tes, jadwal, status (open, closed, settled, void), dan hasil                     | Punya banyak Seal; punya satu Outcome saat selesai                                                        |
| **Seal**       | Rekaman prediksi yang dirantai; satu per (Question, Forecaster)                                            | Milik satu Question dan satu Forecaster; punya satu Receipt; ditautkan ke rekaman sebelumnya dalam rantai |
| **Failure**    | Catatan jawaban tanpa angka atau gagal, beserta jawaban mentah                                             | Milik satu Question dan satu Forecaster                                                                   |
| **Receipt**    | Bukti bertanda tangan per Seal                                                                             | Milik satu Seal                                                                                           |
| **Anchor**     | Penanaman hash kepala rantai di chain (transaksi, blok, waktu)                                             | Merujuk keadaan rantai pada satu titik                                                                    |
| **Score**      | Hasil penilaian (p, outcome, Brier) per (Question, Forecaster)                                             | Diturunkan dari Seal yang sudah selesai                                                                   |
| **Agent Run**  | Catatan satu percobaan agen BYOK per pertanyaan, tanpa kunci apa pun                                       | Milik satu Forecaster dan satu Question                                                                   |
| **Admin Log**  | Log audit tindakan admin (pembuatan, penyelesaian, persetujuan)                                            | Merujuk Question                                                                                          |

**Aturan integritas tingkat produk**

- Data segel bersifat append-only.
- Isi prediksi yang belum diungkap disimpan terenkripsi sampai penutupan.
- Kunci BYOK tidak pernah menjadi bagian dari model data.

---

## 7. Non-Functional Requirements

- **Keamanan:** kunci BYOK tidak pernah disimpan atau di-log; sesi aman; pembatasan laju pada Seal dan API publik; validasi input; kunci penanda tangan dan kunci jangkar hanya di sisi server yang terlindungi.
- **Integritas:** rantai append-only (tanpa perubahan atau penghapusan pada segel), dijaga constraint dan test.
- **Aksesibilitas:** kontras WCAG AA, navigasi keyboard penuh, fokus terlihat, target sentuh minimal 44px, gerak dinonaktifkan bila pengguna memilih _reduced motion_, diagram dapat dibaca pembaca layar.
- **Responsif:** desktop, tablet, dan ponsel; tanpa overflow horizontal (diuji pada lebar 1440 dan 390).
- **Ikon:** SVG, bukan emoji.
- **Privasi:** tanpa nama asli; hanya handle dan wallet; tidak ada pelacak pihak ketiga.
- **Kejujuran konten:** halaman Method dan FAQ wajib menyebut batas-batas berikut:
  - Skor dari _n_ kecil hanyalah noise.
  - Pertanyaan tentang masa lalu mengukur hafalan, bukan ramalan.
  - Hasil model bergantung pada prompt dan suhu.
  - Tidak ada nilai transferabel antar set pertanyaan.
- **API publik:** data pertanyaan, rantai, peringkat, profil, kuitansi, dan anchor dapat diakses tanpa autentikasi, dengan pembatasan laju; kunci publik penanda tangan kuitansi diterbitkan agar verifikasi bisa dilakukan mandiri.
- **Pihak ketiga:** semua adaptasi dari brier tercatat di `THIRD_PARTY.md` beserta lisensi MIT-nya.

**Acceptance criteria**

- [ ] Tidak ada overflow horizontal di 1440 dan 390.
- [ ] Target sentuh minimal 44px; semua kontrol dapat dijangkau keyboard.
- [ ] `prefers-reduced-motion` menonaktifkan seluruh gerak.
- [ ] Beranda menampilkan seluruh bagian di 5.2 tanpa angka karangan.
- [ ] `THIRD_PARTY.md` mencatat semua adaptasi dari brier dan fox milik brier tidak dipakai.

---

## 8. Risks & Open Questions

### 8.1 Risiko

| Risiko                                                                       | Mitigasi                                                                                                             |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Kepercayaan ke server sebelum jangkar**                                    | Kuitansi bertanda tangan, jangkar harian, dan pelabelan status yang jujur (sealed / pending anchor / anchored).      |
| **Sumber resolusi bisa dimanipulasi** (pool likuiditas rendah mudah digeser) | Ambang likuiditas minimum, rata-rata berbobot waktu, dan void bila ragu.                                             |
| **Cold start** (papan peringkat kosong terasa mati)                          | Cassandra dan pembanding menghidupkan papan sejak hari pertama; manusia menyusul.                                    |
| **Sybil** (satu orang banyak akun, memamerkan yang beruntung)                | Syarat _n_ ≥ 20, tampilkan usia akun, tanpa hadiah uang.                                                             |
| **Statistik n kecil**                                                        | UI wajib jujur; tidak menyimpulkan dari sedikit pertanyaan; label provisional.                                       |
| **Persepsi judi dan kepatuhan**                                              | Tanpa taruhan dan hadiah tunai. Bila kelak ada hadiah, konsultasikan hukum lebih dulu (di luar lingkup dokumen ini). |
| **Tumpang tindih dengan brier**                                              | Pembeda Called: arena publik, akun, manusia, kuitansi, dan jangkar berkala.                                          |
| **Biaya Cassandra**                                                          | Batasi jumlah pertanyaan terbuka; pakai model gratis atau murah.                                                     |
| **Model berubah di bawah kaki**                                              | Selalu pin ID dan versi; perlakukan perubahan sebagai peramal baru.                                                  |
| **Kualitas meramal model bawaan belum teruji**                               | Mode bayangan 2 minggu tanpa masuk peringkat sebelum model utama dikunci.                                            |

### 8.2 Open Questions

- Model mana yang akan dikunci sebagai Cassandra setelah mode bayangan (berdasarkan kalibrasi, kecepatan, ketersediaan)?
- Apakah opsi BYOK panggilan dari browser ("self-reported") akan ditawarkan pada rilis pertama, atau hanya BYOK lewat server?
- Berapa ambang likuiditas minimum dan ukuran jendela rata-rata waktu yang dipakai per aset?
- Bagaimana cadangan operasional bila dompet jangkar kehabisan saldo, sehingga rekaman terlalu lama berstatus "pending anchor"?
- Bagaimana kebijakan bila seluruh lapis Cassandra gagal berulang kali (pertanyaan tanpa jawaban bawaan)?

---

## 9. Out of Scope

- **Uang, taruhan, dan hadiah tunai** dalam bentuk apa pun. Produk hanya membangun rekam jejak yang tidak bisa diedit.
- Saran keuangan atau klaim tentang arah harga di masa depan; angka menyatakan tentang peramal, bukan tentang masa depan.
- Pertanyaan yang tidak bisa diselesaikan secara objektif oleh orang yang tidak hadir (tanpa tanggal masa depan, sumber, atau tes ya/tidak).
- Pertanyaan tentang masa lalu sebagai bahan peringkat (mengukur hafalan, bukan ramalan).
- Penyalinan aset visual, nama, teks UI, atau peramal "fox" dari brier.
- Penyimpanan kunci API pengguna dalam bentuk apa pun.
