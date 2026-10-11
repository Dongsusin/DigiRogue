# Hosting, Firebase and request budget

The app and all public game files use https://digirouge.co.kr on Vercel.
Firebase Authentication remains for Google login. New guest sessions are local:
they never call Firebase anonymous sign-in. Existing anonymous sessions are
signed out locally once; the guest save namespace and its contents are preserved.
Google account-specific local saves and explicit guest-to-Google import remain.

Vercel builds include public. The old external Firebase rewrite and asset
redirects are removed. Regenerate routing with
node scripts/prepare-vercel-preview.mjs (no Firebase origin argument).
The production team must support the source upload size (currently Pro).

Before dev/build, generate-resource-versions.mjs recursively hashes GLB models and the ten original AI-composed OGG tracks. Legacy Digimon recordings are removed from public assets and rebuilt output.
Saved preferences retain their original paths. Download URLs add a content hash;
production model URLs additionally select explicit .glb.br static files.
Local development uses raw GLB. The postbuild compressor verifies lossless
round trips for every model and keeps raw GLB for legacy URLs.
Explicit Brotli files carry Content-Encoding: br and model/gltf-binary.
They are separate URLs from raw GLB, not variants of one cache key.

Versioned model/music responses use a one-year immutable browser cache.
Unversioned public paths use one day; HTML uses no-cache and compiled bundles
retain fingerprinted immutable caching. A changed asset receives a new hash.
No account, auth handler or player data is added to the static cache policy.

After Vercel serves the complete game successfully, retire Firebase Hosting
asset serving with an empty-file release that redirects previous public file
paths to Vercel. Preserve reserved /__/auth/*, the Google Auth project and a
recoverable previous Hosting version. Never disable Authentication or delete
accounts/saves. Verify actual model bytes, encoded responses, music and a
Unicode path before this change; verify old-URL redirects and auth afterward.

The entry download now installs all static game files, including music, before the main screen. See game-download.md for the persistent cache, revision checks and retry flow. This initial installation is intentional network traffic; the following restrictions apply to playback requests after installation.

Music starts only after a gesture while audible, online and visible. Hiding or
muting pauses playback and cancels retries. Returning resumes the same track.
Failures back off 5, 10, 20 and 40 seconds, then stop. Duplicate errors cannot
schedule parallel timers. preload=none avoids eager full-file loading.
Pausing alone does not prove every browser cancels an ongoing transfer.

Run test:network-budget, test:hosting-budget, test:guest-budget, test:auth,
verify and build before release. The compressor checks every output model.
Actual monthly savings require later traffic measurements. Accumulated usage
does not reset. Git builds for main are disabled to avoid duplicate automatic
and manual builds; release production explicitly after validation.
