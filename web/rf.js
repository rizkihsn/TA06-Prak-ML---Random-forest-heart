/*
 * Inferensi Random Forest di browser.
 * Setiap pohon disimpan sebagai array: f (indeks fitur, -1 = daun), t (ambang), l/r (anak kiri/kanan), v (skor kelas 1 di daun).
 * Skor akhir = rata-rata skor semua pohon, sama seperti predict_proba milik scikit-learn.
 */
(function (root) {
  "use strict";

  var NUMERIC = ["Age", "RestingBP", "Cholesterol", "MaxHR", "Oldpeak"];
  var VARIABLES = ["Age", "Sex", "ChestPainType", "RestingBP", "Cholesterol", "FastingBS",
    "RestingECG", "MaxHR", "ExerciseAngina", "Oldpeak", "ST_Slope"];

  function treeScore(tree, x) {
    var n = 0;
    while (tree.f[n] >= 0) {
      // scikit-learn membandingkan nilai float32 dengan ambang float64
      n = Math.fround(x[tree.f[n]]) <= tree.t[n] ? tree.l[n] : tree.r[n];
    }
    return tree.v[n];
  }

  /** Mengubah isian formulir menjadi vektor fitur sesuai urutan kolom saat pelatihan. */
  function encode(model, input) {
    return model.features.map(function (name) {
      if (NUMERIC.indexOf(name) >= 0 || name === "FastingBS") return Number(input[name]);
      for (var i = 0; i < model.categorical.length; i++) {
        var c = model.categorical[i];
        if (name.indexOf(c + "_") === 0) return input[c] === name.slice(c.length + 1) ? 1 : 0;
      }
      throw new Error("Fitur tidak dikenal: " + name);
    });
  }

  /** Skor kelas 1 (penyakit jantung) dan skor tiap pohon. */
  function predictVector(model, x) {
    var per = model.trees.map(function (t) { return treeScore(t, x); });
    var sum = 0;
    for (var i = 0; i < per.length; i++) sum += per[i];
    return { score: sum / per.length, perTree: per };
  }

  function predict(model, input) {
    return predictVector(model, encode(model, input));
  }

  /**
   * Perkiraan faktor berpengaruh: selisih skor jika satu isian diganti nilai umum data latih
   * (median untuk angka, modus untuk kategori). Positif = isian ini menaikkan skor.
   */
  function factors(model, input) {
    var base = predict(model, input).score;
    var out = [];
    VARIABLES.forEach(function (v) {
      if (String(input[v]) === String(model.reference[v])) return;
      var alt = Object.assign({}, input);
      alt[v] = model.reference[v];
      out.push({ variable: v, delta: base - predict(model, alt).score });
    });
    out.sort(function (a, b) { return Math.abs(b.delta) - Math.abs(a.delta); });
    return out;
  }

  var api = { predict: predict, predictVector: predictVector, encode: encode, factors: factors, VARIABLES: VARIABLES };
  root.RF = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
