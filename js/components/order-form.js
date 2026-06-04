// js/components/order-form.js
// <order-form :paket="state.paket" :pengiriman-list="state.pengirimanList"
//             @created="handleNewDO" />

Vue.component('order-form', {
  template: '#tpl-order',
  props: {
    paket:          { type: Array, default: () => [] },
    pengirimanList: { type: Array, default: () => [] }
  },
  emits: ['created'],

  data() {
    return {
      form: this._emptyForm(),
      errors: {},
      submitted: false,
      successMsg: ''
    };
  },

  watch: {
    // WATCHER 5: update total harga otomatis saat paket dipilih
    'form.paketKode'(kode) {
      const found = this.paket.find(p => p.kode === kode);
      this.form.total = found ? found.harga : 0;
    }
  },

  computed: {
    selectedPaket() {
      return this.paket.find(p => p.kode === this.form.paketKode) || null;
    },
    formattedTanggal() {
      if (!this.form.tanggalKirim) return '';
      const d = new Date(this.form.tanggalKirim);
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    }
  },

  filters: {
    rupiah(val) { return 'Rp ' + Number(val).toLocaleString('id-ID'); }
  },

  methods: {
    _emptyForm() {
      const today = new Date();
      const pad   = n => String(n).padStart(2, '0');
      return {
        nim: '', nama: '', ekspedisi: '', paketKode: '',
        tanggalKirim: `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`,
        total: 0
      };
    },

    validate() {
      const e = {};
      const f = this.form;
      if (!f.nim.trim())      e.nim       = 'NIM wajib diisi';
      else if (!/^\d{9}$/.test(f.nim.trim())) e.nim = 'NIM harus 9 digit angka';
      if (!f.nama.trim())     e.nama      = 'Nama wajib diisi';
      if (!f.ekspedisi)       e.ekspedisi = 'Pilih jenis pengiriman';
      if (!f.paketKode)       e.paketKode = 'Pilih paket bahan ajar';
      if (!f.tanggalKirim)    e.tanggalKirim = 'Tanggal kirim wajib diisi';
      this.errors = e;
      return Object.keys(e).length === 0;
    },

    submit() {
      if (!this.validate()) return;
      this.$emit('created', { ...this.form });
      this.successMsg = `Delivery Order berhasil dibuat untuk ${this.form.nama}!`;
      this.form    = this._emptyForm();
      this.errors  = {};
      this.submitted = true;
      setTimeout(() => { this.successMsg = ''; this.submitted = false; }, 4000);
    },

    formKey(e) {
      if (e.key === 'Enter') { e.preventDefault(); this.submit(); }
    },

    resetForm() {
      this.form    = this._emptyForm();
      this.errors  = {};
      this.submitted  = false;
      this.successMsg = '';
    }
  }
});
