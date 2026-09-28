# Design System — Called

Sumber kebenaran: `project-3-arena-prototype.html` (nilai warna, ukuran, layout, animasi). PRD section 21–23 melengkapi deskripsi. Aturan bisnis ada di `prd.md`; arsitektur dan data ada di `architecture.md`.

> **Catatan prototipe vs produk.** Hal-hal berikut hanya ada di prototipe dan tidak ikut ke produk: bar "PROTOTYPE" di atas header, teks wordmark "working name", tombol pratinjau state (Loading / Error / Ready), dan angka berlabel SAMPLE. Produk memakai data nyata atau state kosong yang jujur.

---

## 1. Design Philosophy / Read

**Design Read:** arena prediksi untuk peramal manusia dan agen AI. Bahasa visualnya gelap ala buku besar (_ledger_) dengan tekstur karakter.

**Dial:** `ENERGY 3 / RHYTHM 3 / MOTION 2`. Energi sedang, ritme antarbagian teratur tapi dipatahkan sengaja satu kali (permukaan kertas), gerak hemat.

Keputusan dan alasannya (dari komentar desain prototipe):

| Keputusan                                              | Alasan                                                                                                                                    |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Dasar hampir hitam + teks bone                         | Buku besar dibaca lama; hero gelap penuh adalah suasana yang dipilih owner dari referensi.                                                |
| Satu aksen: vermilion                                  | Warna segel lilin; hanya dipakai pada hal yang tersegel, terverifikasi, atau bisa diklik.                                                 |
| Doto (dot-matrix) untuk judul dan angka besar          | Dot-matrix terbaca sebagai struk dan penghitung, yaitu apa yang dihasilkan produk.                                                        |
| IBM Plex Mono untuk hash                               | Hash memang heksadesimal; mono di sini berfungsi, bukan hiasan.                                                                           |
| Cakrawala karakter heksadesimal di hero                | Karakternya sama dengan yang ditulis ledger; punggung bukit yang menyala adalah garis antara yang sudah disegel dan yang belum diketahui. |
| Karakter membesar ke bawah, langit jarang              | Kedalaman mencegah grid karakter seragam terasa kosong.                                                                                   |
| Kursor menyorot karakter di sekitarnya                 | Medan terasa responsif tanpa sistem animasi kedua.                                                                                        |
| Vignette hanya di area judul                           | Ada semata agar teks tetap di atas kontras 4,5:1; bentang alam di bawahnya tetap terang penuh.                                            |
| Slip kertas di bagian Method                           | Satu-satunya permukaan terang, karena kuitansi adalah kertas; sekaligus memutus ritme bagian secara sengaja.                              |
| Baris tabel, bukan kartu, untuk leaderboard dan ledger | Isinya baris yang dibandingkan, jadi kelurusan lebih penting daripada wadah.                                                              |
| Tanpa bentuk pil                                       | Baris dan tombol berradius kecil; hanya thumb slider yang bulat karena itu pegangan.                                                      |
| Diagram kalibrasi sebagai visual penanda               | Janji produk adalah kejujuran yang terukur; kurva "bilang vs benar" adalah buktinya.                                                      |
| Bagian Result dengan plot sebaran                      | Menunjukkan posisi tiap peramal sebelum jawaban, inti dari menyegel lebih dulu.                                                           |
| Ticker di kaki hero                                    | Status chain adalah pembacaan berjalan, jadi bergerak seperti itu; hover atau tombol Pause menghentikannya.                               |

---

## 2. Color System

### 2.1 Token inti

| Token         | Hex       | Peran                                                                                            |
| ------------- | --------- | ------------------------------------------------------------------------------------------------ |
| `--void`      | `#0a0a0b` | Latar utama halaman, latar input di dalam slip, latar header (dengan alfa)                       |
| `--ink`       | `#111113` | Permukaan terangkat: slip forecast, kartu kalibrasi, kepala tabel, bagian Ledger, bar notifikasi |
| `--line`      | `#26262b` | Garis pemisah, border kartu/tabel/input, grid diagram                                            |
| `--bone`      | `#ece9e4` | Teks utama, garis aksi sekunder, bar positif, penanda plot, judul hero                           |
| `--mute`      | `#a19d95` | Teks sekunder, label, kicker, sumbu diagram                                                      |
| `--seal`      | `#ff5a36` | Aksen tunggal (vermilion, warna segel lilin)                                                     |
| `--paper`     | `#e9e4d8` | **Satu-satunya permukaan terang**: slip kuitansi                                                 |
| `--paper-ink` | `#141414` | Teks di atas kertas                                                                              |

