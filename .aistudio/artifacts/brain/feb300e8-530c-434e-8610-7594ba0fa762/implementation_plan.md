# Si-Lussi v2 — Sistem Informasi Penilaian Kondisi Fisik & Kinerja Sungai
### Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Tengah

**Si-Lussi v2** adalah platform inspeksi lapangan dan analitik kondisi fisik serta kinerja sungai berbasis web di bawah naungan **Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Tengah**, dirancang dengan identitas visual biru elegan sesuai logo resmi Si-Lussi. Aplikasi ini memfasilitasi alur kerja terpadu antara **Administrator Pengelola** dan **Inspektor Lapangan**, mulai dari pendaftaran dan persetujuan akun, pengisian blangko penilaian per ruas sungai dengan kalkulasi `IF` otomatis dan **angka tarik (slider penyesuaian nilai lapangan)**, unggah dokumentasi per komponen sungai, pemantauan temuan real-time, hingga ekspor laporan resmi ke format PDF dan Spreadsheet (CSV/Excel).

---

## User Review & Keputusan Utama (Telah Diperbarui)

> [!IMPORTANT]
> Berikut adalah pembaruan spesifikasi berdasarkan arahan terbaru Anda:

- **Skema Penilaian Fungsi `IF` (50, 70, 80, 90) + Angka Tarik (Slider Penyesuaian Lapangan)**:
  - Setiap sub-komponen sungai memiliki pilihan kondisi kualitatif standar sesuai rumus `IF` pada spreadsheet (**50**, **70**, **80**, **90**) **DAN** dilengkapi **Angka Tarik (Interactive Range Slider 0–100%)** beserta penunjuk angka presisi.
  - Saat Inspektor memilih kondisi pada dropdown `IF`, nilai otomatis terisi (`50`, `70`, `80`, atau `90`), lalu Inspektor dapat **menggeser angka tarik (slider)** untuk menyesuaikan angka berapa yang paling akurat menggambarkan kondisi riil di lapangan (misalnya `65%`, `75%`, `85%`), dan sistem langsung menghitung ulang Nilai Kondisi Fisik tertimbang secara real-time.
- **Instansi Resmi**: Seluruh antarmuka portal, header aplikasi, dan kop laporan PDF/Spreadsheet mencantumkan **Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Tengah**.
- **Penghapusan Atribut Luas DAS**: Kolom/entitas `Luas DAS` dihapus sepenuhnya dari formulir input, tampilan detail, maupun cetakan laporan blangko.
- **Identitas Inspektor Otomatis dari Akun Login**: Formulir inspeksi tidak meminta pengisian manual identitas inspektor; nama dan atribut Inspektor langsung diambil dan ditampilkan secara otomatis dari akun Inspektor yang sedang masuk (*login*).
- **Standarisasi Pilihan Wilayah Sungai (WS)**: Pilihan dropdown Wilayah Sungai dikunci pada 6 wilayah resmi:
  1. `WS Pemali Comal`
  2. `WS Bodri Kuto`
  3. `WS Seluna`
  4. `WS Bengawan Solo`
  5. `WS Probolo`
  6. `WS Serayu Citanduy`
- **Standarisasi Pilihan Balai PSDA**: Pilihan dropdown Balai PSDA pada pendaftaran akun dan blangko inspeksi menggunakan daftar resmi:
  1. `BPSDA Pemali Comal`
  2. `BPSDA Jratun Seluna`
  3. `WS Bengawan Solo`
  4. `WS Serayu Bogowonto`
- **Dokumentasi Tiap Komponen Sungai**: Masing-masing komponen sungai memiliki modul unggah foto lapangan, input tautan dokumentasi, serta catatan kondisi tersendiri.

---

## 1. Gambaran Umum & Konsep Inti

