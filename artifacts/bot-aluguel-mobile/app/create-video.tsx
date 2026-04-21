import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
  { key: "tiktok",    label: "TikTok",    color: "#FF0050", icon: "music" },
  { key: "instagram", label: "Instagram", color: "#E4405F", icon: "instagram" },
  { key: "youtube",   label: "YouTube",   color: "#FF0000", icon: "youtube" },
] as const;

export default function CreateVideoScreen() {
  const insets = useSafeAreaInsets();
  const { addPost } = useApp();

  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<string[]>(["tiktok", "instagram", "youtube"]);
  const [scheduleNow, setScheduleNow] = useState(true);
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = (key: string) => {
    setSelected((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
    Haptics.selectionAsync();
  };

  const handleSubmit = async () => {
    setError(null);
    if (!videoUrl.trim()) {
      setError("Cole o link do seu vídeo (TikTok, Instagram, YouTube ou direto .mp4).");
      return;
    }
    if (selected.length === 0) {
      setError("Escolha pelo menos uma plataforma para publicar.");
      return;
    }
    const time = scheduleNow ? new Date().toISOString() : (scheduledTime || new Date().toISOString());
    setLoading(true);
    try {
      const result = await schedulePostsBatch({
        posts: [
          {
            videoUrl: videoUrl.trim(),
            time,
            platforms: selected,
          },
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
        status: result.success ? (scheduleNow ? "processing" : "scheduled") : "failed",
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
          colors={["rgba(109,40,217,0.3)", "transparent"]}
          style={[s.blob, { top: -100, left: -60, width: 280, height: 280 }]}
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

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
          <View style={s.heroCard}>
            <View style={s.heroIcon}>
              <Feather name="video" size={26} color="#A78BFA" />
            </View>
            <Text style={s.heroTitle}>Publicar vídeo automaticamente</Text>
            <Text style={s.heroDesc}>
              Cole o link de um vídeo (TikTok, Instagram, YouTube ou link direto). Nossa automação processa e publica nas plataformas que você escolher.
            </Text>
          </View>

          <Text style={s.label}>LINK DO VÍDEO</Text>
          <View style={s.inputWrap}>
            <Feather name="link" size={16} color="#8E8E9E" style={{ marginLeft: 12 }} />
            <TextInput
              style={s.input}
              placeholder="https://www.tiktok.com/@user/video/..."
              placeholderTextColor="#6B7280"
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>

          <Text style={s.label}>TÍTULO (OPCIONAL)</Text>
          <View style={s.inputWrap}>
            <Feather name="type" size={16} color="#8E8E9E" style={{ marginLeft: 12 }} />
            <TextInput
              style={s.input}
              placeholder="Ex: Receita rápida de bolo"
              placeholderTextColor="#6B7280"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <Text style={s.label}>PUBLICAR EM</Text>
          <View style={s.platformGrid}>
            {PLATFORMS.map((p) => {
              const on = selected.includes(p.key);
              return (
                <Pressable
                  key={p.key}
                  style={[s.platformCard, on && { borderColor: p.color, backgroundColor: p.color + "15" }]}
                  onPress={() => togglePlatform(p.key)}
                >
                  <Feather name={p.icon as any} size={22} color={on ? p.color : "#8E8E9E"} />
                  <Text style={[s.platformLabel, on && { color: "#EBEBF2" }]}>{p.label}</Text>
                  {on && (
                    <View style={[s.checkBadge, { backgroundColor: p.color }]}>
                      <Feather name="check" size={10} color="#FFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={s.label}>QUANDO PUBLICAR</Text>
          <View style={s.scheduleRow}>
            <Pressable
              style={[s.scheduleBtn, scheduleNow && s.scheduleBtnActive]}
              onPress={() => setScheduleNow(true)}
            >
              <Feather name="zap" size={14} color={scheduleNow ? "#A78BFA" : "#8E8E9E"} />
              <Text style={[s.scheduleText, scheduleNow && s.scheduleTextActive]}>Agora</Text>
            </Pressable>
            <Pressable
              style={[s.scheduleBtn, !scheduleNow && s.scheduleBtnActive]}
              onPress={() => setScheduleNow(false)}
            >
              <Feather name="calendar" size={14} color={!scheduleNow ? "#A78BFA" : "#8E8E9E"} />
              <Text style={[s.scheduleText, !scheduleNow && s.scheduleTextActive]}>Agendar</Text>
            </Pressable>
          </View>

          {!scheduleNow && (
            <View style={s.inputWrap}>
              <Feather name="clock" size={16} color="#8E8E9E" style={{ marginLeft: 12 }} />
              <TextInput
                style={s.input}
                placeholder="2026-04-22T18:00:00Z"
                placeholderTextColor="#6B7280"
                value={scheduledTime}
                onChangeText={setScheduledTime}
                autoCapitalize="none"
              />
            </View>
          )}

          {error && (
            <View style={s.errorBox}>
              <Feather name="alert-triangle" size={14} color="#EF4444" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [s.submitBtn, pressed && { opacity: 0.85 }, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <LinearGradient
              colors={["#7C3AED", "#4F46E5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.submitGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Feather name="send" size={16} color="#FFF" />
                  <Text style={s.submitText}>Enviar para publicação</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          <Text style={s.helper}>
            Powered by n8n. Seu vídeo é processado pela nossa automação e publicado nas redes selecionadas. Acompanhe o status na aba Vídeos.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0C0C11" },
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
  heroCard: {
    backgroundColor: "#13131D",
    borderWidth: 1,
    borderColor: "#20202B",
    borderRadius: 18,
    padding: 18,
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 24,
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#6D28D920",
    borderWidth: 1,
    borderColor: "#6D28D940",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { fontSize: 16, color: "#EBEBF2", fontFamily: "Inter_700Bold" },
  heroDesc: { fontSize: 12, color: "#8E8E9E", fontFamily: "Inter_400Regular", lineHeight: 18 },
  label: {
    fontSize: 11,
    color: "#8E8E9E",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 4,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#13131D",
    borderWidth: 1,
    borderColor: "#20202B",
    borderRadius: 12,
    marginBottom: 18,
  },
  input: {
    flex: 1,
    color: "#EBEBF2",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    padding: 12,
  },
  platformGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  platformCard: {
    flex: 1,
    backgroundColor: "#13131D",
    borderWidth: 1.5,
    borderColor: "#20202B",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  platformLabel: { fontSize: 11, color: "#8E8E9E", fontFamily: "Inter_600SemiBold" },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  scheduleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#13131D",
    borderWidth: 1,
    borderColor: "#20202B",
    borderRadius: 10,
    paddingVertical: 11,
  },
  scheduleBtnActive: { borderColor: "#6D28D9", backgroundColor: "#6D28D915" },
  scheduleText: { color: "#8E8E9E", fontFamily: "Inter_600SemiBold", fontSize: 12 },
  scheduleTextActive: { color: "#EBEBF2" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EF444415",
    borderWidth: 1,
    borderColor: "#EF444440",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: "#EF4444", flex: 1, fontFamily: "Inter_500Medium", fontSize: 12 },
  submitBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  submitText: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 14 },
  helper: { fontSize: 11, color: "#6B7280", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 17, marginTop: 16, paddingHorizontal: 8 },
});
