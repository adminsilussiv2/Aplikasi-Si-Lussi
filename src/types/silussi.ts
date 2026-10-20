export type WilayahSungai =
  | 'WS Pemali Comal'
  | 'WS Bodri Kuto'
  | 'WS Seluna'
  | 'WS Bengawan Solo'
  | 'WS Probolo'
  | 'WS Serayu Citanduy';

export const WILAYAH_SUNGAI_OPTIONS: WilayahSungai[] = [
  'WS Pemali Comal',
  'WS Bodri Kuto',
  'WS Seluna',
  'WS Bengawan Solo',
  'WS Probolo',
  'WS Serayu Citanduy',
];

export type BalaiPSDA =
  | 'BPSDA Jratun Seluna'
  | 'BPSDA Pemali Comal'
  | 'BPSDA Bengawan Solo'
  | 'BPSDA Serayu Bogowonto';

export const BALAI_PSDA_OPTIONS: BalaiPSDA[] = [
  'BPSDA Jratun Seluna',
  'BPSDA Pemali Comal',
  'BPSDA Bengawan Solo',
  'BPSDA Serayu Bogowonto',
];

export type NamaBangunanPrasarana =
  | 'Bendung'
  | 'Pompa Pengambilan'
  | 'Pengambilan Bebas'
  | 'Bendungan beserta Waduknya'
  | 'Rawa'
  | 'Daerah Retensi'
  | 'Groundsill'
  | 'Checkdam'
  | 'Krib'
  | 'Parapet'
  | 'Perkuatan Tebing'
  | 'AWLR'
  | 'Pelischaal'
  | 'AWLL'
  | 'Pos Hujan Otomatis'
  | 'Pos Hujan Biasa'
  | 'ARL'
  | 'Pos Klimatologi';

export const NAMA_BANGUNAN_OPTIONS: NamaBangunanPrasarana[] = [
  'Bendung',
  'Pompa Pengambilan',
  'Pengambilan Bebas',
  'Bendungan beserta Waduknya',
  'Rawa',
  'Daerah Retensi',
  'Groundsill',
  'Checkdam',
  'Krib',
  'Parapet',
  'Perkuatan Tebing',
  'AWLR',
  'Pelischaal',
  'AWLL',
  'Pos Hujan Otomatis',
  'Pos Hujan Biasa',
  'ARL',
  'Pos Klimatologi',
];

export type UserRole = 'admin' | 'inspector';
export type AccountStatus = 'pending' | 'approved' | 'rejected';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  nip: string;
  jabatan: string;
  balaiPsda: BalaiPSDA;
  role: UserRole;
  status: AccountStatus;
  registeredAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export type InspectionCategory = 'fisik_sungai' | 'kinerja_prasarana';

export type FisikComponentKey =
  | 'palung'
  | 'bantaranKanan'
  | 'bantaranKiri'
  | 'sempadanKanan'
  | 'sempadanKiri'
  | 'muara'
  | 'buanganLimbah';

export type PrasaranaComponentKey = 'kinerjaPrasarana';

export type ComponentKey = FisikComponentKey | PrasaranaComponentKey;

export interface IfOption {
  score: 90 | 80 | 70 | 50;
  label: string;
  shortTag: string;
}

export interface SubComponentMetadata {
  id: string;
  no: number;
  name: string;
  bobot: number; // Percentage within the sub-table (sums to 100)
  placeholderTag: string;
  ifOptions: IfOption[];
}

export interface ComponentMetadata {
  key: ComponentKey;
  no: number;
  title: string;
  shortTitle: string;
  bobotInduk: number; // Weight in the main summary table
  isMainWeighted: boolean;
  subComponents: SubComponentMetadata[];
}

export interface ComponentPhoto {
  id: string;
  url: string;
  caption: string;
  uploadedAt: string;
}

export interface SubComponentValue {
  subId: string;
  conditionLabel: string;
  nilaiFisik: number; // Derived from IF (50, 70, 80, 90) or adjusted via Angka Tarik (0-100)
  keterangan?: string; // Optional documentation note per sub-component
  docLink?: string; // Optional documentation link per sub-component
  photos?: ComponentPhoto[]; // Optional uploaded photos per sub-component
}

