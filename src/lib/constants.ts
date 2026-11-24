export const BMKG_GEOJSON_API = '/api/bmkg/geojson'
export const BMKG_BANJIRROB_API = '/api/bmkg/banjirrob'

export const BMKG_GEOJSON_URL =
  'https://maritim.bmkg.go.id/marine2026-data/meta/indonesia-prov.geojson'
export const BMKG_BANJIRROB_URL =
  'https://maritim.bmkg.go.id/marine2026-data/w-banjirob/banjirrob_combine.json'

export const OFFICIAL_HIMBAUAN = [
  'Potensi banjir pesisir umumnya berdampak pada aktivitas masyarakat di sekitar pelabuhan dan pesisir, seperti aktivitas bongkar muat di pelabuhan, aktivitas di pemukiman pesisir, serta aktivitas tambak garam dan perikanan darat.',
  'Masyarakat diimbau untuk selalu waspada dan siaga untuk mengantisipasi dampak dari Pasang Air Laut Maksimum serta memperhatikan update informasi cuaca maritim dari BMKG.',
  'Demikian informasi peringatan dini ini untuk dapat diantisipasi.',
] as const

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

export const INDONESIAN_DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const

export const PROVINCE_ALIASES: Record<string, string[]> = {
  Aceh: ['aceh', 'nanggroe aceh darussalam', 'nad', 'di aceh', 'daerah istimewa aceh'],
  'Sumatera Utara': ['sumatera utara', 'sumatra utara', 'sumut'],
  'Sumatera Barat': ['sumatera barat', 'sumatra barat', 'sumbar'],
  Riau: ['riau'],
  'Kepulauan Riau': ['kepulauan riau', 'kep riau', 'kep. riau', 'kepri'],
  Jambi: ['jambi'],
  'Sumatera Selatan': ['sumatera selatan', 'sumatra selatan', 'sumsel'],
  'Kepulauan Bangka Belitung': [
    'kepulauan bangka belitung',
    'bangka belitung',
    'kep bangka belitung',
    'kep. bangka belitung',
    'babel',
  ],
  Bengkulu: ['bengkulu'],
  Lampung: ['lampung'],
  'DKI Jakarta': [
    'dki jakarta',
    'daerah khusus ibukota jakarta',
    'jakarta',
    'dkijakarta',
  ],
  Banten: ['banten'],
  'Jawa Barat': ['jawa barat', 'jabar'],
  'Jawa Tengah': ['jawa tengah', 'jateng'],
  'DI Yogyakarta': [
    'di yogyakarta',
    'daerah istimewa yogyakarta',
    'd.i. yogyakarta',
    'yogyakarta',
    'diy',
  ],
  'Jawa Timur': ['jawa timur', 'jatim'],
  Bali: ['bali'],
  'Nusa Tenggara Barat': ['nusa tenggara barat', 'nusatenggara barat', 'ntb'],
  'Nusa Tenggara Timur': ['nusa tenggara timur', 'nusatenggara timur', 'ntt'],
  'Kalimantan Barat': ['kalimantan barat', 'kalbar'],
  'Kalimantan Tengah': ['kalimantan tengah', 'kalteng'],
  'Kalimantan Selatan': ['kalimantan selatan', 'kalsel'],
  'Kalimantan Timur': ['kalimantan timur', 'kaltim'],
  'Kalimantan Utara': ['kalimantan utara', 'kaltara'],
  'Sulawesi Utara': ['sulawesi utara', 'sulut'],
  Gorontalo: ['gorontalo'],
  'Sulawesi Tengah': ['sulawesi tengah', 'sulteng'],
  'Sulawesi Barat': ['sulawesi barat', 'sulbar'],
  'Sulawesi Selatan': ['sulawesi selatan', 'sulsel'],
  'Sulawesi Tenggara': ['sulawesi tenggara', 'sultra'],
  Maluku: ['maluku'],
  'Maluku Utara': ['maluku utara', 'malut', 'maluku_utara'],
  'Papua Barat': ['papua barat', 'irian jaya barat'],
  'Papua Barat Daya': ['papua barat daya'],
  Papua: ['papua', 'irian jaya'],
  'Papua Tengah': ['papua tengah', 'irian jaya tengah'],
  'Papua Pegunungan': ['papua pegunungan'],
  'Papua Selatan': ['papua selatan'],
}

export const MAP_BOUNDS = {
  minLon: 94.4,
  maxLon: 141.6,
  minLat: -11.4,
  maxLat: 6.4,
}

export const GEO_CACHE_NAME = 'bmkg-maritim-geojson-v1'