### 2.2 Warna turunan (nilai persis dari prototipe)

| Nilai                              | Dipakai untuk                                        |
| ---------------------------------- | ---------------------------------------------------- |
| `#4d493f`                          | Label (`dt`) di slip kertas                          |
| `#5a5548`                          | Garis putus-putus (dotted) antarbaris di slip kertas |
| `#33333a`                          | Sorot shimmer skeleton (di antara `--line`)          |
| `rgba(10,10,11,.92)`               | Latar header sticky                                  |
| `rgba(236,233,228,.045)`           | Sorot hover baris tabel                              |
| `rgba(255,90,54,.10)`              | Tint baris rusak (BROKEN)                            |
| `rgba(255,90,54,.24)` → transparan | Kedip baris ledger baru                              |
| `rgba(0,0,0,.5)`                   | Bayangan slip kertas (`0 18px 40px`)                 |

Karakter hero berinterpolasi dari bone ke seal menurut kedekatan dengan punggung bukit (`rgb(236+19k, 233−143k, 228−174k)`, `k = band × 0,55`), alfa maksimum 0,92.

### 2.3 Aturan pemakaian aksen (`--seal`)

**Aturan:** vermilion hanya untuk hal yang **tersegel, terverifikasi, atau bisa diklik**, dan seluruh permukaan lain tetap netral (bone/mute).

Pemakaian aksen yang ada di prototipe:

| Kategori                 | Elemen                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bisa diklik / aksi utama | Tombol primer (latar seal, teks void), thumb slider                                                                                                                 |
| Tersegel                 | Header dan border putus-putus slip "SEALED", penanda selesai di log Method, titik dan kurva kalibrasi, baris Cassandra, ID pertanyaan yang berubah saat di-_reword_ |
| Perhatian / pelanggaran  | Status BROKEN dan tint baris rusak, teks error, bar skill negatif, penanda _outcome_ di plot sebaran, kedip baris baru                                              |
| Data hidup               | Nilai pada ticker (hash kepala, jumlah rekaman, status), titik hero yang bergeser                                                                                   |

Status **VALID** sengaja _tidak_ memakai aksen (border bone); aksen menandai yang berubah atau rusak, bukan yang aman.

> **Catatan selisih dengan PRD.** PRD section 22 menyebut aksen "hanya untuk hal yang tersegel, terverifikasi, atau bisa diklik". Prototipe juga memakai aksen untuk sinyal error/rusak dan bar negatif. Tim perlu memutuskan: (a) menerima "perhatian/pelanggaran" sebagai bagian aturan, atau (b) memindahkan sinyal-sinyal itu ke warna netral. Sampai diputuskan, prototipe adalah acuan.

**Larangan pemakaian:** aksen tidak dipakai untuk dekorasi, latar bagian, atau teks biasa. Permukaan terang selain slip kuitansi tidak diperbolehkan.

---

## 3. Typography

| Keluarga              | Bobot dimuat  | Kapan dipakai                                                                         |
| --------------------- | ------------- | ------------------------------------------------------------------------------------- |
| **Doto** (dot-matrix) | 400–900       | Judul, angka besar, dan kata hasil. Tidak dipakai untuk teks bacaan.                  |
| **IBM Plex Sans**     | 400, 500, 600 | Teks bacaan, label, navigasi, tombol, FAQ.                                            |
| **IBM Plex Mono**     | 400, 500      | Hash, ID, data meta, status, kicker, label jenis, ticker, angka tabel, sumbu diagram. |

Fallback: Doto → `IBM Plex Mono, monospace`; Plex Sans → `system-ui, sans-serif`; Plex Mono → `ui-monospace, Menlo, monospace`. Font dimuat dengan `display=swap`.

