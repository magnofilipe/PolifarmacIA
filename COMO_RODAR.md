# 🚀 Como rodar o PolifarmácIA (guia completo)

Passo a passo para subir **tudo** e deixar o sistema 100% rodando, incluindo a camada de **RAG** (busca semântica + justificativa por IA).

---

## 🧩 Visão geral: o que precisa estar no ar

O sistema tem **3 processos** rodando ao mesmo tempo, cada um no seu terminal:

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Chroma (vetor)  │   │     Backend      │   │     Frontend     │
│   porta :8000    │◄──│    porta :3000   │◄──│    porta :8080   │
│  npx chroma run  │   │   npm run dev    │   │   npm run dev    │
└──────────────────┘   └──────────────────┘   └──────────────────┘
        ▲
        │ (uma vez só, antes de tudo)
   ingestão dos dados → npm run process-pdfs + npm run generate-embeddings
```

> ⚠️ **Importante:** o **motor de regras** (detecção de interações via `indice_pares.json`) funciona **sem** Chroma e sem Gemini. Se você pular a parte de RAG, o app ainda detecta interações — só não mostra o texto explicativo da IA. A IA é um **complemento**, nunca um bloqueador.

---

## ✅ Pré-requisitos

- **Node.js 18+** instalado (testado no v24).
- Uma **chave gratuita do Gemini** (Google AI Studio → https://aistudio.google.com → *Get API key*).

---

## 1️⃣ Instalar dependências (uma vez só)

```bash
# na raiz do projeto
cd backend && npm install
cd ../frontend && npm install
cd ..
```

## 2️⃣ Configurar a chave do Gemini

Crie o arquivo **`backend/.env`** com o conteúdo:

```env
GEMINI_KEY=cole_sua_chave_aqui
CHROMA_URL=http://localhost:8000
PORT=3000
```

---

## 3️⃣ Subir o banco vetorial (Chroma) — **Terminal 1**

Deixe este terminal **aberto** o tempo todo. É o "banco" ligado.

```bash
cd backend
npx chroma run
```

Deve aparecer algo como *"Running Chroma ... listening on localhost:8000"*.
Não feche esse terminal enquanto estiver usando o sistema.

---

## 4️⃣ Popular a base de conhecimento (RAG) — **Terminal 2**, uma vez só

Com o Chroma do passo 3 rodando, gere os embeddings dos documentos. **Isso roda uma única vez** (ou toda vez que você adicionar/trocar documentos).

```bash
cd backend
npm run process-pdfs          # 1) lê o jsonl + os docs em materiais-referencia/ → data/rag-chunks.json
npm run generate-embeddings   # 2) manda tudo pro Chroma (usa a quota gratuita do Gemini)
```

Ao final, deve imprimir algo como:
`Concluído. A collection 'clinical-documents' agora tem 872 registro(s).`

> 💡 Os documentos-fonte ficam em **`materiais-referencia/`** na raiz. Formatos suportados: `.pdf`, `.html`, `.htm`, `.txt`, `.md`.

### ⏳ Por que o `generate-embeddings` demora ~10 minutos (e por que isso é NORMAL)

Cada pedaço de texto (chunk) precisa ser convertido em vetor pelo Gemini, e **o plano gratuito permite só 100 requisições de embedding por minuto**. Como a base tem ~872 chunks, não dá pra mandar tudo de uma vez — estouraria o limite (erro `429 RESOURCE_EXHAUSTED`).

**Você não precisa fazer nada manual** — o script já cuida disso sozinho:

- Envia em **lotes pequenos** e **pula** o que já foi enviado (é **resumível**);
- Quando bate no limite dos 100/min, ele **espera ~50s automaticamente e continua** — você vai ver linhas assim, e **isso é esperado, não é erro**:
  ```
  · [embed] erro transitório, aguardando 51s (tentativa 1/5)...
    -> 400/872 processado(s).
  ```
- No total, popular os 872 chunks leva **cerca de 8–10 minutos**. Pode deixar rodando e ir tomar um café. ☕

**Se ele parar no meio** (fechou o terminal, caiu a internet, acabou a quota do dia): é só **rodar `npm run generate-embeddings` de novo**. Ele detecta o que já está no Chroma e **retoma de onde parou**, sem gastar quota reprocessando.

> ⚠️ **Não rode o comando duas vezes ao mesmo tempo** (em dois terminais). Dois processos disputando o mesmo limite de 100/min só deixam tudo mais lento.

> 🔑 **Modelos usados** (caso você veja um erro de "modelo não encontrado / no longer available", é aqui que se troca):
> - Embedding: `gemini-embedding-001` — em `backend/src/services/rag/embedding.service.ts`
> - Justificativa (geração): `gemini-flash-lite-latest` — em `backend/src/services/llm/gemini.service.ts`
>
> Os nomes de modelo do Gemini mudam com o tempo; se algum for descontinuado para chaves novas, rode este comando para ver os disponíveis na sua chave e ajuste o nome no arquivo correspondente:
> ```bash
> KEY=$(grep '^GEMINI_KEY=' backend/.env | cut -d= -f2-)
> curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=${KEY}" | grep -o '"name": "models/[^"]*"'
> ```

---

## 5️⃣ Subir o backend — **Terminal 2** (o mesmo do passo 4)

```bash
cd backend
npm run dev
```

Deve aparecer: `API running on 3000`.

---

## 6️⃣ Subir o frontend — **Terminal 3**

```bash
cd frontend
npm run dev
```

---

## 7️⃣ Acessar e testar

Abra o navegador em **http://localhost:8080**.

**Login de demonstração:**
- **E-mail:** `demo@clinica.com`
- **Senha:** `123456`

(ou clique em **"Criar Conta"** para criar o seu próprio usuário)

**Para ver uma interação com justificativa da IA**, entre num paciente → seção **Medicamentos** → adicione dois medicamentos que interagem, por exemplo:
- **AAS**
- **Varfarina**

O sistema mostra o alerta instantaneamente. Com o RAG no ar, o modal também traz o bloco **"Justificativa clínica (gerada por IA)"** com mecanismo e conduta.

> ℹ️ O exemplo `AAS + Ibuprofeno` (citado no README antigo) **não dispara** — esse par não está na base. Use `AAS + Varfarina`.

---

## 🔁 Resumo rápido (depois da 1ª configuração)

Já com `.env` criado, deps instaladas e Chroma já populado, o dia a dia é só:

```bash
# Terminal 1
cd backend && npx chroma run

# Terminal 2
cd backend && npm run dev

# Terminal 3
cd frontend && npm run dev
```

E acessar http://localhost:8080.

---

## ➕ Como adicionar mais documentos à base da IA

1. Jogue os arquivos em **`materiais-referencia/`** (`.pdf`, `.html`, `.txt` ou `.md`).
2. Com o Chroma rodando, regenere a base:
   ```bash
   cd backend
   npm run process-pdfs
   npm run generate-embeddings
   ```

> ⚠️ Adicionar documentos aqui **enriquece as explicações** da IA. **Não** cria detecção de interações novas — a detecção vem exclusivamente do `indice_pares.json`.

---

## 🆘 Problemas comuns

| Sintoma | Causa / solução |
|---|---|
| Alerta aparece, mas **sem** o texto da IA | Chroma não está no ar, base não populada, ou `GEMINI_KEY` inválida. O app degrada de propósito — rode os passos 3 e 4. |
| `generate-embeddings` fica repetindo *"aguardando 51s..."* | **Normal.** É o limite de 100 embeddings/min do plano gratuito. O script espera e continua sozinho. Veja a seção do passo 4. |
| `generate-embeddings` erro `429 RESOURCE_EXHAUSTED` que não passa | Você provavelmente esgotou a **quota diária** do plano gratuito. Espere algumas horas e rode de novo — ele **retoma** de onde parou. |
| Erro `NOT_FOUND` / *"model ... is no longer available"* | O nome do modelo do Gemini foi descontinuado. Veja a nota "🔑 Modelos usados" no passo 4 para descobrir os disponíveis e trocar. |
| `sh: 1: chroma: Permission denied` (ou `tsc`, `vite`...) | Os executáveis perderam permissão. Rode: `chmod +x node_modules/.bin/*` na pasta (backend e/ou frontend). |
| `Address localhost:8000 is not available` | A porta 8000 já está ocupada (Chroma antigo travado). Ache e encerre: `lsof -i :8000` e depois `kill <PID>`. |
| `generate-embeddings` falha na conexão | O Chroma (passo 3) não está rodando. Suba-o antes. |
| `generate-embeddings` erro de autenticação | `GEMINI_KEY` ausente/errada no `backend/.env`. |
| Frontend não conecta no backend | Backend não está rodando (passo 5) ou não está na porta 3000. |
| Nenhuma interação detectada | Confira se os dois medicamentos formam um par existente (ex.: `AAS + Varfarina`). |
| A justificativa da IA demora muito pra aparecer | Normal na 1ª vez se a quota estiver saturada. Em uso normal são ~2–3s. O alerta determinístico aparece na hora, independente da IA. |

---

## 📁 Arquivos de dados (referência)

| Arquivo | Papel |
|---|---|
| `indice_pares.json` | **Motor de regras** — decide SE existe interação (lookup O(1)). Fonte de verdade. |
| `interacoes_rag.jsonl` | Corpus base do RAG (uma entrada por interação). |
| `materiais-referencia/` | Documentos extras do RAG (PDFs, HTML da Anvisa etc.). |
| `interacoes_medicamentosas.json`, `interacoes-medicamentos.json` | Materiais auxiliares — **não usados** pelo código atual. |
| `backend/data/rag-chunks.json` | Gerado automaticamente pelo `process-pdfs` (não versionado). |