- **Fungsi Utama Aplikasi**: Menggantikan pengisian spreadsheet manual menjadi sistem digital terpusat di lingkungan **Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Tengah** yang menghitung **Nilai Kondisi Fisik (NKF)** sungai secara otomatis, mengklasifikasikan tingkat risiko (**Risiko Rendah >70**, **Risiko Sedang 50–70**, **Risiko Tinggi <50**), menentukan rekomendasi penanganan (*Pemeliharaan Preventif*, *Pemeliharaan Korektif*, atau *Rehabilitatif*), serta memicu notifikasi tindak lanjut saat ditemukan kerusakan.
- **Target Pengguna & Peran**:
  1. **Administrator Pengelola**: Menyetujui atau menolak pendaftaran akun Inspektor, memantau dashboard analitik real-time seluruh ruas sungai lintas WS dan Balai PSDA di Jawa Tengah, memverifikasi temuan kritis, memperbarui status tindak lanjut lapangan, mengelola riwayat log aktivitas, dan mengunduh laporan rekapitulasi.
  2. **Inspektor Lapangan**: Menginput data blangko inspeksi kondisi fisik per ruas sungai (dengan nama inspektor otomatis terikat dari sesi akun), memilih parameter kondisi setiap sub-komponen (`50 / 70 / 80 / 90`) serta menyesuaikan nilai aktual menggunakan **angka tarik (slider)**, melampirkan foto dan tautan dokumentasi per komponen, serta memantau riwayat dan status temuan yang telah dilaporkan.
- **Nilai Tambah Utama**: Fleksibilitas penilaian lapangan (gabungan patokan rumus `IF` dan angka tarik slider), transparansi penuh melalui pencatatan log aktivitas otomatis di setiap aksi pengguna, akurasi perhitungan bobot tanpa risiko salah rumus (`#REF!`), dan dokumentasi visual terstruktur di setiap komponen sungai.

---

## 2. Pengalaman Pengguna & Desain Visual

### Alur Pengguna Utama (Key User Flows)

1. **Portal Login & Pendaftaran Inspektor**:
   - Pengguna disambut halaman portal resmi **Si-Lussi — Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Tengah** menampilkan logo **SI-LUSSI** dengan pilihan tab **Masuk Akun** dan **Daftar Inspektor Baru**, dilengkapi tombol akses cepat akun demo (*Admin Pengelola* & *Inspektor Terverifikasi*).
   - Saat calon Inspektor mendaftar, mereka memilih unit kerja Balai PSDA (`BPSDA Pemali Comal`, `BPSDA Jratun Seluna`, `WS Bengawan Solo`, atau `WS Serayu Bogowonto`). Akun baru masuk ke antrean persetujuan Administrator.
2. **Alur Inspektor — Input Blangko, Angka Tarik & Dokumentasi Per Komponen**:
   - Nama Inspektor pelapor otomatis terisi dari sesi akun aktif (tanpa perlu diketik ulang).
   - Inspektor mengisi data umum ruas sungai (tanpa Luas DAS): *Nama Sungai*, *No./Keterangan Ruas*, *Panjang Sungai (km)*, *Panjang Ruas Sungai (km)*, *Nama WS* (`WS Pemali Comal`, `WS Bodri Kuto`, `WS Seluna`, `WS Bengawan Solo`, `WS Probolo`, `WS Serayu Citanduy`), *Desa*, *Kecamatan*, *Kabupaten/Kota*, *Balai PSDA* (`BPSDA Pemali Comal`, `BPSDA Jratun Seluna`, `WS Bengawan Solo`, `WS Serayu Bogowonto`), *Tanggal Pelaksanaan*, serta *Titik Koordinat Awal (X,Y)* dan *Akhir (X,Y)*.
   - Pada setiap sub-komponen (*Palung Sungai*, *Bantaran Kanan*, *Bantaran Kiri*, *Sempadan Kanan*, *Sempadan Kiri*, *Muara Sungai*, *Buangan Limbah*):
     1. Inspektor dapat memilih kriteria kondisi dari fungsi `IF` (otomatis mengarahkan ke patokan **50**, **70**, **80**, atau **90**).
     2. Inspektor dapat menggeser **Angka Tarik (Slider Interaktif)** yang dilengkapi penanda patokan (`50 · 70 · 80 · 90`) untuk menyesuaikan nilai persis dengan kondisi di lapangan.
     3. Mengunggah foto atau tautan dokumentasi khusus untuk komponen tersebut.
   - Panel ringkasan menghitung skor sub-komponen, total **NKF (%)**, kategori risiko (**RR / RS / RT**), dan rekomendasi pemeliharaan secara langsung (*live calculation*).