### 3.1 Skala yang dipakai

| Elemen                            | Keluarga                                                                                                     | Ukuran / bobot                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Wordmark header                   | Doto                                                                                                         | 36px / 800                                           |
| Judul bagian (`h2.title`)         | Doto                                                                                                         | `clamp(34px, 5vw, 60px)` / 700, line-height 1        |
| Judul bagian Ledger               | Doto                                                                                                         | `clamp(40px, 7.4vw, 104px)`                          |
| Teks pertanyaan                   | Doto                                                                                                         | `clamp(30px, 4.2vw, 54px)` / 600, lh 1,04            |
| Judul slip / kalibrasi / kuitansi | Doto                                                                                                         | 28 / 26 / 30px, bobot 700–800                        |
| Angka probabilitas                | Doto                                                                                                         | 72px / 800 (58px di ≤560px)                          |
| Kata hasil (YES/NO)               | Doto                                                                                                         | `clamp(96px, 17vw, 230px)` / 900, lh 0,82            |
| Wordmark footer                   | Doto                                                                                                         | `clamp(64px, 15vw, 190px)` / 900, lh 0,85            |
| Judul hero                        | Titik hasil pengambilan sampel dari teks IBM Plex Mono 600 (bukan font Doto); ukuran `min(140px, lebar/8,6)` | Judul asli tetap ada sebagai `h1` tersembunyi visual |
| Teks isi                          | Plex Sans                                                                                                    | 16px / lh 1,55                                       |
| Lede hero                         | Plex Sans                                                                                                    | 18px, mute                                           |
| Tombol                            | Plex Sans                                                                                                    | 15px / 600 (14px untuk `small`)                      |
| Ringkasan FAQ                     | Plex Sans                                                                                                    | 19px / 500                                           |
| Teks tabel                        | Plex Sans / Mono                                                                                             | 14px; hash 12,5px (Ledger 15px / 13,5px)             |
| Kicker                            | Plex Mono                                                                                                    | 12px, letter-spacing 0,06em, mute                    |
| Meta / status / ticker            | Plex Mono                                                                                                    | 12–13px                                              |

Kicker adalah teks polos, **bukan badge**.

---

## 4. Key Components & Behavior

### 4.1 Struktur halaman dan irama

- Kontainer `.wrap`: lebar maks 1180px, padding horizontal 24px (18px di ≤560px).
- Bagian: padding vertikal 96px (68px di ≤860px), dipisah garis `--line`.
- Header sticky: tinggi min 56px, latar `rgba(10,10,11,.92)`, border bawah `--line`. Tautan navigasi min-height 44px, padding 0 12px, radius 4px, 14px mute; hover bone + latar ink. Navigasi bisa di-scroll horizontal di dalam wadahnya.
- Tautan jangkar memakai `scroll-padding-top: 72px` agar tidak tertutup header.
- Urutan: Hero → Question → Result → Ledger (latar `--ink`, pemutus irama) → Leaderboard → Method (slip kertas, pemutus irama kedua) → FAQ → Footer.

### 4.2 Hero

