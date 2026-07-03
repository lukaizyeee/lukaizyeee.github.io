#!/usr/bin/env bash
# 构建产物路由断言：每个任务把新增路由加进 EXPECTED，先跑红再实现。
set -euo pipefail
EXPECTED=(
  index.html
  dev/components/index.html
  blog/index.html
  zh/blog/index.html
  blog/hello-astro/index.html
  blog/di-yi-pian/index.html
  rss.xml
)
missing=0
for f in "${EXPECTED[@]}"; do
  if [ ! -f "dist/$f" ]; then echo "MISSING dist/$f"; missing=1; fi
done
[ "$missing" -eq 0 ] && echo "OK: ${#EXPECTED[@]} routes present"
exit "$missing"
