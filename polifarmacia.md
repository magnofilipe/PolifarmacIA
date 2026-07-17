# Sobre o PolifarmácIA
Na medicina, o manejo da polifarmácia (uso simultâneo de múltiplos medicamentos) exige atenção, pois o volume de prescrições facilita que interações medicamentosas (quando uma substância altera o efeito da outra, causando diversos riscos) passem despercebidas. O PolifarmácIA é um sistema de suporte à decisão clínica baseado em RAG criado para facilitar o manejo de polifarmácia, com foco em geriatria, mas aplicável a qualquer paciente. Na aplicação, o médico vai inserir o perfil do paciente e a lista de medicamentos, detalhando substâncias, doses e posologias. O sistema cruzará os dados com bases farmacológicas e retornará alertas sobre interações detectadas, entregando orientações para garantir a segurança do tratamento.

A ideia central é: pegamos todas as interações medicamentosas do site https://imses.crfmg.org.br/index.php, colocando elas em uma espécie de JSON. Quando o médico inserir os medicamentos, vai haver uma espécie de if/else para retornar se há ou não interação medicamentosa. Retornar que houve interação medicamentosa é tranquilo. O mais difícil é usar RAG para retornar um texto explicando porque aquilo é uma interação medicamentosa. A justificativa em texto será feita por IA, enquanto que o retorno se há ou não interação é feita com if/else ou alguma estrutura assim. 

# PIPELINE Sugerido pelo Gemini para codificar o PolifarmácIA

## Fase 1: Curadoria de Dados e Vetorização (Etapa Offline)
Esta fase é executada apenas uma vez para construir a base de conhecimento do sistema.
1. Mapeamento de Regras: Crie um arquivo JSON estático contendo as regras extraídas do "Detecta Interações". As chaves serão os pares de medicamentos e os valores serão os níveis de alerta (1 a 4) e uma breve descrição da ação.
2. Coleta de Documentos Clínicos: Faça o download de documentos em PDF que fundamentam as interações cadastradas no JSON (Critérios de Beers, bulas específicas da ANVISA e protocolos geriátricos).
3. Processamento de Texto: Utilize uma biblioteca de extração (PyPDF2 ou equivalente) para ler os PDFs. Em seguida, particione o texto em blocos menores (chunks) de aproximadamente 500 a 1000 caracteres, garantindo que parágrafos não sejam cortados abruptamente.
4. Geração de Embeddings: Envie cada chunk para um modelo de embedding (text-embedding-004 do Google) para converter o texto em vetores numéricos.
5. Armazenamento Vetorial: Salve os vetores e seus respectivos textos originais (metadados) em um banco de dados vetorial local (ChromaDB ou FAISS).

## Fase 2: Interface e Entrada de Dados (Frontend)
O médico interage com o sistema fornecendo dados estruturados.
1. Cadastro do Paciente: O sistema recebe dados demográficos e clínicos básicos por meio de formulário (nome, idade, sexo, condições clínicas, observações).
2. Prescrição: O médico seleciona os medicamentos de interesse. A interface deve utilizar exclusivamente componentes de seleção fechada (dropdowns) alimentados pela lista de medicamentos existentes no seu arquivo JSON. Isso elimina a necessidade de normalização de texto na entrada.

## Fase 3: Detecção de Conflitos (Backend - Motor de Regras)
Esta é a camada de cruzamento determinístico.
1. Iteração de Pares: Assim que um novo medicamento é adicionado à lista do paciente, o backend gera todas as combinações possíveis (pares) entre o novo fármaco e os já listados.
2. Verificação Condicional: O sistema consulta o arquivo JSON criado na Fase 1 através de blocos if/else.
3. Captura do Gatilho: Se um par (exemplo: Anlodipino + Sinvastatina) existir no JSON, o sistema extrai o nível do alerta (Contraindicada, Grave, Monitorar de perto, Menor) e aciona a Fase 4. Se não houver correspondência, o fluxo encerra sem alertas.

## Fase 4: Recuperação Semântica (Backend - RAG)
O RAG atua para buscar a explicação literária da interação detectada.
Consulta Vetorial: O backend formula uma string de busca contendo os nomes dos dois medicamentos conflitantes.
Busca por Similaridade: O ChromaDB (ou FAISS) calcula a distância vetorial entre a string de busca e os documentos armazenados, retornando os fragmentos de texto (chunks) mais relevantes que mencionam a interação e seus mecanismos fisiológicos.
Fase 5: Geração de Justificativa (Backend - LLM)
O modelo de linguagem sintetiza a resposta final para o médico.
Montagem do Prompt: O backend concatena as seguintes informações em uma única string:
Instrução de sistema (papel do modelo e restrições de formatação).
Dados do paciente (idade e condições clínicas extraídas da Fase 2).
Os medicamentos conflitantes e o nível do alerta (extraídos da Fase 3).
Os fragmentos de texto recuperados do banco vetorial (Fase 4).
Chamada de API: O prompt é enviado via SDK (Google GenAI) para o modelo Gemini 2.5 Flash.
Processamento: O modelo lê o contexto e gera uma justificativa clínica curta, restrita exclusivamente aos documentos fornecidos e adaptada (se aplicável) à idade ou condição do paciente.
Fase 6: Exibição do Alerta (Frontend)
O sistema devolve a informação processada ao usuário.
Renderização do Modal: A interface exibe um alerta visual correspondente ao nível de gravidade da interação (cores distintas para os níveis 1 a 4).
Entrega do Conteúdo: O texto gerado pelo Gemini 2.5 Flash é exibido no corpo do modal, fornecendo a justificativa fisiológica e a recomendação de manejo de forma direta.