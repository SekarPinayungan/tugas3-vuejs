// js/components/do-tracking.js
// <do-tracking :data="state.tracking" :paket="state.paket"
//              :pengiriman-list="state.pengirimanList" />

Vue.component('do-tracking', {
  template: '#tpl-tracking',
  props: {
    data:          { type: Array, default: () => [] },
    paket:         { type: Array, default: () => [] },
    pengirimanList:{ type: Array, default: () => [] }
  },

  data() {
    return {
      searchQuery:   '',
      searchResult:  null,
      searchError:   '',

      // Form tambah DO
      showDOForm:   false,
      doFormErrors: {},
      doForm:       this._emptyDOForm(),

      // Tambah progress perjalanan
      showProgressForm: false,
      progressTarget:   null,
      progressKet:      '',
      progressError:    '',

      // Local copy
      localTracking: []
    };
  },

  created() {
    this.localTracking = this._flattenTracking(this.data);
  },

  watch: {
    // WATCHER 3: sync when parent data changes
    data: {
      deep: true,
      handler(val) {
        this.localTracking = this._flattenTracking(val);
        // Re-run search to update result
        if (this.searchQuery.trim()) this.doSearch();
      }
    },
    // WATCHER 4: auto-fill total harga saat paket berubah
    'doForm.paketKode'(kode) {
      const found = this.paket.find(p => p.kode === kode);
      this.doForm.total = found ? found.harga : 0;
    }
  },

  computed: {
    // Generate next DO number
    nextDONumber() {
      const year  = new Date().getFullYear();
      const prefix = `DO${year}-`;
      const existing = this.localTracking
        .filter(t => t.noDO.startsWith(prefix))
        .map(t => parseInt(t.noDO.replace(prefix, ''), 10))
        .filter(n => !isNaN(n));
      const next = existing.length ? Math.max(...existing) + 1 : 1;
      return `${prefix}${String(next).padStart(4, '0')}`;
    },

    selectedPaketDetail() {
      return this.paket.find(p => p.kode === this.doForm.paketKode) || null;
    }
  },

  filters: {
    rupiah(val) { return 'Rp ' + Number(val).toLocaleString('id-ID'); },
    datetime(val) {
      if (!val) return '-';
      const d = new Date(val);
      return d.toLocaleString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    },
    tanggal(val) {
      if (!val) return '-';
      const d = new Date(val);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    }
  },

  methods: {
    _flattenTracking(arr) {
      // Each element in the array is an object { "DO2025-XXXX": {...} }
      const result = [];
      const seen = new Set();
      arr.forEach(obj => {
        Object.keys(obj).forEach(noDO => {
          if (!seen.has(noDO)) {
            seen.add(noDO);
            result.push({ noDO, ...obj[noDO] });
          }
        });
      });
      return result;
    },

    _emptyDOForm() {
      const today = new Date();
      const pad   = n => String(n).padStart(2, '0');
      const dateStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
      return {
        nim: '', nama: '', ekspedisi: '', paketKode: '',
        tanggalKirim: dateStr, total: 0
      };
    },

    doSearch() {
      const q = this.searchQuery.trim().toLowerCase();
      if (!q) { this.searchResult = null; this.searchError = ''; return; }
      const found = this.localTracking.find(
        t => t.noDO.toLowerCase() === q || t.nim === q
      );
      if (found) {
        this.searchResult = found;
        this.searchError  = '';
      } else {
        this.searchResult = null;
        this.searchError  = `Data dengan nomor DO / NIM "${this.searchQuery}" tidak ditemukan.`;
      }
    },

    onSearchKey(e) {
      if (e.key === 'Enter')  this.doSearch();
      if (e.key === 'Escape') { this.searchQuery = ''; this.searchResult = null; this.searchError = ''; }
    },

    // ── ADD DO ──
    openDOForm() {
      this.doForm       = this._emptyDOForm();
      this.doFormErrors = {};
      this.showDOForm   = true;
    },

    validateDOForm() {
      const e = {};
      const f = this.doForm;
      if (!f.nim.trim())      e.nim       = 'NIM wajib diisi';
      if (!f.nama.trim())     e.nama      = 'Nama wajib diisi';
      if (!f.ekspedisi)       e.ekspedisi = 'Pilih ekspedisi';
      if (!f.paketKode)       e.paketKode = 'Pilih paket';
      if (!f.tanggalKirim)    e.tanggalKirim = 'Tanggal kirim wajib diisi';
      this.doFormErrors = e;
      return Object.keys(e).length === 0;
    },

    saveDO() {
      if (!this.validateDOForm()) return;
      const noDO = this.nextDONumber;
      const now  = new Date();
      const waktu = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      this.localTracking.push({
        noDO,
        nim:          this.doForm.nim,
        nama:         this.doForm.nama,
        status:       'Menunggu Pengiriman',
        ekspedisi:    this.doForm.ekspedisi,
        tanggalKirim: this.doForm.tanggalKirim,
        paket:        this.doForm.paketKode,
        total:        this.doForm.total,
        perjalanan:   [{ waktu, keterangan: 'DO dibuat' }]
      });
      this.showDOForm = false;
    },

    doFormKey(e) {
      if (e.key === 'Enter')  { e.preventDefault(); this.saveDO(); }
      if (e.key === 'Escape') this.showDOForm = false;
    },

    // ── ADD PROGRESS ──
    openProgress(tracking) {
      this.progressTarget = tracking;
      this.progressKet    = '';
      this.progressError  = '';
      this.showProgressForm = true;
    },

    saveProgress() {
      if (!this.progressKet.trim()) {
        this.progressError = 'Keterangan tidak boleh kosong';
        return;
      }
      const now = new Date();
      const waktu = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
      this.progressTarget.perjalanan.push({ waktu, keterangan: this.progressKet });
      this.progressTarget.status = this.progressKet;
      this.showProgressForm = false;
    },

    progressKey(e) {
      if (e.key === 'Enter')  { e.preventDefault(); this.saveProgress(); }
      if (e.key === 'Escape') this.showProgressForm = false;
    }
  }
});
