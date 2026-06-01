import { useEffect, useRef } from "react";

/**
 * Se connecte au WebSocket /ws/attendance du backend.
 * Appelle onNew(data) à chaque nouveau pointage HikVision.
 * Reconnexion automatique si la connexion est perdue.
 */
export default function useAttendanceSocket(onNew) {
  const cbRef = useRef(onNew);
  cbRef.current = onNew;

  useEffect(() => {
    let ws = null;
    let dead = false;
    let retryTimer = null;

    const connect = () => {
      if (dead) return;
      const host = window.location.hostname;
      ws = new WebSocket(`ws://${host}:8000/ws/attendance`);

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "new_attendance") {
            cbRef.current(msg.data);
          }
        } catch (_) {}
      };

      ws.onclose = () => {
        if (!dead) retryTimer = setTimeout(connect, 3000); // reconnexion après 3s
      };

      ws.onerror = () => ws.close();

      // Ping toutes les 25s pour garder la connexion alive
      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      }, 25000);

      ws._ping = ping;
    };

    connect();

    return () => {
      dead = true;
      clearTimeout(retryTimer);
      if (ws) {
        clearInterval(ws._ping);
        ws.close();
      }
    };
  }, []); // eslint-disable-line
}
