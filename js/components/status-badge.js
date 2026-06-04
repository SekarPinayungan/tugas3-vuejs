// js/components/status-badge.js
// <status-badge :qty="n" :safety="n" />

Vue.component('status-badge', {
  template: '#tpl-badge',
  props: {
    qty: { type: Number, required: true },
    safety: { type: Number, required: true }
  },
  computed: {
    status() {
      if (this.qty === 0) return 'kosong';
      if (this.qty < this.safety) return 'menipis';
      return 'aman';
    },
    label() {
      return { kosong: 'Kosong', menipis: 'Menipis', aman: 'Aman' }[this.status];
    },
    icon() {
      return { kosong: '🔴', menipis: '⚠️', aman: '✅' }[this.status];
    },
    cls() {
      return { kosong: 'badge-danger', menipis: 'badge-warning', aman: 'badge-safe' }[this.status];
    }
  }
});
