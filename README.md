# TA-06 · Prediksi Penyakit Jantung dengan Random Forest

> **Tugas Akhir Modul 6 — Praktikum Pembelajaran Mesin**  
> Teknik Informatika, Universitas Bale Bandung  
> **Rizki Hasan Fauzi · NIM 301240071 · Kelas 5B**

---

## 🫀 Deskripsi Proyek

Proyek ini membangun model **Random Forest** untuk memprediksi kemungkinan penyakit jantung berdasarkan data klinis pasien. Model dilatih dengan **scikit-learn**, kemudian diekspor ke JavaScript sehingga prediksi dapat berjalan langsung di browser — tanpa server Python, tanpa data yang dikirim ke luar.

**Akurasi model: 89,13%** pada data uji (184 pasien).

### Demo Website

Buka file `web/index.html` langsung di browser, atau jalankan server lokal:

```bash
cd web
python -m http.server 8000
# buka http://localhost:8000
```

---

## 📁 Struktur Proyek

```
TA06_Website_301240071_RizkiHasanFauzi/
│
├── data/
│   └── heart.csv                        # Dataset Heart Failure Prediction (Kaggle)
│
├── web/                                 # Website statis (bisa dibuka tanpa server)
│   ├── index.html                       # Halaman utama
│   ├── style.css                        # Tampilan tema kertas EKG
│   ├── app.js                           # Logika antarmuka & formulir
│   ├── rf.js                            # Mesin inferensi Random Forest (JS)
│   ├── model.js                         # Model hasil ekspor (auto-generated)
│   └── README.md                        # Panduan deploy website
│
├── TA06_RandomForest_HeartFailure.ipynb # Notebook eksplorasi & pelatihan model
├── train_export_model.py                # Script melatih ulang & ekspor ke model.js
├── results.json                         # Metrik model dari notebook (diperlukan script)
├── .gitignore
└── README.md                            # File ini
```

---

## 📊 Dataset

**Heart Failure Prediction Dataset** — [fedesoriano, Kaggle](https://www.kaggle.com/datasets/fedesoriano/heart-failure-prediction)

- **918 pasien**, 11 fitur klinis
- Variabel target: `HeartDisease` (0 = Normal, 1 = Penyakit Jantung)
- 172 nilai kolesterol = 0 diperlakukan sebagai data hilang → diganti median data latih

| Fitur | Keterangan |
|-------|-----------|
| Age | Usia pasien (tahun) |
| Sex | Jenis kelamin (M/F) |
| ChestPainType | Jenis nyeri dada (ASY/ATA/NAP/TA) |
| RestingBP | Tekanan darah sistolik saat istirahat (mmHg) |
| Cholesterol | Kolesterol serum (mg/dl) |
| FastingBS | Gula darah puasa > 120 mg/dl (0/1) |
| RestingECG | Hasil EKG saat istirahat (Normal/ST/LVH) |
| MaxHR | Detak jantung maksimum saat olahraga (bpm) |
| ExerciseAngina | Nyeri dada saat olahraga (Y/N) |
| Oldpeak | Depresi segmen ST (mm) |
| ST_Slope | Arah segmen ST (Up/Flat/Down) |

---

## 🤖 Model

**Random Forest Classifier** dengan konfigurasi terbaik:

| Parameter | Nilai |
|-----------|-------|
| `n_estimators` | 50 pohon |
| `max_depth` | 10 |
| `random_state` | 42 |
| Pembagian data | 80% latih / 20% uji (stratified) |

### Hasil Evaluasi

| Metrik | Nilai |
|--------|-------|
| Akurasi Testing | **89,13%** |
| Presisi (Penyakit Jantung) | 89,42% |
| Recall (Penyakit Jantung) | 91,18% |
| F1-Score (Penyakit Jantung) | 90,29% |
| Akurasi OOB | 84,74% |
| Akurasi CV 5-Fold | 86,65% |

### Confusion Matrix (data uji, 184 pasien)

|  | Diprediksi Normal | Diprediksi Sakit |
|--|:-:|:-:|
| **Sebenarnya Normal** | 71 ✅ | 11 ❌ |
| **Sebenarnya Sakit** | 9 ❌ | 93 ✅ |

### Fitur Terpenting

| Fitur | Importance |
|-------|-----------|
| ST_Slope | 28,86% |
| ChestPainType | 12,28% |
| ExerciseAngina | 11,04% |
| Oldpeak | 8,97% |
| MaxHR | 8,46% |

---

## 🚀 Cara Menjalankan

### 1. Buka Website Langsung
Cukup buka `web/index.html` di browser — tidak perlu instalasi apapun.

### 2. Melatih Ulang Model
Pastikan Python & dependensi sudah terinstall di virtual environment:

```bash
# Aktifkan venv (Windows)
.venv\Scripts\activate

# Install dependensi (jika belum)
pip install numpy pandas scikit-learn

# Jalankan script
python train_export_model.py
```

Output yang diharapkan:
```
Akurasi testing: 0.8913
Ditulis: web\model.js  192.7 KB
```

### 3. Eksplorasi Notebook
Buka `TA06_RandomForest_HeartFailure.ipynb` di Jupyter Notebook atau VS Code untuk melihat seluruh proses eksplorasi data, pemilihan hyperparameter, dan evaluasi model.

---

## 🌐 Deploy Website

Website ini **100% statis** — tidak butuh server backend.

**GitHub Pages:**
1. Push seluruh isi folder `web/` ke repository
2. Settings → Pages → Source: Deploy from branch `main` → folder `/ (root)` atau `/web`
3. Tunggu beberapa menit → website online

**Netlify:**  
Seret folder `web/` ke [app.netlify.com/drop](https://app.netlify.com/drop)

---

## ⚠️ Disclaimer

> Ini adalah **alat belajar**, bukan alat diagnosis medis. Hasil prediksi berasal dari model statistik pada 918 pasien dan tidak menggantikan pemeriksaan tenaga kesehatan profesional.

---

## 📝 Lisensi & Referensi

- Dataset: [Heart Failure Prediction Dataset](https://www.kaggle.com/datasets/fedesoriano/heart-failure-prediction) oleh fedesoriano (CC BY 4.0)
- Model: scikit-learn RandomForestClassifier
- Universitas Bale Bandung — Praktikum Pembelajaran Mesin 2024/2025
