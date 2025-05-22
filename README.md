# Company Name Deduplication Tool

This tool finds and groups duplicate or near-duplicate company names from a text file using token-based Jaccard similarity and a fast blocking approach.

---

## 📦 Installation

```bash
npm install
```

---

## 🚀 Usage

```bash
npm start
```

This runs the script on the default `companies.txt` file.

You can also pass a custom file path:

```bash
npm start ./data/your-file.txt
```

---

## ✅ Running Tests

```bash
npm test
```

Tests include:

* Name normalization
* Duplicate group detection
* Handling noise words and edge cases

---

## 📂 Input Format

Plain text file with one company name per line, for example:

```
Ubisoft
Ubisoft Montreal
Ubisoft Canada
Sony Interactive Entertainment
Sony
Sony Ltd
```

---

## ⚙️ How It Works

* Normalizes names:

  * lowercases
  * removes accents and punctuation
  * filters out generic “noise” words like `inc`, `studio`, `group`, etc.
* Tokenizes names into word sets
* Uses **Jaccard similarity** (default threshold: `0.5`) to detect overlap
* Speeds up comparisons using **blocking** based on tokens

---

## 📄 Output Example

The script prints groups of potential duplicates like this:

```
Group 1:
  - Ubisoft
  - Ubisoft Inc.
  - Ubisoft Studios

Group 2:
  - Sony
  - Sony Ltd
```

---

## 🧪 Tech Stack

* **Node.js**
* **TypeScript**
* **Jest** (for unit testing)

---

## 👨‍💻 Notes

* The tool is designed for large datasets (100,000+ names).
* Accuracy can be tuned via the `threshold` parameter.
* You can extend the noise word list in `NOISE_WORDS` for better results.
