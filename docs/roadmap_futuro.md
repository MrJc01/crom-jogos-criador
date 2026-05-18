# Roadmap Master: O Futuro do Simulador "Criador"

Este documento consolida a visão estratégica para as próximas etapas do desenvolvimento, servindo como o nosso "Backlog" de alto nível. Cada fase foca em uma camada fundamental da experiência de jogo.

---

## ⚔️ Fase 6: O Motor de Conflito (Combate e Guerra)
Atualmente, as espécies migram e convivem pacificamente no mesmo hexágono, assimilando-se ou fundindo-se em híbridos. A Fase 6 introduzirá a violência orgânica e a competição por recursos escassos.

### Etapas da Implementação:
1. **Regras de Engajamento:** Modificar o `MigrationEngine.js`. Quando uma espécie com a Tag `Agressiva` invadir um nó ocupado por uma pacifista, em vez de conviverem, o motor rodará um cálculo de atrito mensal.
2. **Sistema de Combate Autônomo:** Uma espécie usará seu Inventário (`Armas`, `Aço`) e Tecnologia (`Táticas Militares`) para reduzir a % populacional da facção inimiga no nó.
3. **Casus Belli:** Combates só ocorrem se o hexágono atingir um gargalo de `Água` ou `Comida`, forçando a guerra por sobrevivência, ou se o `Exploration Drive` da facção for predatório (Caóticos Malignos).
4. **Espólios de Guerra:** A facção vencedora rouba uma % do inventário e da `Moeda de Confiança` da facção derrotada.

---

## 🖥️ Fase 7: Imersão Visual (Frontend D3.js e UI)
O Backend já é incrivelmente complexo (hibridização, dicionários procedurais, desastres por Era). A interface visual precisa alcançar essa riqueza para informar o jogador do que está acontecendo sem que ele precise ler o terminal.

### Etapas da Implementação:
1. **Painel de Biomas Dinâmicos:** Ao clicar em um hexágono, a UI deve listar os recursos usando o `ResourceDictionary.js`. Em vez de "Food", a UI lerá: *Carne de Morsa (Tundra)*.
2. **Raio-X Demográfico:** Atualizar o gráfico de pizza (D3) no menu lateral para mostrar os nomes procedurais gerados (ex: *Pele-ra-s*) e os seus alinhamentos (Agressivo, Simbiótico).
3. **Indicadores Visuais no Globo:** 
   - Renderizar ícones pequenos ou cores piscantes quando um **Desastre** (ex: *Praga Extrema*) atingir um hexágono.
   - Mostrar linhas de fluxo (migração) temporárias quando o `Exploration Drive` empurrar populações para nós vizinhos.

---

## 🤝 Fase 8: Diplomacia Zero-Player Avançada
Evoluir a Moeda de Confiança para alianças políticas formais.

### Etapas da Implementação:
1. **Tratados e Federações:** Se duas facções convivem no mesmo continente e ambas acumulam alta Confiança, elas formam um "Pacto". Facções pactuadas compartilham a Árvore de Tecnologias.
2. **O Mercado Global (Trade Routes):** Ativar fisicamente as rotas aéreas e marítimas (`tradeRoutes`) geradas no mapa. Facções ricas em Minério exportam automaticamente para facções ricas em Madeira em troca de Confiança, sem a intervenção do jogador.
3. **A Jornada Infinita:** O jogo não possui tela de *Game Over* ou *Vitória*. A humanidade continuará a expandir pelas eras ciclicamente. Se a Era Espacial colapsar, eles retornam à Idade da Pedra e os detritos orbitais tornam-se novas fontes de "Minérios Místicos", criando eras infinitas de apocalipse e renascimento.

---

> [!NOTE]
> Você pode escolher qualquer uma das Fases acima para começarmos, ou podemos quebrar uma delas em um novo `implementation_plan.md` focado!
