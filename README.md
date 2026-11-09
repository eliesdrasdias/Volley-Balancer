# Volley Balancer

Aplicação web client-side para montar três times de vôlei a partir de uma lista colada do WhatsApp. O projeto combina parsing tolerante a texto informal, edição rápida de jogadores e um algoritmo de distribuição com regras explícitas de nível, gênero e função.

## Visão geral

O fluxo cobre uma rodada do início ao fim:

1. Colar a lista recebida no WhatsApp.
2. Extrair levantadores e atletas, ignorando informações administrativas.
3. Revisar sexo e nível técnico dos jogadores.
4. Sortear três times e conferir as métricas de equilíbrio.
5. Exportar os cards como imagem JPEG.

Não há API, servidor de aplicação ou banco de dados implementados pelo projeto. A lista e os times ficam somente na memória da página atual; atualizar ou fechar a página descarta a rodada. A hospedagem estática ainda pode registrar dados técnicos de acesso conforme sua própria política.

## Privacidade e uso dos dados

O aplicativo processa nomes, função, nível e sexo informados pelo organizador. Esses dados existem na memória da página aberta; não são enviados por este código a uma API do projeto nem gravados em armazenamento persistente do navegador. A imagem exportada contém os nomes e deve ser compartilhada pelo organizador somente com o grupo pretendido. Não cole dados de pagamento, telefone, saúde ou outras informações que não sejam necessárias para montar os times.

O botão **Apagar rodada** no cabeçalho (ou **Limpar lista e jogadores**) remove os dados da página imediatamente. Atualizar ou fechar a página também os descarta. A exportação é iniciada por ação do usuário e baixa um JPEG local. Evite exportar em dispositivos compartilhados.

Para uso em grupo, o organizador deve explicar aos participantes que seus nomes e atributos serão usados para a montagem dos times, limitar o acesso à lista e às imagens e combinar a base legal adequada ao contexto. Este software, sozinho, não determina a base legal nem torna o tratamento automaticamente conforme à LGPD. A política da plataforma de hospedagem e a forma como o organizador coleta e compartilha a lista também precisam ser consideradas.

## Decisões técnicas

### Parser de texto

O parser normaliza finais de linha, reconhece as seções `Levantadores` e `Atletas` e ignora linhas como data, PIX, chave, valor e links. Nível técnico só se aplica a atletas: aceita sufixos como `Ana 2`, `Ana - 2` e `Ana (2)`. Nível ausente recebe valor padrão 3 com aviso. A entrada é validada para exatamente três levantadores e quinze atletas, e nomes duplicados são sinalizados.

### Sorteio com restrições

O sorteio valida 18 jogadores (3 levantadores e 15 atletas) antes de distribuir. Atletas são organizados por nível e distribuídos em snake draft. Dentro de cada nível, o algoritmo avalia combinações de posições por gênero e as seis permutações possíveis dos levantadores; escolhe uma distribuição com a menor diferença possível na quantidade de mulheres. Entre soluções igualmente equilibradas, embaralha jogadores e seleciona uma alternativa aleatória.

Cada time recebe um levantador e cinco atletas. A soma de níveis considera somente atletas; diferenças maiores que um ponto e distribuições de gênero fora da tolerância aparecem como avisos no resultado.

### Persistência e exportação

- Jogadores e times permanecem somente na memória da página aberta; recarregar inicia uma rodada vazia.
- `html2canvas-pro` é carregado sob demanda ao exportar. A biblioteca captura os cards no navegador, e o app gera um JPEG com compressão progressiva para reduzir o tamanho do arquivo.
- O algoritmo aceita uma fonte aleatória injetável, permitindo verificar resultados diferentes de forma reproduzível nos testes.

## Arquitetura

```text
src/
├── components/
│   ├── Algorithm/draw.ts             # validação e distribuição dos times
│   ├── ExportButton/ExportButton.tsx # captura e download do JPEG
│   ├── PlayerEditor/PlayerEditor.tsx # ajustes de sexo e nível
│   ├── SmartPaste/
│   │   ├── parser.ts                 # parser e validação da lista
│   │   └── SmartPaste.tsx            # entrada e prévia dos jogadores
│   └── TeamCard/TeamCard.tsx         # apresentação de cada time
├── types/index.ts                    # modelo de jogador, time e estado
├── App.tsx                            # composição do fluxo da aplicação
└── acceptance.test.ts                # testes de aceitação
```

## Stack

- React 19 e TypeScript
- Vite 8
- Tailwind CSS 4
- Vitest, Testing Library e jsdom
- html2canvas-pro para captura local da interface

## Requisitos

- Node.js `^20.19.0` ou `>=22.12.0`
- npm

## Executar localmente

```sh
npm install
npm run dev
```

## Verificação de qualidade

```sh
npm test
npm run lint
npm run build
```

A suíte cobre parsing da amostra, regras de composição, equilíbrio de nível e gênero, variação entre sorteios, comportamento responsivo e exportação. Lint e build verificam estilo, tipos e bundle de produção.

## Amostra para validar o Smart Paste

Copie a lista abaixo para o campo **Lista do WhatsApp**. O parser deve ignorar os dados de pagamento e reconhecer 3 levantadores e 15 atletas.

<details>
<summary>Abrir amostra de WhatsApp</summary>

```text
*Vôlei de terça-feira*
Data: 08/11/2026
PIX: chave@exemplo.com
Valor: R$ 20,00

*Levantadores*
Ana Souza
Bruno Lima
Carla Mendes

*Atletas*
Diego Alves 1
Elisa Costa 2
Felipe Rocha 3
Giovana Reis 4
Heitor Nunes 1
Isabela Prado 2
João Martins 3
Karen Oliveira 4
Lucas Ferreira 1
Marina Gomes 2
Nicolas Barros 3
Olivia Ribeiro 4
Paulo Santos 1
Quitéria Melo 2
Rafael Duarte 3
```

</details>

Os níveis vão de 1 (mais avançado) a 4 (iniciante). Como o texto não informa sexo, os jogadores são inicialmente classificados como M; ajuste essa informação no editor antes do sorteio.
