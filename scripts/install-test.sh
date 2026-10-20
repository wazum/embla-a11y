#!/usr/bin/env bash
# Installs the packed package into a fresh project, as a user would, once per Embla version.
set -euo pipefail

root="$(pwd)"
typescript="$(node -p "require('./package.json').devDependencies.typescript")"
embla9="$(node -p "require('./package.json').devDependencies['embla-carousel']")"
embla8="$(node -p "require('./v8/package.json').dependencies['embla-carousel']")"

npm run build
tarball="$root/$(npm pack --silent --ignore-scripts)"
trap 'rm -f "$tarball"' EXIT

for embla in "$embla9" "$embla8"; do
  project="$(mktemp -d)"
  cd "$project"
  npm init -y > /dev/null
  npm pkg set type=module
  npm install --no-audit --no-fund --silent "$tarball" "embla-carousel@$embla" "typescript@$typescript"

  cat > consumer.ts << 'EOF'
import EmblaCarousel from 'embla-carousel'
import emblaA11y, {
  type AnnouncementType,
  type DotLabelType,
  type EmblaA11yOptionsType,
  type RotationLabelType
} from 'embla-a11y'

const announcement: AnnouncementType = (first, last, total) => `${first} to ${last} of ${total}`
const dotLabel: DotLabelType = (first) => `Slide ${first}`
const rotationLabel: RotationLabelType = (playing) => (playing ? 'Stop' : 'Start')
const options: EmblaA11yOptionsType = {
  label: 'Products',
  announcement,
  dotLabel,
  rotationLabel,
  dotKeys: true,
  warnings: false
}

EmblaCarousel(document.createElement('div'), {}, [emblaA11y(options)])
EOF
  npx tsc --noEmit --strict --module nodenext --moduleResolution nodenext --lib es2023,dom consumer.ts
  node --input-type=module -e "
    const { default: emblaA11y } = await import('embla-a11y')
    if (typeof emblaA11y !== 'function') throw new Error('embla-a11y has no default export')
  "
  echo "embla-a11y installs and type-checks with embla-carousel@$embla"
  cd "$root"
  rm -rf "$project"
done
