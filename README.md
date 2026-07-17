# PolifarmácIA

Na medicina, o manejo da polifarmácia (uso simultâneo de múltiplos medicamentos) exige atenção, pois o volume de prescrições facilita que **interações medicamentosas (quando uma substância altera o efeito da outra, causando diversos riscos)** passem despercebidas. O PolifarmácIA é um **sistema de suporte à decisão clínica baseado em RAG criado para facilitar o manejo de polifarmácia**, com foco em geriatria, mas aplicável a qualquer paciente.

Na aplicação, o médico insere o perfil do paciente e a lista de medicamentos, detalhando substâncias, doses e posologias. O sistema **cruzará os dados com bases farmacológicas e retornará alertas sobre interações detectadas**, entregando orientações para garantir a segurança do tratamento.

> [!NOTE]
> Este projeto possui caráter acadêmico. Todos os dados inseridos são armazenados e processados localmente.

A base que alimenta o motor de regras deste sistema deriva do **Detecta Interações** do [CRF-MG](https://imses.crfmg.org.br/index.php). Para ter acesso ao artigo de validação, acesse [Revista Brasileira de Farmácia Hospitalar e Serviços de Saúde](https://jhphs.org/sbrafh/article/view/568/555). Para ter acesso às interações medicamentosas validadas, acesse o [Guia de Interações](https://ufsj.edu.br/portal2-repositorio/File/nepefac/GUIA%20INTERACOES%20FINAL%20corretto.pdf).

--- 

## 🛠️ Como executar o projeto localmente

Antes de tudo, clone o repositório em seu terminal e acesse a pasta do projeto

```bash
git clone https://github.com/magnofilipe/PolifarmacIA.git
cd PolifarmacIA
```

---

### Backend

1. **Abra um terminal e entre na pasta do backend:**
   ```bash
   cd backend
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor:**
   ```bash
   npm run dev
   ```

---

### Frontend

1. Abra **outro** terminal e entre na pasta do frontend:
   ```bash
   cd frontend
   ```

2. Instale as dependências. Você precisa ter o npm instalado.
   ```bash
   npm install
   ```

3. Inicie o frontend:
   ```bash
   npm run dev
   ```

---

## Acessar e testar

Abra seu navegador e acesse ```http://localhost:8080```. Para testar você pode usar as seguintes credenciais na tela de login:
   - **E-mail:** `demo@clinica.com`
   - **Senha:** `123456`

Note que você também pode clicar em **"Criar Conta"** e criar o seu próprio usuário. Ao acessar o menu de um paciente, vá na seção de Medicamentos e adicione, por exemplo:

   - **AAS**
   - **Ibuprofeno**

A tela mostrará instantaneamente o alerta caso detecte algum conflito na prescrição.

---
