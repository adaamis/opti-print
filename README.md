# OptiPrint — Suíte de Inteligência Gráfica e Aproveitamento de Folhas

**OptiPrint** é uma aplicação web moderna para otimização de corte e aproveitamento de folhas, desenvolvida especificamente para profissionais gráficos, bureaus de impressão digital, serigrafias, convertedores e estúdios de design.

O objetivo do OptiPrint é eliminar o desperdício de papel e substratos, calculando instantaneamente o melhor arranjo geométrico de itens em folhas comerciais (A4, A3, SRA3, Folha Inteira, etc.) ou formatos personalizados salvos pelo usuário.

---

## 🚀 Principais Funcionalidades

### 1. ⚡ Modo Rápido ("Quantos Cabem?")
- Avaliação instantânea de quantas unidades de uma peça cabem em uma folha.
- **Análise comparativa em tempo real** entre três estratégias de imposição:
  - **Horizontal Puro**: todas as peças alinhadas horizontalmente.
  - **Vertical Puro**: todas as peças alinhadas em 90°.
  - **Misto Otimizado (Mixed Nesting)**: combinação inteligente de blocos ortogonais que aproveita os "restos" de margem e sangria, superando alinhamentos rígidos convencionais.
- Destaque automático da estratégia campeã com maior rendimento e menor taxa de refugo (apara).

### 2. 📦 Modo Múltiplos Itens (Multi-Packer)
- Cadastro de pedidos complexos com múltiplas peças de dimensões e quantidades diferentes (ex: cartões de visita, tags, panfletos, adesivos).
- Algoritmo de empacotamento em múltiplas folhas sequenciais respeitando orientação individual (livre, somente horizontal ou somente vertical).
- Relatório consolidado: quantidade solicitada vs. produzida, total de folhas necessárias e aproveitamento global ponderado por área.

### 3. 📐 Presets Industriais & Medidas Personalizadas
- Presets prontos para produção gráfica:
  - **A4** (210 × 297 mm)
  - **A3** (297 × 420 mm)
  - **A3+ / Super A3** (329 × 483 mm)
  - **SRA3** (320 × 450 mm)
  - **Folha Inteira BB** (660 × 960 mm)
  - **Folha Inteira AA** (760 × 1120 mm)
- **Gerenciador de formatos salvos**: salve seus substratos personalizados com persistência automática no navegador (`localStorage`).
- Suporte a alternância de unidades: **Milímetros (mm)** ou **Centímetros (cm)** com conversão bidirecional automática.
- Configuração de margem técnica (pinça / gripper) e espaçamento entre peças (calha de corte / sangria).

### 4. 🖨️ Visualizador Interativo & Impressão
- Canvas vetorial responsivo com grade dimensional milimétrica.
- Zoom e navegação intuitiva entre folhas com paginação sequencial.
- Layout otimizado para `@media print` — imprima a ficha técnica de corte diretamente do navegador sem poluição de interface.

### 5. 📥 Exportação SVG 1:1 para Produção
- Gera arquivos SVG com escala métrica real em milímetros (`1:1 physical mm`).
- Compatibilidade nativa com softwares de corte e pré-impressão: **CorelDRAW**, **Adobe Illustrator**, **Inkscape**, além de RIPs e plotters de recorte.
- Camadas estruturadas: contorno da folha, guia de margem pontilhada, peças rotuladas e cotas dimensionais.

---

## 🛠️ Tecnologias Utilizadas

- **React 19** + **TypeScript**: arquitetura moderna, tipagem estrita e reatividade de alta performance.
- **Tailwind CSS v4**: estilização utilitária com suporte completo a design responsivo e folhas de estilo para impressão.
- **Lucide React**: ícones modernos e funcionais.
- **Vite 8**: build tool ultrarrápida com Hot Module Replacement (HMR).
- **Vitest**: suíte completa de testes automatizados para os algoritmos de cálculo, exportadores e utilitários.

---

## 💻 Como Executar o Projeto

### Pré-requisitos
- Node.js (versão 18 ou superior recomendada)
- npm (gerenciador de pacotes padrão)

### 1. Instalação das Dependências
```bash
npm install
```

### 2. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse a aplicação no seu navegador no endereço indicado (geralmente `http://localhost:5173`).

### 3. Executar os Testes Automatizados
```bash
npm test
```
Executa a bateria de testes unitários e de integração com o Vitest.

### 4. Verificação de Tipos TypeScript
```bash
npm run typecheck
```
ou:
```bash
npx tsc --noEmit
```

### 5. Gerar Build de Produção
```bash
npm run build
```
Os arquivos otimizados e minificados para distribuição serão gerados no diretório `dist/`.

Para pré-visualizar a build localmente:
```bash
npm run preview
```

---

## 📂 Estrutura de Diretórios

```
opti-print/
├── index.html                 # Ponto de entrada HTML e metadados
├── package.json               # Configurações do projeto e scripts
├── tsconfig.json              # Configurações do compilador TypeScript
├── vite.config.ts             # Configuração do Vite e plugins
└── src/
    ├── App.tsx                # Componente raiz e orquestração de estado
    ├── main.tsx               # Bootstrap da aplicação React
    ├── index.css              # Estilos globais e regras @media print
    ├── types/
    │   └── optimizer.ts       # Modelos de dados e contratos de tipagem
    ├── constants/
    │   ├── sheets.ts          # Presets industriais de papéis e cores
    │   └── sheets.test.ts     # Testes de integridade das constantes
    ├── engine/
    │   ├── packer.ts          # Algoritmos de nesting misto e multi-packing
    │   └── packer.test.ts     # Testes unitários do algoritmo de empacotamento
    ├── components/
    │   ├── MetricsBar.tsx     # Barra de indicadores (aproveitamento, apara, etc.)
    │   ├── QuickModePanel.tsx # Painel do modo rápido ("Quantos cabem?")
    │   ├── ItemListPanel.tsx  # Tabela e formulário de múltiplos itens
    │   ├── SheetConfigPanel.tsx # Seleção de formato, margens e espaçamento
    │   └── SheetVisualizer.tsx# Visualizador gráfico e exportação SVG
    └── utils/
        ├── units.ts           # Conversões milímetros/centímetros
        ├── customPresets.ts   # Persistência de formatos customizados (localStorage)
        ├── customPresets.test.ts # Testes de persistência
        ├── exportSvg.ts       # Geração vetorial 1:1 em SVG
        └── exportSvg.test.ts  # Testes de integridade do SVG
```

---

## 📄 Licença
Distribuído sob licença proprietária/interna para uso e desenvolvimento da plataforma OptiPrint.
