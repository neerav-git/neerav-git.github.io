# Four-Class Alzheimer MRI Classification

## Narration

Four-class Alzheimer MRI classification must separate adjacent stages whose scans can look structurally similar. This experiment turns 6,400 folder-labelled MRI images into a complete TensorFlow workflow. It inspects the scans, builds an 80-10-10 train, validation, and test pipeline, resizes images to 256 square pixels, and applies augmentation only to training data. The primary convolutional network contains six convolution-and-pooling blocks, dropout, a dense representation, and a four-class softmax output. Independently saved models are then compared through their full probability vectors, allowing uncertain judgments to be combined before the final class is chosen. In the author-confirmed companion experiment, held-out accuracy increased from 78 to 85 percent. What makes the project special is the visible experimental progression: data, tensors, architecture, individual predictions, model diversity, ensemble probabilities, and image-level error review all remain inspectable inside one reproducible notebook.

## Edit

| Time | Beat | On screen |
| --- | --- | --- |
| 0.0–9.1 s | THE RESEARCH PROBLEM | Separate four adjacent MRI severity categories |
| 9.1–31.1 s | DATA PIPELINE | 6,400 scans become repeatable training, validation, and test streams |
| 31.1–41.2 s | MODEL DESIGN | Six convolution blocks carry the image into a four-class softmax |
| 41.2–52.0 s | ENSEMBLE METHOD | Full probability vectors are averaged before the class decision |
| 52.0–59.8 s | THE RESULT | Companion experiment accuracy increased from 78% to 85% |
| 59.8–78.6 s | REPRODUCIBLE NOTEBOOK | Every stage of the experiment stays inspectable |

## Delivery

- Length: 78.6 seconds
- Voice: Kokoro af_heart, synthesized per sentence with the portfolio guide's tuning
- Cuts land on the sentence each scene illustrates
