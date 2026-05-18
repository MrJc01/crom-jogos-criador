# CROM: Documentação do Motor de Simulação Histórica

Bem-vindo à documentação do **CROM**, um simulador de "Zero-Player" focado em Cliodinâmica, Sociologia e Evolução Malthusiana. Este documento destina-se a desenvolvedores, designers de sistemas e roteiristas que desejam rodar testes, acompanhar simulações interativas pelo terminal e customizar a matriz do jogo.

---

## 1. O Script Interativo (`simulate.js`)

Criamos um script interativo de CLI para que você possa comandar o "fluxo do tempo" e assistir à evolução humana diretamente pelo terminal, sem precisar carregar a interface gráfica.

### Como Executar

Na raiz do projeto (`crom-jogos-criador`), rode o comando via Node.js:

```bash
node simulate.js
```

### Argumentos de Customização

Você pode passar argumentos para customizar o que quer ver:

* `--years=N`: Determina quantos anos a simulação deve rodar (padrão: 1000).
* `--interval=N`: Define a frequência (em anos) com que o motor exibe o relatório no terminal (padrão: 100).
* `--faction=ID`: Escolhe a tribo matriz que começará no ponto de infecção zero.
* `--help`: Exibe o menu de ajuda.

**Exemplo Prático (Simulação de 20 Mil Anos, reportando a cada 1000 anos, começando com os Sino-Tibetanos):**
```bash
node simulate.js --years=20000 --interval=1000 --faction=sino_tibetanos
```

### O Que Você Verá no Terminal
O terminal imprimirá a contagem de população global, as culturas/facções que ainda estão vivas (com suas quantidades demográficas em tempo real), a temperatura global (Avisando de *Grandes Secas* ou *Eras do Gelo*), e as **Crônicas** contendo Traumas Culturais e separações rebeldes.

---

## 2. Como Customizar os Nomes e a Etnogênese

No CROM, as facções não são estáticas. Elas ganham Traumas e sofrem Cismas (Rachas culturais por causa de fome e guerra). Para não ficarmos com nomes sem graça, introduzimos a geração procedural de nomenclaturas.

### Arquivo: `client/src/config/NamesConfig.json`
Este é o arquivo-mestre onde a linguagem do mundo é criada. 
Ele contém **prefixos** e **sufixos**. Quando uma minoria se rebela, o motor (`EthnogenesisEngine.js`) puxa um pedaço daqui e monta o nome. 

Exemplo de estrutura atual:
```json
{
    "rebels": {
        "prefixes": ["Frente", "Exército", "A Irmandade"],
        "suffixes": ["Livre", "da Fome", "Verdadeiro"]
    }
}
```
**Para customizar:** Basta adicionar palavras ao Array no JSON. Se você quiser criar uma facção espacial rebelde, coloque prefixos como "Império" ou "Rebelião".

### Adicionando Novas Facções Base (`FactionsData.js`)
Se quiser adicionar um bloco histórico real que inicia o jogo:
1. Abra `client/src/core/FactionsData.js`.
2. Adicione na constante `FactionTaxonomy`:
```javascript
vikings: { name: "Nórdicos", baseColor: "#ecf0f1", traits: ["expansionist", "survivalist"] }
```
3. Agora você pode rodar `node simulate.js --faction=vikings`!

---

## 3. O Sistema de Traumas e A I.A. (Eureka)

O coração sociológico do CROM é o fato de que a I.A. das facções aprende sofrendo.
- **Como funciona:** Se um povo perder 30% da sua base demográfica porque o Clima ficou Abaixo de Zero, o `CulturalTraumaEngine.js` gruda neles a "Cicatriz" de `ice_survivors`.
- **Como customizar o Eureka:** Você pode ditar o que esse trauma faz na Árvore Tecnológica! Vá em qualquer tecnologia na pasta `client/src/modules/technologies/...` e adicione a tag `traumaTrigger`.
  
*Exemplo em `ice_fishing.js` (Pesca no Gelo):*
```javascript
export default {
    id: 'tech_ice_fishing',
    name: 'Pesca no Gelo',
    baseCost: 25,
    traumaTrigger: 'ice_survivors', // I.A. vai pesquisar isso desesperadamente se estiver traumatizada!
    ...
```

---

## 4. O Surgimento de Megacidades e Estados

O jogo agora ultrapassa o escopo de tribos. Quando um Hexágono cruza a marca de 15.000 pessoas (via muita agricultura), ele se transforma num Estado (`StateEngine.js`).

**Mecânica do Estado:**
- A Capacidade Limite (K) aumenta massivamente (500%).
- Surge o custo "Burocracia" que esvazia a reserva de comida, simulando a elite.
- Surge um "Exército Permanente" proporcional à população do Hex.

**Como mudar os Limites do Estado:**
No arquivo `client/src/modules/sociology/StateEngine.js`, procure por:
```javascript
if (majorityPct > 0.6 && node.demographics.total > 15000)
```
Mude `15000` para o limite que desejar. Se abaixar para `1000`, seu jogo vai simular um mundo entupido de Micropaíses muito rapidamente!

---
> Este documento pode ser estendido no futuro para abranger Religião, Redes Comerciais de IA e Batalhas Militares Avançadas.
