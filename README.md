# Cross-Request Supervision for Source-Conditioned Drum Sound Variation

Wonil Kim · Jongsoo Kim · Taejun Kim · Juhan Nam

Research overview, results, and the **DrumCurate** dataset for **Cross-Request CVAE**, a model that generates requested timbral variations from a single-hit drum sample.

[**Download the dataset (ZIP, approximately 306 MB)**](https://github.com/ianwonilkim/drumcurate/releases/download/v1.0/drumcurate-v1.0.zip) · [Checksums](https://github.com/ianwonilkim/drumcurate/releases/download/v1.0/SHA256SUMS)

Links to the paper and public interactive demo will be added here.

## Overview

We generate requested timbral variations from a selected drum sound, such as making the same snare brighter or warmer.
Cross-Request CVAE conditions generation on the source and the requested attribute, direction, and magnitude.
It combines a conditional variational autoencoder (CVAE) with two training methods that learn relations among timbral attributes that change together.

- **Attribute-contrast target sampling** selects real target recordings near the source with contrasting attribute changes.
- **Cross-request supervision** matches differences between predicted changes in all seven attributes across requests for different attributes of the same source to differences in real target changes.

At inference, the model generates a latent residual once and decodes it into a waveform, without iterative optimization.

## Interactive demo

The demo runs Cross-Request CVAE on **15 selected examples: five each of Kick, Snare, and Hi-hat**.

Supported attributes:

`brightness` · `depth` · `hardness` · `roughness` · `warmth` · `sharpness` · `boominess`

1. Select a source, an attribute, and an increase or decrease direction.
2. Click **Generate** to run the model for the request.
3. Listen to the results at **0%, 25%, 50%, 75%, and 100% latent interpolation**.

Compare the original recording with the outputs and download individual results as WAV files.
The display shows the target value and the selected AudioCommons descriptor measured directly on each generated waveform.

The demo uses a request scale of **1.0 IQR**, based on the class- and attribute-specific interquartile range.
The interpolation endpoints are the source codec reconstruction at 0% and the generated output at 100%.

## Main results

The objective evaluation used **600 TEST sources**, increase and decrease requests for seven attributes, and request scales of **0.5, 1.0, and 1.5 IQR**.
**Eleven professional music producers** participated in the listening evaluation.

- **Requested-attribute error:** Cross-Request CVAE achieved lower overall mean absolute error (MAE) than Latent optimization (LO), Regularized latent optimization (RLO), Fader-RAVE (F-RAVE), and Conditional RAVE (C-RAVE) at all three request scales.
- **Effect of Cross-request supervision:** Adding Cross to Base + Selected reduced MAE averaged over the three request scales from **5.440 to 4.854 (10.8%)**. In the listening evaluation, perceived timbral diversity increased from **1.68 to 3.45 on a five-point scale**.
- **Generation time:** In a common benchmark, generation took **89.4 ms per request**, approximately **1/54 of the time required by LO/RLO**.

Base + Selected is the CVAE trained with the Selected-attribute loss in addition to reconstruction and KL objectives.
Generation time was measured on an RTX A6000 in FP32 with batch size 1, 1 s inputs, and a request scale of 1.0 IQR.
It excludes model loading, disk I/O, and descriptor extraction.
The paper reports the full evaluation settings and results.

## DrumCurate dataset

DrumCurate contains **13,209 drum one-shots curated and labelled by professional music producers**.

| Class | Recordings |
|---|---:|
| Kick | 4,000 |
| Snare | 6,580 |
| Hi-hat | 2,629 |
| **Total** | **13,209** |

Two producers selected and labelled the recordings, and a third resolved disputed items.
The corpus contains single-class drum one-shots.
Loops, multiple hits, mixed classes, and unusable audio were excluded, and exact PCM duplicates were merged.

The release includes:

- **11,336 Freesound WAV files**.
- **Class labels and original identifiers for all 13,209 recordings**.
- Source, licence, and attribution metadata.

For the remaining **1,873 Drum and Percussion Kits (DPK) recordings**, only labels and source mappings are included.
Obtain the corresponding audio from the [original distribution](https://zenodo.org/records/3994999).

Released audio is **mono, 44.1 kHz, 1 s, PCM16 WAV**.

[**Download the dataset (ZIP, approximately 306 MB)**](https://github.com/ianwonilkim/drumcurate/releases/download/v1.0/drumcurate-v1.0.zip) · [Checksums](https://github.com/ianwonilkim/drumcurate/releases/download/v1.0/SHA256SUMS)

Extract the archive, then use `sample_id` to join the CSV files.
`audio_path` is relative to the extracted folder.
Filter `audio_in_release=true` when using only the included WAV files.

[Dataset labels](metadata/dataset.csv) · [Freesound attribution](metadata/freesound_attribution.csv) · [DPK source mappings](metadata/dpk_sources.csv) · [WAV checksums](metadata/audio_files.csv) · [Column definitions](metadata/DATA_DICTIONARY.md)

## Licences

Freesound audio retains its per-file **CC0 1.0** or **CC BY 4.0** licence.
Keep the provided attribution, licence links, and modification notices.
DPK audio is not redistributed here.
Our class annotations and documentation are licensed under **CC BY 4.0**.
See [LICENSES.md](LICENSES.md).

## Citation

If you use this research or dataset, please cite:

> Wonil Kim, Jongsoo Kim, Taejun Kim, and Juhan Nam.
> *Cross-Request Supervision for Source-Conditioned Drum Sound Variation.*
> Manuscript, 2026.

The publication link and final bibliographic details will be added when available.
