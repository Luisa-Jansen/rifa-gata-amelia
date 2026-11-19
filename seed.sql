-- =====================================================================
-- Rifa Solidária da Amélia — Dados iniciais (seed)
-- =====================================================================
-- Rode DEPOIS do schema.sql:
--   wrangler d1 execute rifa-amelia --local  --file=./seed.sql
--   wrangler d1 execute rifa-amelia --remote --file=./seed.sql
--
-- Usa INSERT OR IGNORE: não sobrescreve valores já editados no painel.
-- Todos os textos abaixo também são editáveis em /admin  ->  Configurações.

-- Gera os 500 números (001..500), todos disponíveis.
INSERT OR IGNORE INTO numbers (n, status)
WITH RECURSIVE seq(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 500
)
SELECT n, 'disponivel' FROM seq;

-- ---------------------------------------------------------------------
-- Configurações públicas (JSON por chave)
-- ---------------------------------------------------------------------

-- Campanha / cabeçalho
INSERT OR IGNORE INTO settings (key, value) VALUES
('campaign', json('{
  "titleLine1": "RIFA SOLIDÁRIA",
  "titleLine2": "AJUDE A AMÉLIA",
  "subtitle": "Uma gatinha que precisa de nós. Uma corrente de amor que pode mudar sua história.",
  "ctaPrimary": "PARTICIPE DA RIFA E AJUDE A AMÉLIA",
  "ctaSecondary": "QUERO AJUDAR",
  "closingLine": "Juntos, podemos dar a Amélia a chance de uma vida mais saudável e feliz."
}'));

-- História da Amélia
INSERT OR IGNORE INTO settings (key, value) VALUES
('story', json('{
  "heading": "A história da Amélia",
  "paragraphs": [
    "Amélia foi resgatada das ruas e passou por uma cirurgia de emergência. Desde então, sua saúde exige acompanhamento intensivo, exames, tratamentos e cuidados especializados.",
    "Ela enfrenta uma série de complicações médicas e precisa continuar seu tratamento.",
    "A campanha foi criada para ajudar a custear suas despesas veterinárias e permitir que ela continue recebendo todo o cuidado necessário."
  ]
}'));

-- Quadro de diagnósticos e tratamentos
INSERT OR IGNORE INTO settings (key, value) VALUES
('diagnoses', json('{
  "heading": "A AMÉLIA PRECISA CONTINUAR TRATANDO",
  "intro": "Ela enfrenta uma série de complicações e precisa do nosso apoio para seguir com seu tratamento.",
  "cards": [
    {
      "title": "ONCOLOGIA",
      "icon": "ribbon",
      "text": "A biópsia da orelha confirmou carcinoma de células escamosas. A conduta está aguardando avaliação da oncologia."
    },
    {
      "title": "PLATINOSOMOSE E FÍGADO",
      "icon": "liver",
      "text": "Amélia está em tratamento para platinosomose. O ultrassom mostrou hepatomegalia (aumento do fígado), edema da vesícula biliar, presença acentuada de lama biliar, dilatação dos ductos biliares e sinais de icterícia."
    },
    {
      "title": "RINS E BEXIGA",
      "icon": "kidney",
      "items": [
        "Hidronefrose bilateral",
        "Mineralizações renais",
        "Suspeita de doença renal crônica",
        "Acompanhamento com nefrologista",
        "Retenção urinária e sedimento na bexiga",
        "Necessidade de auxílio para esvaziar a bexiga em alguns momentos"
      ]
    },
    {
      "title": "BAÇO E INTESTINO",
      "icon": "intestine",
      "items": [
        "Esplenomegalia intensa (aumento do baço)",
        "Espessamento difuso intestinal",
        "Episódios de vômito",
        "Fezes pastosas e episódios de diarreia"
      ]
    }
  ]
}'));

-- Meta da campanha (valores em centavos)
INSERT OR IGNORE INTO settings (key, value) VALUES
('goal', json('{
  "heading": "META DE CUSTEIO VETERINÁRIO",
  "target_cents": 1500000,
  "note": "Esse valor corresponde à dívida veterinária informada na campanha inicial. A arrecadação considera apenas pagamentos confirmados."
}'));

-- Prêmios (valores em centavos)
INSERT OR IGNORE INTO settings (key, value) VALUES
('prizes', json('{
  "heading": "PRÊMIOS DA RIFA",
  "items": [
    { "place": "1º PRÊMIO", "value_cents": 100000 },
    { "place": "2º PRÊMIO", "value_cents": 50000 },
    { "place": "3º PRÊMIO", "value_cents": 20000 }
  ],
  "note": "Os prêmios serão pagos aos ganhadores e contabilizados separadamente do valor destinado ao tratamento."
}'));

-- Configuração dos números
INSERT OR IGNORE INTO settings (key, value) VALUES
('raffle', json('{
  "total": 500,
  "price_cents": 3000,
  "pad": 3
}'));

-- Pagamento PIX
INSERT OR IGNORE INTO settings (key, value) VALUES
('pix', json('{
  "key": "(62) 99387-3229",
  "holder": "Mariana Vaz",
  "copia_cola": "",
  "instructions": "Faça o PIX no valor total da sua seleção e, em seguida, envie o comprovante pelo WhatsApp para confirmarmos seus números."
}'));

-- WhatsApp para envio de comprovante
INSERT OR IGNORE INTO settings (key, value) VALUES
('whatsapp', json('{
  "receipt_number": "+55 62 9253-6374",
  "message_template": "Olá! Participei da Rifa Solidária da Amélia e estou enviando meu comprovante de pagamento. Meus números são: {numeros}. Valor pago: R$ {valor}. Nome: {nome}."
}'));

-- Transparência e organização
INSERT OR IGNORE INTO settings (key, value) VALUES
('transparency', json('{
  "heading": "Organização e transparência",
  "items": [
    { "q": "Por que a rifa está sendo realizada?", "a": "Para custear o tratamento veterinário contínuo da Amélia, resgatada das ruas e em acompanhamento médico intensivo." },
    { "q": "Para onde vai o dinheiro?", "a": "Toda a arrecadação é destinada às despesas veterinárias da Amélia. Os prêmios são pagos aos ganhadores e contabilizados separadamente." },
    { "q": "Como os pagamentos são controlados?", "a": "Cada número só é marcado como pago após a confirmação do comprovante enviado pelo WhatsApp. A arrecadação exibida considera apenas pagamentos confirmados." },
    { "q": "Como os ganhadores serão definidos?", "a": "O método e a data do sorteio serão divulgados aqui assim que forem definidos." },
    { "q": "Como os prêmios serão entregues?", "a": "Os ganhadores serão contatados pelo WhatsApp informado no cadastro." },
    { "q": "Como será divulgado o resultado?", "a": "O resultado será divulgado nesta página e pelos canais da campanha." }
  ],
  "draw_date": "",
  "draw_date_label": "Data do sorteio a definir"
}'));

-- Fotografias
INSERT OR IGNORE INTO settings (key, value) VALUES
('photos', json('{
  "hero": "/img/amelia-2.jpeg",
  "gallery": ["/img/amelia-1.jpeg", "/img/amelia-2.jpeg", "/img/amelia-3.jpeg"]
}'));
