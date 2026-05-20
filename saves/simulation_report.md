# Relatório: Simulação Histórica 0 a.C. → 2026 d.C.

**Duração da simulação:** 301.9s
**Fator de escala:** 1 unidade = 10.000 pessoas

## Comparação com Dados Reais

| Ano | Pop Simulada | Pop Real | Ratio | Era |
|-----|-------------|----------|-------|-----|
| 0 | 306.0M | 300.0M | 102.0% | - |
| 500 | 7.05B | 310.0M | 2272.9% | - |
| 1000 | 6.74B | 310.0M | 2173.1% | - |
| 1500 | 7.12B | 500.0M | 1424.5% | - |
| 1800 | 7.02B | 1.00B | 702.1% | - |
| 1900 | 7.11B | 1.60B | 444.2% | - |
| 1950 | 6.79B | 2.50B | 271.7% | - |
| 2000 | 6.91B | 6.10B | 113.2% | - |
| 2026 | 7.04B | 8.20B | 85.9% | - |

## Estado Final

- **Era:** Era Espacial
- **Techs:** 56
- **K-Penalty:** 1.0000
- **Trust:** 24

## Saves Editáveis

Os seguintes checkpoints JSON estão disponíveis em `saves/`:

- `checkpoint_year_0.json`
- `checkpoint_year_1499.json`
- `checkpoint_year_1500.json`
- `checkpoint_year_1999.json`
- `checkpoint_year_2000.json`
- `checkpoint_year_2025.json`
- `checkpoint_year_2026.json`
- `checkpoint_year_499.json`
- `checkpoint_year_999.json`
- `quick_test_year_508.json`

## Como Editar um Save

1. Abra o JSON (ex: `saves/checkpoint_year_500.json`)
2. Modifique parâmetros (pop, techs, inventário)
3. Use `SaveSystem.load(json, engine)` para recarregar
