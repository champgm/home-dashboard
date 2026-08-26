import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppRuntime } from "../AppContext";
import { HueSearchStatus } from "../../protocol/hue/search";

type HueSearchKind = "lights" | "sensors";

export function HueSearchStatusView({ kind }: { kind: HueSearchKind }): JSX.Element {
  const runtime = useAppRuntime();
  const [status, setStatus] = useState<HueSearchStatus>();
  const [message, setMessage] = useState<string>();
  const mounted = useRef(true);
  const refreshStatus = async (): Promise<HueSearchStatus | undefined> => {
    try {
      const next = await runtime.service.getHueSearchStatus(kind);
      if (!mounted.current || !runtime.service.isForeground) return undefined;
      if (!next) {
        setStatus(undefined);
        setMessage("Hue is not configured.");
        return undefined;
      }
      setStatus(next);
      setMessage(undefined);
      return next;
    } catch (_error) {
      if (!mounted.current || !runtime.service.isForeground) return undefined;
      setMessage("Search status is unavailable.");
      return undefined;
    }
  };
  useEffect(() => {
    let disposed = false;
    mounted.current = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      if (disposed || !runtime.service.isForeground) return;
      const next = await refreshStatus();
      if (!disposed && runtime.service.isForeground && next?.active) timer = setTimeout(() => void poll(), 1000);
    };
    const lifecycle = runtime.service.subscribeLifecycle(() => {
      if (!runtime.service.isForeground) {
        if (timer) clearTimeout(timer);
        timer = undefined;
        return;
      }
      void poll();
    });
    void poll();
    return () => { disposed = true; mounted.current = false; lifecycle(); if (timer) clearTimeout(timer); };
  // The status value is read inside the polling loop; adding it as a dependency
  // would restart the timer on every bridge response.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, runtime]);
  const visibleMessage = message || (status?.active ? "A bridge search is active." : undefined);
  if (!visibleMessage) return <></>;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{visibleMessage}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#073642", borderRadius: 8, marginBottom: 10, padding: 10 },
  text: { color: "#fdf6e3", marginBottom: 8 },
});