export interface ComponentDocumentation {
  componentKey: ComponentKey;
  keterangan: string;
  docLink: string;
  photos: ComponentPhoto[];
}

export type RiskLevel =
  | 'Risiko Rendah (RR)'
  | 'Risiko Sedang (RS)'
  | 'Risiko Tinggi (RT)';
export type PerformanceLevel =
  | 'Kinerja Baik'
  | 'Kinerja Cukup'
  | 'Kinerja Buruk';
export type MaintenanceAction =
  | 'Pemeliharaan Preventif'
  | 'Pemeliharaan Korektif'
  | 'Rehabilitatif';
export type PhysicalStatusLabel = 'BAIK' | 'RUSAK SEDANG' | 'RUSAK BERAT';
export type FollowUpStatus =
  | 'Aman / Terkendali'
  | 'Perlu Tindak Lanjut'
  | 'Dalam Penanganan'
  | 'Selesai Ditindaklanjuti';

export interface RiverInspection {
  id: string;
  category: InspectionCategory;
  kodeInspeksi: string;
  namaSungai: string;
  namaPrasarana?: string; // Nama Bangunan (selected from NAMA_BANGUNAN_OPTIONS when category === 'kinerja_prasarana')
  jenisPrasarana?: string;
  noRuas: string;
  panjangSungaiKm?: number;
  panjangRuasKm: number;
  namaWs: WilayahSungai;
  desa: string;
  kecamatan: string;
  kabupatenKota: string;
  balaiPsda: BalaiPSDA;
  koordinatAwal: string;
  koordinatAkhir: string;
  tanggalPelaksanaan: string;
  createdAt: string;

  // Automatic Inspector identity from logged-in account
  inspectorId: string;
  inspectorName: string;
  inspectorNip: string;
  inspectorBalai: BalaiPSDA;

  // Values per sub-component (includes optional documentation per sub-component)
  subValues: Record<string, SubComponentValue>;

  // Aggregated documentation per component
  componentDocs: Record<string, ComponentDocumentation>;

  // Global documentation links in Blangko footer
  linkDokumentasi1: string;
  linkDokumentasi2: string;
  linkDokumentasi3: string;

  // Computed Summary Metrics
  nkfTotal: number;
  muaraScore: number;
  includeMuaraInSummary: boolean;
  riskLevel: RiskLevel;
  performanceLevel: PerformanceLevel;
  maintenanceAction: MaintenanceAction;
  physicalStatusLabel: PhysicalStatusLabel;

  // Follow-up & verification
  followUpStatus: FollowUpStatus;
  followUpNotes: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  actorBalai: string;
  actionType:
    | 'LOGIN'
    | 'REGISTER_ACCOUNT'
    | 'APPROVE_ACCOUNT'
    | 'REJECT_ACCOUNT'
    | 'CREATE_INSPECTION'
    | 'UPDATE_INSPECTION'
    | 'UPDATE_FOLLOWUP'
    | 'EXPORT_REPORT';
  summary: string;
  detail: string;
  relatedId?: string;
}

