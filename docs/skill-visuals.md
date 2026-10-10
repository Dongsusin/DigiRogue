# Technique visuals

Attack art direction is resolved by technique name in `src/three/skillEffectRecipes.js`. Native source clips, bone emitters and release markers remain in `attackProfiles.json`; damage, attributes and combat balance are unchanged.

The October 10 update adds 36 technique recipes and revises Flower Cannon and Grace Cross Freezer. The shared 3D flame envelope now has a palette-driven moving surface and tongues. A continuous, widening flame breath replaces the old cylinder and crystal-shaped fire particles. Geometry is pooled per battle; effect-local materials and completed effects are disposed.

| Technique family | Presentation |
| --- | --- |
| Gabumon Blue Blaster / Garurumon Fox Fire | Blue fire charge, projectile or continuous breath, blue trail, blue impact and feedback. Black variants sharing the same technique keep the same palette. |
| Agumon / Greymon | Orange fire with a warm core; larger explosions for Mega Flame. |
| Biyomon Spiral Twister | Pink spectral fire in a rotating three-dimensional helix. |
| Birdramon Meteor Wing / Garudamon Shadow Wing | Fan of fire projectiles / flaming bird silhouette rather than generic rocks. |
| Tentomon / Kabuterimon | Electrical discharge / green electrical orb with arcing rings. |
| Gomamon / Ikkakumon | Multi-colored marching fish / a launched horn rather than a red metal rocket. |
| Palmon / Rosemon | Thorned green vine tether and vine impact. |
| Lillymon Flower Cannon | Flower-shaped energy bomb from the existing cannon emitter, with a petal impact. |
| Renamon Diamond Storm | Fan of sharp pale diamond-shaped chips rather than green leaves. |
| MetalGarurumon | Cold breath and freezing missiles; muzzle, exhaust and impacts retain the cold palette. |
| Angel techniques | Gold/white sacred fist, arrows, halos and gates. |
| Multi-colored volleys | Each cosmetic strike and the final impact use the corresponding projectile color. |

## Canon references

- [Gabumon](https://digimon.net/reference_en/detail.php?directory_name=gabumon) and [Garurumon](https://digimon.net/reference_en/detail.php?directory_name=garurumon): named techniques and blue-flame breath.
- [Biyomon](https://digimon.net/reference_en/detail.php?directory_name=piyomon): spectral Spiral Twister.
- [Ikkakumon](https://digimon.net/reference_en/detail.php?directory_name=ikkakumon): Harpoon Torpedo launches its horn.
- [Lillymon](https://digimon.net/reference_en/detail.php?directory_name=lilimon): Flower Cannon fires an energy bomb from the joined wrist flowers.
- [Renamon](https://digimon.net/reference_en/detail.php?directory_name=renamon): Diamond Storm throws sharp chips.
- [MetalGarurumon](https://digimon.net/reference_en/detail.php?directory_name=metalgarurumon): freezing breath and missiles.

Colors and motion surfaces are procedural art interpretations of the techniques. No reference-site images or footage are copied into the game.

## Verification

`npm run test:effects` checks canonical palette/shape resolution, charge/projectile/impact materials, freezing missile exhaust, volley color matching, finite bounded geometry, effect disposal, all 781 shipped signatures across 512 Digimon, and the existing native Brave Tornado attachment regression.

Visual review uses the real BattleRenderer, shipped GLBs and the original 2D map in an isolated browser. It covers 16 representative techniques, including blue flames, electricity, fish, horn, vines, flower bomb, chips, frost, holy light, Brave Tornado and Pandemonium Flame. This is not a claim of manual visual review of all 781 signatures or of performance on every physical GPU.

Blue flames additionally pass a 24-case browser matrix across 1140×600, 844×390 and 390×844, both sides and 1×/3× speed. GPU pixel comparisons against the same scene without effects confirm blue output during flight and impact, not just blue material metadata. Shaders compile without errors and effects return to zero. The built game also passes real command-selection/cast checks for Gabumon and Garurumon in isolated saves.
