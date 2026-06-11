# SGE v2 — Sistema de Gestão de Efetivos
## Grupo Energia

Sistema web para gestão de efetivos, alojamentos e ativos operacionais.

---

## Estrutura do Repositório

```
SGE_v2/
├── index.html          ← Hub central + login + Colaboradores + Obras
├── efetivos.html       ← Módulo Efetivos (em construção)
├── alojamentos.html    ← Módulo Alojamentos (em construção)
├── ativos.html         ← Módulo Ativos (em construção)
├── assets/
│   └── logo.png        ← Logo da Grupo Energia
├── js/
│   ├── config.js       ← SHEET_ID, GAS_URL, constantes
│   └── utils.js        ← Auth, Sheets, GAS, Toast, Fmt, Dom
└── gas/
    ├── SETUP_SGE_v2.js ← Roda 1x no GAS para criar a planilha
    └── GAS_BACKEND.js  ← Backend de escrita (Web App)
```

---

## Passo a Passo para Ativar

### 1. Criar a Planilha
1. Abra o Google Sheets e crie uma planilha vazia
2. No menu: **Extensões → Apps Script**
3. Cole o conteúdo de `gas/SETUP_SGE_v2.js`
4. Execute a função `SETUP_SGE_v2`
5. Autorize e aguarde a conclusão

### 2. Publicar a Planilha como CSV
1. **Arquivo → Compartilhar → Publicar na web**
2. Publique cada aba individualmente como CSV
3. Execute `MOSTRAR_URLS_CSV` no GAS para ver os GIDs de cada aba

### 3. Configurar o Backend (GAS)
1. Crie um **novo projeto GAS** (separado da planilha)
2. Cole o conteúdo de `gas/GAS_BACKEND.js`
3. Atualize o `SHEET_ID` no topo do arquivo
4. **Implantar → Nova implantação → Web App**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
5. Copie a URL do Web App

### 4. Atualizar config.js
```js
SHEET_ID: 'id_da_sua_planilha',
GAS_URL:  'url_do_seu_web_app',
ABAS: {
  COLABORADORES: 'gid_real',
  OBRAS:         'gid_real',
  EFETIVOS:      'gid_real',
  ALOJAMENTOS:   'gid_real',
  ATIVOS:        'gid_real',
  CONFIG:        'gid_real',
},
```

### 5. Subir para o GitHub
```bash
git init
git add .
git commit -m "SGE v2 — estrutura inicial"
git remote add origin https://github.com/murilo-energia/SGE_v2.git
git push -u origin main
```

### 6. Ativar GitHub Pages
- Repositório → Settings → Pages
- Source: **main** / **(root)**
- Acesse: `https://murilo-energia.github.io/SGE_v2`

---

## Usuários padrão (altere em config.js)

| Usuário      | Senha    | Perfil          |
|-------------|----------|-----------------|
| `admin`     | `ge2024` | Administrador   |
| `engenheiro`| `eng2024`| Engenheiro      |

---

## Arquitetura

- **Leitura**: `fetch` direto no CSV público do Google Sheets (rápido, sem GAS)
- **Escrita**: GAS Web App com `Content-Type: text/plain` (sem CORS preflight)
- **Inativação em cascata**: Inativar colaborador propaga para Efetivos e Alojamentos
- **Autenticação**: localStorage com chave `sge_sessao`
