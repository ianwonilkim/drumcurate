# Metadata fields

All CSV files are UTF-8 with a header row. `sample_id` is the preserved canonical component identifier from the experimental corpus. It is not a newly assigned sequential index. The original identifier was derived from PCM canonicalization; it is not the SHA-256 checksum of the distributed WAV container. Use `wav_sha256` for downloaded-file verification.

## dataset.csv

One row per canonical recording, including DPK recordings whose audio is not supplied.

| Column | Meaning |
|---|---|
| `sample_id` | Preserved canonical component ID |
| `source` | `freesound` or `dpk` |
| `source_id` | Original Freesound numeric ID, or the preserved DPK conversion identifier |
| `class` | Human-curated `kick`, `snare`, or `hat` (hi-hat) |
| `source_aliases_json` | JSON array of original source keys represented by the canonical recording |
| `audio_in_release` | `true` for supplied Freesound audio; `false` for DPK |
| `audio_path` | Path relative to the extracted release; blank for DPK |

## freesound_attribution.csv

`sample_id` joins to `dataset.csv`. `freesound_id` identifies the original sound. `is_canonical_source` identifies the representative source selected during canonicalization. There are 11,338 attribution rows for 11,336 distributed recordings because two recordings each have one additional exact-PCM alias.

`sound_name`, `creator`, `creator_url`, `sound_url`, `license_url`, `license_observed_at`, and `source_description` preserve the stored source metadata. `modifications` describes the corpus preprocessing applied to source audio. Titles and source descriptions are original-creator text; they do not replace the final human-curated class labels.

## dpk_sources.csv

`sample_id` and `class` come from the final corpus. `source_id` is the preserved converted-file identifier. `source_collection_relative_path` and `source_filename` come from the existing conversion manifest. Local computer path prefixes have been removed. `source_url` points to the original DPK record.

The relative paths describe the source collection layout recorded during conversion. They have not been independently checked against current remote archive contents. These paths and original filenames support locating recordings after obtaining the source collection. Source-folder names or converted-filename prefixes may differ from the final human-curated `class`.

## audio_files.csv

`sample_id` joins to the annotation and attribution tables. `audio_path` gives the path relative to the release root. `bytes` is the WAV container size. `wav_sha256` is the SHA-256 checksum of the complete distributed WAV file, including its header. All listed files are Freesound recordings; there are no DPK audio entries.