- Tinggi min `min(94vh, 860px)`, isi di tengah. Perbatasan bawah `--line`.
- **Cakrawala karakter:** kanvas penuh, `aria-hidden`. Sel 26px, karakter heksadesimal IBM Plex Mono 500, ukuran `12 + kedalaman × 10` px (membesar ke bawah). Punggung bukit di ±80% tinggi, bergelombang lambat. Langit di atasnya jarang (karakter acak dibuang berdasarkan probabilitas). Di bawah punggung bukit memudar, dan di 80–100% tinggi alfa turun ke nol. Sekitar 1,2% karakter berganti tiap ±90ms. Kursor menyalakan karakter dalam radius 210px (tambahan alfa hingga +0,6).
- **Vignette:** satu radial-gradient elips (`62% × 46%` di 50%/36%), 0,96 → 0,84 → 0 alfa void, hanya di belakang judul agar kontras teks terjaga.
- **Judul dot-matrix:** kanvas ±220px. Titik-titik berjarak `max(3,2px, fontPx/20)`, jari-jari titik `step × 0,36`. Pointer mendorong titik dalam radius `max(60, fontPx × 0,85)` dengan gaya 3,2; menyeret (pointer ditekan) menambahkan momentum 0,28; pegas kembali 0,04; redaman 0,86. Titik yang bergeser berubah bone → seal sesuai jarak (penuh di ≥60px), lalu kembali ke bone saat diam. `touch-action: pan-y` supaya scroll vertikal di sentuh tetap jalan; kursor `crosshair`. Kanvas berhenti diperbarui saat di luar layar (IntersectionObserver) atau tab tersembunyi. Menunggu font siap (batas 1,5 detik) sebelum dibangun.
- Petunjuk: "Move or drag through the dots." (mono 13,5px, mute).
- Lede maks 560px. Dua CTA sejajar di tengah: **primer** (latar seal, teks void; hover → bone) dan **sekunder** (border bone; hover → latar bone, teks void). Tombol: min-height 46px, radius 4px.
- **Kaki hero (ticker):** border atas `--line`, latar void, mono 12px. Menampilkan hash kepala, jumlah rekaman, dan status jangkar; nilainya berwarna seal, pemisah `/`. Bergulir 46 detik linear, tepi memudar 48px (mask). Berhenti saat hover atau lewat tombol Pause/Play (min 44×72px, `aria-pressed`). Ada versi teks untuk pembaca layar (`aria-live="polite"`) karena ticker sendiri `aria-hidden`.

### 4.3 Slip Forecast dan meta pertanyaan

- Layout `1,25fr / 1fr`, gap 56px, rata atas (kolom pertanyaan asimetris di kiri).
- **Meta pertanyaan:** daftar dengan garis atas dan bawah tiap baris; kolom label 130px (mute), nilai mono 13px, `word-break: break-all`.
- **Slip:** latar `--ink`, border `--line`, radius 6px, padding 28px. Judul Doto 28px, petunjuk 13,5px mute.
  - Angka probabilitas Doto 72px sejajar dengan keterangan "chance this is true".
  - **Slider:** rentang 1–99, tinggi target 44px, track 2px `--line`, **thumb bulat 28px berwarna seal** (satu-satunya elemen bulat di sistem). Skala "1%" dan "99%" di bawahnya.
  - **Alasan satu kalimat:** textarea min-height 78px, latar void, border `--line`, radius 4px, maks 140 karakter dengan penghitung di kanan bawah.
  - **Error:** area `role="alert"` tinggi min 20px, teks seal 13,5px.
  - Tombol Seal penuh lebar, gaya primer.
  - **Blok kuitansi setelah disegel:** border putus-putus seal, radius 4px, padding 16px; judul "SEALED" (mono 12px, seal); hash muncul dengan efek _scramble_ heksadesimal 700ms; baris meta di bawahnya.

### 4.4 Kotak Reword (ID hidup)

- Label 13px mute di atas input; input latar `--ink`, border `--line`, radius 4px, padding 11×12px, 14px.
- ID pertanyaan di meta diperbarui setiap ketikan. Bila berbeda dari ID asli, teks ID berubah **seal**; kembali normal bila teks dikembalikan.
- Penjelasan 13px mute di bawah input.

### 4.5 Ledger dengan Tamper dan Verify

- Bagian berlatar `--ink`; judul besar di kiri, paragraf penjelas maks 520px mute di kanan.
- **Baris aksi:** tiga tombol `small` (min-height 44px): _Verify chain_, _Tamper with record 1_ (berubah menjadi _Undo tampering_), _Clear ledger_. Tamper adalah kontrol demo dan wajib berlabel jelas.
- **Bilah status** (`role="status"`, mono 13px, border `--line`, padding 12×14px, radius 4px):
  - Netral: border `--line`.
  - VALID: border bone.
  - BROKEN: border dan teks seal; teks menyebut nomor rekaman pertama yang rusak.
