#!/bin/bash
handlebars-xgettext -o locale/translations.pot -D template

abspath=`pwd | sed 's/\//\\\//g'`
sed -i.tmp "s/$abspath\///" locale/translations.pot
rm locale/translations.pot.tmp

for lang in en br; do
msgmerge locale/$lang/translations.po locale/translations.pot > locale/$lang/translations.po.new
mv locale/$lang/translations.po.new locale/$lang/translations.po
msgfmt -o locale/$lang/translations.mo locale/$lang/translations.po
done

rm locale/translations.pot
