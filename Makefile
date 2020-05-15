PASSWORD := 

all: clean setup 

clean: ;
	rm -rf node_modules
	rm -rf serverless/node_modules

deploy: ;
	npm run build
	twilio serverless:deploy

update: ;
	git pull --rebase origin master
	npm install
	npm install -C ./serverless

install:
	npm install twilio-cli -g
	twilio plugins:install @twilio-labs/plugin-serverless
	npm install
	npm install -C ./serverless

dev:
	@cd serverless; twilio serverless:start --ngrok="$$NGROK_HOST" &
	npm start

config:
	cp ./public/appConfig.example.js ./public/appConfig.js
	cp ./serverless/.env.sample ./serverless/.env

	@echo "Please enter your account sid (eg: ACxxxxxxxxxxxxxxx)"; read account_sid; \
	sed -i '' 's/ACxxx/'"$$account_sid"'/g' ./serverless/.env

	@echo "\nPlease enter your auth token (found at: https://www.twilio.com/console)"; read auth_token; \
	sed -i '' 's/auth_token/'"$$auth_token"'/g' ./serverless/.env

	@echo "\nPlease enter your workspace sid (eg: WSxxxxxxxxxxxxx found here: https://www.twilio.com/console/taskrouter/dashboard)"; read workspace_sid; \
	sed -i '' 's/WSxxx/'"$$workspace_sid"'/g' ./serverless/.env; \
	echo "\nPlease enter your workflow sid (eg: WWxxxxxxxxxxxxx within your workspace here https://www.twilio.com/console/taskrouter/workspaces/$$workspace_sid/workflows)"; read workflow_sid; \
	sed -i '' 's/WWxxx/'"$$workflow_sid"'/g' ./serverless/.env

	@echo "\nPlease enter your sync service sid (eg: ISxxxxxxx found at: https://www.twilio.com/console/sync/services)"; read sync_sid; \
	sed -i '' 's/ISxxx/'"$$sync_sid"'/g' ./serverless/.env

	@echo "\nPlease enter your functions hostname (or ngrok URL for localhost)"; read host; \
	sed -i '' 's/serverless_host/'"$$host"'/g' ./serverless/.env

	@echo "\nPlease enter your desired from number (E164 format eg +14445556666)"; read from_number; \
	sed -i '' 's/from_number/'"$$from_number"'/g' ./serverless/.env

	@echo "\n\nNote: update public/appConfig.js if you'd like to authenticate via SSO locally\n"

setup: clean install config

.PHONY: clean update install setup config
