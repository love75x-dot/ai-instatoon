#!/usr/bin/env bash
# index.html(아티팩트 원본)에서 파일 버전 instatoon.html을 만든다.
# index.html에는 doctype/head/body 태그가 없다(아티팩트 게시 때 플랫폼이 감싸 줌).
set -e
cd "$(dirname "$0")"
{ printf '<!doctype html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n'; cat index.html; printf '\n</body>\n</html>\n'; } > instatoon.html
# 문법 검사(선택): node 필요
python3 - <<'PY'
import re
s=open('index.html').read()
open('/tmp/_instatoon_check.js','w').write('\n'.join(re.findall(r'<script>(.*?)</script>',s,re.S)))
PY
node --check /tmp/_instatoon_check.js && echo "JS 문법 OK"
