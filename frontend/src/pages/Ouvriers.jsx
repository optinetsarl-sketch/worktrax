import { useCallback, useEffect, useRef, useState } from "react";
import http, { CATEGORIES, SITES, STRUCTURES, STATUS_LABEL, formatDate, fmtMoney, formatTime } from "../lib/api";
import { useAuth } from "../lib/auth";
import Layout from "../components/Layout";

const TINY_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

function WorkerAvatar({ worker, size = 36, fontSize = "0.85rem" }) {
  const photo = worker.face_image_b64 && worker.face_image_b64 !== TINY_PIXEL ? worker.face_image_b64 : null;
  if (photo) {
    return (
      <img
        src={photo}
        alt={worker.name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid #e2e8f0" }}
      />
    );
  }
  return (
    <div className="worker-avatar" style={{ width: size, height: size, fontSize, background: worker.color, flexShrink: 0 }}>
      {worker.initials}
    </div>
  );
}

export default function Ouvriers() {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [inactiveList, setInactiveList] = useState([]);
  const [cat, setCat] = useState("Tous");
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [stats, setStats] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("actifs"); // "actifs" | "inactifs"
  const [confirm, setConfirm] = useState(null); // { type: "suspend"|"delete"|"reactivate", worker }

  const canEdit = user.role === "super_admin" || user.role === "admin" || user.role === "superviseur";
  const canManage = user.role === "super_admin" || user.role === "admin";

  const load = useCallback(() => {
    const params = {};
    if (cat !== "Tous") params.category = cat;
    if (statusFilter) params.status = statusFilter;
    if (q) params.q = q;
    http.get("/workers", { params }).then((r) => setList(r.data));
    http.get("/workers").then((r) => {
      const s = {};
      r.data.forEach((w) => { s[w.category] = (s[w.category] || 0) + 1; });
      s.Tous = r.data.length;
      setStats(s);
    });
    if (canManage) {
      http.get("/workers/inactive").then((r) => setInactiveList(r.data)).catch(() => {});
    }
  }, [cat, statusFilter, q, canManage]);
  useEffect(() => { load(); }, [load]);

  const handleConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === "suspend") await http.patch(`/workers/${confirm.worker.id}/suspend`);
      else if (confirm.type === "reactivate") await http.patch(`/workers/${confirm.worker.id}/reactivate`);
      else if (confirm.type === "delete") await http.delete(`/workers/${confirm.worker.id}`);
      setConfirm(null);
      load();
    } catch (e) {
      alert(e.response?.data?.detail || "Erreur");
    }
  };

  return (
    <Layout title="Ouvriers">
      <div className="cat-grid" data-testid="categories-grid">
        {CATEGORIES.map((c) => (
          <div
            key={c.name}
            className={`cat-card ${cat === c.name ? "selected" : ""}`}
            onClick={() => { setCat(c.name); setView("actifs"); }}
            data-testid={`cat-${c.name}`}
          >
            <div className="cat-icon">{c.icon}</div>
            <div className="cat-name">{c.name}</div>
            <div className="cat-count">{stats[c.name] || 0} ouvriers</div>
            <div className="cat-bar"><div className="cat-bar-fill" style={{ width: Math.min(100, (stats[c.name] || 0) * 3) + "%" }} /></div>
          </div>
        ))}
      </div>

      {!canEdit && (
        <div className="rbac-banner">
          <span className="rbac-icon">🔒</span>
          <div>
            <strong>Accès restreint</strong> — Vous êtes en mode consultation uniquement.<br />
            <span style={{ opacity: .85 }}>La création d'ouvriers est réservée à l'<strong>Administrateur</strong> et au <strong>Superviseur</strong>.</span>
          </div>
        </div>
      )}

      {/* Onglets Actifs / Inactifs */}
      {canManage && (
        <div className="fiche-tabs" style={{ marginBottom: 0 }}>
          <div className={`fiche-tab ${view === "actifs" ? "active" : ""}`} onClick={() => setView("actifs")}>
            👷 Actifs <span style={{ marginLeft: 6, background: "#e2e8f0", borderRadius: 10, padding: "1px 8px", fontSize: ".78rem" }}>{list.length}</span>
          </div>
          <div className={`fiche-tab ${view === "inactifs" ? "active" : ""}`} onClick={() => setView("inactifs")}>
            🚫 Inactifs / Suspendus <span style={{ marginLeft: 6, background: inactiveList.length ? "#fee2e2" : "#e2e8f0", color: inactiveList.length ? "#dc2626" : "inherit", borderRadius: 10, padding: "1px 8px", fontSize: ".78rem" }}>{inactiveList.length}</span>
          </div>
        </div>
      )}

      {/* ── Vue ACTIFS ── */}
      {view === "actifs" && (
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">👷 Liste des ouvriers</div>
              <div className="panel-subtitle">{list.length} ouvrier{list.length > 1 ? "s" : ""} affiché{list.length > 1 ? "s" : ""}</div>
            </div>
            <div className="panel-actions">
              <input className="form-input" placeholder="🔍 Rechercher..." value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 200, padding: "7px 12px" }} data-testid="search-input" />
              <div className="filter-bar">
                <button className={`filter-btn ${!statusFilter ? "active" : ""}`} onClick={() => setStatusFilter("")}>Tous</button>
                <button className={`filter-btn ${statusFilter === "present" ? "active" : ""}`} onClick={() => setStatusFilter("present")}>Présents</button>
                <button className={`filter-btn ${statusFilter === "absent" ? "active" : ""}`} onClick={() => setStatusFilter("absent")}>Absents</button>
                <button className={`filter-btn ${statusFilter === "malade" ? "active" : ""}`} onClick={() => setStatusFilter("malade")}>Malades</button>
              </div>
              {canEdit && (
                <button className="top-btn accent" onClick={() => setShowAdd(true)} data-testid="add-worker-btn">+ Ajouter ouvrier</button>
              )}
            </div>
          </div>
          <div className="scroll-x">
            <table className="data-table" data-testid="workers-table">
              <thead>
                <tr><th>Ouvrier</th><th>Catégorie</th><th>Chantier</th><th>Structure</th><th>Heures/mois</th><th>Statut</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {list.map((w) => (
                  <tr key={w.id} data-testid={`worker-row-${w.id}`}>
                    <td>
                      <div className="worker-info">
                        <WorkerAvatar worker={w} size={36} />
                        <div>
                          <div className="name">{w.name}</div>
                          <div className="meta">{w.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>{w.category}</td>
                    <td>{w.site}</td>
                    <td>{w.structure}</td>
                    <td><strong>{w.hours_month}h</strong></td>
                    <td><span className={`badge ${w.status}`}>● {STATUS_LABEL[w.status] || w.status}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button className="top-btn ghost" style={{ padding: "5px 10px" }} onClick={() => setSelected(w)} data-testid={`view-${w.id}`}>👁 Fiche</button>
                        {canManage && (
                          <>
                            <button
                              className="top-btn ghost"
                              style={{ padding: "5px 10px", color: "#d97706", borderColor: "#d97706" }}
                              onClick={() => setConfirm({ type: "suspend", worker: w })}
                              title="Suspendre"
                            >⏸ Suspendre</button>
                            <button
                              className="top-btn ghost"
                              style={{ padding: "5px 10px", color: "#dc2626", borderColor: "#dc2626" }}
                              onClick={() => setConfirm({ type: "delete", worker: w })}
                              title="Supprimer"
                            >🗑 Supprimer</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!list.length && (
                  <tr><td colSpan={7} className="empty">Aucun ouvrier trouvé</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Vue INACTIFS ── */}
      {view === "inactifs" && canManage && (
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">🚫 Ouvriers inactifs / suspendus</div>
              <div className="panel-subtitle">{inactiveList.length} ouvrier{inactiveList.length > 1 ? "s" : ""} suspendu{inactiveList.length > 1 ? "s" : ""}</div>
            </div>
          </div>
          <div className="scroll-x">
            <table className="data-table">
              <thead>
                <tr><th>Ouvrier</th><th>Catégorie</th><th>Chantier</th><th>Structure</th><th>Suspendu par</th><th>Date suspension</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {inactiveList.map((w) => (
                  <tr key={w.id} style={{ opacity: 0.8 }}>
                    <td>
                      <div className="worker-info">
                        <WorkerAvatar worker={w} size={36} />
                        <div>
                          <div className="name">{w.name}</div>
                          <div className="meta">{w.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>{w.category}</td>
                    <td>{w.site}</td>
                    <td>{w.structure}</td>
                    <td style={{ fontSize: ".8rem" }}>{w.suspended_by_name || "—"}</td>
                    <td style={{ fontSize: ".8rem" }}>{w.suspended_at ? new Date(w.suspended_at).toLocaleDateString("fr-FR") : "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button
                          className="top-btn ghost"
                          style={{ padding: "5px 10px", color: "#16a34a", borderColor: "#16a34a" }}
                          onClick={() => setConfirm({ type: "reactivate", worker: w })}
                        >✅ Réactiver</button>
                        <button
                          className="top-btn ghost"
                          style={{ padding: "5px 10px", color: "#dc2626", borderColor: "#dc2626" }}
                          onClick={() => setConfirm({ type: "delete", worker: w })}
                        >🗑 Supprimer</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!inactiveList.length && (
                  <tr><td colSpan={7} className="empty">Aucun ouvrier suspendu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdd && <AddWorkerModal onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
      {selected && <WorkerFicheModal worker={selected} onClose={() => setSelected(null)} />}

      {/* ── Dialog de confirmation ── */}
      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {confirm.type === "suspend" && "⏸ Suspendre l'ouvrier"}
                {confirm.type === "delete" && "🗑 Supprimer l'ouvrier"}
                {confirm.type === "reactivate" && "✅ Réactiver l'ouvrier"}
              </h2>
              <div className="modal-close" onClick={() => setConfirm(null)}>×</div>
            </div>
            <div style={{ padding: "16px 0" }}>
              {confirm.type === "suspend" && (
                <p>Voulez-vous suspendre <strong>{confirm.worker.name}</strong> ? L'ouvrier sera déplacé dans la liste des inactifs et ne pourra plus pointer.</p>
              )}
              {confirm.type === "delete" && (
                <p style={{ color: "#dc2626" }}>Voulez-vous <strong>supprimer définitivement</strong> <strong>{confirm.worker.name}</strong> ? Cette action est irréversible.</p>
              )}
              {confirm.type === "reactivate" && (
                <p>Voulez-vous réactiver <strong>{confirm.worker.name}</strong> ? Il sera de nouveau actif dans la liste des ouvriers.</p>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="top-btn ghost" onClick={() => setConfirm(null)}>Annuler</button>
              <button
                className="top-btn accent"
                style={{ background: confirm.type === "delete" ? "#dc2626" : confirm.type === "suspend" ? "#d97706" : "#16a34a", border: "none" }}
                onClick={handleConfirm}
              >
                {confirm.type === "suspend" && "Suspendre"}
                {confirm.type === "delete" && "Supprimer"}
                {confirm.type === "reactivate" && "Réactiver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function AddWorkerModal({ onClose, onSaved }) {
  const [structures, setStructures] = useState(["EBOMAF", "Cabinet AGBO", "KOFFI BTP", "SODJI", "AMEGAH"]);
  const [form, setForm] = useState({
    name: "", phone: "", category: "Maçon", site: SITES[0], structure: "EBOMAF",
    contract: "CDI", contract_end: "", hours_month: 0, status: "present", color: "#1a3c5e",
    fingerprint_enrolled: false, face_image_b64: null, face_descriptor: null,
    hik_employee_id: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [step, setStep] = useState(1);
  const [extracting, setExtracting] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const wsRef = useRef(null);
  const [fpStatus, setFpStatus] = useState("idle"); // idle | connecting | waiting | done | error
  const [fpDevice, setFpDevice] = useState(null); // {label, instruction}

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Load structures from API and auto-generate hik_employee_id on mount
  useEffect(() => {
    http.get("/structures").then((r) => setStructures(r.data)).catch(() => {});
    http.get("/hikvision/next-employee-id").then((r) => upd("hik_employee_id", r.data.next_id)).catch(() => {});
  }, []); // eslint-disable-line

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startCam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(s);
    } catch (e) {
      setErr("⚠️ Webcam non accessible : " + e.message);
    }
  };

  const captureFace = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth || 320;
    c.height = v.videoHeight || 240;
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL("image/jpeg", 0.7);
    upd("face_image_b64", dataUrl);

    // Extract 128D face descriptor for real biometric matching
    setExtracting(true);
    setErr("");
    try {
      const api = await import("@vladmandic/face-api");
      const url = process.env.PUBLIC_URL + "/models";
      if (!api.nets.tinyFaceDetector.isLoaded) {
        await Promise.all([
          api.nets.tinyFaceDetector.loadFromUri(url),
          api.nets.faceLandmark68TinyNet.loadFromUri(url),
          api.nets.faceRecognitionNet.loadFromUri(url),
        ]);
      }
      const result = await api
        .detectSingleFace(c, new api.TinyFaceDetectorOptions({ inputSize: 224 }))
        .withFaceLandmarks(true)
        .withFaceDescriptor();
      if (result) {
        upd("face_descriptor", Array.from(result.descriptor));
        stopCam(); // fermer la caméra automatiquement après détection réussie
      } else {
        setErr("⚠️ Aucun visage détecté. Reprendre la capture avec un meilleur éclairage.");
        upd("face_image_b64", null);
      }
    } catch {
      // Keep image even if descriptor extraction fails — will enroll without facial recognition
      stopCam();
    } finally {
      setExtracting(false);
    }
  };

  const stopCam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => () => stopCam(), [stopCam]);

  const stopFp = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => () => stopFp(), [stopFp]);

  const startFpEnrollment = () => {
    setFpStatus("connecting");
    setErr("");
    const ws = new WebSocket("ws://localhost:9999");
    wsRef.current = ws;

    ws.onopen = () => setFpStatus("waiting");

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        // Message de bienvenue — afficher le nom du lecteur, ne pas valider l'enrôlement
        if (msg.type === "hello") {
          setFpDevice({ label: msg.label, instruction: msg.instruction });
          return;
        }
      } catch (_) { /* message non-JSON ignoré */ }
      // Tout autre message = scan réel → enrôlement validé
      setFpStatus("done");
      upd("fingerprint_enrolled", true);
      ws.close();
      wsRef.current = null;
    };

    ws.onerror = () => {
      setFpStatus("error");
      setErr("⚠️ Agent empreinte non accessible. Lancez fingerprint_agent.py puis réessayez.");
    };

    ws.onclose = () => {
      if (wsRef.current) wsRef.current = null;
    };
  };

  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      stopCam();
      await http.post("/workers", form);
      if (form.hik_employee_id) {
        window.open(
          `https://192.168.1.200/doc/index.html#/peopleManage/addEditPeople?employeeNo=${form.hik_employee_id}`,
          "hikvision_scanner"
        );
      }
      onSaved();
    } catch (ex) {
      const d = ex.response?.data?.detail;
      setErr(typeof d === "string" ? d : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} data-testid="modal-add-worker">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>+ Ajouter un ouvrier — Étape {step}/3</h2>
          <div className="modal-close" onClick={() => { stopCam(); onClose(); }}>×</div>
        </div>

        {step === 1 && (
          <div>
            <div className="form-label" style={{ marginBottom: 10, fontSize: ".88rem", color: "var(--primary)" }}>📝 Étape 1 — Informations personnelles</div>
            <div className="form-grid">
              <div><label className="form-label">Nom complet *</label><input className="form-input" required value={form.name} onChange={(e) => upd("name", e.target.value)} data-testid="form-name" /></div>
              <div><label className="form-label">Téléphone *</label><input className="form-input" required value={form.phone} onChange={(e) => upd("phone", e.target.value)} placeholder="+228 90 ..." data-testid="form-phone" /></div>
              <div><label className="form-label">Catégorie</label>
                <select className="form-input" value={form.category} onChange={(e) => upd("category", e.target.value)} data-testid="form-category">
                  {CATEGORIES.filter((c) => c.name !== "Tous").map((c) => <option key={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="form-label">Chantier</label>
                <select className="form-input" value={form.site} onChange={(e) => upd("site", e.target.value)} data-testid="form-site">
                  {SITES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="form-label">Structure</label>
                <select
                  className="form-input"
                  value={structures.includes(form.structure) ? form.structure : "__new__"}
                  onChange={(e) => {
                    if (e.target.value === "__new__") upd("structure", "");
                    else upd("structure", e.target.value);
                  }}
                >
                  {structures.map((s) => <option key={s} value={s}>{s}</option>)}
                  <option value="__new__">➕ Nouvelle structure…</option>
                </select>
                {!structures.includes(form.structure) && (
                  <input
                    className="form-input"
                    style={{ marginTop: 6 }}
                    placeholder="Nom de la structure (ex: Prestataire XYZ, Cabinet ABC…)"
                    value={form.structure}
                    onChange={(e) => upd("structure", e.target.value)}
                    autoFocus
                  />
                )}
              </div>
              <div><label className="form-label">Contrat</label>
                <select className="form-input" value={form.contract} onChange={(e) => upd("contract", e.target.value)}>
                  <option>CDI</option><option>CDD</option><option>Journalier</option><option>Intérim</option>
                </select>
              </div>
              <div>
                <label className="form-label">Fin de contrat (optionnel)</label>
                <input className="form-input" type="date" value={form.contract_end} onChange={(e) => upd("contract_end", e.target.value)} />
              </div>
              <div>
                <label className="form-label">ID Scanner HikVision <span style={{ color: "#16a34a", fontWeight: 600, fontSize: ".75rem" }}>AUTO</span></label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    className="form-input"
                    value={form.hik_employee_id}
                    readOnly
                    style={{ background: "#f0fdf4", fontWeight: 600, color: "#166534", cursor: "default" }}
                  />
                  <button
                    type="button"
                    className="top-btn ghost"
                    style={{ padding: "0 12px", flexShrink: 0 }}
                    onClick={() => http.get("/hikvision/next-employee-id").then((r) => upd("hik_employee_id", r.data.next_id)).catch(() => {})}
                    title="Régénérer l'ID"
                  >↺</button>
                </div>
                <div style={{ fontSize: ".75rem", color: "#64748b", marginTop: 3 }}>
                  Généré automatiquement — unique sur le scanner HikVision
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
              <button type="button" className="top-btn accent" onClick={() => { setStep(2); startCam(); }} disabled={!form.name || !form.phone} data-testid="next-step1">Suivant : 📷 Visage →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="form-label" style={{ marginBottom: 10, fontSize: ".88rem", color: "var(--primary)" }}>📷 Étape 2 — Enrôlement reconnaissance faciale</div>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                {!stream && !form.face_image_b64 && (
                  <div style={{ background: "#0f172a", borderRadius: 10, padding: 30, textAlign: "center", color: "#fff" }}>
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>⏳</div>
                    <p style={{ margin: 0, fontSize: ".85rem" }}>Activation de la caméra…</p>
                  </div>
                )}
                {stream && !form.face_image_b64 && (
                  <div className="webcam-wrap" style={{ maxWidth: "100%", margin: 0 }}>
                    <video ref={videoRef} autoPlay muted playsInline />
                    <div className="webcam-overlay"><div className="face-frame" /></div>
                  </div>
                )}
                {form.face_image_b64 && (
                  <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `3px solid ${form.face_descriptor ? "var(--success)" : "#f59e0b"}` }}>
                    <img src={form.face_image_b64} alt="Visage capturé" style={{ width: "100%", display: "block" }} />
                    <div style={{ position: "absolute", top: 8, right: 8, background: form.face_descriptor ? "var(--success)" : "#f59e0b", color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: ".75rem", fontWeight: 700 }}>
                      {extracting ? "⏳ Analyse…" : form.face_descriptor ? "✅ Descripteur extrait" : "⚠️ Sans descripteur"}
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} style={{ display: "none" }} />
                {stream && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button type="button" className="top-btn accent" onClick={captureFace} disabled={extracting} data-testid="capture-face" style={{ flex: 1, justifyContent: "center" }}>
                      {extracting ? "⏳ Analyse du visage…" : "📸 Capturer le visage"}
                    </button>
                  </div>
                )}
                {form.face_image_b64 && !extracting && (
                  <button type="button" className="top-btn ghost" onClick={() => { upd("face_image_b64", null); upd("face_descriptor", null); startCam(); }} style={{ marginTop: 8, width: "100%", justifyContent: "center" }}>🔄 Reprendre</button>
                )}
              </div>
              <div style={{ flex: 1, padding: 14, background: "#f8fafc", borderRadius: 10, fontSize: ".82rem" }}>
                <strong style={{ color: "var(--primary)" }}>ℹ️ Instructions</strong>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>
                  <li>Cadrer le visage dans le cercle</li>
                  <li>Bon éclairage, fond neutre</li>
                  <li>Retirer lunettes / casquette</li>
                  <li>Le visage sera utilisé pour le pointage automatique</li>
                </ul>
                <div style={{ marginTop: 12, padding: 8, borderRadius: 6, fontSize: ".75rem", background: form.face_descriptor ? "#dcfce7" : form.face_image_b64 ? "#fef3c7" : "#f8fafc" }}>
                  {form.face_descriptor ? "✅ Visage enrôlé + descripteur biométrique extrait"
                    : form.face_image_b64 ? "⏳ Extraction du descripteur en cours…"
                      : "⏳ En attente de capture"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
              <button type="button" className="top-btn ghost" onClick={() => { stopCam(); setStep(1); }}>← Retour</button>
              <button type="button" className="top-btn accent" onClick={() => { stopCam(); setStep(3); startFpEnrollment(); }} data-testid="next-step2">
                Suivant : 👆 Empreinte →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="form-label" style={{ marginBottom: 10, fontSize: ".88rem", color: "var(--primary)" }}>👆 ÉTAPE 3 — ENRÔLEMENT EMPREINTE DIGITALE</div>

            {/* Lecteur connecté — en attente / succès */}
            {fpStatus === "idle" && !form.fingerprint_enrolled && (
              <div style={{ textAlign: "center", padding: 30, background: "#f8fafc", borderRadius: 14, border: "2px dashed var(--border)" }}>
                <div style={{ fontSize: "3rem", marginBottom: 8 }}>⏳</div>
                <p style={{ margin: 0, fontSize: ".85rem", color: "var(--text-muted)" }}>Connexion au lecteur d'empreinte…</p>
              </div>
            )}

            {fpStatus === "connecting" && (
              <div style={{ textAlign: "center", padding: 30, background: "#eff6ff", borderRadius: 14, border: "2px dashed #93c5fd" }}>
                <div style={{ fontSize: "3rem", marginBottom: 10 }}>🔌</div>
                <h3 style={{ margin: "0 0 6px" }}>Connexion au lecteur…</h3>
                <p style={{ color: "var(--text-muted)", fontSize: ".82rem", margin: 0 }}>Connexion à l'agent biométrique en cours.</p>
              </div>
            )}

            {fpStatus === "waiting" && (
              <div style={{ textAlign: "center", padding: 30, background: "linear-gradient(135deg,#fefce8,#fef9c3)", borderRadius: 14, border: "2px dashed #fbbf24", animation: "pulse 1.5s ease-in-out infinite" }}>
                <div style={{ fontSize: "4rem", marginBottom: 10 }}>👇</div>
                <h3 style={{ margin: "0 0 6px", color: "#92400e" }}>Posez le doigt sur le lecteur</h3>
                {fpDevice && (
                  <div style={{ display: "inline-block", background: "#1a3c5e", color: "#fff", borderRadius: 8, padding: "5px 14px", fontSize: ".8rem", fontWeight: 700, marginBottom: 10 }}>
                    📟 {fpDevice.label}
                  </div>
                )}
                <p style={{ color: "#a16207", fontSize: ".85rem", margin: "0 0 14px" }}>
                  {fpDevice ? fpDevice.instruction : "Lecteur connecté — maintenez le doigt bien à plat sur le capteur…"}
                </p>
                <button type="button" className="top-btn ghost" onClick={() => { stopFp(); setFpStatus("idle"); setFpDevice(null); }} style={{ fontSize: ".78rem" }}>
                  Annuler
                </button>
              </div>
            )}

            {(fpStatus === "done" || form.fingerprint_enrolled) && (
              <div style={{ textAlign: "center", padding: 30, background: "linear-gradient(135deg,#dcfce7,#bbf7d0)", borderRadius: 14, border: "2px dashed var(--success)" }}>
                <div style={{ fontSize: "4rem", marginBottom: 10 }}>✅</div>
                <h3 style={{ margin: "0 0 6px" }}>Empreinte enregistrée !</h3>
                <p style={{ color: "var(--text-muted)", fontSize: ".82rem", margin: "0 0 14px" }}>
                  L'empreinte servira au pointage biométrique automatique.
                </p>
                <button type="button" className="top-btn ghost" onClick={() => { upd("fingerprint_enrolled", false); setFpStatus("idle"); }} style={{ fontSize: ".78rem" }}>
                  ✗ Recommencer
                </button>
              </div>
            )}

            {fpStatus === "error" && (
              <div>
                {/* Option HikVision scanner */}
                <div style={{ padding: 20, background: "linear-gradient(135deg,#eff6ff,#dbeafe)", borderRadius: 14, border: "2px solid #93c5fd", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: "2rem" }}>📡</span>
                    <div>
                      <div style={{ fontWeight: 700, color: "#1e40af", fontSize: ".95rem" }}>Enrôlement via Scanner HikVision</div>
                      <div style={{ fontSize: ".78rem", color: "#3b82f6" }}>Recommandé — l'ouvrier sera créé sur le scanner</div>
                    </div>
                  </div>
                  <div style={{ background: "#dbeafe", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: ".78rem", color: "#1e40af" }}>
                    💡 <strong>Connexion unique :</strong> Le scanner s'ouvre dans le même onglet à chaque ouvrier. Connectez-vous <strong>une seule fois</strong> au début — pas besoin de recommencer.
                  </div>
                  <ol style={{ margin: "0 0 14px", paddingLeft: 20, fontSize: ".82rem", color: "#1e3a8a", lineHeight: 1.9 }}>
                    <li>Cliquez <strong>"Enregistrer et ouvrir le scanner"</strong> ci-dessous</li>
                    <li><em>1ère fois seulement :</em> connectez-vous (<strong>admin / Admin@2026</strong>)</li>
                    <li>La fiche de <strong>{form.name || "l'ouvrier"}</strong> s'ouvre directement</li>
                    <li>Cliquez <strong>"Fingerprint"</strong> → posez le doigt <strong>3 fois</strong> sur le scanner</li>
                  </ol>
                  <button
                    type="button"
                    className="top-btn accent"
                    style={{ width: "100%", justifyContent: "center", background: "#1d4ed8" }}
                    onClick={submit}
                    disabled={busy}
                  >
                    {busy ? "Enregistrement…" : "📡 Enregistrer et ouvrir le scanner →"}
                  </button>
                </div>

                {/* Option lecteur USB (fallback) */}
                <div style={{ padding: 14, background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: ".78rem", color: "#64748b", marginBottom: 8 }}>
                    ⚠️ <strong>Lecteur USB non détecté</strong> — Lancez <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>python fingerprint_agent.py</code> si vous avez un lecteur USB.
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" className="top-btn ghost" style={{ fontSize: ".78rem" }} onClick={startFpEnrollment}>↩ Réessayer lecteur USB</button>
                  </div>
                </div>
              </div>
            )}

            {err && <div className="login-error" style={{ marginTop: 10 }}>{err}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
              <button type="button" className="top-btn ghost" onClick={() => setStep(2)}>← Retour</button>
              {fpStatus !== "error" && (
                <button type="button" className="top-btn accent" onClick={submit} disabled={busy || (!form.face_image_b64 && !form.fingerprint_enrolled)} data-testid="form-submit">
                  {busy ? "..." : "✓ Enregistrer l'ouvrier"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkerFicheModal({ worker, onClose }) {
  const [tab, setTab] = useState("info");
  const [details, setDetails] = useState(worker);
  const [hikBusy, setHikBusy] = useState(false);
  const [hikMsg, setHikMsg] = useState("");
  useEffect(() => {
    http.get(`/workers/${worker.id}`).then((r) => setDetails(r.data));
  }, [worker.id]);

  const pushToScanner = async () => {
    setHikBusy(true);
    setHikMsg("");
    try {
      await http.post(`/hikvision/workers/${worker.id}/push`);
      setHikMsg("✓ Ouvrier envoyé sur le scanner. Il peut maintenant enrôler son empreinte.");
    } catch (e) {
      setHikMsg("✗ " + (e.response?.data?.detail || "Erreur scanner"));
    } finally {
      setHikBusy(false);
    }
  };
  return (
    <div className="modal-overlay" onClick={onClose} data-testid="modal-fiche">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <WorkerAvatar worker={details} size={56} fontSize="1.05rem" />
            <div>
              <h2 style={{ margin: 0 }}>{worker.name}</h2>
              <div className="muted" style={{ fontSize: ".82rem" }}>{worker.category} • {worker.site} • {worker.structure}</div>
            </div>
          </div>
          <div className="modal-close" onClick={onClose}>×</div>
        </div>
        <div className="fiche-tabs">
          {[
            { k: "info", l: "👤 Identité" },
            { k: "activite", l: "📊 Activité" },
            { k: "absences", l: "📅 Absences" },
            { k: "paie", l: "💰 Paie" },
          ].map((t) => (
            <div key={t.k} className={`fiche-tab ${tab === t.k ? "active" : ""}`} onClick={() => setTab(t.k)}>{t.l}</div>
          ))}
        </div>
        {tab === "info" && (
          <div className="form-grid">
            <Info label="Téléphone" value={details.phone} />
            <Info label="Email" value={details.email} />
            <Info label="Adresse" value={details.address} />
            <Info label="Contrat" value={details.contract} />
            <Info label="CNSS" value={details.cnss} />
            <Info label="Date de naissance" value={formatDate(details.birth_date)} />
            <Info label="Date de recrutement" value={formatDate(details.recruited_at)} />
            <Info label="Empreinte" value={details.fingerprint_id ? "✓ Enregistrée" : "Non enregistrée"} />
            <Info label="ID Scanner HikVision" value={details.hik_employee_id || "—"} />
          </div>
        )}
        {tab === "info" && details.hik_employee_id && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
            <div style={{ fontWeight: 600, marginBottom: 8, fontSize: ".9rem" }}>Scanner HikVision</div>
            <div style={{ fontSize: ".82rem", color: "#475569", marginBottom: 10 }}>
              ID : <strong>{details.hik_employee_id}</strong> — Cliquez pour envoyer/mettre à jour sur le scanner, puis l'ouvrier peut enrôler son empreinte depuis le terminal.
            </div>
            <button className="top-btn accent" style={{ fontSize: ".82rem", padding: "6px 14px" }} onClick={pushToScanner} disabled={hikBusy}>
              {hikBusy ? "Envoi…" : "📡 Envoyer sur scanner"}
            </button>
            {hikMsg && <div style={{ marginTop: 8, fontSize: ".82rem", color: hikMsg.startsWith("✓") ? "#16a34a" : "#dc2626" }}>{hikMsg}</div>}
          </div>
        )}
        {tab === "activite" && (
          <div>
            <div className="kpi-grid">
              <div className="kpi-card blue"><div className="kpi-value">{details.hours_month}h</div><div className="kpi-label">Heures ce mois</div></div>
              <div className="kpi-card green"><div className="kpi-value">{details.days_worked || 0}</div><div className="kpi-label">Jours travaillés</div></div>
              <div className="kpi-card orange"><div className="kpi-value">{(details.attendance || []).length}</div><div className="kpi-label">Pointages</div></div>
            </div>
            <h4>Derniers pointages</h4>
            <table className="data-table">
              <thead><tr><th>Date</th><th>Heure</th><th>Type</th><th>Méthode</th><th>Site</th></tr></thead>
              <tbody>
                {(details.attendance || []).slice(0, 10).map((a) => (
                  <tr key={a.id}><td>{formatDate(a.timestamp)}</td><td>{formatTime(a.timestamp)}</td><td><span className={`badge ${a.type === "entry" ? "present" : "absent"}`}>{a.type === "entry" ? "Entrée" : "Sortie"}</span></td><td>{a.method}</td><td>{a.site}</td></tr>
                ))}
                {!(details.attendance || []).length && <tr><td colSpan={5} className="empty">Aucun pointage</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {tab === "absences" && (
          <table className="data-table">
            <thead><tr><th>Type</th><th>Du</th><th>Au</th><th>Jours</th><th>Déclaré par</th><th>Statut</th></tr></thead>
            <tbody>
              {(details.absences || []).map((a) => (
                <tr key={a.id}>
                  <td>{a.type}</td>
                  <td>{formatDate(a.date_from)}</td>
                  <td>{formatDate(a.date_to)}</td>
                  <td>{a.days}</td>
                  <td style={{ fontSize: ".78rem" }}>
                    <strong>{a.declared_by_name || "—"}</strong>
                    <div className="muted" style={{ fontSize: ".72rem" }}>{a.declared_by_role || "—"}</div>
                  </td>
                  <td><span className={`badge ${a.statut === "valide" ? "actif" : "warning"}`}>{a.statut}</span></td>
                </tr>
              ))}
              {!(details.absences || []).length && <tr><td colSpan={6} className="empty">Aucune absence</td></tr>}
            </tbody>
          </table>
        )}
        {tab === "paie" && (
          <table className="data-table">
            <thead><tr><th>Mois</th><th>Jours</th><th>Heures</th><th>Brut</th><th>CNSS</th><th>Net</th></tr></thead>
            <tbody>
              {(details.payroll || []).map((p) => (
                <tr key={p.id}><td>{p.month}</td><td>{p.days}</td><td>{p.hours}h</td><td>{fmtMoney(p.gross)}</td><td>{fmtMoney(p.cnss)}</td><td><strong>{fmtMoney(p.net)}</strong></td></tr>
              ))}
              {!(details.payroll || []).length && <tr><td colSpan={6} className="empty">Aucune paie</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <div className="form-label">{label}</div>
      <div style={{ padding: "8px 0", borderBottom: "1px dashed #e2e8f0", fontWeight: 600 }}>{value || "—"}</div>
    </div>
  );
}
