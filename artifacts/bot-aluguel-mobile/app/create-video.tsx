import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { schedulePostsBatch } from "@/services/videoApi";

const PLATFORMS = [
  { key: "tiktok", label: "TikTok", color: "#FF2D75", icon: "music" },
  { key: "instagram", label: "Instagram", color: "#E4405F", icon: "instagram" },
  { key: "youtube", label: "YouTube", color: "#FF3D3D", icon: "youtube" },
] as const;

const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEKDAYS_PT = ["D", "S", "T", "Q", "Q", "S", "S"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function buildMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function MiniCalendar({
  value,
  onChange,
}: {
  value: Date;
  onChange: (d: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [view, setView] = useState({ y: value.getFullYear(), m: value.getMonth() });
  const cells = useMemo(() => buildMonthGrid(view.y, view.m), [view]);

  const goPrev = () => {
    Haptics.selectionAsync();
    setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  };
  const goNext = () => {
    Haptics.selectionAsync();
    setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));
  };

  return (
    <View style={cal.wrap}>
      <View style={cal.header}>
        <Pressable style={cal.navBtn} onPress={goPrev}>
          <Feather name="chevron-left" size={16} color="#EBEBF2" />
        </Pressable>
        <Text style={cal.title}>
          {MONTHS_PT[view.m]} {view.y}
        </Text>
        <Pressable style={cal.navBtn} onPress={goNext}>
          <Feather name="chevron-right" size={16} color="#EBEBF2" />
        </Pressable>
      </View>

      <View style={cal.weekRow}>
        {WEEKDAYS_PT.map((w, i) => (
          <Text key={i} style={cal.weekDay}>{w}</Text>
        ))}
      </View>

      <View style={cal.grid}>
        {cells.map((d, i) => {
          if (d === null) return <View key={i} style={cal.cell} />;
          const cellDate = new Date(view.y, view.m, d);
          cellDate.setHours(0, 0, 0, 0);
          const isPast = cellDate.getTime() < today.getTime();
          const isToday = cellDate.getTime() === today.getTime();
          const sel =
            value.getFullYear() === view.y &&
            value.getMonth() === view.m &&
            value.getDate() === d;
          return (
            <Pressable
              key={i}
              style={cal.cell}
              disabled={isPast}
              onPress={() => {
                Haptics.selectionAsync();
                const nd = new Date(value);
                nd.setFullYear(view.y);
                nd.setMonth(view.m);
                nd.setDate(d);
                onChange(nd);
              }}
            >
              <View
                style={[
                  cal.dayDot,
                  sel && cal.dayDotActive,
                  isToday && !sel && cal.dayDotToday,
                ]}
              >
                <Text
                  style={[
                    cal.dayText,
                    isPast && { color: "#3F3F4A" },
                    sel && { color: "#FFF", fontFamily: "Inter_700Bold" },
                  ]}
                >
                  {d}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ClockPicker({
  hour,
  minute,
  onChange,
}: {
  hour: number;
  minute: number;
  onChange: (h: number, m: number) => void;
}) {
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), []);
  const hRef = useRef<FlatList>(null);
  const mRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => {
      hRef.current?.scrollToIndex({ index: hour, animated: false, viewPosition: 0.5 });
      const mIdx = minutes.findIndex((m) => m >= minute);
      mRef.current?.scrollToIndex({ index: mIdx >= 0 ? mIdx : 0, animated: false, viewPosition: 0.5 });
    }, 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={clk.wrap}>
      <View style={clk.display}>
        <Text style={clk.dispNum}>{pad(hour)}</Text>
        <Text style={clk.dispSep}>:</Text>
        <Text style={clk.dispNum}>{pad(minute)}</Text>
      </View>

      <View style={clk.cols}>
        <View style={clk.col}>
          <Text style={clk.colLabel}>HORA</Text>
          <FlatList
            ref={hRef}
            data={hours}
            keyExtractor={(h) => String(h)}
            showsVerticalScrollIndicator={false}
            style={clk.list}
            getItemLayout={(_, i) => ({ length: 36, offset: 36 * i, index: i })}
            renderItem={({ item }) => {
              const sel = item === hour;
              return (
                <Pressable
                  style={[clk.item, sel && clk.itemSel]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChange(item, minute);
                  }}
                >
                  <Text style={[clk.itemText, sel && clk.itemTextSel]}>{pad(item)}</Text>
                </Pressable>
              );
            }}
          />
        </View>

        <View style={clk.col}>
          <Text style={clk.colLabel}>MIN</Text>
          <FlatList
            ref={mRef}
            data={minutes}
            keyExtractor={(m) => String(m)}
            showsVerticalScrollIndicator={false}
            style={clk.list}
            getItemLayout={(_, i) => ({ length: 36, offset: 36 * i, index: i })}
            renderItem={({ item }) => {
              const sel = item === minute;
              return (
                <Pressable
                  style={[clk.item, sel && clk.itemSel]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onChange(hour, item);
                  }}
                >
                  <Text style={[clk.itemText, sel && clk.itemTextSel]}>{pad(item)}</Text>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </View>
  );
}

export default function CreateVideoScreen() {
  const insets = useSafeAreaInsets();
  const { addPost } = useApp();

  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<string[]>(["tiktok", "instagram", "youtube"]);
  const [mode, setMode] = useState<"now" | "schedule">("now");

  const initial = useMemo(() => {
    const d = new Date();
    d.setMinutes(Math.ceil(d.getMinutes() / 5) * 5 + 30, 0, 0);
    return d;
  }, []);
  const [date, setDate] = useState<Date>(initial);
  const [hour, setHour] = useState<number>(initial.getHours());
  const [minute, setMinute] = useState<number>(initial.getMinutes() % 60);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
    Haptics.selectionAsync();
  };

  const buildScheduledDate = () => {
    const d = new Date(date);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  const scheduledPretty = useMemo(() => {
    const d = buildScheduledDate();
    return d.toLocaleString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, hour, minute]);

  const handleSubmit = async () => {
    setError(null);
    if (!videoUrl.trim()) {
      setError("Cole o link do seu vídeo (TikTok, Instagram, YouTube ou .mp4 direto).");
      return;
    }
    if (selected.length === 0) {
      setError("Escolha pelo menos uma plataforma.");
      return;
    }

    let when: Date;
    if (mode === "now") {
      when = new Date();
    } else {
      when = buildScheduledDate();
      if (when.getTime() <= Date.now()) {
        setError("Escolha uma data e hora no futuro.");
        return;
      }
    }
    const time = when.toISOString();

    setLoading(true);
    try {
      const result = await schedulePostsBatch({
        posts: [
          {
            videoUrl: videoUrl.trim(),
            time,
            platforms: selected,
            ...(title.trim() ? { title: title.trim() } : {}),
          } as any,
        ],
      });
      const id = `video_${Date.now()}`;
      await addPost({
        id,
        videoUrl: videoUrl.trim(),
        title: title.trim(),
        description: "",
        hashtags: [],
        platforms: selected,
        timestamp: new Date().toISOString(),
        scheduledTime: time,
        status: result.success
          ? mode === "now"
            ? "processing"
            : "scheduled"
          : "failed",
        jobId: result.jobId,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível enviar o vídeo agora.";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const paddingTop = Platform.OS === "web" ? insets.top + 24 : insets.top + 12;

  return (
    <View style={s.root}>
      <View style={s.blobWrap} pointerEvents="none">
        <LinearGradient
          colors={["rgba(124,58,237,0.35)", "transparent"]}
          style={[s.blob, { top: -120, left: -80, width: 320, height: 320 }]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <LinearGradient
          colors={["rgba(167,139,250,0.18)", "transparent"]}
          style={[s.blob, { top: 200, right: -100, width: 280, height: 280 }]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={[s.header, { paddingTop }]}>
          <Pressable style={s.iconBtn} onPress={() => router.back()}>
            <Feather name="arrow-left" size={20} color="#EBEBF2" />
          </Pressable>
          <Text style={s.headerTitle}>Novo Vídeo</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* MODE SEGMENTED */}
          <View style={s.modeWrap}>
            <Pressable
              style={[s.modeBtn, mode === "now" && s.modeBtnActive]}
              onPress={() => {
                setMode("now");
                Haptics.selectionAsync();
              }}
            >
              <Feather name="zap" size={14} color={mode === "now" ? "#FFF" : "#8E8E9E"} />
              <Text style={[s.modeText, mode === "now" && s.modeTextActive]}>
                Publicar agora
              </Text>
            </Pressable>
            <Pressable
              style={[s.modeBtn, mode === "schedule" && s.modeBtnActive]}
              onPress={() => {
                setMode("schedule");
                Haptics.selectionAsync();
              }}
            >
              <Feather
                name="calendar"
                size={14}
                color={mode === "schedule" ? "#FFF" : "#8E8E9E"}
              />
              <Text style={[s.modeText, mode === "schedule" && s.modeTextActive]}>
                Agendar
              </Text>
            </Pressable>
          </View>

          {/* LINK */}
          <Text style={s.label}>LINK DO VÍDEO</Text>
          <View style={s.inputWrap}>
            <Feather name="link" size={16} color="#8E8E9E" style={{ marginLeft: 14 }} />
            <TextInput
              style={s.input}
              placeholder="https://www.tiktok.com/@user/video/..."
              placeholderTextColor="#5A5A6B"
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          {/* TITLE (only when "now") */}
          {mode === "now" && (
            <>
              <Text style={s.label}>TÍTULO (OPCIONAL)</Text>
              <View style={s.inputWrap}>
                <Feather name="type" size={16} color="#8E8E9E" style={{ marginLeft: 14 }} />
                <TextInput
                  style={s.input}
                  placeholder="Ex: Receita rápida de bolo"
                  placeholderTextColor="#5A5A6B"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </>
          )}

          {/* PLATFORMS */}
          <Text style={s.label}>PUBLICAR EM</Text>
          <View style={s.platformGrid}>
            {PLATFORMS.map((p) => {
              const on = selected.includes(p.key);
              return (
                <Pressable
                  key={p.key}
                  style={[
                    s.platformCard,
                    on && { borderColor: p.color, backgroundColor: p.color + "18" },
                  ]}
                  onPress={() => togglePlatform(p.key)}
                >
                  <Feather name={p.icon as any} size={22} color={on ? p.color : "#8E8E9E"} />
                  <Text style={[s.platformLabel, on && { color: "#EBEBF2" }]}>
                    {p.label}
                  </Text>
                  {on && (
                    <View style={[s.checkBadge, { backgroundColor: p.color }]}>
                      <Feather name="check" size={10} color="#FFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* SCHEDULE PICKERS */}
          {mode === "schedule" && (
            <>
              <Text style={s.label}>ESCOLHA A DATA</Text>
              <MiniCalendar value={date} onChange={setDate} />

              <Text style={[s.label, { marginTop: 18 }]}>ESCOLHA O HORÁRIO</Text>
              <ClockPicker
                hour={hour}
                minute={minute}
                onChange={(h, m) => {
                  setHour(h);
                  setMinute(m);
                }}
              />

              <View style={s.summaryCard}>
                <Feather name="bell" size={14} color="#A78BFA" />
                <Text style={s.summaryText}>
                  Seu vídeo será publicado em{" "}
                  <Text style={{ color: "#EBEBF2", fontFamily: "Inter_700Bold" }}>
                    {scheduledPretty}
                  </Text>
                </Text>
              </View>
            </>
          )}

          {error && (
            <View style={s.errorBox}>
              <Feather name="alert-triangle" size={14} color="#EF4444" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              s.submitBtn,
              pressed && { opacity: 0.85 },
              loading && { opacity: 0.7 },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={mode === "now" ? ["#7C3AED", "#4F46E5"] : ["#A78BFA", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Feather
                    name={mode === "now" ? "send" : "calendar"}
                    size={16}
                    color="#FFF"
                  />
                  <Text style={s.submitText}>
                    {mode === "now" ? "Publicar agora" : "Agendar publicação"}
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          <Text style={s.helper}>
            Powered by n8n · Acompanhe o status na aba Vídeos.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0A0A10" },
  blobWrap: { ...StyleSheet.absoluteFillObject },
  blob: { position: "absolute", borderRadius: 999 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#13131D",
    borderWidth: 1,
    borderColor: "#20202B",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, color: "#EBEBF2", fontFamily: "Inter_700Bold" },

  modeWrap: {
    flexDirection: "row",
    backgroundColor: "#101019",
    borderWidth: 1,
    borderColor: "#1F1F2A",
    borderRadius: 14,
    padding: 5,
    marginBottom: 22,
    gap: 5,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: "#6D28D9",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  modeText: { color: "#8E8E9E", fontSize: 12.5, fontFamily: "Inter_600SemiBold" },
  modeTextActive: { color: "#FFF", fontFamily: "Inter_700Bold" },

  label: {
    fontSize: 11,
    color: "#8E8E9E",
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.4,
    marginBottom: 10,
    marginTop: 2,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#101019",
    borderWidth: 1,
    borderColor: "#1F1F2A",
    borderRadius: 14,
    marginBottom: 18,
  },
  input: {
    flex: 1,
    color: "#EBEBF2",
    fontFamily: "Inter_400Regular",
    fontSize: 13.5,
    padding: 14,
  },

  platformGrid: { flexDirection: "row", gap: 10, marginBottom: 22 },
  platformCard: {
    flex: 1,
    backgroundColor: "#101019",
    borderWidth: 1.5,
    borderColor: "#1F1F2A",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  platformLabel: { fontSize: 11.5, color: "#8E8E9E", fontFamily: "Inter_600SemiBold" },
  checkBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#6D28D912",
    borderWidth: 1,
    borderColor: "#6D28D940",
    borderRadius: 14,
    padding: 14,
    marginTop: 18,
  },
  summaryText: { flex: 1, color: "#A78BFA", fontFamily: "Inter_500Medium", fontSize: 12.5, lineHeight: 18 },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EF444415",
    borderWidth: 1,
    borderColor: "#EF444440",
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
    marginBottom: 4,
  },
  errorText: { color: "#EF4444", flex: 1, fontFamily: "Inter_500Medium", fontSize: 12 },

  submitBtn: { borderRadius: 16, overflow: "hidden", marginTop: 22 },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 17,
  },
  submitText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 14 },
  helper: {
    fontSize: 11,
    color: "#5A5A6B",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 14,
  },
});

const cal = StyleSheet.create({
  wrap: {
    backgroundColor: "#101019",
    borderWidth: 1,
    borderColor: "#1F1F2A",
    borderRadius: 16,
    padding: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1A1A24",
    borderWidth: 1,
    borderColor: "#26262F",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#EBEBF2", fontSize: 14, fontFamily: "Inter_700Bold" },
  weekRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    color: "#5A5A6B",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayDotActive: {
    backgroundColor: "#7C3AED",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.5,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dayDotToday: {
    borderWidth: 1,
    borderColor: "#7C3AED",
  },
  dayText: {
    color: "#EBEBF2",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});

const clk = StyleSheet.create({
  wrap: {
    backgroundColor: "#101019",
    borderWidth: 1,
    borderColor: "#1F1F2A",
    borderRadius: 16,
    padding: 14,
  },
  display: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 4,
  },
  dispNum: {
    color: "#FFF",
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  dispSep: {
    color: "#7C3AED",
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    marginHorizontal: 2,
  },
  cols: {
    flexDirection: "row",
    gap: 12,
  },
  col: { flex: 1 },
  colLabel: {
    fontSize: 10,
    color: "#5A5A6B",
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
    textAlign: "center",
    marginBottom: 6,
  },
  list: {
    height: 144,
    backgroundColor: "#0A0A10",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F1F2A",
  },
  item: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  itemSel: {
    backgroundColor: "#7C3AED20",
    borderLeftWidth: 2,
    borderLeftColor: "#7C3AED",
  },
  itemText: {
    color: "#8E8E9E",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  itemTextSel: {
    color: "#FFF",
    fontFamily: "Inter_700Bold",
  },
});
