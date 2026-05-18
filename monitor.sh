#!/bin/bash

# Cores para o terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

while true; do
    clear
    
    # Verifica status via PID
    SERVER_STATUS="${RED}[OFF]${NC}"
    VITE_INFO=""
    
    if [ -f "client/.vite.pid" ]; then
        PID=$(cat client/.vite.pid)
        if kill -0 $PID 2>/dev/null; then
            SERVER_STATUS="${GREEN}[ON]${NC}"
            # Extrai o link de acesso local do log, se existir
            if [ -f "client/vite.log" ]; then
                # Vite costuma escrever "Local: http://localhost:5173/"
                URL=$(grep -o 'http://[a-zA-Z0-9.:]*' client/vite.log | head -n 1)
                if [ ! -z "$URL" ]; then
                    VITE_INFO="-> Acesso: ${GREEN}${URL}${NC}"
                else
                    VITE_INFO="-> Iniciando... (verifique os logs na opção 5)"
                fi
            fi
        else
            # PID existe mas o processo morreu (crash)
            rm -f client/.vite.pid
        fi
    fi

    echo -e "${BLUE}=========================================${NC}"
    echo -e "${GREEN}      ORQUESTRADOR: CRIADOR - MONITOR    ${NC}"
    echo -e "${BLUE}=========================================${NC}"
    echo "Selecione uma opção:"
    echo -e "1) Ligar/Desligar Jogo Local (${GREEN}http://localhost:5173${NC}) - Status: $SERVER_STATUS $VITE_INFO"
    echo "2) Rodar Testes Unitários - Cliente (Engine/UI)"
    echo "3) Rodar Testes Unitários - Backend (Multiverso)"
    echo "4) Instalar/Atualizar Dependências (Client & Backend)"
    echo "5) Ver Logs do Jogo Local (Monitorar Erros)"
    echo "0) Sair"
    echo -e "${BLUE}=========================================${NC}"
    
    read -p "Opção: " choice

    case $choice in
        1)
            if [ -f "client/.vite.pid" ] && kill -0 $(cat client/.vite.pid) 2>/dev/null; then
                echo -e "${YELLOW}Desligando o servidor Vite...${NC}"
                kill $(cat client/.vite.pid)
                rm -f client/.vite.pid
                sleep 1
            else
                echo -e "${YELLOW}Ligando o servidor do Jogo...${NC}"
                cd client
                # Limpa o log antigo
                > vite.log
                # Inicia e salva o PID com precisão
                nohup npm run dev > vite.log 2>&1 &
                echo $! > .vite.pid
                cd ..
                
                # Aguarda 2 segundos para dar tempo do Vite imprimir o IP no log
                echo -e "Aguardando o Vite inicializar..."
                sleep 2
            fi
            ;;
        2)
            echo -e "${YELLOW}Executando testes da Engine (Client)...${NC}"
            cd client && npm run test -- --run
            cd ..
            read -p "Pressione [Enter] para continuar..."
            ;;
        3)
            echo -e "${YELLOW}Executando testes do Multiverso (Backend)...${NC}"
            cd backend && npm run test -- --run
            cd ..
            read -p "Pressione [Enter] para continuar..."
            ;;
        4)
            echo -e "${YELLOW}Instalando dependências...${NC}"
            echo "-> Instalando no Client..."
            cd client && npm install
            echo "-> Instalando no Backend..."
            cd ../backend && npm install
            cd ..
            echo -e "${GREEN}Concluído!${NC}"
            read -p "Pressione [Enter] para continuar..."
            ;;
        5)
            if [ -f "client/vite.log" ]; then
                echo -e "${YELLOW}Exibindo logs (Pressione Ctrl+C para sair dos logs e voltar ao menu)...${NC}"
                tail -f client/vite.log
            else
                echo -e "${RED}O arquivo de log ainda não existe. Inicie o jogo primeiro.${NC}"
                sleep 2
            fi
            ;;
        0)
            echo -e "${GREEN}Encerrando monitor...${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Opção inválida!${NC}"
            sleep 1
            ;;
    esac
done
