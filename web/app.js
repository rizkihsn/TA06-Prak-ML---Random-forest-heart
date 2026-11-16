/* Antarmuka Lembar EKG: formulir, jejak EKG, hasil model, dan penjelasan. */
(function () {
  "use strict";

  var M = window.RF_MODEL;
  var RF = window.RF;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var NUM = ["Age", "RestingBP", "Cholesterol", "MaxHR", "Oldpeak"];
  var CAT = ["Sex", "ChestPainType", "FastingBS", "RestingECG", "ExerciseAngina", "ST_Slope"];

  var NAMES = {
    Age: "Usia", Sex: "Jenis kelamin", ChestPainType: "Jenis nyeri dada", RestingBP: "Tekanan darah",
    Cholesterol: "Kolesterol", FastingBS: "Gula darah puasa", RestingECG: "EKG istirahat",
    MaxHR: "Detak maksimum", ExerciseAngina: "Nyeri dada saat olahraga", Oldpeak: "Depresi segmen ST",
    ST_Slope: "Arah segmen ST"
  };
  var VALUES = {
    Sex: { M: "Laki-laki", F: "Perempuan" },
    ChestPainType: { ASY: "Tanpa keluhan nyeri dada", NAP: "Nyeri bukan angina", ATA: "Angina atipikal", TA: "Angina tipikal" },
    FastingBS: { 0: "Tidak di atas 120 mg/dl", 1: "Di atas 120 mg/dl" },
    RestingECG: { Normal: "Normal", ST: "Kelainan gelombang ST-T", LVH: "Hipertrofi ventrikel kiri" },
    ExerciseAngina: { Y: "Ya", N: "Tidak" },
    ST_Slope: { Up: "Naik", Flat: "Datar", Down: "Turun" }
  };
  var UNIT = { Age: "tahun", RestingBP: "mmHg", Cholesterol: "mg/dl", MaxHR: "bpm", Oldpeak: "mm" };

  var PRESETS = {
    rendah: { Age: 42, Sex: "F", ChestPainType: "ATA", RestingBP: 118, Cholesterol: 195, FastingBS: 0, RestingECG: "Normal", MaxHR: 168, ExerciseAngina: "N", Oldpeak: 0, ST_Slope: "Up" },
    menengah: { Age: 52, Sex: "M", ChestPainType: "ASY", RestingBP: 138, Cholesterol: 218, FastingBS: 0, RestingECG: "Normal", MaxHR: 152, ExerciseAngina: "N", Oldpeak: 0.3, ST_Slope: "Flat" },
    tinggi: { Age: 63, Sex: "M", ChestPainType: "ASY", RestingBP: 145, Cholesterol: 260, FastingBS: 1, RestingECG: "ST", MaxHR: 112, ExerciseAngina: "Y", Oldpeak: 2, ST_Slope: "Flat" }
  };

  var nf = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
  function pct(x, d) {
    d = d == null ? 1 : d;
    return (x * 100).toLocaleString("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }) + "%";
  }
  function setText(id, t) { $(id).textContent = t; }

  /* ---------- jejak EKG ---------- */
  var ecg = (function () {
    var cv = $("#ecg");
    var ctx = cv.getContext("2d");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var SPEED = 220, STEP = 0.5, GAP = 36;
    var p = { bpm: 138, slope: "Flat", depress: 0 };
    var W = 0, H = 0, N = 0, ys = null, head = 0, phase = 0, acc = 0, last = 0;

    function g(x, mu, s, a) { var d = (x - mu) / s; return a * Math.exp(-d * d / 2); }
    function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

    function wave(ph) {
      var y = g(ph, 0.14, 0.024, 0.13) + g(ph, 0.262, 0.008, -0.13) + g(ph, 0.285, 0.0105, 1) + g(ph, 0.312, 0.0105, -0.26);
      var s0 = 0, s1 = 0;
      if (p.slope === "Up") { s0 = 0.03; s1 = 0.12; }
      if (p.slope === "Down") { s0 = -0.06; s1 = -0.26; }
      var u = Math.min(1, Math.max(0, (ph - 0.33) / 0.17));
      var dep = -0.055 * Math.max(0, Math.min(4, p.depress));
      var st = s0 + (s1 - s0) * u + dep * smooth(0.33, 0.36, ph);
      y += st * smooth(0.325, 0.35, ph) * (1 - smooth(0.5, 0.54, ph));
      y += g(ph, 0.62, 0.055, p.slope === "Down" ? 0.12 : 0.3);
      return y;
    }

    function writeSample() {
      ys[head] = wave(phase);
      head = (head + 1) % N;
      phase += STEP / (SPEED * 60 / p.bpm);
      if (phase >= 1) phase -= 1;
    }

    function fillAll() {
      for (var i = 0; i < N; i++) writeSample();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var base = H * 0.66, amp = H * 0.5;
      var ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#2A1624";
      var red = getComputedStyle(document.documentElement).getPropertyValue("--red").trim() || "#C0172F";
      var gapN = reduce ? 0 : Math.round(GAP / STEP);
      ctx.lineWidth = 2.4; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.strokeStyle = ink;
      ctx.beginPath();
      var pen = false, prev = -1;
      for (var k = 0; k < N - gapN; k++) {
        var idx = (head + gapN + k) % N;
        var v = ys[idx];
        var x = idx * STEP, y = base - v * amp;
        if (!pen || idx < prev) { ctx.moveTo(x, y); pen = true; } else { ctx.lineTo(x, y); }
        prev = idx;
      }
      ctx.stroke();
      if (!reduce) {
        var hi = (head - 1 + N) % N;
        ctx.fillStyle = red;
        ctx.beginPath(); ctx.arc(hi * STEP, base - ys[hi] * amp, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    function tick(ts) {
      if (!last) last = ts;
      var dt = Math.min(0.05, (ts - last) / 1000);
      last = ts;
      acc += SPEED * dt / STEP;
      while (acc >= 1) { writeSample(); acc -= 1; }
      draw();
      window.requestAnimationFrame(tick);
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = cv.getBoundingClientRect();
      W = Math.max(1, Math.floor(r.width)); H = Math.max(1, Math.floor(r.height));
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      N = Math.ceil(W / STEP);
      ys = new Float32Array(N);
      head = 0; phase = 0;
      fillAll();
      draw();
    }

    window.addEventListener("resize", resize);
    resize();
    if (!reduce) window.requestAnimationFrame(tick);

    return {
      set: function (next) {
        p.bpm = Math.max(30, Math.min(240, next.bpm));
        p.slope = next.slope;
        p.depress = next.depress;
        if (reduce) { head = 0; phase = 0; fillAll(); draw(); }
      }
    };
  })();

  /* ---------- formulir ---------- */
  function setNote(name, text) { var el = $("#note-" + name); if (el) el.textContent = text; }

  function readInput() {
    var inp = {}, ok = true;
    NUM.forEach(function (n) {
      var v = parseFloat($("#" + n).value);
      if (!isFinite(v)) { ok = false; setNote(n, "Isi dengan angka."); return; }
      inp[n] = v;
      var r = M.ranges[n];
      setNote(n, (v < r[0] || v > r[1])
        ? "Di luar rentang data latih (" + nf.format(r[0]) + " sampai " + nf.format(r[1]) + "). Hasil di sini kurang bisa dipercaya."
        : "");
    });
    CAT.forEach(function (c) {
      var el = $('input[name="' + c + '"]:checked');
      inp[c] = c === "FastingBS" ? Number(el.value) : el.value;
    });
    if ($("#CholUnknown").checked) { inp.Cholesterol = M.reference.Cholesterol; setNote("Cholesterol", ""); }
    return ok ? inp : null;
  }

  function setField(name, value) {
    if (NUM.indexOf(name) >= 0) {
      $("#" + name).value = value;
      $("#" + name + "R").value = value;
    } else {
      var el = $('input[name="' + name + '"][value="' + value + '"]');
      if (el) el.checked = true;
    }
  }

  function toggleChol() {
    var unknown = $("#CholUnknown").checked;
    $("#Cholesterol").disabled = unknown;
    $("#CholesterolR").disabled = unknown;
    if (unknown) {
      $("#Cholesterol").value = M.reference.Cholesterol;
      $("#CholesterolR").value = M.reference.Cholesterol;
    }
  }

  /* ---------- hasil ---------- */
  function describe(variable, input) {
    var v = input[variable];
    if (NUM.indexOf(variable) >= 0) {
      var formatted = variable === "Oldpeak"
        ? v.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
        : nf.format(v);
      return formatted + " " + UNIT[variable];
    }
    return VALUES[variable][v];
  }

  function drawForest(per) {
    var n = per.length, bw = 6, gap = 4, w = n * (bw + gap) - gap, h = 76;
    var svg = $("#forest");
    svg.setAttribute("viewBox", "0 0 " + w + " " + (h + 2));
    var html = '<line class="half" x1="0" x2="' + w + '" y1="' + (h / 2) + '" y2="' + (h / 2) + '"/>';
    per.forEach(function (s, i) {
      var bh = Math.max(3, s * h);
      html += '<rect class="' + (s > 0.5 ? "hi" : "lo") + '" x="' + (i * (bw + gap)) + '" y="' + (h - bh) +
        '" width="' + bw + '" height="' + bh + '"><title>Pohon ' + (i + 1) + ": skor " + pct(s, 0) + "</title></rect>";
    });
    html += '<line class="base" x1="0" x2="' + w + '" y1="' + (h + 1) + '" y2="' + (h + 1) + '"/>';
    svg.innerHTML = html;
  }

  function drawFactors(input) {
    var list = $("#factors");
    var fs = RF.factors(M, input).filter(function (f) { return Math.abs(f.delta) >= 0.01; }).slice(0, 4);
    if (!fs.length) {
      list.innerHTML = '<li class="f-empty" style="display:block">Tidak ada isian tunggal yang menonjol. Isian ini mendekati nilai yang umum di data latih.</li>';
      setText("#factorsNote", "");
      return;
    }
    list.innerHTML = fs.map(function (f) {
      var pts = Math.round(f.delta * 100);
      var width = Math.min(50, Math.abs(f.delta) / 0.6 * 50);
      var up = f.delta > 0;
      return '<li><div class="f-name">' + NAMES[f.variable] + "<small>" + describe(f.variable, input) + "</small></div>" +
        '<div class="f-bar" aria-hidden="true"><span class="' + (up ? "up" : "down") + '" style="width:' + width + '%"></span></div>' +
        '<div class="f-val">' + (up ? "+" : "−") + Math.abs(pts) + " poin</div></li>";
    }).join("");
    setText("#factorsNote", "Selisih skor jika isian itu diganti nilai yang umum di data latih (median atau modus). Merah menaikkan skor, hijau-biru menurunkannya. Ini perkiraan satu per satu, bukan penjelasan pasti.");
  }

  function update() {
    var input = readInput();
    if (!input) return;

    var res = RF.predict(M, input);
    var score = res.score;
    var high = score > 0.5;
    var n = res.perTree.filter(function (s) { return s > 0.5; }).length;
    var rounded = Math.round(score * 100);

    setText("#scoreNum", String(rounded));
    $("#score").classList.toggle("is-high", high);
    setText("#verdict", high ? "Model memprediksi: penyakit jantung" : "Model memprediksi: normal");
    $("#hedge").hidden = !(score >= 0.4 && score <= 0.6);
    drawForest(res.perTree);
    setText("#forestCaption", n + " dari " + res.perTree.length + " pohon condong ke penyakit jantung (skor pohon di atas 50%). Tinggi batang adalah skor tiap pohon, garis putus-putus adalah batas 50%.");
    drawFactors(input);

    setText("#bpm", String(Math.round(input.MaxHR)));
    setText("#stLabel", VALUES.ST_Slope[input.ST_Slope]);
    ecg.set({ bpm: input.MaxHR, slope: input.ST_Slope, depress: input.Oldpeak });

    setText("#miniNum", String(rounded));
    setText("#miniVerdict", high ? "Model memprediksi: penyakit jantung" : "Model memprediksi: normal");
    $("#mini").hidden = false;
  }

  /* ---------- tentang model ---------- */
  function renderAbout() {
    var m = M.meta, cm = m.confusion;
    var correct = cm[0][0] + cm[1][1];
    setText("#aboutLead", "Model dilatih pada " + m.nTrain + " dari " + m.rows + " pasien, lalu diuji pada " + m.nTest +
      " pasien yang belum pernah dilihatnya. Empat angka pertama berasal dari pengujian itu.");

    var rows = [
      ["Akurasi", pct(m.accuracy), correct + " dari " + m.nTest + " pasien uji diprediksi benar"],
      ["Presisi penyakit jantung", pct(m.precision1), "Dari yang diprediksi sakit, seberapa banyak yang memang sakit"],
      ["Recall penyakit jantung", pct(m.recall1), "Dari yang memang sakit, seberapa banyak yang terdeteksi"],
      ["F1 penyakit jantung", pct(m.f11), "Keseimbangan presisi dan recall"],
      ["Akurasi OOB", pct(m.oob), "Perkiraan bawaan Random Forest dari data latih"],
      ["Akurasi cross-validation 5-fold", pct(m.cv), "Dihitung pada data latih untuk memilih konfigurasi"]
    ];
    $("#metrics").innerHTML = rows.map(function (r) {
      return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + '</dd><dd class="sub">' + r[2] + "</dd></div>";
    }).join("");

    setText("#aboutFine", "Evaluasi memakai satu pembagian data dengan " + m.nTest + " pasien uji, jadi selisih satu atau dua poin persen antar konfigurasi belum tentu berarti. Model memakai " +
      m.nTrees + " pohon dengan kedalaman maksimum " + m.maxDepth + ".");

    $("#cm").innerHTML =
      "<caption>Matriks kebingungan pada " + m.nTest + " pasien uji</caption>" +
      "<thead><tr><td></td><th scope=\"col\">Diprediksi normal</th><th scope=\"col\">Diprediksi penyakit jantung</th></tr></thead>" +
      "<tbody><tr><th scope=\"row\">Sebenarnya normal</th><td class=\"ok\">" + cm[0][0] + "</td><td class=\"bad\">" + cm[0][1] + "</td></tr>" +
      "<tr><th scope=\"row\">Sebenarnya penyakit jantung</th><td class=\"bad\">" + cm[1][0] + "</td><td class=\"ok\">" + cm[1][1] + "</td></tr></tbody>";

    var imp = Object.keys(m.importance).map(function (k) { return [k, m.importance[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; });
    var max = imp[0][1];
    $("#importance").innerHTML = imp.map(function (r) {
      return "<li><span>" + NAMES[r[0]] + '</span><span class="track"><span class="fill" style="width:' + (r[1] / max * 100) +
        '%"></span></span><b>' + pct(r[1], 1) + "</b></li>";
    }).join("");
  }

  /* ---------- pasang ---------- */
  NUM.forEach(function (n) {
    var num = $("#" + n), rng = $("#" + n + "R");
    rng.addEventListener("input", function () { num.value = rng.value; update(); });
    num.addEventListener("input", function () {
      var v = parseFloat(num.value);
      if (isFinite(v)) rng.value = v;
      update();
    });
  });
  $$('input[type="radio"]').forEach(function (el) { el.addEventListener("change", update); });
  $("#CholUnknown").addEventListener("change", function () { toggleChol(); update(); });

  $$(".presets button").forEach(function (b) {
    b.addEventListener("click", function () {
      var preset = PRESETS[b.getAttribute("data-preset")];
      $("#CholUnknown").checked = false;
      toggleChol();
      Object.keys(preset).forEach(function (k) { setField(k, preset[k]); });
      update();
    });
  });

  setText("#cholMedian", nf.format(M.reference.Cholesterol));
  renderAbout();
  update();
})();
