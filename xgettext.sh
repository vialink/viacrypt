#!/bin/bash
handlebars-xgettext -o locale/messages.pot -D template

#                   s/\//\\\//g
abspath=`pwd | sed 's/\//\\\\\\//g'`

sed -i.tmp "s/$abspath\///" locale/messages.pot
rm locale/messages.pot.tmp

for lang in en br; do
msgmerge locale/$lang/messages.po locale/messages.pot > locale/$lang/messages.po.new
mv locale/$lang/messages.po.new locale/$lang/messages.po
done