- **Tabel:** dibungkus wadah dengan border `--line`, radius 6px, `overflow-x: auto`; tabel `min-width: 680px`. Kolom: `#`, Forecast, Reason, Previous hash, Hash. Kepala tabel 12px mute, latar void. Sel Ledger padding 17×16px, teks 15px; hash mono 13,5px ditampilkan singkat (8 karakter awal + `...` + 6 akhir) dengan nilai penuh di `title`.
- Baris rusak: tint `rgba(255,90,54,.10)`. Baris baru: kedip aksen 1,6 detik. Hover baris: `rgba(236,233,228,.045)`.
- **State kosong:** kalimat mute terpusat, padding 38×20px.

### 4.6 Tabel Leaderboard dan Bar

- Header bagian: judul di kiri, **filter** di kanan (grup tombol; `aria-pressed`; min-height 44px; border `--line` radius 4px; aktif = border dan teks bone).
- Strip catatan berborder putus-putus (13px mute) untuk disclaimer data contoh/definisi skill.
- Layout `1,35fr / 1fr`, gap 44px: tabel di kiri, panel kalibrasi di kanan.
- Kolom: `#`, Forecaster (nama + baris keterangan mono 12px mute), Kind (mono 12px mute), Skill vs baseline, Brier (mono, 3 desimal), n.
- **Bar skill:** tinggi 6px, radius 1px, lebar `|skill| / 60 × 120px` (min 2px), diikuti angka bertanda (`+12.4%`). Bar positif berwarna **bone**, negatif **seal**. Tumbuh dari lebar 0 dalam 0,9 detik (`cubic-bezier(.2,.7,.2,1)`) saat data siap.
- Baris Cassandra: nama berwarna seal, bobot 600. Peserta provisional diberi label "provisional" (12px mute) di samping nama.
- **State:**
  - _Loading:_ 5 baris skeleton (tinggi 14px, shimmer 1,2 detik dari `--line` ke `#33333a`).
  - _Error:_ kotak terpusat, pesan seal, tombol "Try again" (`small`).
  - _Kosong:_ pesan mute yang spesifik per filter (mis. Humans dan Agents).
  - _Ready:_ tabel penuh.

### 4.7 Diagram Kalibrasi

- Kartu: latar `--ink`, border `--line`, radius 6px, padding 24px, **sticky** di `top: 84px` (statis di ≤860px).
- Pemilih peramal: `select` tinggi 44px, latar void, border `--line`, radius 4px.
- SVG `viewBox 0 0 360 330`; area plot 304×260 dengan margin kiri 44px, atas 14px. Grid 5 garis per sumbu (0, 25, 50, 75, 100) berwarna `--line`; label sumbu mono 11px mute; judul sumbu "said (%)" dan "was right (%)" 12px mute.
- **Garis acuan:** diagonal putus-putus (`5 5`, lebar 1,2) berwarna bone.
- **Kurva:** stroke seal 2,2px, **menggambar sendiri** 1,3 detik (dash-offset dari 1 ke 0). Peramal dengan satu titik tidak punya kurva.
- **Titik:** lingkaran seal dengan jari-jari `4 + n/200 × 7` px (ukuran menurut jumlah sampel); tooltip `<title>` "said X%, right Y% (n=…)".
- Teks penjelas di bawah grafik (14px, min-height 44px). `aria-label` SVG diperbarui berisi nama peramal dan ringkasan.

### 4.8 Plot Sebaran Hasil (Result)

- Layout `0,9fr / 1,4fr`, gap 64px, rata tengah vertikal.
- **Kata hasil** (YES/NO): Doto 900 ukuran besar, warna **bone** (bukan seal), line-height 0,82. Keterangan mute maks 360px.
- **Plot:** tinggi 190px; sumbu 1px bone di tengah; tick 0%, 50%, 100% (label mono 11,5px mute). Penanda peramal berupa persegi 10×10px bone dengan label mono 12px; penanda ditempatkan **bergantian di atas dan di bawah sumbu** agar label tidak bertabrakan. Penanda _outcome_ berwarna seal, di 100%, label rata kanan.
- Plot berperan `role="img"` dengan `aria-label` berisi posisi tiap peramal dan hasil.
- **Tabel skor** di bawahnya: baris tanpa border samping, bar 8px bone, nama pemenang berwarna seal. Caption tersembunyi untuk pembaca layar.

