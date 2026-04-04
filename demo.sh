#!/bin/bash

RUNS=3
INTERVAL=15

echo ""
echo "================================================"
echo "  AGENTWALL DEMO — running $RUNS times"
echo "  ${INTERVAL}s interval between each run"
echo "================================================"

for i in $(seq 1 $RUNS); do
  echo ""
  echo "▶  Run $i / $RUNS  — $(date '+%H:%M:%S')"
  echo "------------------------------------------------"
  npm run dev:agent:multi
  if [ $i -lt $RUNS ]; then
    echo ""
    echo "⏳  Waiting ${INTERVAL}s before next run..."
    sleep $INTERVAL
  fi
done

echo ""
echo "✅  All $RUNS runs complete."
