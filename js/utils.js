// ============================================================
//  SGE v2 — Grupo Energia
//  utils.js — Funções compartilhadas
// ============================================================

// ── Autenticação ─────────────────────────────────────────────
const Auth = {
  login(usuario, senha) {
    const user = SGE.USUARIOS.find(u => u.usuario === usuario && u.senha === senha);
    if (!user) return false;
    localStorage.setItem(SGE.SESSAO_KEY, JSON.stringify({ ...user, ts: Date.now() }));
    return true;
  },
  logout() {
    localStorage.removeItem(SGE.SESSAO_KEY);
    window.location.href = 'index.html';
  },
  getSessao() {
    try { return JSON.parse(localStorage.getItem(SGE.SESSAO_KEY)); }
    catch { return null; }
  },
  exigirLogin() {
    const s = this.getSessao();
    if (!s) { window.location.href = 'index.html'; return null; }
    return s;
  },
  isAdmin() {
    const s = this.getSessao();
    return s && s.perfil === 'Administrador';
  },
};

// ── Fetch CSV com cache de 5 minutos ─────────────────────────
const Sheets = {
  _cache: {},
  _TTL: 5 * 60 * 1000, // 5 minutos

  async fetch(gid, forceRefresh = false) {
    const cached = this._cache[gid];
    const expirado = !cached || (Date.now() - cached.ts > this._TTL);
    if (!forceRefresh && !expirado) return cached.data;
    try {
      const url  = SGE.csvUrl(gid);
      const res  = await fetch(url + '&t=' + Date.now()); // evita cache do browser
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      const data = this._parseCSV(text);
      this._cache[gid] = { data, ts: Date.now() };
      return data;
    } catch (err) {
      console.error('Sheets.fetch erro:', err);
      Toast.erro('Erro ao carregar dados. Verifique a conexão.');
      return cached ? cached.data : []; // retorna cache antigo se existir
    }
  },

  _parseCSV(text) {
    const linhas = text.trim().split('\n');
    if (linhas.length < 2) return [];
    const headers = this._splitLinha(linhas[0]);
    return linhas.slice(1).map(linha => {
      const vals = this._splitLinha(linha);
      const obj  = {};
      headers.forEach((h, i) => {
        obj[h.replace(/^"|"$/g,'').trim()] = (vals[i] || '').replace(/^"|"$/g,'').trim();
      });
      return obj;
    }).filter(row => Object.values(row).some(v => v !== ''));
  },

  _splitLinha(linha) {
    const res = []; let atual = '', dentroAspas = false;
    for (const c of linha) {
      if (c === '"') dentroAspas = !dentroAspas;
      else if (c === ',' && !dentroAspas) { res.push(atual); atual = ''; }
      else atual += c;
    }
    res.push(atual);
    return res;
  },

  limparCache() { this._cache = {}; },
};

// ── Escrita via GAS ──────────────────────────────────────────
const GAS = {
  async post(payload) {
    try {
      const res = await fetch(SGE.GAS_URL, {
        method : 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body   : JSON.stringify(payload),
      });
      const text = await res.text();
      try { return JSON.parse(text); }
      catch { return { ok: false, mensagem: 'Resposta inválida do servidor.' }; }
    } catch (err) {
      console.error('GAS.post erro:', err);
      Toast.erro('Erro ao salvar. Verifique a conexão.');
      return { ok: false, mensagem: err.message };
    }
  },
};

// ── Toasts ────────────────────────────────────────────────────
const Toast = {
  _c: null,
  _init() {
    if (this._c) return;
    this._c = Object.assign(document.createElement('div'), {
      id: 'toast-container',
    });
    Object.assign(this._c.style, {
      position:'fixed', bottom:'24px', right:'24px', zIndex:'9999',
      display:'flex', flexDirection:'column', gap:'8px',
    });
    document.body.appendChild(this._c);
  },
  _show(msg, tipo) {
    this._init();
    const cfg = {
      sucesso: { bg:'#166534', icon:'ti-circle-check' },
      erro:    { bg:'#991B1B', icon:'ti-circle-x'    },
      info:    { bg:'#1E40AF', icon:'ti-info-circle'  },
      aviso:   { bg:'#854D0E', icon:'ti-alert-triangle'},
    }[tipo] || { bg:'#1E40AF', icon:'ti-info-circle' };
    const el = document.createElement('div');
    Object.assign(el.style, {
      background:cfg.bg, color:'#fff', padding:'10px 16px', borderRadius:'8px',
      fontSize:'13px', display:'flex', alignItems:'center', gap:'8px',
      boxShadow:'0 4px 12px rgba(0,0,0,.2)', minWidth:'240px', maxWidth:'360px',
      animation:'toastIn .2s ease',
    });
    el.innerHTML = `<i class="ti ${cfg.icon}" style="font-size:16px;flex-shrink:0"></i><span>${msg}</span>`;
    this._c.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0'; el.style.transition = 'opacity .3s';
      setTimeout(() => el.remove(), 300);
    }, 3500);
  },
  sucesso: (m) => Toast._show(m,'sucesso'),
  erro:    (m) => Toast._show(m,'erro'),
  info:    (m) => Toast._show(m,'info'),
  aviso:   (m) => Toast._show(m,'aviso'),
};

// ── Formatadores ─────────────────────────────────────────────
const Fmt = {
  data(str) {
    if (!str || str.trim() === '') return '—';
    const parts = str.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return str;
  },
  statusBadge(status) {
    const mapa = {
      'Ativo'    : 'badge-ativo',
      'Inativo'  : 'badge-inativo',
      'Aberto'   : 'badge-ativo',
      'Concluído': 'badge-info',
      'Pausado'  : 'badge-aviso',
    };
    return `<span class="badge ${mapa[status]||'badge-info'}">${status||'—'}</span>`;
  },
  iniciais(nome) {
    if (!nome) return '??';
    return nome.trim().split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase();
  },
};

// ── DOM helpers ───────────────────────────────────────────────
const Dom = {
  loading(el, msg='Carregando...') {
    el.innerHTML = `<div style="text-align:center;padding:48px 0;color:#64748B">
      <i class="ti ti-loader-2" style="font-size:28px;animation:spin 1s linear infinite"></i>
      <p style="margin-top:12px;font-size:14px">${msg}</p></div>`;
  },
  vazio(el, msg='Nenhum registro encontrado.', sub='') {
    el.innerHTML = `<div style="text-align:center;padding:48px 0;color:#64748B">
      <i class="ti ti-inbox" style="font-size:36px;opacity:.4"></i>
      <p style="margin-top:12px;font-size:15px;font-weight:500">${msg}</p>
      ${sub?`<p style="font-size:13px;opacity:.7;margin-top:4px">${sub}</p>`:''}
    </div>`;
  },
};

// ── CSS global injetado ───────────────────────────────────────
(function() {
  const s = document.createElement('style');
  s.textContent = `
    @keyframes toastIn { from{transform:translateX(20px);opacity:0} to{transform:translateX(0);opacity:1} }
    @keyframes spin     { to{transform:rotate(360deg)} }
  `;
  document.head.appendChild(s);
})();
