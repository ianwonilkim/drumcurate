# DrumCurate

A producer-curated dataset of **13,209 kick, snare, and hi-hat one-shots**, used in *Cross-Request Supervision for Source-Conditioned Drum Sound Variation*.

[**Download the dataset (ZIP, approximately 306 MB)**](https://github.com/ianwonilkim/drumcurate/releases/download/v1.0/drumcurate-v1.0.zip) · [Checksums](https://github.com/ianwonilkim/drumcurate/releases/download/v1.0/SHA256SUMS)

The interactive demo will be added later.

## Data

The data archive, `drumcurate-v1.0.zip`, includes **11,336 Freesound WAV files**, plus class labels and original identifiers for **all 13,209 recordings**. For the remaining **1,873 DPK recordings**, obtain audio from [Drum and Percussion Kits](https://zenodo.org/records/3994999); only our labels and source mappings are included here.

| Class | Recordings |
|---|---:|
| Kick | 4,000 |
| Snare | 6,580 |
| Hi-hat | 2,629 |

Two music producers selected and labelled the recordings; a third resolved disputed items. The corpus contains single-class drum hits suitable for music production. Loops, multiple hits, mixed classes, and unusable audio were excluded, and exact PCM duplicates were merged.

Audio is **mono, 44.1 kHz, 1 second, PCM16**. Multichannel sources were averaged; preprocessing used a −50 dB tail threshold, 20 ms smoothing, 50 ms margin/fade, and peak normalization to 0.89. The archive preserves the experimental WAV files without re-encoding.

Extract the archive, then use `sample_id` to join the CSV files. `audio_path` is relative to the extracted folder. Filter `audio_in_release=true` when using only the included WAV files.

- [Dataset labels](metadata/dataset.csv)
- [Freesound attribution](metadata/freesound_attribution.csv)
- [DPK source mappings](metadata/dpk_sources.csv)
- [WAV checksums](metadata/audio_files.csv) · [Column definitions](metadata/DATA_DICTIONARY.md)

## Licences

Freesound audio retains its per-file **CC0 1.0** or **CC BY 4.0** licence. Keep the provided attribution, licence links, and modification notices. DPK audio is not redistributed. Our class annotations and documentation are licensed under **CC BY 4.0**. See [LICENSES.md](LICENSES.md).

## Citation

Wonil Kim, Jongsoo Kim, Taejun Kim, and Juhan Nam. *Cross-Request Supervision for Source-Conditioned Drum Sound Variation*. Manuscript, 2026. The publication link and final bibliographic details will be added when available.
