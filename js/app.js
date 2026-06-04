// js/app.js – Vue Root Instance

new Vue({
  el: '#app',

  data: {
    tab: 'stok',
    loading: true,
    loadError: '',

    state: {
      stok:          [],
      upbjjList:     [],
      kategoriList:  [],
      pengirimanList:[],
      paket:         [],
      tracking:      []
    }
  },

  async created() {
    try {
      const data = await ApiService.fetchData();
      this.state.stok           = data.stok           || [];
      this.state.upbjjList      = data.upbjjList      || [];
      this.state.kategoriList   = data.kategoriList   || [];
      this.state.pengirimanList = data.pengirimanList || [];
      this.state.paket          = data.paket          || [];
      this.state.tracking       = data.tracking       || [];
    } catch (e) {
      this.loadError = 'Gagal memuat data: ' + e.message;
    } finally {
      this.loading = false;
    }
  },

  methods: {
    handleNewDO(formData) {
      // Sync order-form created event to tracking data
      const year   = new Date().getFullYear();
      const prefix = `DO${year}-`;
      const existing = this.state.tracking.flatMap(obj => Object.keys(obj))
        .filter(k => k.startsWith(prefix))
        .map(k => parseInt(k.replace(prefix, ''), 10))
        .filter(n => !isNaN(n));
      const next = existing.length ? Math.max(...existing) + 1 : 1;
      const noDO = `${prefix}${String(next).padStart(4, '0')}`;
      const now  = new Date();
      const waktu = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;

      const newEntry = {
        [noDO]: {
          nim:          formData.nim,
          nama:         formData.nama,
          status:       'Menunggu Pengiriman',
          ekspedisi:    formData.ekspedisi,
          tanggalKirim: formData.tanggalKirim,
          paket:        formData.paketKode,
          total:        formData.total,
          perjalanan:   [{ waktu, keterangan: 'DO dibuat via form pemesanan' }]
        }
      };
      this.state.tracking.push(newEntry);
      // Switch to tracking tab after order
      this.tab = 'tracking';
    }
  }
});
