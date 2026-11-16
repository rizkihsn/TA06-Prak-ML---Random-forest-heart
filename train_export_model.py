"""
Melatih ulang model Random Forest terbaik TA-06 dan mengekspornya ke JavaScript
agar website dapat memprediksi langsung di browser (tanpa server Python).

Konfigurasi sama dengan notebook: n_estimators=50, max_depth=10, random_state=42.
Jalankan dari folder proyek:  python train_export_model.py
"""
import json
import os

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

RANDOM_STATE = 42
N_TREES, MAX_DEPTH = 50, 10
HERE = os.path.dirname(os.path.abspath(__file__))
OUT_JS = os.path.join(HERE, "web", "model.js")
TEST_DUMP = os.environ.get("TEST_DUMP")  # opsional: simpan data uji paritas JS vs sklearn

df = pd.read_csv(os.path.join(HERE, "data", "heart.csv"))
kategorik = df.select_dtypes(exclude="number").columns.tolist()

X = pd.get_dummies(df.drop(columns="HeartDisease"), columns=kategorik, dtype=int)
y = df["HeartDisease"]
for kol in ["Cholesterol", "RestingBP"]:
    X[kol] = X[kol].replace(0, np.nan)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
)
median = X_train[["Cholesterol", "RestingBP"]].median()
X_train = X_train.fillna(median)
X_test = X_test.fillna(median)

model = RandomForestClassifier(n_estimators=N_TREES, max_depth=MAX_DEPTH,
                               random_state=RANDOM_STATE, n_jobs=-1)
model.fit(X_train, y_train)
acc = accuracy_score(y_test, model.predict(X_test))
print("Akurasi testing:", round(acc, 4))
assert abs(acc - 0.8913) < 1e-3, "Model tidak sama dengan notebook"

# ---- ekspor pohon ----
trees = []
for est in model.estimators_:
    t = est.tree_
    leaf = t.children_left == -1
    val = t.value[:, 0, :]
    p1 = val[:, 1] / val.sum(axis=1)
    trees.append({
        "f": np.where(leaf, -1, t.feature).astype(int).tolist(),
        "t": [0 if lf else float(th) for lf, th in zip(leaf, t.threshold)],
        "l": t.children_left.astype(int).tolist(),
        "r": t.children_right.astype(int).tolist(),
        "v": [round(float(v), 6) for v in p1],
    })

# ---- referensi untuk analisis "faktor berpengaruh" ----
num_cols = ["Age", "RestingBP", "Cholesterol", "MaxHR", "Oldpeak"]
df_tr = df.loc[X_train.index]
reference = {c: float(X_train[c].median()) for c in num_cols}
reference["FastingBS"] = int(df_tr["FastingBS"].mode()[0])
for c in kategorik:
    reference[c] = str(df_tr[c].mode()[0])

ranges = {
    "Age": [int(df.Age.min()), int(df.Age.max())],
    "RestingBP": [int(df[df.RestingBP > 0].RestingBP.min()), int(df.RestingBP.max())],
    "Cholesterol": [int(df[df.Cholesterol > 0].Cholesterol.min()), int(df.Cholesterol.max())],
    "MaxHR": [int(df.MaxHR.min()), int(df.MaxHR.max())],
    "Oldpeak": [float(df.Oldpeak.min()), float(df.Oldpeak.max())],
}

res = json.load(open(os.path.join(HERE, "results.json"), encoding="utf-8"))
rep = res["report"]
meta = {
    "nTrees": N_TREES,
    "maxDepth": MAX_DEPTH,
    "rows": int(len(df)),
    "nTrain": int(len(X_train)),
    "nTest": int(len(X_test)),
    "accuracy": rep["accuracy"],
    "precision1": rep["Penyakit Jantung (1)"]["precision"],
    "recall1": rep["Penyakit Jantung (1)"]["recall"],
    "f11": rep["Penyakit Jantung (1)"]["f1-score"],
    "f10": rep["Normal (0)"]["f1-score"],
    "oob": res["oob"],
    "cv": res["cv_puncak_b"],
    "confusion": res["cm"],
    "importance": res["grup"],
}

payload = {
    "meta": meta,
    "features": X_train.columns.tolist(),
    "categorical": kategorik,
    "reference": reference,
    "ranges": ranges,
    "trees": trees,
}
os.makedirs(os.path.dirname(OUT_JS), exist_ok=True)
with open(OUT_JS, "w", encoding="utf-8") as f:
    f.write("/* Dibuat otomatis oleh train_export_model.py. Jangan diedit manual. */\n")
    f.write("var RF_MODEL = " + json.dumps(payload, separators=(",", ":")) + ";\n")
    f.write("(typeof window !== 'undefined' ? window : globalThis).RF_MODEL = RF_MODEL;\n")
    f.write("if (typeof module !== 'undefined') module.exports = RF_MODEL;\n")
print("Ditulis:", OUT_JS, round(os.path.getsize(OUT_JS) / 1024, 1), "KB")
print("Fitur:", payload["features"])
print("Referensi:", reference)

if TEST_DUMP:
    X_all = pd.concat([X_train, X_test]).sort_index()
    json.dump({"X": X_all.astype(float).values.tolist(),
               "p1": model.predict_proba(X_all)[:, 1].tolist(),
               "pred": model.predict(X_all).tolist()}, open(TEST_DUMP, "w"))
    print("Dump uji paritas:", TEST_DUMP, "baris:", len(X_all))
