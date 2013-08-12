# suggestion: use grunt instead of Makefile, because it's javascript and has some helpers on watching file changes
#

NODE_BIN_PATH := ./node_modules/.bin

.PHONY: all
all: get_assets compile

.PHONY: compile
compile:
	./compile.js

.PHONY: get_assets
get_assets:
	./get_assets

.PHONY: locale
locale:
	$(NODE_BIN_PATH)/handlebars-xgettext $(wildcard ./template/*) > locale/translations.po