3. **Alur Notifikasi & Tindak Lanjut Temuan**:
   - Saat inspeksi disimpan—terutama jika **NKF ≤ 70** (*Risiko Sedang* atau *Risiko Tinggi*) atau terdapat sub-komponen bernilai rendah—sistem otomatis membuat **Notifikasi Temuan Baru** bagi Administrator dan pengguna terkait.
   - Administrator dapat meninjau detail komponen yang rusak, melihat foto dokumentasi per komponen, dan memperbarui status tindak lanjut (*Menunggu Tindak Lanjut* → *Dalam Penanganan* → *Selesai Ditindaklanjuti*).
4. **Alur Dashboard Analitik, Log Aktivitas & Ekspor Laporan**:
   - Dashboard memvisualisasikan tren NKF sungai secara real-time, distribusi kondisi fisik per Wilayah Sungai dan Balai PSDA, perbandingan nilai antar komponen sungai, serta daftar temuan prioritas.
   - Setiap inspeksi dapat dicetak atau diunduh sebagai **Laporan PDF Resmi** ber-kop **Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Tengah** (sesuai tata letak blangko Penilaian Kondisi Fisik Sungai lengkap dengan dokumentasi tiap komponen) maupun **Spreadsheet (CSV/Excel)**.

### Identitas Visual & Tema

- **Arah Estetika**: *Modern Hydrological SaaS & Field Command* — memadukan ketegasan instrumen teknis sumber daya air Jawa Tengah dengan tata letak bersih, terang, dan berfokus pada keterbacaan data tabel.
- **Palet Warna (60-30-10 Nuansa Biru Si-Lussi)**:
  - **60% Kanvas Dominan**: Putih bersih (`#F8FAFC` / `slate-50`) dan permukaan konten putih murni (`#FFFFFF`) untuk menjaga kontras tinggi.
  - **30% Struktur & Navigasi**: Biru tua samudra (`#0B2C5F` — selaras dengan warna gelap pada logo Si-Lussi) untuk bilah navigasi samping (*sidebar*), header tabel utama, dan aksen tipografi struktural, dipadukan garis batas halus (`#E2E8F0`).
  - **10% Aksen & Status Semantik**: Biru gelombang (`#1B65A6` & `#3882C4`) untuk tombol aksi utama, track angka tarik (slider), dan indikator aktif; disertai warna semantik terukur beserta label teks eksplisit:
    - **Risiko Rendah / Kinerja Baik (>70)**: Hijau Zamrud (`#15803D`) — *Pemeliharaan Preventif*
    - **Risiko Sedang / Kinerja Cukup (50–70)**: Kuning Amber (`#B45309`) — *Pemeliharaan Korektif*
    - **Risiko Tinggi / Rusak Berat (<50)**: Merah Kirmizi (`#B91C1C`) — *Rehabilitatif*
- **Tipografi & Hierarki**:
  - *Display & Judul*: `Plus Jakarta Sans` (SemiBold/Bold) untuk judul halaman, identitas instansi, dan ringkasan metrik.
  - *Teks & Formulir*: `Public Sans` untuk keterbacaan optimal pada tabel blangko dan formulir kepadatan tinggi.
  - *Angka & Koordinat*: `JetBrains Mono` dengan `tabular-nums` untuk seluruh kolom persentase Bobot, Nilai Fisik, Nilai Kondisi Fisik, dan titik koordinat.

---

## 3. Keputusan Produk & Pertimbangan Teknis

