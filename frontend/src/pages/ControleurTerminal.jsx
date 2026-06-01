import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import http, { formatTime } from "../lib/api";
import Layout from "../components/Layout";
import useAttendanceSocket from "../lib/useAttendanceSocket";

function playBeep(success = true) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (success) {
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.start();
      setTimeout(() => { osc.frequency.value = 1320; }, 100);
      setTimeout(() => { osc.stop(); ctx.close(); }, 250);
    } else {
      osc.frequency.value = 200;
      gain.gain.value = 0.25;
      osc.start();
      let i = 0;
      const interval = setInterval(() => {
        i += 1;
        gain.gain.value = i % 2 === 0 ? 0.25 : 0;
        if (i >= 6) {
          clearInterval(interval);
          try { osc.stop(); ctx.close(); } catch { /* noop */ }
        }
      }, 120);
    }
  } catch { /* blocked by browser policy */ }
}

const FACE_THRESHOLD = 0.48;
const DETECT_MS = 1200;
const AUTO_CONFIRM_S = 2;
const FP_WS = "ws://localhost:9999";

export default function ControleurTerminal() {
  const [mode, setMode] = useState("fingerprint");
  const [pointType, setPointType] = useState("entry");
  const [scanState, setScanState] = useState("ready");
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [workers, setWorkers] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [recent, setRecent] = useState([]);
  const [stats, setStats] = useState({});
  const [site, setSite] = useState("");
  const [lastResult, setLastResult] = useState(null);
  const [geoStatus, setGeoStatus] = useState("idle");
  const [lastGeo, setLastGeo] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  // Face recognition
  const [faceModelState, setFaceModelState] = useState("idle"); // idle|loading|ready|error
  const [biometricWorkers, setBiometricWorkers] = useState([]);
  const [faceDetected, setFaceDetected] = useState(null); // { worker, distance } | null
  const [autoConfirmIn, setAutoConfirmIn] = useState(0);

  // Fingerprint WebSocket
  const [fpConnected, setFpConnected] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const lockRef = useRef(false);
  const faceapiRef = useRef(null);
  const detectLoopRef = useRef(null);
  const autoTimerRef = useRef(null);
  const autoCountRef = useRef(null);

  // Live refs for stable event-handler closures
  const candidatesRef = useRef([]);
  const performScanRef = useRef(null);

  // ── Data ────────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    const { data } = await http.get("/dashboard/controleur");
    setStats(data || {});
    setSite(data?.site || "");
    const attendance = Array.isArray(data?.attendance) ? data.attendance : [];
    setTodayAttendance(attendance);
    setRecent(attendance.slice(0, 10));
    const params = {};
    if (data?.site) params.site = data.site;
    const wr = await http.get("/workers", { params });
    setWorkers(Array.isArray(wr.data) ? wr.data : []);
  }, []);

  useEffect(() => { loadAll().catch(() => {}); }, [loadAll]);

  // Mise à jour automatique en temps réel quand HikVision enregistre un pointage
  useAttendanceSocket((newRecord) => {
    setTodayAttendance((prev) => {
      if (prev.some((a) => a.id === newRecord.id)) return prev;
      const updated = [newRecord, ...prev];
      setRecent(updated.slice(0, 10));
      return updated;
    });
  });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const candidateWorkers = useMemo(() => {
    const entered = new Set(todayAttendance.filter((a) => a.type === "entry").map((a) => a.worker_id));
    const exited = new Set(todayAttendance.filter((a) => a.type === "exit").map((a) => a.worker_id));
    if (pointType === "entry") return workers.filter((w) => !entered.has(w.id));
    return workers.filter((w) => entered.has(w.id) && !exited.has(w.id));
  }, [workers, todayAttendance, pointType]);

  useEffect(() => { candidatesRef.current = candidateWorkers; }, [candidateWorkers]);

  useEffect(() => {
    if (!selectedWorkerId) return;
    if (!candidateWorkers.some((w) => w.id === selectedWorkerId)) setSelectedWorkerId("");
  }, [candidateWorkers, selectedWorkerId]);

  const selectedWorker = useMemo(
    () => workers.find((w) => w.id === selectedWorkerId) || null,
    [workers, selectedWorkerId]
  );

  // ── GPS ──────────────────────────────────────────────────────────────────
  const readPos = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error("GPS non supporté")); return; }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true, timeout: 8000, maximumAge: 0,
      });
    });

  // ── Core scan ────────────────────────────────────────────────────────────
  const performScan = useCallback(async (wid) => {
    const workerId = wid || selectedWorkerId;
    if (lockRef.current || cooldown > 0) return;
    if (!workerId) {
      setLastResult({ ok: false, message: "Aucun ouvrier identifié." });
      setScanState("error");
      playBeep(false);
      setTimeout(() => setScanState("ready"), 1200);
      return;
    }
    lockRef.current = true;
    setScanState("scanning");
    setLastResult(null);
    setGeoStatus("loading");
    let coords = {};
    try {
      const pos = await readPos();
      coords = { latitude: +pos.coords.latitude.toFixed(6), longitude: +pos.coords.longitude.toFixed(6) };
      setGeoStatus("ok");
      setLastGeo(coords);
    } catch { setGeoStatus("error"); }
    try {
      const worker = workers.find((w) => w.id === workerId);
      const { data } = await http.post("/attendance/scan", {
        worker_id: workerId, type: pointType, method: mode, ...coords,
      });
      setScanState("success");
      setLastResult({ ok: true, worker, attendance: data });
      playBeep(true);
      setFaceDetected(null);
      setSelectedWorkerId("");
      await loadAll();
    } catch (e) {
      setScanState("error");
      setLastResult({ ok: false, message: e.response?.data?.detail || "Erreur réseau" });
      playBeep(false);
    } finally {
      setCooldown(2);
      setTimeout(() => { lockRef.current = false; setScanState("ready"); }, 2200);
    }
  }, [selectedWorkerId, cooldown, workers, pointType, mode, loadAll]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep stable ref for use inside WS/timer closures
  useEffect(() => { performScanRef.current = performScan; }, [performScan]);

  // ── Face: auto-confirm countdown ─────────────────────────────────────────
  const cancelAutoConfirm = useCallback(() => {
    if (autoTimerRef.current) { clearTimeout(autoTimerRef.current); autoTimerRef.current = null; }
    if (autoCountRef.current) { clearInterval(autoCountRef.current); autoCountRef.current = null; }
    setAutoConfirmIn(0);
    setFaceDetected(null);
  }, []);

  const triggerAutoScan = useCallback((workerId) => {
    if (autoTimerRef.current) return;
    setAutoConfirmIn(AUTO_CONFIRM_S);
    let n = AUTO_CONFIRM_S;
    autoCountRef.current = setInterval(() => {
      n -= 1;
      setAutoConfirmIn(n);
      if (n <= 0) { clearInterval(autoCountRef.current); autoCountRef.current = null; }
    }, 1000);
    autoTimerRef.current = setTimeout(() => {
      autoTimerRef.current = null;
      performScanRef.current?.(workerId);
    }, AUTO_CONFIRM_S * 1000);
  }, []);

  // ── Face: detection loop ─────────────────────────────────────────────────
  const runFaceDetection = useCallback(async () => {
    if (lockRef.current || !faceapiRef.current || !videoRef.current) return;
    if (videoRef.current.readyState < 2) return;
    if (autoTimerRef.current) return;
    const bw = biometricWorkers;
    if (bw.length === 0) return;
    try {
      const api = faceapiRef.current;
      const result = await api
        .detectSingleFace(videoRef.current, new api.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor();
      if (!result) { setFaceDetected(null); return; }
      const labeled = bw.map((w) => new api.LabeledFaceDescriptors(w.id, [new Float32Array(w.face_descriptor)]));
      const matcher = new api.FaceMatcher(labeled, FACE_THRESHOLD);
      const best = matcher.findBestMatch(result.descriptor);
      if (best.label === "unknown") { setFaceDetected(null); return; }
      const worker = candidatesRef.current.find((w) => w.id === best.label);
      if (!worker) { setFaceDetected(null); return; }
      setFaceDetected({ worker, distance: best.distance });
      setSelectedWorkerId(worker.id);
      triggerAutoScan(worker.id);
    } catch { /* detection error — ignore */ }
  }, [biometricWorkers, triggerAutoScan]);

  // ── Face mode: camera + model loading + detection loop ───────────────────
  useEffect(() => {
    if (mode !== "face") {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (detectLoopRef.current) { clearInterval(detectLoopRef.current); detectLoopRef.current = null; }
      cancelAutoConfirm();
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: { ideal: 640 } } })
      .then((s) => { streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => {});

    http.get("/workers/biometrics")
      .then(({ data }) => setBiometricWorkers(Array.isArray(data) ? data : []))
      .catch(() => {});

    if (faceModelState === "idle") {
      setFaceModelState("loading");
      import("@vladmandic/face-api").then(async (api) => {
        faceapiRef.current = api;
        const url = process.env.PUBLIC_URL + "/models";
        await Promise.all([
          api.nets.tinyFaceDetector.loadFromUri(url),
          api.nets.faceLandmark68TinyNet.loadFromUri(url),
          api.nets.faceRecognitionNet.loadFromUri(url),
        ]);
        setFaceModelState("ready");
      }).catch(() => setFaceModelState("error"));
    }

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (detectLoopRef.current) { clearInterval(detectLoopRef.current); detectLoopRef.current = null; }
      cancelAutoConfirm();
    };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode !== "face" || faceModelState !== "ready") return;
    detectLoopRef.current = setInterval(runFaceDetection, DETECT_MS);
    return () => { if (detectLoopRef.current) { clearInterval(detectLoopRef.current); detectLoopRef.current = null; } };
  }, [mode, faceModelState, runFaceDetection]);

  // ── Fingerprint WebSocket ─────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "fingerprint") return;
    let ws;
    let reconnectTimer;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      try {
        ws = new WebSocket(FP_WS);
        ws.onopen = () => setFpConnected(true);
        ws.onclose = () => {
          setFpConnected(false);
          if (!stopped) reconnectTimer = setTimeout(connect, 3000);
        };
        ws.onerror = () => setFpConnected(false);
        ws.onmessage = (evt) => {
          try {
            const payload = JSON.parse(evt.data);
            if (!payload.worker_id) return;
            const candidate = candidatesRef.current.find((w) => w.id === payload.worker_id);
            if (candidate) {
              setSelectedWorkerId(candidate.id);
              setTimeout(() => performScanRef.current?.(candidate.id), 50);
            } else {
              setLastResult({ ok: false, message: `"${payload.name || payload.worker_id}" introuvable ou déjà pointé.` });
              setScanState("error");
              playBeep(false);
              setTimeout(() => setScanState("ready"), 1800);
            }
          } catch { /* parse error */ }
        };
      } catch {
        if (!stopped) reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();
    return () => {
      stopped = true;
      clearTimeout(reconnectTimer);
      if (ws) { ws.onclose = null; ws.close(); }
      setFpConnected(false);
    };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ────────────────────────────────────────────────────────────────
  const confidence = faceDetected ? Math.round((1 - faceDetected.distance) * 100) : 0;

  return (
    <Layout title="Terminal Contrôleur">
      <div className="role-banner controleur">
        <div className="rb-icon">📱</div>
        <div>
          <h2>Terminal de pointage biométrique</h2>
          <p>Identification automatique — visage ou empreinte digitale</p>
        </div>
        <div className="rb-right">
          <div className="rb-time">{new Date().toLocaleTimeString("fr-FR")}</div>
          <div style={{ opacity: 0.7, fontSize: ".78rem" }}>{new Date().toLocaleDateString("fr-FR")}</div>
        </div>
      </div>

      {/* Mode selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          className={`top-btn ${mode === "fingerprint" ? "primary" : "ghost"}`}
          onClick={() => setMode("fingerprint")}
          data-testid="mode-fingerprint"
        >
          👆 Empreinte digitale
        </button>
        <button
          className={`top-btn ${mode === "face" ? "primary" : "ghost"}`}
          onClick={() => setMode("face")}
          data-testid="mode-face"
        >
          👤 Reconnaissance faciale
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            className={`top-btn ${pointType === "entry" ? "accent" : "ghost"}`}
            onClick={() => setPointType("entry")}
            data-testid="type-entry"
          >🟢 Entrée</button>
          <button
            className={`top-btn ${pointType === "exit" ? "accent" : "ghost"}`}
            onClick={() => setPointType("exit")}
            data-testid="type-exit"
          >🔴 Sortie</button>
        </div>
      </div>

      <div className="finger-scanner" data-testid="finger-scanner">

        {/* ── FACE MODE ── */}
        {mode === "face" && (
          <>
            <div className="webcam-wrap" style={{ position: "relative", margin: "0 auto 14px" }}>
              <video ref={videoRef} autoPlay muted playsInline />
              <div className="webcam-overlay">
                <div
                  className="face-frame"
                  style={{
                    borderColor:
                      faceDetected ? "rgba(34,197,94,.9)"
                        : scanState === "scanning" ? "rgba(249,115,22,.9)"
                          : scanState === "error" ? "rgba(220,38,38,.9)"
                            : "rgba(34,197,94,.7)",
                  }}
                />
              </div>
              {/* Status badge overlay */}
              <div style={{
                position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)",
                background: "rgba(0,0,0,.7)", borderRadius: 20, padding: "4px 14px",
                fontSize: ".78rem", color: "#fff", whiteSpace: "nowrap",
              }}>
                {faceModelState === "loading" && "⏳ Chargement des modèles IA…"}
                {faceModelState === "error" && "⚠️ Erreur modèles — vérifier /models"}
                {faceModelState === "ready" && !faceDetected && scanState === "ready" && "🔍 Recherche d'un visage…"}
                {faceDetected && autoConfirmIn > 0 && `✅ ${faceDetected.worker.name} (${confidence}%) — validation dans ${autoConfirmIn}s`}
                {scanState === "scanning" && "⏳ Pointage en cours…"}
                {biometricWorkers.length === 0 && faceModelState === "ready" && "⚠️ Aucun ouvrier enrôlé en facial"}
              </div>
            </div>

            {/* Auto-confirm countdown + cancel */}
            {faceDetected && autoConfirmIn > 0 && (
              <div style={{
                background: "rgba(34,197,94,.12)", border: "2px solid rgba(34,197,94,.5)",
                borderRadius: 12, padding: "12px 20px", marginBottom: 12,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                    👤 {faceDetected.worker.name} — {faceDetected.worker.category}
                  </div>
                  <div style={{ fontSize: ".8rem", opacity: 0.8 }}>
                    Confiance : {confidence}% • Validation automatique dans {autoConfirmIn}s
                  </div>
                </div>
                <button className="top-btn ghost" onClick={cancelAutoConfirm} style={{ flexShrink: 0 }}>
                  ✕ Annuler
                </button>
              </div>
            )}
          </>
        )}

        {/* ── FINGERPRINT MODE ── */}
        {mode === "fingerprint" && (
          <>
            <div style={{ marginBottom: 10, textAlign: "center" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 14px", borderRadius: 20, fontSize: ".78rem",
                background: fpConnected ? "rgba(34,197,94,.15)" : "rgba(220,38,38,.15)",
                border: `1px solid ${fpConnected ? "rgba(34,197,94,.5)" : "rgba(220,38,38,.4)"}`,
                color: fpConnected ? "#86efac" : "#fca5a5",
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                {fpConnected ? "Lecteur connecté" : "Lecteur déconnecté — démarrer fingerprint_agent.py"}
              </span>
            </div>
            <div
              className={`scan-icon ${scanState}`}
              data-testid="scan-icon"
              style={{
                filter:
                  scanState === "scanning" ? "drop-shadow(0 0 12px rgba(249,115,22,.6))"
                    : scanState === "success" ? "drop-shadow(0 0 12px rgba(34,197,94,.6))"
                      : scanState === "error" ? "drop-shadow(0 0 12px rgba(220,38,38,.6))"
                        : "none",
              }}
            >
              {scanState === "scanning" ? "⟳" : scanState === "success" ? "✓" : scanState === "error" ? "⛔" : "👆"}
            </div>
          </>
        )}

        {/* ── Scan results ── */}
        {lastResult?.ok && (
          <div style={{
            position: "relative", background: "rgba(34,197,94,.15)",
            border: "2px solid rgba(34,197,94,.5)", borderRadius: 14,
            padding: 18, marginBottom: 14, animation: "pulse 1.4s 2",
          }} data-testid="scan-success">
            <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: lastResult.worker?.color || "#1a3c5e",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 900, fontSize: "1.4rem",
              }}>
                {lastResult.worker?.initials || "OK"}
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "1.3rem", fontWeight: 800 }}>✅ {lastResult.attendance.worker_name}</div>
                <div style={{ opacity: 0.8, fontSize: ".88rem" }}>
                  {lastResult.worker?.category || "—"} • {lastResult.attendance.site || "—"}
                </div>
                <div style={{ marginTop: 4, fontSize: ".82rem", color: "#86efac" }}>
                  {pointType === "entry" ? "🟢 Entrée enregistrée" : "🔴 Sortie enregistrée"} à{" "}
                  {formatTime(lastResult.attendance.timestamp)}
                  {lastResult.attendance.late_minutes > 0 && ` • ⏰ Retard ${lastResult.attendance.late_minutes}min`}
                </div>
              </div>
            </div>
          </div>
        )}

        {lastResult?.ok === false && (
          <div style={{
            position: "relative", background: "rgba(220,38,38,.18)",
            border: "2px solid rgba(220,38,38,.6)", borderRadius: 14,
            padding: 18, marginBottom: 14,
          }} data-testid="scan-error">
            <div style={{ fontSize: "2rem", marginBottom: 6 }}>🚨</div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fca5a5" }}>POINTAGE REFUSÉ</div>
            <div style={{ opacity: 0.85, fontSize: ".85rem", marginTop: 4 }}>{lastResult.message}</div>
          </div>
        )}

        {/* ── Manual fallback ── */}
        <details style={{ marginBottom: 10 }}>
          <summary style={{ cursor: "pointer", fontSize: ".82rem", opacity: 0.7, marginBottom: 8 }}>
            ↕ Sélection manuelle (secours)
          </summary>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <select
              className="form-input"
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              disabled={scanState === "scanning"}
              data-testid="worker-select"
            >
              <option value="">
                {candidateWorkers.length
                  ? "Sélectionnez un ouvrier"
                  : pointType === "entry" ? "Aucun ouvrier disponible" : "Aucun ouvrier en attente de sortie"}
              </option>
              {candidateWorkers.map((w) => (
                <option key={w.id} value={w.id}>{w.name} — {w.category} — {w.site}</option>
              ))}
            </select>
          </div>
        </details>

        {!lastResult && scanState !== "scanning" && (
          <p style={{ opacity: 0.6, fontSize: ".82rem", position: "relative" }}>
            {mode === "face"
              ? "Placez le visage devant la caméra — identification automatique."
              : fpConnected
                ? "Posez le doigt sur le lecteur — identification automatique."
                : "Démarrez l'agent lecteur : python fingerprint_agent.py"}
          </p>
        )}

        {/* Manual scan button (for fallback selection) */}
        {selectedWorkerId && !autoTimerRef.current && (
          <div style={{ position: "relative", marginTop: 10 }}>
            <button
              className="top-btn accent"
              onClick={() => performScan()}
              disabled={scanState === "scanning" || cooldown > 0}
              data-testid="scan-btn"
              style={{ padding: "14px 36px", fontSize: "1rem", minWidth: 240 }}
            >
              {scanState === "scanning" ? "⏳ Validation…"
                : cooldown > 0 ? `⏱️ Patientez ${cooldown}s`
                  : `▶ Valider ${mode === "face" ? "visage" : "empreinte"}`}
            </button>
          </div>
        )}

        <div style={{ marginTop: 10, fontSize: ".78rem", opacity: 0.85 }}>
          {geoStatus === "idle" && "📍 GPS inactif"}
          {geoStatus === "loading" && "📍 Lecture GPS…"}
          {geoStatus === "ok" && `📍 GPS capturé${lastGeo ? ` (${lastGeo.latitude}, ${lastGeo.longitude})` : ""}`}
          {geoStatus === "error" && "📍 GPS indisponible (pointage enregistré sans coordonnées)"}
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card green">
          <div className="kpi-header"><div className="kpi-icon">✅</div></div>
          <div className="kpi-value">{stats.entries_count || 0}</div>
          <div className="kpi-label">Pointés aujourd'hui</div>
        </div>
        <div className="kpi-card red">
          <div className="kpi-header"><div className="kpi-icon">⏳</div></div>
          <div className="kpi-value">{stats.not_pointed || 0}</div>
          <div className="kpi-label">Non encore pointés</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-header"><div className="kpi-icon">⏰</div></div>
          <div className="kpi-value">{stats.retards_count || 0}</div>
          <div className="kpi-label">Retards signalés</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-header"><div className="kpi-icon">👤</div></div>
          <div className="kpi-value">{stats.total_assigned || 0}</div>
          <div className="kpi-label">Total affectés</div>
        </div>
      </div>

      {/* Recent scans */}
      <div className="panel">
        <div className="panel-header">
          <div><div className="panel-title">📋 Derniers pointages enregistrés</div></div>
        </div>
        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Ouvrier</th><th>Méthode</th><th>Type</th><th>Heure</th><th>Statut</th></tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td>{r.worker_name}</td>
                  <td>{r.method === "face" ? "👤 Faciale" : "👆 Empreinte"}</td>
                  <td>
                    <span className={`badge ${r.type === "entry" ? "present" : "absent"}`}>
                      {r.type === "entry" ? "Entrée" : "Sortie"}
                    </span>
                  </td>
                  <td>{formatTime(r.timestamp)}</td>
                  <td>
                    {r.late_minutes > 0
                      ? <span className="badge warning">⏰ Retard {r.late_minutes}min</span>
                      : <span className="badge actif">✓ OK</span>}
                  </td>
                </tr>
              ))}
              {!recent.length && <tr><td colSpan={6} className="empty">Aucun pointage récent</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
