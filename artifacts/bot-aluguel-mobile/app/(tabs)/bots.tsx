import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useState, useMemo } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useApp, type VideoPost } from "@/context/AppContext";

const PLATFORM_CFG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  tiktok:    { color: "#FF0050", bg: "#FF005015", icon: "music",      label: "TikTok" },
  instagram: { color: "#E4405F", bg: "#E4405F15", icon: "instagram",  label: "Instagram" },
  youtube:   { color: "#FF0000", bg: "#FF000015", icon: "youtube",    label: "YouTube" },
};

const STATUS_CFG: Record<string, { color: string; label: string; icon: string }> = {
  sent:       { color: "#22C55E", label: "Publicado",  icon: "check-circle" },
  scheduled:  { color: "#A78BFA", label: "Agendado",   icon: "clock" },
  pending:    { color: "#F59E0B", label: "Pendente",   icon: "loader" },
  processing: { color: "#3B82F6", label: "Processando", icon: "refresh-cw" },
  failed:     { color: "#EF4444", label: "Falhou",     icon: "alert-circle" },
};

function VideoCard({ post, onDelete }: { post: VideoPost; onDelete: (id: string) => void }) {
  const st = STATUS_CFG[post.status] ?? STATUS_CFG.pending;
  const dateStr = useMemo(() => {
    try {
      const d = new Date(post.scheduledTime ?? post.timestamp);
      return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }, [post]);

  const shortUrl = post.videoUrl.length > 38 ? post.videoUrl.slice(0, 38) + "…" : post.videoUrl;

  return (
    <View style={card.wrap}>
      <View style={card.inner}>
        <View style={card.iconCircle}>
          <Feather name="video" size={22} color="#A78BFA" />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={card.name} numberOfLines={1}>{post.title?.trim() || "Vídeo enviado"}</Text>
          <Text style={card.url} numberOfLines={1}>{shortUrl}</Text>
          <View style={card.metaRow}>
            <View style={[card.statusPill, { borderColor: st.color + "40" }]}>
              <Feather name={st.icon as any} size={9} color={st.color} />
              <Text style={[card.statusText, { color: st.color }]}>{st.label}</Text>
            </View>
            <Text style={card.detail}>· {dateStr}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [card.actionBtn, pressed && { opacity: 0.6 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL(post.videoUrl).catch(() => {});
          }}
        >
          <Feather name="external-link" size={16} color="#8E8E9E" />
        </Pressable>
      </View>

      <View style={card.platformRow}>
        {post.platforms.map((p) => {
          const cfg = PLATFORM_CFG[p] ?? PLATFORM_CFG.tiktok;
          return (
            <View key={p} style={[card.platBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + "30" }]}>
              <Feather name={cfg.icon as any} size={10} color={cfg.color} />
              <Text style={[card.platText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          );
        })}
      </View>

      <View style={card.actions}>
        <Pressable
          style={({ pressed }) => [card.btn, card.btnOutline, pressed && { opacity: 0.7 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Linking.openURL(post.videoUrl).catch(() => {});
          }}
        >
          <Feather name="play" size={13} color="#8E8E9E" />
          <Text style={card.btnOutlineText}>Ver vídeo</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [card.btn, card.btnPrimary, pressed && { opacity: 0.7 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/create-video" as any);
          }}
        >
          <Feather name="repeat" size={13} color="#FFF" />
          <Text style={card.btnPrimaryText}>Repostar</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [card.btn, card.btnDanger, pressed && { opacity: 0.7 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDelete(post.id);
          }}
        >
          <Feather name="trash-2" size={13} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  );
}

export default function VideosScreen() {
  const insets = useSafeAreaInsets();
  const { posts, deletePost } = useApp();
  const [filter, setFilter] = useState<"all" | "tiktok" | "instagram" | "youtube">("all");

  const paddingBottom = insets.bottom + 110;
  const paddingTop = Platform.OS === "web" ? insets.top + 48 : insets.top + 12;

  const handleDelete = (id: string) => {
    if (Platform.OS === "web") {
      deletePost(id);
      return;
    }
    Alert.alert("Remover vídeo", "Deseja remover este vídeo da sua lista?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Remover", style: "destructive", onPress: () => deletePost(id) },
    ]);
  };

  const filtered = filter === "all" ? posts : posts.filter((p) => p.platforms.includes(filter));

  return (
    <View style={s.root}>
      <View style={s.blobWrap} pointerEvents="none">
        <LinearGradient
          colors={["rgba(109,40,217,0.25)", "transparent"]}
          style={[s.blob, { top: -80, left: -40, width: 240, height: 240 }]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <LinearGradient
          colors={["rgba(167,139,250,0.15)", "transparent"]}
          style={[s.blob, { bottom: -40, right: -40, width: 280, height: 280 }]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <View style={[s.header, { paddingTop }]}>
        <Text style={s.headerTitle}>Meus Vídeos</Text>
        <Pressable
          style={({ pressed }) => [s.addBtn, pressed && { opacity: 0.8 }]}
          onPress={() => router.push("/create-video" as any)}
        >
          <Feather name="plus" size={22} color="#EBEBF2" />
        </Pressable>
      </View>

      <View style={s.tabSegment}>
        {(["all", "tiktok", "instagram", "youtube"] as const).map((tab) => {
          const active = filter === tab;
          const label = tab === "all" ? "Todos" : PLATFORM_CFG[tab]?.label ?? tab;
          const icon = tab === "all" ? "grid" : PLATFORM_CFG[tab]?.icon ?? "circle";
          return (
            <Pressable
              key={tab}
              style={[s.segBtn, active && s.segBtnActive]}
              onPress={() => setFilter(tab)}
            >
              <Feather name={icon as any} size={12} color={active ? "#EBEBF2" : "#8E8E9E"} />
              <Text style={[s.segText, active && s.segTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Feather name="video" size={32} color="#A78BFA" />
            </View>
            <Text style={s.emptyTitle}>Nenhum vídeo enviado</Text>
            <Text style={s.emptyDesc}>
              Toque no botão + para enviar o link do seu primeiro vídeo. Ele será publicado automaticamente nas plataformas escolhidas.
            </Text>
            <Pressable
              style={s.emptyBtn}
              onPress={() => router.push("/create-video" as any)}
              accessibilityLabel="Enviar primeiro vídeo"
              accessibilityRole="button"
            >
              <Feather name="plus" size={14} color="#FFF" />
              <Text style={s.emptyBtnText}>Enviar primeiro vídeo</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => <VideoCard post={item} onDelete={handleDelete} />}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0C0C11" },
  blobWrap: { ...StyleSheet.absoluteFillObject },
  blob: { position: "absolute", borderRadius: 999 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 22, color: "#EBEBF2", fontFamily: "Inter_700Bold" },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#13131D",
    borderWidth: 1,
    borderColor: "#20202B",
    alignItems: "center",
    justifyContent: "center",
  },
  tabSegment: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#13131D",
    borderRadius: 12,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: "#20202B",
  },
  segBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  segBtnActive: { backgroundColor: "#1E1E2A" },
  segText: { fontSize: 11, color: "#8E8E9E", fontFamily: "Inter_600SemiBold" },
  segTextActive: { color: "#EBEBF2" },
  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#13131D",
    borderWidth: 1,
    borderColor: "#20202B",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, color: "#EBEBF2", fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: "#8E8E9E", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19, marginBottom: 20 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#6D28D9",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
  emptyBtnText: { color: "#FFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

const card = StyleSheet.create({
  wrap: {
    backgroundColor: "#13131D",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#20202B",
    overflow: "hidden",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#6D28D920",
    borderWidth: 1,
    borderColor: "#6D28D940",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 14, color: "#EBEBF2", fontFamily: "Inter_600SemiBold" },
  url: { fontSize: 11, color: "#6B7280", fontFamily: "Inter_400Regular", marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0C0C11",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  detail: { fontSize: 11, color: "#8E8E9E", fontFamily: "Inter_400Regular" },
  actionBtn: { padding: 6 },
  platformRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  platBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  platText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  actions: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#20202B60",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnOutline: {
    flex: 1,
    backgroundColor: "#1E1E2A",
    borderWidth: 1,
    borderColor: "#20202B",
  },
  btnOutlineText: { color: "#EBEBF2", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  btnPrimary: { flex: 1, backgroundColor: "#6D28D9" },
  btnPrimaryText: { color: "#FFF", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  btnDanger: {
    width: 38,
    backgroundColor: "#EF444415",
    borderWidth: 1,
    borderColor: "#EF444430",
  },
});
