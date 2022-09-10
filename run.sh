#!/bin/sh

if [ "$1" = "dev" ]; then
	if [ "$2" = "build" ]; then
		(cd ./backend/ && npm install)
		(cd ./frontend/ && npm install)
		sudo docker compose -f ./docker-compose.dev.yaml build
		return
	elif [ "$2" = "up" ]; then
		sudo docker compose -f ./docker-compose.dev.yaml up --no-build
		return
	elif [ "$2" = "down" ]; then
		sudo docker compose -f ./docker-compose.dev.yaml down --rmi all -v
		return
	fi
elif [ "$1" = "prod" ]; then
	if [ "$2" = "build" ]; then
		sudo docker compose -f ./docker-compose.prod.yaml build
		return
	elif [ "$2" = "up" ]; then
		sudo docker compose -f ./docker-compose.prod.yaml up --no-build -d
		return
	elif [ "$2" = "down" ]; then
		if [ "$3" = "out" ]; then
			sudo docker compose -f ./docker-compose.prod.yaml down --rmi all
			sudo docker volume rm expanse_build
			return
		fi
		sudo docker compose -f ./docker-compose.prod.yaml down
		return
	elif [ "$2" = "update" ]; then
		sh ./run.sh prod down out
		git pull
		sh ./run.sh prod build
		sh ./run.sh prod up
		return
	fi
fi
