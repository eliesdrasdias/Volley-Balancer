# Volley Balancer

Aplicação web para transformar uma lista de presença do WhatsApp em três times de vôlei equilibrados. O organizador cola a lista, revisa os dados dos jogadores, gera a distribuição e exporta os times como imagem — tudo direto no navegador.

**Demonstração:** [volei.eliesdras.dev.br](https://volei.eliesdras.dev.br/)

## Visão geral

O Volley Balancer resolve uma tarefa recorrente de quem organiza partidas: distribuir 18 pessoas em três times considerando levantadores, nível técnico e gênero, sem montar tudo manualmente.

1. Cole a lista recebida no WhatsApp.
2. O parser reconhece levantadores e atletas e ignora informações administrativas comuns, como data, PIX, valor e links.
3. Revise os nomes, busque jogadores pelo nome e ajuste gênero e nível técnico.
4. Sorteie três times e confira os indicadores de equilíbrio.
5. Exporte os cards em JPEG para compartilhar com o grupo.

O aplicativo funciona sem API ou banco de dados próprios. Os dados da rodada ficam na memória da página e são descartados ao atualizar ou fechar a aba.

## Funcionalidades

- **Entrada tolerante a listas reais:** reconhece as seções `Levantadores` e `Atletas`, níveis no formato `Ana 2`, `Ana - 2` ou `Ana (2)`, e ignora linhas administrativas frequentes.
- **Revisão antes do sorteio:** sinaliza contagens incorretas, nomes duplicados e níveis ausentes ou inválidos. O editor permite ajustar gênero e nível individualmente e localizar pessoas pela busca.
- **Distribuição com restrições:** valida a composição de 3 levantadores e 15 atletas, distribui atletas por nível com snake draft e avalia as combinações de gênero e as permutações dos levantadores para equilibrar os times.
- **Indicadores claros:** cada time mostra a composição e a soma de níveis dos atletas. Diferenças acima da meta aparecem como avisos para revisão.
- **Exportação local:** captura os cards no navegador e gera um JPEG otimizado, sem enviar a imagem para um serviço do projeto.
- **Layout responsivo e acessível:** interface adaptada a telas menores, com controles semânticos, estados acessíveis e alvos de toque confortáveis.

## Decisões técnicas

### Parser de texto

O parser normaliza finais de linha, reconhece títulos de seção mesmo com formatação comum do WhatsApp e desconsidera linhas administrativas e listas de espera. O nível técnico se aplica somente a atletas; quando falta, o valor padrão é 3 e um aviso é exibido. A rodada requer exatamente três levantadores e quinze atletas, e nomes repetidos são sinalizados para conferência.

### Sorteio com restrições

O algoritmo valida a quantidade e o papel dos jogadores antes de distribuir. Agrupa os atletas pelos níveis de 1 a 4 e usa snake draft para espalhar cada grupo entre os times. Em seguida, avalia as combinações de gênero dentro de cada nível e as seis permutações possíveis dos levantadores; prioriza a menor diferença na quantidade de mulheres por time e sorteia entre opções igualmente equilibradas.

Cada time recebe um levantador e cinco atletas. A soma de níveis considera somente atletas. O resultado informa quando a diferença entre as somas de nível ou entre as contagens de gênero passa de um jogador/ponto.

### Privacidade e exportação

Os nomes, papéis, gêneros e níveis são mantidos apenas na memória da página aberta. O código do projeto não envia esses dados a uma API nem os grava em armazenamento persistente do navegador. Atualizar ou fechar a página descarta a rodada. A exportação é iniciada pelo organizador e baixa um JPEG local contendo os nomes; compartilhe-o somente com o grupo pretendido. A hospedagem estática pode registrar dados técnicos de acesso conforme sua própria política.

## Arquitetura

```text
src/
├── components/
│   ├── Algorithm/draw.ts             # validação, distribuição e métricas
│   ├── ExportButton/ExportButton.tsx # captura e download do JPEG
│   ├── PlayerEditor/PlayerEditor.tsx # busca e edição dos jogadores
│   ├── SmartPaste/
│   │   ├── parser.ts                 # parsing e validação da lista
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

A suíte de aceitação cobre parsing, regras de composição, equilíbrio de nível e gênero, variação entre sorteios, comportamento responsivo e exportação. Os comandos também permitem executar lint e gerar o bundle de produção.

## Amostra para validar o Smart Paste

Cole a lista abaixo no campo **Lista do WhatsApp**. O parser deve ignorar os dados administrativos e reconhecer 3 levantadores e 15 atletas.

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

Os níveis vão de 1 (mais avançado) a 4 (iniciante). Como a lista não informa gênero, o parser inicia todos como M; ajuste essa informação no editor antes de sortear para que o algoritmo possa equilibrar essa dimensão.
