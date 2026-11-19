# 🐾 Rifa Solidária da Amélia

Plataforma web completa para a rifa beneficente da gatinha Amélia: página pública emocional e transparente + painel administrativo protegido, com **banco de dados real**, controle de concorrência na seleção dos números e expiração automática de reservas.

Construída para **Cloudflare Pages + Pages Functions + D1 (SQLite)** — o mesmo tipo de infraestrutura do site de referência.

---

## ✨ O que já vem pronto

**Site público (`/`)**
- História da Amélia com fotos reais e seção de diagnósticos (apenas os dados do briefing, sem invenções).
- Painel de meta com barra de progresso, valor arrecadado (só pagamentos **confirmados**), restante, % e contadores.
- Prêmios (1º R$ 1.000 · 2º R$ 500 · 3º R$ 200).
- Grade interativa de **500 números** com busca, filtros, legenda, seleção múltipla e total em tempo real.
- Fluxo de compra: escolher números → dados (nome + WhatsApp) → reserva → instruções de PIX → enviar comprovante pelo WhatsApp.
- Pagamento PIX com chave, titular, botão **Copiar**, campo **Copia e Cola** e **QR Code** gerado localmente a partir do código válido.
- Seção de transparência (perguntas e respostas) e espaço editável para a data do sorteio.
- 100% responsivo (mobile-first).

**Painel administrativo (`/admin`)**
- Login protegido por senha (hash PBKDF2), sessão assinada (HMAC) em cookie HttpOnly e **limite de tentativas**.
- Dashboard: arrecadado, pendente, meta, falta, vendidos, reservados, disponíveis, participantes, total de prêmios e **saldo estimado após prêmios**.
- Gestão de números: marcar como pago, reservar, bloquear, liberar.
- Participantes: busca, filtros, confirmar pagamento, cancelar, reabrir, editar, excluir e **exportar CSV**.
- Configurações editáveis: textos, meta, valor por número, quantidade de números, premiação, PIX, titular, WhatsApp, fotos, diagnósticos e mensagens.
- Histórico de ações (auditoria) e troca de senha.

---

## 🗂️ Estrutura

```
.
├── public/                 # Site estático (deploy do Pages)
│   ├── index.html          # Página pública
│   ├── admin.html          # Painel administrativo
│   ├── css/                # styles.css, admin.css
│   ├── js/                 # app.js, admin.js, qrcode.js
│   └── img/                # Fotos da Amélia
├── functions/              # Backend (Pages Functions)
│   ├── _middleware.js      # Cabeçalhos de segurança
│   ├── _lib/               # Utilitários (crypto, auth, db, raffle)
│   └── api/                # Rotas da API (públicas e /admin)
├── schema.sql              # Estrutura do banco D1
├── seed.sql                # Dados iniciais (números + textos do briefing)
└── wrangler.toml           # Configuração do Cloudflare
```

---

## 🚀 Como colocar no ar (passo a passo)

### Pré-requisitos
- Conta na [Cloudflare](https://dash.cloudflare.com/) (plano gratuito já serve).
- [Node.js](https://nodejs.org/) 18+ instalado.

### 1. Instalar dependências
```bash
npm install
```

### 2. Criar o banco de dados D1
```bash
npx wrangler d1 create rifa-amelia
```
Copie o `database_id` que aparecer e cole em **`wrangler.toml`** (campo `database_id`).

### 3. Criar as tabelas e os dados iniciais
```bash
# Produção (nuvem):
npm run db:init:remote
npm run db:seed:remote
```

### 4. Configurar os segredos (nunca ficam no código)
```bash
npx wrangler pages secret put ADMIN_PASSWORD     # senha inicial do painel
npx wrangler pages secret put SESSION_SECRET      # chave aleatória (ex.: openssl rand -hex 32)
```

### 5. Publicar
```bash
npm run deploy
```
Ou conecte o repositório do GitHub ao Cloudflare Pages (build output: `public`).

### 6. Ativar a senha do admin
Acesse `https://SEU-SITE/admin` e clique em **“Ativar senha inicial”** (usa o `ADMIN_PASSWORD`). Depois entre e **troque a senha** pela aba *Senha*.

---

## 💻 Rodar localmente (desenvolvimento)

```bash
# 1. Crie o arquivo de segredos locais
cp .dev.vars.example .dev.vars    # edite ADMIN_PASSWORD e SESSION_SECRET

# 2. Prepare o banco local
npm run db:init:local
npm run db:seed:local

# 3. Suba o servidor
npm run dev
```
Abra `http://localhost:8788` (site) e `http://localhost:8788/admin` (painel).

---

## 🔧 Configurações editáveis pelo painel

Tudo o que o briefing pediu para deixar editável está na aba **Configurações**: nome/textos da campanha, meta, valor por número, quantidade de números, premiação, PIX, titular, WhatsApp de comprovantes, fotos, diagnósticos e a data do sorteio.

> **PIX Copia e Cola e QR Code:** por segurança, o QR **não é inventado**. Cole no campo *PIX Copia e Cola* o código oficial gerado pelo seu banco; o QR Code é desenhado a partir dele. Antes de divulgar, **escaneie o QR uma vez** para conferir. Enquanto o campo estiver vazio, o site mostra apenas a chave PIX e as instruções.

---

## 🔒 Segurança

- Senha do admin guardada apenas como **hash PBKDF2-SHA256** (nunca em texto puro).
- Sessão em cookie **HttpOnly + SameSite=Strict**, assinada com HMAC.
- **Limite de tentativas** de login (bloqueio temporário após 5 erros).
- Rotas administrativas protegidas no backend.
- Cabeçalhos de segurança (CSP, X-Frame-Options, etc.) em todas as respostas.
- Nenhuma credencial exposta no código ou no frontend.

---

## 📌 Pontos importantes

- A **arrecadação** exibida considera apenas números **pagos** (confirmados). Reservas pendentes contam como “pendente”.
- Os **prêmios** são contabilizados **separadamente** do valor do tratamento (o painel mostra o saldo estimado após prêmios).
- As **reservas expiram** automaticamente (padrão: 120 min, ajustável em `wrangler.toml` → `RESERVA_EXPIRA_MINUTOS`) e os números voltam a ficar disponíveis.
- O envio do comprovante **não confirma** o pagamento automaticamente — a confirmação é feita manualmente no painel.
- **Data e método do sorteio não foram inventados** — ficam em branco até você definir.
