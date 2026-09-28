# Third-party notices

Called berisi kode orisinal. Tidak ada berkas sumber, aset, atau potongan kode
dari proyek lain yang disalin ke repositori ini. Berkas ini mencatat adaptasi
tingkat konsep dan pola penamaan yang berasal dari proyek lain, beserta
lisensinya.

## brier

- Proyek: `brier`
- Sumber: https://github.com/Noisyxl/brier
- Lisensi: MIT

### Apa yang diadaptasi

Semua berkas TypeScript di repositori ini ditulis khusus untuk Called. Yang
diambil dari brier adalah gagasan dan pola penamaan, bukan kode:

| Gagasan brier               | Lokasi di Called                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Gerbang pertanyaan (Aask)   | `lib/ask-gate.ts`, `lib/test-grammar.ts`, `lib/question-id.ts`, `config/vague.ts`                                                                                  |
| Rantai hash dan commit-reveal | `lib/seal.ts`, `lib/seal-store.ts`, `lib/verify.ts`, `db/schema.ts` (`seals`, `seal_reveals`)                                                                     |
| Ledger publik dan Verify    | `app/ledger/page.tsx`, `app/ledger/verify.tsx`, `app/api/ledger/route.ts`                                                                                          |
| Penanaman hash kepala (Anchor) | `lib/anchor.ts`, `lib/anchor-status.ts`, `app/api/cron/anchor/route.ts`, `app/anchor/[id]/page.tsx`                                                              |
| Penilaian dan papan skor    | `lib/scoring/brier.ts`, `lib/scoring/skill.ts`, `lib/scoring/murphy.ts`, `lib/scoring/leaderboard-core.ts`, `app/leaderboard/*`                                    |
| Kalibrasi                   | `lib/scoring/calibration.ts`, `components/calibration-plot.tsx`                                                                                                    |
| Pembanding sederhana        | `lib/baselines.ts` (Always-yes, Parrot, Hedgehog, Drift, Drunk)                                                                                                    |

### Pola penamaan (brier -> Called)

Pola nama berikut diadopsi agar kosakata tetap konsisten; pemetaan lengkap ada
di `docs/PRD.md` bagian 1.5:

| brier                   | Called                  |
| ----------------------- | ----------------------- |
| ask                     | Ask                     |
| seal                    | Seal                    |
| wait                    | Wait                    |
| settle                  | Settle                  |
| panel                   | The Field               |
| ledger.jsonl            | Ledger                  |
| anchor                  | Anchor                  |
| score, scoreboard       | Leaderboard             |
| calibrate               | Calibration             |
| ledger --verify         | Verify                  |
| almanac                 | Sample world            |
| hedgehog, parrot, drunk | Hedgehog, Parrot, Drunk |
| fox                     | Drift                   |
| always-yes              | Always-yes              |
| (tidak ada)             | Receipt                 |

### Yang tidak dipakai

- Peramal `fox` milik brier **tidak dipakai**. Di brier, `fox` sengaja diberi
  pandangan sempit dan berisik ke jawaban agar terkalibrasi. Di Called,
  pembanding tidak boleh punya akses ke hasil. Pembanding Called memakai
  definisi sendiri di `lib/baselines.ts` (Drift menggantikan fox).
- Aset visual, nama, dan teks UI brier tidak disalin. Tampilan Called mengikuti
  `docs/DESIGN.md`.

### Teks lisensi MIT

```
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
