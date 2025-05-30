#!/bin/sh

if [ "$1" = "dev" ]; then
	if [ "$2" = "audit" ]; then
		(cd ./backend/ && npm audit)
		cd ./frontend/ && npm audit
		return
	elif [ "$2" = "outdated" ]; then
		(cd ./backend/ && npm outdated)
		cd ./frontend/ && npm outdated
		return
	elif [ "$2" = "build" ]; then
		(cd ./backend/ && npm install)
		(cd ./frontend/ && npm install && npm run build)
		docker compose -f ./compose.dev.yaml build
		return
	elif [ "$2" = "up" ]; then
		docker compose -f ./compose.dev.yaml up --no-build
		return
	fi
elif [ "$1" = "prod" ]; then
	if [ "$2" = "up" ]; then
		if [ "$3" = "--watch" ]; then
			docker compose -f ./compose.prod.yaml up
			return
		fi
		docker compose -f ./compose.prod.yaml up -d
		return
	elif [ "$2" = "down" ]; then
		docker compose -f ./compose.prod.yaml down
		return
	elif [ "$2" = "update" ]; then
		sh ./run.sh prod down
		git pull
		docker compose -f ./compose.prod.yaml pull
		sh ./run.sh prod up
		return
	fi
fi
