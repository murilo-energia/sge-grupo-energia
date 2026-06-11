// ============================================================
//  SGE v2 — Grupo Energia
//  config.js — Configurações centrais do sistema
// ============================================================

const SGE = {

  NOME_SISTEMA : 'SGE v2',
  NOME_EMPRESA : 'Grupo Energia',
  VERSAO       : '2.0.0',

  SHEET_ID: '1mOuc97W4JZmhA-VWPzJpUOcOumDOpfMG3aKHkmCmHVk',

  csvUrl(gid) {
    return `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/gviz/tq?tqx=out:csv&gid=${gid}`;
  },

  ABAS: {
    COLABORADORES : '850845993',
    OBRAS         : '1685909525',
    EFETIVOS      : '1126380489',
    ALOJAMENTOS   : '631834089',
    ATIVOS        : '1416872538',
    CONFIG        : '1098632204',
  },

  GAS_URL: 'https://script.google.com/macros/s/AKfycbw99FfrP1ex4a5yTlGl7vlOAgdVrD9GlDawkJZi35c2oR34xErVqWw9vzrUV-Z-vHgE/exec',

  SESSAO_KEY : 'sge_sessao',
  PERFIS     : ['Administrador', 'Engenheiro'],

  USUARIOS: [
    { usuario: 'admin',      senha: 'ge2024',  perfil: 'Administrador', nome: 'Murilo Henrique' },
    { usuario: 'engenheiro', senha: 'eng2024', perfil: 'Engenheiro',    nome: 'Engenheiro'      },
  ],

  MODULOS: [
    { id: 'efetivos',    label: 'Efetivos',    icon: 'ti-users',    url: 'efetivos.html',    perfis: ['Administrador','Engenheiro'] },
    { id: 'alojamentos', label: 'Alojamentos', icon: 'ti-building', url: 'alojamentos.html', perfis: ['Administrador','Engenheiro'] },
    { id: 'ativos',      label: 'Ativos',      icon: 'ti-truck',    url: 'ativos.html',      perfis: ['Administrador'] },
  ],

  COR: {
    LARANJA : '#C8670A',
    DARK    : '#0F172A',
    BG      : '#F4EFE6',
  },
};