### 4.9 Slip Kuitansi

- **Satu-satunya permukaan terang.** Latar `--paper`, teks `--paper-ink`, radius 2px, padding 30×28×34px.
- Dimiringkan `-1,2°`, bayangan `0 18px 40px rgba(0,0,0,.5)`.
- Tepi bawah bergerigi seperti sobekan struk: gradien berulang 8px terisi / 4px kosong, tinggi 8px di bawah slip (gradien fungsional, bukan dekorasi).
- Judul "RECEIPT" Doto 30px/800. Baris data: grid `120px / 1fr`, garis dotted `#5a5548`, label `#4d493f`, nilai mono 12,5px `word-break: break-all`.
- **Stempel:** kotak berborder `--paper-ink`, mono 12px, letter-spacing 0,06em (mis. "SAMPLE, NOT A REAL RECEIPT" pada data contoh).
- Catatan di bawah slip: 13,5px mute, maks 420px.

### 4.10 Log Method

- Layout dua kolom `1fr / 1fr`, gap 72px: log di kiri, slip kertas di kanan.
- Daftar bernomor dengan garis vertikal `--line` di kiri, padding kiri 28px.
- **Penanda langkah:** persegi 9×9px (bukan bulat). Langkah selesai = isi seal dengan border seal; langkah belum = isi void dengan border bone.
- Tiap langkah: tanggal mono 12,5px mute, judul 19px, paragraf 15px mute maks 460px, jarak bawah 34px.

### 4.11 FAQ dan Footer

- **FAQ:** layout `0,8fr / 1,2fr`, gap 64px; kolom judul **sticky** di `top: 96px` (statis di ≤860px). Memakai `details/summary`; ringkasan min-height 44px, padding 22px, 19px/500, indikator `+` / `-` mono; jawaban mute maks 640px.
- **Footer:** wordmark Doto besar bone dengan keterangan 18px mute; tautan footer min-height 44px, mute → bone saat hover; baris atribusi ke brier (MIT) dengan tautan nyata.

### 4.12 Tombol dan input

| Varian               | Spesifikasi                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Tombol dasar         | min-height 46px, padding 0 22px, radius 4px, border 1px bone, latar transparan, 15px/600; hover: latar bone, teks void |
| Primer               | Latar dan border seal, teks void; hover: latar dan border bone                                                         |
| Small                | min-height 44px, padding 0 16px, 14px                                                                                  |
| Tab / filter / state | min-height 44px, border `--line`, radius 4px, 14px mute; `aria-pressed=true`: border dan teks bone                     |
| Input / textarea     | Border `--line`, radius 4px, padding 11×12px, 14px; latar `--ink` (di luar slip) atau `--void` (di dalam slip)         |
| Fokus                | `outline: 2px solid var(--bone); outline-offset: 3px` pada semua kontrol                                               |

Radius: 2px (kertas), 4px (tombol, input, tab, baris), 6px (slip, kartu, wadah tabel). Tidak ada radius pil.

---

## 5. Motion Rules

Dial MOTION 2: gerak hanya untuk memandu perhatian atau menunjukkan data hidup.