// ============================================================================
// 1. BLANGKO PENILAIAN KONDISI FISIK SUNGAI (PER RUAS)
// ============================================================================
export const BLANGKO_COMPONENTS: ComponentMetadata[] = [
  {
    key: 'palung',
    no: 1,
    title: 'Palung Sungai',
    shortTitle: 'Palung Sungai',
    bobotInduk: 60,
    isMainWeighted: true,
    subComponents: [
      {
        id: 'palung_1',
        no: 1,
        name: 'Hambatan Aliran Air',
        bobot: 15,
        placeholderTag: '<<Hambatan Aliran>>',
        ifOptions: [
          {
            score: 90,
            label: 'Tidak ada hambatan aliran (<10% lebar alur)',
            shortTag: 'Aman / Lancar (90)',
          },
          {
            score: 80,
            label: 'Hambatan ringan ranting/sampah (10%-25% alur)',
            shortTag: 'Hambatan Ringan (80)',
          },
          {
            score: 70,
            label: 'Hambatan sedang pulau sedimen/vegetasi (25%-50%)',
            shortTag: 'Hambatan Sedang (70)',
          },
          {
            score: 50,
            label: 'Hambatan berat menyumbat aliran (>50% lebar alur)',
            shortTag: 'Hambatan Berat (50)',
          },
        ],
      },
      {
        id: 'palung_2',
        no: 2,
        name: 'Penyempitan',
        bobot: 20,
        placeholderTag: '<<Penyempitan>>',
        ifOptions: [
          {
            score: 90,
            label: 'Penampang alur normal / tidak ada penyempitan',
            shortTag: 'Normal (90)',
          },
          {
            score: 80,
            label: 'Penyempitan ringan alur sungai (10%-25%)',
            shortTag: 'Penyempitan Ringan (80)',
          },
          {
            score: 70,
            label: 'Penyempitan sedang mengurangi kapasitas (25%-50%)',
            shortTag: 'Penyempitan Sedang (70)',
          },
          {
            score: 50,
            label: 'Penyempitan kritis rawan meluap (>50% lebar normal)',
            shortTag: 'Penyempitan Berat (50)',
          },
        ],
      },
      {
        id: 'palung_3',
        no: 3,
        name: 'Erosi Dasar',
        bobot: 25,
        placeholderTag: '<<Erosi Dasar>>',
        ifOptions: [
          {
            score: 90,
            label: 'Dasar sungai stabil / tidak terjadi degradasi',
            shortTag: 'Stabil (90)',
          },
          {
            score: 80,
            label: 'Gerusan dasar lokal / ringan (<0.5 m)',
            shortTag: 'Erosi Ringan (80)',
          },
          {
            score: 70,
            label: 'Degradasi dasar sedang (0.5 m - 1.5 m)',
            shortTag: 'Erosi Sedang (70)',
          },
          {
            score: 50,
            label:
              'Gerusan dasar berat mengancam kaki tebing/bangunan (>1.5 m)',
            shortTag: 'Erosi Berat (50)',
          },
        ],
      },
      {
        id: 'palung_4',
        no: 4,
        name: 'Sedimentasi di dasar sungai',
        bobot: 25,
        placeholderTag: '<<Sedimentasi Dasar Sungai>>',
        ifOptions: [
          {
            score: 90,
            label: 'Tidak ada endapan sedimen berarti (<10% kapasitas)',
            shortTag: 'Bersih / Normal (90)',
          },
          {
            score: 80,
            label: 'Endapan sedimen ringan di tikungan (10%-25%)',
            shortTag: 'Sedimentasi Ringan (80)',
          },
          {
            score: 70,
            label: 'Pendangkalan sedang di dasar sungai (25%-50%)',
            shortTag: 'Sedimentasi Sedang (70)',
          },
          {
            score: 50,
            label: 'Pendangkalan berat / delta sedimen tinggi (>50%)',
            shortTag: 'Sedimentasi Berat (50)',
          },
        ],
      },
      {
        id: 'palung_5',
        no: 5,
        name: 'Aktifitas penambangan sedimen pada alur',
        bobot: 15,
        placeholderTag: '<<Aktv. Penambangan Sedimen>>',
        ifOptions: [
          {
            score: 90,
            label: 'Tidak ada aktivitas penambangan pada alur sungai',
            shortTag: 'Tidak Ada Tambang (90)',
          },
          {
            score: 80,
            label: 'Penambangan rakyat manual terkendali / berizin',
            shortTag: 'Manual Terkendali (80)',
          },
          {
            score: 70,
            label: 'Penambangan intensif mulai mengubah morfologi alur',
            shortTag: 'Tambang Sedang (70)',
          },
          {
            score: 50,
            label: 'Penambangan mekanis liar merusak palung sungai',
            shortTag: 'Tambang Liar Berat (50)',
          },
        ],
      },
    ],
  },
  {
    key: 'bantaranKanan',
    no: 2,
    title: 'Bantaran Sungai ( Kanan )',
    shortTitle: 'Bantaran Kanan',
    bobotInduk: 10,
    isMainWeighted: true,
    subComponents: [
      {
        id: 'bantaran_kanan_1',
        no: 1,
        name: 'Kepadatan tanaman dalam bantaran',
        bobot: 70,
        placeholderTag: '<<Kepadatan Tanaman (Kanan)>>',
        ifOptions: [
          {
            score: 90,
            label: 'Bantaran bersih / rumput rendah (<10% tutupan pohon)',
            shortTag: 'Bersih / Rumput (90)',
          },
          {
            score: 80,
            label: 'Tanaman perdu/semak jarang (10%-25% bantaran)',
            shortTag: 'Perdu Jarang (80)',
          },
          {
            score: 70,
            label: 'Tanaman cukup rapat menghambat arus banjir (25%-50%)',
            shortTag: 'Cukup Rapat (70)',
          },
          {
            score: 50,
            label: 'Pohon keras / bambu sangat rapat (>50% bantaran)',
            shortTag: 'Sangat Rapat (50)',
          },
        ],
      },
      {
        id: 'bantaran_kanan_2',
        no: 2,
        name: 'Aktifitas penambangan sedimen pada bantaran',
        bobot: 30,
        placeholderTag: '<<Akt. Penambangan Sedimen (Kanan)>>',
        ifOptions: [
          {
            score: 90,
            label: 'Tidak ada penggalian/penambangan pada bantaran kanan',
            shortTag: 'Tidak Ada (90)',
          },
          {
            score: 80,
            label: 'Aktivitas pengambilan material skala kecil/lokal',
            shortTag: 'Ringan (80)',
          },
          {
            score: 70,
            label: 'Penggalian sedang menimbulkan lubang di bantaran',
            shortTag: 'Sedang (70)',
          },
          {
            score: 50,
            label: 'Penambangan berat merusak stabilitas bantaran kanan',
            shortTag: 'Berat / Rusak (50)',
          },
        ],
      },
    ],
  },
  {
    key: 'bantaranKiri',
    no: 3,
    title: 'Bantaran Sungai ( Kiri )',
    shortTitle: 'Bantaran Kiri',
    bobotInduk: 10,
    isMainWeighted: true,
    subComponents: [
      {
        id: 'bantaran_kiri_1',
        no: 1,
        name: 'Kepadatan tanaman dalam bantaran',
        bobot: 70,
        placeholderTag: '<<Kepadatan Tanaman (Kiri)>>',
        ifOptions: [
          {
            score: 90,
            label: 'Bantaran bersih / rumput rendah (<10% tutupan pohon)',
            shortTag: 'Bersih / Rumput (90)',
          },
          {
            score: 80,
            label: 'Tanaman perdu/semak jarang (10%-25% bantaran)',
            shortTag: 'Perdu Jarang (80)',
          },
          {
            score: 70,
            label: 'Tanaman cukup rapat menghambat arus banjir (25%-50%)',
            shortTag: 'Cukup Rapat (70)',
          },
          {
            score: 50,
            label: 'Pohon keras / bambu sangat rapat (>50% bantaran)',
            shortTag: 'Sangat Rapat (50)',
          },
        ],
      },
      {
        id: 'bantaran_kiri_2',
        no: 2,
        name: 'Aktifitas penambangan sedimen pada bantaran',
        bobot: 30,
        placeholderTag: '<<Akt. Penambangan Sedimen (Kiri)>>',
        ifOptions: [
          {
            score: 90,
            label: 'Tidak ada penggalian/penambangan pada bantaran kiri',
            shortTag: 'Tidak Ada (90)',
          },
          {
            score: 80,
            label: 'Aktivitas pengambilan material skala kecil/lokal',
            shortTag: 'Ringan (80)',
          },
          {
            score: 70,
            label: 'Penggalian sedang menimbulkan lubang di bantaran',
            shortTag: 'Sedang (70)',
          },
          {
            score: 50,
            label: 'Penambangan berat merusak stabilitas bantaran kiri',
            shortTag: 'Berat / Rusak (50)',
          },
        ],
      },
    ],
  },
  {
    key: 'sempadanKanan',
    no: 4,
    title: 'Sempadan ( Kanan )',
    shortTitle: 'Sempadan Kanan',
    bobotInduk: 5,
    isMainWeighted: true,
    subComponents: [
      {
        id: 'sempadan_kanan_1',
        no: 1,
        name: 'Pemanfaatan Daerah Sempadan',
        bobot: 80,
        placeholderTag: '<<Pemanfaatan Daerah Sempadan (Kanan)>>',
        ifOptions: [
          {
            score: 90,
            label: 'Ruang terbuka hijau / jalan inspeksi terjaga',
            shortTag: 'RTH / Aman (90)',
          },
          {
            score: 80,
            label: 'Budidaya pertanian musiman tanpa bangunan',
            shortTag: 'Pertanian Non-Bangunan (80)',
          },
          {
            score: 70,
            label: 'Terdapat bangunan semi-permanen / lapak warga',
            shortTag: 'Bangunan Semi-Permanen (70)',
          },
          {
            score: 50,
            label: 'Padat bangunan permanen / hunian liar di sempadan',
            shortTag: 'Bangunan Permanen (50)',
          },
        ],
      },
      {
        id: 'sempadan_kanan_2',
        no: 2,
        name: 'Penetapan Garis Sempadan',
        bobot: 20,
        placeholderTag: '<<Penetapan Garis Sempadan (Kanan)>>',
        ifOptions: [
          {
            score: 90,
            label: 'Sudah ditetapkan Perda/SK dan patok sempadan lengkap',
            shortTag: 'Ditetapkan & Ada Patok (90)',
          },
          {
            score: 80,
            label: 'Sudah ditetapkan namun patok batas sebagian rusak',
            shortTag: 'Ditetapkan Tanpa Patok Utuh (80)',
          },
          {
            score: 70,
            label: 'Dalam tahap kajian / proses penetapan garis sempadan',
            shortTag: 'Proses Kajian (70)',
          },
          {
            score: 50,
            label: 'Belum ada penetapan garis sempadan maupun patok',
            shortTag: 'Belum Ditetapkan (50)',
          },
        ],
      },
    ],
  },
  {
    key: 'sempadanKiri',
    no: 5,
    title: 'Sempadan ( Kiri )',
    shortTitle: 'Sempadan Kiri',
    bobotInduk: 5,
    isMainWeighted: true,
    subComponents: [
      {
        id: 'sempadan_kiri_1',
        no: 1,
        name: 'Pemanfaatan Daerah Sempadan',
        bobot: 80,
        placeholderTag: '<<Pemanfaatan Daerah Sempadan (Kiri)>>',
        ifOptions: [
          {
            score: 90,
            label: 'Ruang terbuka hijau / jalan inspeksi terjaga',
            shortTag: 'RTH / Aman (90)',
          },
          {
            score: 80,
            label: 'Budidaya pertanian musiman tanpa bangunan',
            shortTag: 'Pertanian Non-Bangunan (80)',
          },
          {
            score: 70,
            label: 'Terdapat bangunan semi-permanen / lapak warga',
            shortTag: 'Bangunan Semi-Permanen (70)',
          },
          {
            score: 50,
            label: 'Padat bangunan permanen / hunian liar di sempadan',
            shortTag: 'Bangunan Permanen (50)',
          },
        ],
      },
      {
        id: 'sempadan_kiri_2',
        no: 2,
        name: 'Penetapan Garis Sempadan',
        bobot: 20,
        placeholderTag: '<<Penetapan Garis Sempadan (Kiri)>>',
        ifOptions: [
          {
            score: 90,
            label: 'Sudah ditetapkan Perda/SK dan patok sempadan lengkap',
            shortTag: 'Ditetapkan & Ada Patok (90)',
          },
          {
            score: 80,
            label: 'Sudah ditetapkan namun patok batas sebagian rusak',
            shortTag: 'Ditetapkan Tanpa Patok Utuh (80)',
          },
          {
            score: 70,
            label: 'Dalam tahap kajian / proses penetapan garis sempadan',
            shortTag: 'Proses Kajian (70)',
          },
          {
            score: 50,
            label: 'Belum ada penetapan garis sempadan maupun patok',
            shortTag: 'Belum Ditetapkan (50)',
          },
        ],
      },
    ],
  },
  {
    key: 'buanganLimbah',
    no: 6,
    title: 'Buangan Limbah',
    shortTitle: 'Buangan Limbah',
    bobotInduk: 10,
    isMainWeighted: true,
    subComponents: [
      {
        id: 'limbah_1',
        no: 1,
        name: 'Limbah cair / pabrik',
        bobot: 100,
        placeholderTag: '<<Limbah Cair/Pabrik>>',
        ifOptions: [
          {
            score: 90,
            label: 'Tidak ada buangan limbah pabrik / air tidak tercemar',
            shortTag: 'Bebas Limbah (90)',
          },
          {
            score: 80,
            label: 'Buangan drainase domestik ringan / sudah melalui IPAL',
            shortTag: 'Domestik Terolah (80)',
          },
          {
            score: 70,
            label:
              'Buangan limbah sedang menyebabkan perubahan warna/bau lokal',
            shortTag: 'Pencemaran Sedang (70)',
          },
          {
            score: 50,
            label:
              'Buangan limbah cair/pabrik berat mencemari badan sungai',
            shortTag: 'Tercemar Berat (50)',
          },
        ],
      },
    ],
  },
];

