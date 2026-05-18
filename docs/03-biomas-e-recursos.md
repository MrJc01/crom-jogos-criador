# Biomas e Sistema de Recursos

## Biomas: Camada Ambiental Independente
Os biomas existem em uma camada visual e lógica separada das fronteiras políticas (países/estados). As fronteiras definem onde os humanos lutam ou se organizam, mas o **Bioma** define o custo de sobrevivência da área. Um único território pode conter os biomas "Deserto" e "Floresta Tropical".

### Atributos do Bioma
- **Custo de Manutenção de População**: Cada bioma apresenta uma porcentagem de dificuldade para sustentar vida humana. 
  - Exemplo: Desertos e Tundras congeladas impõem `100%` de dificuldade, exigindo pesados investimentos tecnológicos para não perder habitantes. Planícies férteis podem ter `20%` de dificuldade.
- **Depósitos de Recursos Naturais**: Cada bioma tem uma % específica (RNG e hardcoded) de conter certos materiais.
- **Degradação**: Conforme os recursos são massivamente extraídos, o bioma perde suas propriedades originais e as % de dificuldade aumentam (ex: desertificação).

---

## Os Três Pilares de Recursos

### 1. Recursos Naturais (Físicos Brutos)
O que é extraído diretamente do bioma:
- Animais (Alimentação, tração inicial, couro)
- Plantas (Madeira, medicina botânica, fibras)
- Minerais (Ferro, cobre, silício, ouro)
- Água (Essencial, ponto de gargalo crítico)
- Solo (Fertilidade)

### 2. Recursos Sociais (Intangíveis)
Gerados pela própria população e essenciais para manter a estabilidade das Facções:
- **População**: O recurso motor de tudo. Sem massa crítica, nada é extraído ou produzido.
- Cultura e Conhecimento
- Felicidade e Saúde Pública
- Religião, Política e Propaganda
- Economia (Circulação de riqueza)
- Entretenimento
- Infraestrutura de Logística: Cidades e Estradas

### 3. Recursos Artificiais (Manufaturados avançados)
Bens refinados que exigem cadeias de produção complexas (Ver `06-sistema-de-producao-e-economia.md`).
- Energia (Fóssil, Elétrica, Nuclear, Renovável)
- Máquinas e Computadores
- Armas (Ataque, Defesa)
- Veículos (Carros, Navios, Foguetes, Espaçonaves)
- Robôs e Inteligência Artificial
- Nanotecnologia e Biotecnologia