| Gerak                                  | Perilaku                                                                                                                                                                                                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Reveal per blok**                    | Setiap blok masuk sekali: `opacity 0→1` dan `translateY(16px)→0`, 0,7 detik `ease`, jeda `(indeks mod 3) × 90ms`. Dipicu IntersectionObserver (`threshold 0,12`) lalu berhenti diamati. Hanya aktif bila JS berjalan (kelas `.js`), sehingga konten tetap tampil tanpa JS. |
| **Kedip baris ledger baru**            | Latar `rgba(255,90,54,.24)` memudar ke transparan selama 1,6 detik.                                                                                                                                                                                                        |
| **Scramble hash kuitansi**             | Karakter acak heksadesimal terkunci ke hash akhir dari kiri ke kanan selama 700ms.                                                                                                                                                                                         |
| **Bar leaderboard tumbuh**             | Lebar 0 → nilai dalam 0,9 detik, `cubic-bezier(.2,.7,.2,1)`.                                                                                                                                                                                                               |
| **Kurva kalibrasi menggambar sendiri** | 1,3 detik, `ease`, dari awal ke akhir kurva.                                                                                                                                                                                                                               |
| **Ticker**                             | Gulir linear 46 detik; berhenti saat hover atau tombol Pause.                                                                                                                                                                                                              |
| **Skeleton**                           | Shimmer 1,2 detik linear selama loading.                                                                                                                                                                                                                                   |
| **Cakrawala hero**                     | Pergantian karakter ±90ms, sorotan mengikuti kursor.                                                                                                                                                                                                                       |
| **Judul dot-matrix**                   | Simulasi fisika partikel (dorong, seret, pegas kembali).                                                                                                                                                                                                                   |
| **Tombol**                             | Transisi warna 0,15 detik.                                                                                                                                                                                                                                                 |

### 5.1 `prefers-reduced-motion: reduce`: matikan semuanya

- Scroll halus dimatikan.
- Reveal: semua blok langsung tampil (tanpa transisi).
- Kedip baris baru, shimmer skeleton, transisi bar: dinonaktifkan; bar langsung berukuran penuh.
- Kurva kalibrasi langsung tergambar penuh.
- Ticker statis: teks dibungkus (wrap) dan tombol Pause disembunyikan.
- Cakrawala hero: tidak ada animasi pergantian karakter dan tidak ada sorotan kursor.
- Judul dot-matrix: statis, tanpa simulasi dorong.
- Scramble hash: hash langsung tampil.
- Slip kuitansi tidak dimiringkan.
- State loading leaderboard tidak menahan (langsung siap).

---

## 6. Anti-patterns (Dilarang)

| Dilarang                            | Yang dipakai sebagai gantinya                                                                         |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Tombol pil di mana-mana             | Radius 4px; hanya thumb slider yang bulat                                                             |
| Badge kapsul di atas judul          | Kicker: teks mono polos                                                                               |
| Deretan statistik karangan          | State kosong yang jujur; data contoh berlabel SAMPLE                                                  |
| Ikon dari pustaka generik dan emoji | SVG kustom seperlunya                                                                                 |
| Gradien dekoratif                   | Hanya gradien fungsional: vignette kontras di hero, shimmer skeleton, mask tepi ticker, gerigi kertas |
| Tautan ke halaman yang belum ada    | Tautan hanya ke halaman yang sudah ada                                                                |
| Kartu untuk data yang dibandingkan  | Baris tabel yang lurus                                                                                |
| Aksen sebagai hiasan                | Aksen mengikuti bagian 2.3                                                                            |
| Permukaan terang selain kuitansi    | Semua permukaan gelap; kertas hanya untuk kuitansi                                                    |
| Angka contoh tanpa label            | Setiap angka contoh berlabel SAMPLE                                                                   |
| Menandai hasil hanya dengan warna   | Selalu disertai teks (VALID / BROKEN, tanda +/−, label outcome)                                       |

---

## 7. Accessibility Requirements

### 7.1 Kontras (WCAG AA)

Dihitung dari token prototipe:

| Pasangan                      | Rasio    |
| ----------------------------- | -------- |
| bone di atas void             | 16,3 : 1 |
| bone di atas ink              | 15,6 : 1 |
| mute di atas void             | 7,3 : 1  |
| mute di atas ink              | 7,0 : 1  |
| seal di atas void             | 6,4 : 1  |
| seal di atas ink              | 6,1 : 1  |
| teks void di atas tombol seal | 6,4 : 1  |
| paper-ink di atas paper       | 14,5 : 1 |
| label `#4d493f` di atas paper | 7,1 : 1  |

Semua teks di atas ambang 4,5:1. Teks hero di atas kanvas dijaga vignette.

