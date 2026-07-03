#!/usr/bin/env bash
# 构建产物路由断言：每个任务把新增路由加进 EXPECTED，先跑红再实现。
set -euo pipefail
EXPECTED=(
  index.html
  blog/index.html
  zh/blog/index.html
  blog/hello-astro/index.html
  blog/di-yi-pian/index.html
  rss.xml
  projects/index.html
  zh/projects/index.html
  projects/contract-review/index.html
  projects/lighter/index.html
  zh/projects/contract-review/index.html
  zh/projects/lighter/index.html
  zh/index.html
  now/index.html
  zh/now/index.html
  about/index.html
  zh/about/index.html
  404.html
  resume.pdf
  sitemap-index.xml
  robots.txt
  favicon.svg
)
missing=0
for f in "${EXPECTED[@]}"; do
  if [ ! -f "dist/$f" ]; then echo "MISSING dist/$f"; missing=1; fi
done
[ "$missing" -eq 0 ] && echo "OK: ${#EXPECTED[@]} routes present"
if [ -d dist/dev ]; then echo "dev pages leaked into production build"; exit 1; fi
if [ -d dist/zh/blog ] && find dist/zh/blog -mindepth 2 -name index.html | grep -q .; then
  echo "zh blog mirror pages leaked into build (blog must be single-canonical-URL)"
  exit 1
fi
exit "$missing"
