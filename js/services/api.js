// js/services/api.js
// Data Service – loads dataBahanAjar.json once and caches it

const ApiService = {
  _cache: null,

  async fetchData() {
    if (this._cache) return this._cache;
    try {
      const res = await fetch('./data/dataBahanAjar.json');
      if (!res.ok) throw new Error('Gagal memuat data');
      this._cache = await res.json();
      return this._cache;
    } catch (e) {
      console.error('[ApiService] Error:', e);
      throw e;
    }
  }
};
