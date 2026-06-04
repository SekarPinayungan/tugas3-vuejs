// js/components/app-modal.js
// General-purpose modal: <app-modal ref="modal" />
// Usage: this.$refs.modal.open(config) → returns Promise

Vue.component('app-modal', {
  template: '#tpl-modal',
  data() {
    return {
      visible: false,
      title: '',
      message: '',
      confirmText: 'Ya',
      cancelText: 'Batal',
      type: 'confirm', // 'confirm' | 'alert'
      _resolve: null
    };
  },
  methods: {
    open(cfg = {}) {
      this.title       = cfg.title       || 'Konfirmasi';
      this.message     = cfg.message     || '';
      this.confirmText = cfg.confirmText || 'Ya';
      this.cancelText  = cfg.cancelText  || 'Batal';
      this.type        = cfg.type        || 'confirm';
      this.visible     = true;
      return new Promise(resolve => { this._resolve = resolve; });
    },
    confirm() { this.visible = false; this._resolve && this._resolve(true); },
    cancel()  { this.visible = false; this._resolve && this._resolve(false); }
  }
});
