.PHONY: bot bot-stop bot-logs

bot:
	node scripts/setup-bot-env.mjs
	docker compose up --build bot

bot-stop:
	docker compose down

bot-logs:
	docker compose logs -f bot
