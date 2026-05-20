# 🌌 CROM: Manual do Arquiteto Cósmico

Bem-vindo ao centro administrativo e criativo do **CROM**, um simulador de "Zero-Player" fundamentado em Cliodinâmica, Sociologia, Ecologia Malthusiana e Evolução Civilizatória. 

Se você é um cientista, desenvolvedor, designer de jogos ou apenas um curioso fascinado em assistir ao desdobrar da espécie humana, este documento é a sua porta de entrada.

---

## 🌅 O Portal do Criador (Guias Narrativos para Curiosos)

Para quem quer entender como o jogo funciona, como os sistemas se entrelaçam e como a humanidade reage sob o capô, criamos uma série de guias didáticos e conceituais fascinantes. Clique nas seções abaixo para iniciar sua jornada intelectual:

### 📖 Módulos Narrativos de Exploração
*   [🌅 O Ano Zero: O Despertar Primordial](file:///home/j/Documentos/GitHub/crom-jogos/crom-jogos-criador/documentacao_curiosos/01_o_ano_zero.md) — Entenda como a humanidade sai estocasticamente da Idade da Pedra, foge da armadilha biológica e inicia o seu crescimento demográfico.
*   [👥 Etnogênese & Cismas: Divisão Social](file:///home/j/Documentos/GitHub/crom-jogos/crom-jogos-criador/documentacao_curiosos/02_etnogenese_e_cismas.md) — Descubra como a fome, o distanciamento geográfico e as crises ecológicas quebram dinastias imperiais e criam novas identidades procedurais de facções rebeldes.
*   [🎛️ As Leis da Matriz: Constantes Físicas](file:///home/j/Documentos/GitHub/crom-jogos/crom-jogos-criador/documentacao_curiosos/03_as_leis_da_matriz.md) — Um guia imersivo detalhando as Leis Físicas que você controla no menu de início (Guerra, Grande Filtro, Multiplicadores de Evolução) e seus impactos ecológicos.
*   [🧠 Traumas & Eureka: Evolução pela Dor](file:///home/j/Documentos/GitHub/crom-jogos/crom-jogos-criador/documentacao_curiosos/04_traumas_e_eureka.md) — Aprenda sobre a inteligência adaptativa das facções e como a dor e os desastres naturais aceleram a Árvore Científica sob o motor de Eureka.

---

## 🛠️ Guia Técnico do Desenvolvedor

Se você deseja debugar a simulação, rodar testes de caixa preta no terminal, exportar ou injetar dados de saves forenses, utilize as diretrizes técnicas a seguir.

### 1. O Script de Simulação de Terminal (`simulate.js`)

Se preferir rodar o tempo e assistir à evolução humana diretamente pelo console (sem carregar os gráficos tridimensionais), criamos um motor leve de CLI.

#### Como Executar

Na raiz do projeto (`crom-jogos-criador`), rode:
```bash
node simulate.js
```

#### Parâmetros de Customização

Você pode passar argumentos para calibrar a injeção estocástica:
*   `--years=N`: Determina quantos anos a simulação deve rodar (padrão: 1000).
*   `--interval=N`: Define a frequência (em anos) com que o motor imprime o censo ecológico no terminal (padrão: 100).
*   `--faction=ID`: Escolhe qual tribo matriz começará no ponto de infecção zero.
*   `--help`: Exibe o menu com todas as opções.

**Exemplo Prático (Simulação de 20 Mil Anos, reportando a cada 1000 anos, começando com os Sino-Tibetanos):**
```bash
node simulate.js --years=20000 --interval=1000 --faction=sino_tibetanos
```

---

### 2. Customizando a Etnogênese Procedural

No CROM, novas facções que nascem de rebeliões não têm nomes fixos; elas ganham designações linguísticas dinâmicas com base em prefixos e sufixos.

#### Arquivo: `client/src/config/NamesConfig.json`
Este é o arquivo-mestre de designação fonética. Para expandir ou traduzir as alcunhas das novas tribos e exércitos rebeldes, adicione palavras ao JSON:
```json
{
    "rebels": {
        "prefixes": ["Frente", "Exército", "A Irmandade", "Clã", "Ordem"],
        "suffixes": ["Livre", "da Fome", "Verdadeiro", "da Estrela", "Caçador"]
    }
}
```

#### Adicionando Novas Facções Base (`FactionsData.js`)
Se quiser adicionar um bloco histórico real que inicia o jogo:
1. Abra `client/src/core/FactionsData.js`.
2. Adicione na constante `FactionTaxonomy`:
```javascript
vikings: { name: "Nórdicos", baseColor: "#ecf0f1", traits: ["expansionist", "survivalist"] }
```
3. Agora você pode iniciar as constantes diretamente com `--faction=vikings`!

---

### 3. Aumentando Limites Geopolíticos do Estado

Se desejar acelerar o surgimento de estados organizados e a ascensão de Megacidades:
1. Abra o arquivo `client/src/modules/sociology/StateEngine.js`.
2. Altere o limite padrão de população:
```javascript
if (majorityPct > 0.6 && node.demographics.total > 15000)
```
Se você abaixar a verificação de `15000` para `2000` habitantes, o simulador explodirá em micropaíses burocráticos e megacidades industriais muito mais cedo!

---
> *CROM é um ecossistema digital de código aberto. Modifique as Leis, teste os limites da resiliência humana e ajude o Homo sapiens a transcender o Grande Filtro.*
