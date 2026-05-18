# Arquitetura Técnica e Visão do Backend (Multiverso)

O jogo possui uma arquitetura híbrida focada no modelo **"Offline-First"** (Single Player primário), mas desenhada desde o dia zero para se conectar a um **Backend Online** responsável pela gestão do Multiverso no futuro.

## 1. O Core do Jogo (Client-Side)
O coração da gameplay acontece no navegador do jogador. Toda a simulação local (o seu planeta atual, propagação de facções, taxas de crescimento logístico, e árvores de tecnologia) roda sem necessidade de conexão com a internet.

- **Motor e Lógica**: Vanilla JavaScript / TypeScript (sem overhead de frameworks para o Game Loop).
- **Renderização e Visualização (Híbrida)**: O frontend utiliza o **HTML5 Canvas API** para renderização de altíssima performance de centenas de milhares de hexágonos (`hex_map.json`), aplicando *Viewport Culling* e *Color Batching* para garantir 60 FPS, enquanto mantém uma camada sobreposta em `D3.js` apenas para interação de UI e partículas vetoriais.
- **Preparação Geográfica (Backend Local)**: Para não travar o cliente, o processamento bruto do `TopoJSON` em hexágonos microscópicos foi transferido para um script isolado Node.js, respeitando o princípio de escalabilidade zero-player.
- **Ecosistema**: Empacotamento ágil com `Vite`.
- **Gerenciamento de Estado**: State machines rodando a *X Ticks/segundo* em um loop não-bloqueante (`requestAnimationFrame`).

## 2. A Camada de Backend: O Multiverso
Embora o foco atual seja **Single Player**, a infraestrutura foi projetada para expansões futuras (MMO ou instâncias compartilhadas). O Backend terá as seguintes responsabilidades:

### 2.1. Persistência de Galáxias e Planetas
- Ao conectar online, o estado do planeta local do jogador é enviado para o servidor e registrado como parte do "Multiverso".
- O servidor manterá um mapa estelar gigantesco onde planetas de vários jogadores existem. 
- Distâncias relativas entre os planetas afetarão o tempo e o custo de transporte interplanetário.

### 2.2. Interações Multiplayer (Invasões e Comércio)
- **Disputa por Recursos**: Planetas neutros ou ricos em materiais podem estar no centro da disputa entre dois jogadores.
- **Invasões**: O jogador poderá enviar "Frotas" (Facções militarizadas, População, e Recursos Artificiais) pela malha do servidor para invadir ou colonizar o planeta de outro jogador.
- **Economia Global**: Facções de jogadores distintos podem abrir rotas de comércio, gerando dependência logística interplanetária.

## 3. Separação de Preocupações (Modelagem MVC)

1. **Engine Local (Client Lógica)**:
   - Contém o `Game Loop` do planeta atual. Resolve crescimento, clima e revoluções.
2. **Renderer (Client Apresentação)**:
   - D3.js transformando dados em SVGs e tooltips (Globo 3D ou Mapa Plano).
3. **Controlador/UI (Client Interface)**:
   - Menus, logs e árvore de vida geridos via HTML/CSS.
4. **Daemon Sincronizador (Client -> Server)** *(Futuro)*:
   - Um serviço em background (ex: WebSockets) que empacota o estado local e sincroniza eventos macro (como o lançamento de uma nave interplanetária) com a API do Servidor do Multiverso.
5. **Backend (Server)** *(Futuro)*:
   - API e banco de dados central (ex: Go, Node.js + Postgres/Redis) que valida movimentações entre jogadores, arbitra invasões e gerencia o mercado do universo.

## 4. Agnosticismo Espacial (Data-Driven)
Tanto a Engine Client quanto o Backend futuro são completamente agnósticos ao "mapa" da vez. O jogo lê metadados baseados num arquivo estruturado de geografia. Se a humanidade chega em Marte, o mapa carrega `mars.json`. Se chega num planeta proceduralmente gerado do Multiverso, carrega `planet_X99.json`.
