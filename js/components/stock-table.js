// js/components/stock-table.js
// <ba-stock-table :items="state.stok" :upbjj-list="state.upbjjList"
//                 :kategori-list="state.kategoriList" />

Vue.component('ba-stock-table', {
  template: '#tpl-stock',
  props: {
    items:       { type: Array, required: true },
    upbjjList:   { type: Array, default: () => [] },
    kategoriList:{ type: Array, default: () => [] }
  },

  data() {
    return {
      // Filter state
      filterUpbjj:    '',
      filterKategori: '',
      filterReorder:  false,
      filterKosong:   false,

      // Sort state
      sortField: 'judul',
      sortAsc:   true,

      // Edit / Create modal
      showForm:   false,
      isEditing:  false,
      formErrors: {},
      formData:   this._emptyForm(),

      // Confirm delete
      showConfirm: false,
      deleteTarget: null,

      // Local copy of items so we can mutate
      localItems: []
    };
  },

  created() {
    // Deep-copy so we don't mutate the prop
    this.localItems = JSON.parse(JSON.stringify(this.items));
  },

  // WATCHER 1: watch items prop to sync when parent reloads data
  watch: {
    items: {
      deep: true,
      handler(val) {
        this.localItems = JSON.parse(JSON.stringify(val));
      }
    },
    // WATCHER 2: reset kategori filter when upbjj changes (dependent options)
    filterUpbjj(newVal) {
      this.filterKategori = '';
      if (newVal === '') {
        this.filterReorder = false;
        this.filterKosong  = false;
      }
    }
  },

  computed: {
    // Available kategori based on selected upbjj (dependent options)
    availableKategori() {
      if (!this.filterUpbjj) return [];
      const set = new Set(
        this.localItems
          .filter(i => i.upbjj === this.filterUpbjj)
          .map(i => i.kategori)
      );
      return this.kategoriList.filter(k => set.has(k));
    },

    // Main filtered + sorted list — uses computed so no unnecessary recompute
    filteredItems() {
      let list = this.localItems;

      if (this.filterUpbjj)    list = list.filter(i => i.upbjj === this.filterUpbjj);
      if (this.filterKategori) list = list.filter(i => i.kategori === this.filterKategori);
      if (this.filterReorder)  list = list.filter(i => i.qty < i.safety);
      if (this.filterKosong)   list = list.filter(i => i.qty === 0);

      const f = this.sortField;
      const asc = this.sortAsc ? 1 : -1;
      return [...list].sort((a, b) => {
        if (a[f] < b[f]) return -1 * asc;
        if (a[f] > b[f]) return  1 * asc;
        return 0;
      });
    },

    reorderCount() {
      return this.localItems.filter(i => i.qty < i.safety).length;
    }
  },

  filters: {
    rupiah(val)  { return 'Rp ' + Number(val).toLocaleString('id-ID'); },
    buah(val)    { return Number(val).toLocaleString('id-ID') + ' buah'; },
    sortLabel(field) {
      const map = { judul: 'Judul', qty: 'Stok', harga: 'Harga' };
      return map[field] || field;
    }
  },

  methods: {
    _emptyForm() {
      return {
        kode: '', judul: '', kategori: '', upbjj: '',
        lokasiRak: '', harga: '', qty: '', safety: '',
        catatanHTML: ''
      };
    },

    setSort(field) {
      if (this.sortField === field) {
        this.sortAsc = !this.sortAsc;
      } else {
        this.sortField = field;
        this.sortAsc   = true;
      }
    },

    sortIcon(field) {
      if (this.sortField !== field) return '⇅';
      return this.sortAsc ? '↑' : '↓';
    },

    resetFilters() {
      this.filterUpbjj    = '';
      this.filterKategori = '';
      this.filterReorder  = false;
      this.filterKosong   = false;
    },

    // ── CREATE ──
    openCreate() {
      this.formData   = this._emptyForm();
      this.formErrors = {};
      this.isEditing  = false;
      this.showForm   = true;
    },

    // ── EDIT ──
    openEdit(item) {
      this.formData   = Object.assign({}, item);
      this.formErrors = {};
      this.isEditing  = true;
      this.showForm   = true;
    },

    validateForm() {
      const errors = {};
      const d = this.formData;
      if (!d.kode.trim())     errors.kode     = 'Kode wajib diisi';
      if (!d.judul.trim())    errors.judul    = 'Judul wajib diisi';
      if (!d.kategori)        errors.kategori = 'Pilih kategori';
      if (!d.upbjj)           errors.upbjj    = 'Pilih UPBJJ';
      if (!d.lokasiRak.trim())errors.lokasiRak= 'Lokasi rak wajib diisi';
      if (isNaN(d.harga) || Number(d.harga) < 0) errors.harga = 'Harga tidak valid';
      if (isNaN(d.qty)   || Number(d.qty)   < 0) errors.qty   = 'Qty tidak valid';
      if (isNaN(d.safety)|| Number(d.safety)< 0) errors.safety= 'Safety tidak valid';
      // Check duplicate kode on create
      if (!this.isEditing) {
        const exists = this.localItems.find(i => i.kode === d.kode.trim());
        if (exists) errors.kode = 'Kode sudah ada';
      }
      this.formErrors = errors;
      return Object.keys(errors).length === 0;
    },

    saveForm() {
      if (!this.validateForm()) return;
      const d = Object.assign({}, this.formData, {
        harga:  Number(this.formData.harga),
        qty:    Number(this.formData.qty),
        safety: Number(this.formData.safety)
      });
      if (this.isEditing) {
        const idx = this.localItems.findIndex(i => i.kode === d.kode);
        if (idx > -1) this.$set(this.localItems, idx, d);
      } else {
        this.localItems.push(d);
      }
      this.showForm = false;
    },

    formKeydown(e) {
      if (e.key === 'Enter') { e.preventDefault(); this.saveForm(); }
      if (e.key === 'Escape') this.showForm = false;
    },

    // ── DELETE ──
    confirmDelete(item) {
      this.deleteTarget = item;
      this.showConfirm  = true;
    },

    doDelete() {
      this.localItems = this.localItems.filter(i => i.kode !== this.deleteTarget.kode);
      this.showConfirm  = false;
      this.deleteTarget = null;
    },

    cancelDelete() {
      this.showConfirm  = false;
      this.deleteTarget = null;
    },

    isReorder(item) {
      return item.qty > 0 && item.qty < item.safety;
    }
  }
});