> **Celah yang perlu ditangani saat implementasi.** Border kontrol interaktif (input, textarea, tab, tombol state) memakai `--line` (`#26262b`) yang hanya **1,3 : 1** terhadap void. Untuk batas komponen UI, WCAG 1.4.11 meminta 3:1. `--line` boleh tetap untuk pemisah dekoratif (garis tabel, grid), tetapi border kontrol interaktif sebaiknya memakai nilai lebih terang (mis. `--mute`, 7,3:1). Fokus tetap terlihat lewat outline bone.

### 7.2 Keyboard dan fokus

- Semua kontrol dapat dijangkau keyboard; urutan tab mengikuti urutan visual.
- Indikator fokus: outline bone 2px, offset 3px, tidak pernah dihapus.
- Filter, tab, dan tombol Pause memakai `aria-pressed`; FAQ memakai `details/summary` bawaan.

### 7.3 Target sentuh

Minimal **44px** pada semua kontrol: tautan navigasi, tombol (46px/44px), tab dan tombol state, `select`, slider (tinggi 44px), ringkasan FAQ, tautan footer, tombol Pause (44px), dan segmen ticker.

### 7.4 Pembaca layar

- `h1` tersembunyi visual ("Say it before it happens.") menggantikan judul kanvas; kanvas dekoratif `aria-hidden`.
- Diagram kalibrasi dan plot sebaran: `role="img"` dengan `aria-label` berisi ringkasan; tabel punya `caption` tersembunyi.
- Kuitansi dan status kepala rantai: `aria-live="polite"`; kesalahan Seal: `role="alert"`; hasil Verify: `role="status"`.
- Label formulir selalu ada (label tersembunyi visual bila tidak ditampilkan).

### 7.5 Gerak

Lihat bagian 5.1. Seluruh gerak nonaktif untuk `prefers-reduced-motion`.

---

## 8. Responsive Rules

Pendekatan: satu tata letak fluida dengan dua titik patah; tipografi besar memakai `clamp()`.

| Rentang                       | Perilaku                                                                                                                                                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Desktop, >860px**           | Kontainer maks 1180px. Tata letak dua kolom asimetris: Question `1,25fr/1fr`, Result `0,9fr/1,4fr`, Leaderboard `1,35fr/1fr`, Method `1fr/1fr`, FAQ `0,8fr/1,2fr`. Kartu kalibrasi dan judul FAQ sticky. Header sebaris.                |
| **Tablet dan ponsel, ≤860px** | Semua grid menjadi **satu kolom**, gap 40px. Sticky dimatikan untuk kartu kalibrasi dan judul FAQ. Padding bagian 68px. Header menumpuk vertikal dan navigasi selebar penuh, bisa digulir horizontal. Padding hero 56px atas dan bawah. |
| **Ponsel sempit, ≤560px**     | Padding kontainer 18px. Baris meta dan slip kuitansi menumpuk (label di atas nilai). Angka probabilitas 58px.                                                                                                                           |

**Aturan lintas rentang**

- Tidak boleh ada overflow horizontal pada halaman. Body memakai `overflow-x: hidden`, tetapi ini pengaman, bukan solusi: anak grid memakai `min-width: 0`.
- Tabel lebar (`min-width: 680px`) menggulir **di dalam wadahnya** (`overflow-x: auto`), bukan di halaman.
- Gambar SVG mengecil fluida (`width: 100%; height: auto`).
- Judul besar memakai `clamp()` sehingga tidak meluap di layar kecil; judul hero dibangun ulang sesuai lebar (dengan jeda 150ms saat resize).
- Kursor `crosshair` dan sorotan pointer hanya relevan untuk pointer halus; `touch-action: pan-y` menjaga scroll di layar sentuh.

**Bukti pengujian prototipe (PRD section 23)**

- Lebar **1440** dan **390**: tanpa overflow horizontal.
- Target sentuh minimal 44px terverifikasi.
- Reveal semua blok berjalan; tanpa error console.

> **Belum tercakup tes prototipe:** lebar tablet portrait (mis. 768px) dan tablet landscape (mis. 1024px). Titik patah 860px berarti 768px memakai tata letak satu kolom dan 1024px memakai dua kolom. Tambahkan keduanya ke uji responsif produk (acceptance test #20 PRD hanya menyebut 1440 dan 390).