// ============================================================================
// 2. BLANGKO PENILAIAN KINERJA PRASARANA SUNGAI (1 INPUT: NILAI KINERJA PRASARANA)
// ============================================================================
export const PRASARANA_COMPONENTS: ComponentMetadata[] = [
  {
    key: 'kinerjaPrasarana',
    no: 1,
    title: 'Nilai Kinerja Prasarana',
    shortTitle: 'Nilai Kinerja Prasarana',
    bobotInduk: 100,
    isMainWeighted: true,
    subComponents: [
      {
        id: 'nilai_kinerja_prasarana',
        no: 1,
        name: 'Nilai Kinerja Prasarana',
        bobot: 100,
        placeholderTag: '<<Nilai Kinerja Prasarana>>',
        ifOptions: [
          {
            score: 90,
            label:
              'Kondisi bangunan sangat baik & berfungsi optimal (>80% - 90%)',
            shortTag: 'Kinerja Sangat Baik (90)',
          },
          {
            score: 80,
            label:
              'Kondisi bangunan baik, kerusakan ringan (<20%), fungsi terjaga (80%)',
            shortTag: 'Kinerja Baik (80)',
          },
          {
            score: 70,
            label:
              'Kondisi bangunan cukup / rusak sedang (20%-40%), butuh pemeliharaan korektif (70%)',
            shortTag: 'Kinerja Cukup (70)',
          },
          {
            score: 50,
            label:
              'Kondisi bangunan rusak berat (>40%), fungsi terganggu / butuh rehabilitasi (50%)',
            shortTag: 'Kinerja Buruk / Rusak Berat (50)',
          },
        ],
      },
    ],
  },
];