- **Kombinasi Fungsi `IF` (50, 70, 80, 90) dan Angka Tarik (Slider Penyesuaian)**:
  - *Pendekatan*: Menyediakan pilihan deskripsi kondisi lapangan (yang otomatis menerapkan logika `IF` ke nilai patokan `50`, `70`, `80`, atau `90`) sekaligus kontrol **Angka Tarik (Range Slider + Input Angka)** pada setiap baris sub-komponen. Ketika slider digeser, nilai fisik berubah secara mulus dan deskripsi kondisi otomatis menyesuaikan rentang nilai terdekat, lalu menghitung `Nilai Kondisi Fisik = (Bobot × Nilai Fisik) / 100`.
  - *Alasan*: Memadukan kepatuhan terhadap standar rumus `IF` blangko dengan keleluasaan Inspektor di lapangan apabila kondisi aktual berada di antara nilai patokan (misalnya 65 atau 85).
- **Otomatisasi Identitas Inspektor dari Sesi Login**:
  - *Pendekatan*: Saat Inspektor membuat laporan baru, sistem otomatis mengikat ID, Nama Lengkap, dan Balai PSDA dari profil akun yang sedang login ke dalam rekaman inspeksi dan log aktivitas.
  - *Alasan*: Menghindari duplikasi input, mencegah kesalahan pengetikan nama petugas, dan menjamin akuntabilitas pada riwayat log aktivitas.

---

## 4. Arsitektur Teknis & Strategi Data

### Diagram Arsitektur & Komponen

```
┌────────────────────────────────────────────────────────────────────────────┐
│       SI-LUSSI v2 — DINAS PU & PENATAAN RUANG PROVINSI JAWA TENGAH         │
│  ┌──────────────────────┐  ┌────────────────────────────────────────────┐  │
│  │   Portal Autentikasi │  │       Header & Pusat Notifikasi            │  │
│  │  • Login Akun        │  │  • Lonceng Notifikasi Temuan Baru (Badge)  │  │
│  │  • Daftar Inspektor  │  │  • Sesi Otomatis Nama Inspektor / Admin    │  │
│  │  • Pilihan Balai PSDA│  │  • Aksi Cepat Input / Ekspor Laporan       │  │
│  └──────────┬───────────┘  └─────────────────────┬──────────────────────┘  │
└─────────────┼────────────────────────────────────┼─────────────────────────┘
              ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                   STATE & PERSISTENCE ENGINE (REAL-TIME)                   │
│  • Store Pengguna & Antrean Persetujuan Inspektor (RBAC: Admin vs Inspektor)│
│  • Store Inspeksi Sungai (6 WS & 4 Balai PSDA Jateng, Tanpa Luas DAS)      │
│  • Store Notifikasi Tindak Lanjut & Riwayat Log Aktivitas Transparan       │
└──────┬──────────────────┬────────────────────┬───────────────────┬─────────┘
       ▼                  ▼                    ▼                   ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────┐  ┌──────────────────┐
│  Dashboard   │  │ Form Blangko     │  │ Panel Admin  │  │ Generator        │
│  Analitik    │  │ Inspeksi Sungai  │  │ & Transparansi│  │ Laporan Resmi    │
│ • Tren NKF   │  │ • 7 Komponen     │  │ • Approval   │  │ • Cetak/Unduh PDF│
│ • Filter WS  │  │ • IF 50/70/80/90 │  │   Inspektor  │  │   Kop DPUPR Jateng│
│   & BPSDA    │  │   + Angka Tarik  │  │ • Tindak     │  │ • Ekspor Excel / │
│ • Peta/Titik │  │ • Dokumentasi    │  │   Lanjut     │  │   CSV Lengkap    │
│   Koordinat  │  │   Tiap Komponen  │  │ • Log Sistem │  │                  │
└──────────────┘  └──────────────────┘  └──────────────┘  └──────────────────┘
```

### Struktur Data & Pemetaan Perhitungan Blangko

1. **Entitas Pengguna (`UserAccount`)**:
   - Menyimpan identitas akun, peran (`admin` atau `inspector`), NIP/ID Petugas, unit kerja (`BPSDA Pemali Comal`, `BPSDA Jratun Seluna`, `WS Bengawan Solo`, `WS Serayu Bogowonto`), status akun (`pending`, `approved`, `rejected`), dan waktu pendaftaran.
