#!/bin/bash

fail() {
	echo "Failed on $@."
	exit 1
}

handlebars-xgettext -o locale/messages.pot -D template > /dev/null || fail handlebars-xgettext

#                   s/\//\\\//g
abspath=`pwd | sed 's/\//\\\\\\//g'`

sed -i.tmp "s/$abspath\///" locale/messages.pot
rm locale/messages.pot.tmp

for lang in en br; do
	msgmerge -q locale/$lang/messages.po locale/messages.pot > locale/$lang/messages.po.new || fail msgmerge
	mv locale/$lang/messages.po.new locale/$lang/messages.po
	po2json locale/$lang/messages.po locale/$lang/messages.json || fail po2json
done

echo 'Done!'