export function getComponentsByCategory(
  category: InspectionCategory = 'fisik_sungai'
): ComponentMetadata[] {
  return category === 'kinerja_prasarana'
    ? PRASARANA_COMPONENTS
    : BLANGKO_COMPONENTS;
}

export interface ComponentCalculationResult {
  componentKey: ComponentKey;
  title: string;
  bobotInduk: number;
  nilaiFisikKomponen: number;
  nilaiKondisiFisikTertimbang: number;
  subResults: {
    subId: string;
    no: number;
    name: string;
    bobot: number;
    conditionLabel: string;
    nilaiFisik: number;
    nilaiKondisiFisik: number;
    keterangan?: string;
    docLink?: string;
    photos?: ComponentPhoto[];
  }[];
}

export function getMatchingIfLabel(
  subMeta: SubComponentMetadata,
  score: number
): string {
  if (score >= 85) return subMeta.ifOptions[0].label;
  if (score >= 75) return subMeta.ifOptions[1].label;
  if (score >= 60) return subMeta.ifOptions[2].label;
  return subMeta.ifOptions[3].label;
}

export function classifyNkf(nkf: number): {
  riskLevel: RiskLevel;
  performanceLevel: PerformanceLevel;
  maintenanceAction: MaintenanceAction;
  physicalStatusLabel: PhysicalStatusLabel;
} {
  if (nkf > 70) {
    return {
      riskLevel: 'Risiko Rendah (RR)',
      performanceLevel: 'Kinerja Baik',
      maintenanceAction: 'Pemeliharaan Preventif',
      physicalStatusLabel: 'BAIK',
    };
  }
  if (nkf >= 50) {
    return {
      riskLevel: 'Risiko Sedang (RS)',
      performanceLevel: 'Kinerja Cukup',
      maintenanceAction: 'Pemeliharaan Korektif',
      physicalStatusLabel: 'RUSAK SEDANG',
    };
  }
  return {
    riskLevel: 'Risiko Tinggi (RT)',
    performanceLevel: 'Kinerja Buruk',
    maintenanceAction: 'Rehabilitatif',
    physicalStatusLabel: 'RUSAK BERAT',
  };
}