2. **Entitas Inspeksi Ruas Sungai (`RiverInspection`)**:
   - **Data Umum & Lokasi**:
     - `Nama Sungai`, `No. Ruas` (Keterangan Ruas), `Panjang Sungai (km)`, `Panjang Ruas Sungai (km)` *(tanpa Luas DAS)*.
     - `Nama WS`: Pilihan `WS Pemali Comal`, `WS Bodri Kuto`, `WS Seluna`, `WS Bengawan Solo`, `WS Probolo`, `WS Serayu Citanduy`.
     - `Balai PSDA`: Pilihan `BPSDA Pemali Comal`, `BPSDA Jratun Seluna`, `WS Bengawan Solo`, `WS Serayu Bogowonto`.
     - `Lokasi`: Desa, Kecamatan, Kabupaten/Kota, `Koordinat Awal (x, y)`, `Koordinat Akhir (x, y)`, `Tanggal Pelaksanaan`.
     - `Inspektor`: Otomatis terisi dari akun Inspektor yang sedang login (`inspectorId`, `inspectorName`, `inspectorBalai`).
   - **Rincian Sub-Komponen, Rumus `IF` (50, 70, 80, 90) & Angka Tarik (Slider)**:
     - Setiap item menyimpan `conditionLabel` (pilihan kondisi `IF`), `nilaiFisik` (angka hasil `IF` 50/70/80/90 yang dapat disesuaikan bebas melalui **Angka Tarik / Slider**), `bobot`, dan `nilaiKondisiFisik = (bobot × nilaiFisik) / 100`.
     - **1. Palung Sungai (Bobot Induk 60%)**: Hambatan Aliran Air (15%), Penyempitan (20%), Erosi Dasar (25%), Sedimentasi di Dasar Sungai (25%), Aktivitas Penambangan Sedimen pada Alur (15%).
     - **2. Bantaran Sungai Kanan (Bobot Induk 10%)**: Kepadatan Tanaman dalam Bantaran (70%), Aktivitas Penambangan Sedimen pada Bantaran (30%).
     - **3. Bantaran Sungai Kiri (Bobot Induk 10%)**: Kepadatan Tanaman dalam Bantaran (70%), Aktivitas Penambangan Sedimen pada Bantaran (30%).
     - **4. Sempadan Sungai Kanan (Bobot Induk 5%)**: Pemanfaatan Daerah Sempadan (80%), Penetapan Garis Sempadan (20%).
     - **5. Sempadan Sungai Kiri (Bobot Induk 5%)**: Pemanfaatan Daerah Sempadan (80%), Penetapan Garis Sempadan (20%).
     - **6. Muara Sungai (Opsional / Ruas Muara)**: Pemanfaatan Muara (50%), Sedimentasi Muara Musim Kemarau (50%).
     - **7. Buangan Limbah (Bobot Induk 10%)**: Limbah Cair / Pabrik (100%).
   - **Dokumentasi Per Komponen (`ComponentDocumentation`)**:
     - Setiap komponen memiliki daftar lampiran foto (unggah langsung), tautan dokumentasi (`url`), dan catatan kondisi lapangan.
   - **Hasil Akhir & Tindak Lanjut**:
     - Skor Total NKF (`0–100%`), Kategori Risiko (`Risiko Rendah >70`, `Risiko Sedang 50–70`, `Risiko Tinggi <50`), Kinerja Sungai (`Kinerja Baik`, `Kinerja Cukup`, `Kinerja Buruk`), Rekomendasi (`Pemeliharaan Preventif`, `Pemeliharaan Korektif`, `Rehabilitatif`), serta Status Tindak Lanjut (`Menunggu Verifikasi`, `Perlu Tindak Lanjut`, `Dalam Penanganan`, `Selesai`).
3. **Entitas Notifikasi & Log Aktivitas (`NotificationItem` & `ActivityLog`)**:
   - Mencatat secara otomatis setiap kejadian beserta nama pengguna aktif untuk transparansi penuh di lingkungan Dinas Pekerjaan Umum dan Penataan Ruang Provinsi Jawa Tengah.
