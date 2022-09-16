#!/bin/sh

if [ "$1" = "dev" ]; then
	if [ "$2" = "build" ]; then
		(cd ./backend/ && npm install)
		(cd ./frontend/ && npm install)
		sudo docker compose -f ./compose.dev.yaml build
		return
	elif [ "$2" = "up" ]; then
		sudo docker compose -f ./compose.dev.yaml up --no-build
		return
	elif [ "$2" = "down" ]; then
		sudo docker compose -f ./compose.dev.yaml down --rmi all -v
		return
	fi
elif [ "$1" = "prod" ]; then
	if [ "$2" = "up" ]; then
		sudo docker compose -f ./compose.prod.yaml up -d
		return
	elif [ "$2" = "down" ]; then
		sudo docker compose -f ./compose.prod.yaml down
		return
	elif [ "$2" = "update" ]; then
		sh ./run.sh prod down
		git pull
		sudo docker compose -f ./compose.prod.yaml pull
		sh ./run.sh prod up
		return
	fi
fi