export function calculateInspectionScores(
  subValues: Record<string, SubComponentValue>,
  category: InspectionCategory = 'fisik_sungai'
): {
  componentResults: Record<string, ComponentCalculationResult>;
  nkfTotal: number;
  muaraScore: number;
  riskLevel: RiskLevel;
  performanceLevel: PerformanceLevel;
  maintenanceAction: MaintenanceAction;
  physicalStatusLabel: PhysicalStatusLabel;
} {
  const targetComponents = getComponentsByCategory(category);
  const componentResults: Record<string, ComponentCalculationResult> = {};
  let nkfTotal = 0;

  for (const comp of targetComponents) {
    let compNilaiFisikSum = 0;
    const subResults = comp.subComponents.map((sub) => {
      const val = subValues[sub.id] || {
        subId: sub.id,
        conditionLabel: sub.ifOptions[1].label,
        nilaiFisik: 80,
      };
      const nilaiKondisiFisik = Number(
        ((sub.bobot * val.nilaiFisik) / 100).toFixed(2)
      );
      compNilaiFisikSum += nilaiKondisiFisik;
      return {
        subId: sub.id,
        no: sub.no,
        name: sub.name,
        bobot: sub.bobot,
        conditionLabel: val.conditionLabel,
        nilaiFisik: val.nilaiFisik,
        nilaiKondisiFisik,
        keterangan: val.keterangan,
        docLink: val.docLink,
        photos: val.photos,
      };
    });

    const nilaiFisikKomponen = Number(compNilaiFisikSum.toFixed(2));
    const nilaiKondisiFisikTertimbang = comp.isMainWeighted
      ? Number(((comp.bobotInduk * nilaiFisikKomponen) / 100).toFixed(2))
      : 0;

    if (comp.isMainWeighted) {
      nkfTotal += nilaiKondisiFisikTertimbang;
    }

    componentResults[comp.key] = {
      componentKey: comp.key,
      title: comp.title,
      bobotInduk: comp.bobotInduk,
      nilaiFisikKomponen,
      nilaiKondisiFisikTertimbang,
      subResults,
    };
  }

  const finalNkf = Number(nkfTotal.toFixed(2));
  const muaraScore = componentResults.muara?.nilaiFisikKomponen ?? 0;
  const classification = classifyNkf(finalNkf);

  return {
    componentResults,
    nkfTotal: finalNkf,
    muaraScore,
    ...classification,
  };
}

export function parseCoordString(
  coordStr: string
): { lat: number; lng: number } | null {
  if (!coordStr) return null;
  const parts = coordStr
    .split(/[,\s]+/)
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !Number.isNaN(n));
  if (parts.length >= 2) {
    return { lat: parts[0], lng: parts[1] };
  }
  return null;
}
