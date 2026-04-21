import { useGetDashboardStats, useGetUnreadCount } from "@workspace/api-client-react";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { ErrorView } from "@/components/StateViews";
import { DashboardSkeleton } from "@/components/SkeletonLoader";

function daysUntil(date: string | Date | null | undefined): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const PLATFORM_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  tiktok:    { color: "#FF0050", bg: "#FF005015", icon: "music",     label: "TikTok" },
  instagram: { color: "#E4405F", bg: "#E4405F15", icon: "instagram", label: "Instagram" },
  youtube:   { color: "#FF0000", bg: "#FF000015", icon: "youtube",   label: "YouTube" },
};

const STATUS_CFG: Record<string, { color: string; label: string }> = {
  sent:       { color: "#22C55E", label: "Publicado" },
  scheduled:  { color: "#A78BFA", label: "Agendado" },
  pending:    { color: "#F59E0B", label: "Pendente" },
  processing: { color: "#3B82F6", label: "Processando" },
  failed:     { color: "#EF4444", label: "Falhou" },
};

function formatNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
  return String(n);
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { posts } = useApp();
  const { data, isLoading, isError, refetch, isRefetching } = useGetDashboardStats();
  const { data: unreadData } = useGetUnreadCount();

  const unreadCount = (unreadData as any)?.count ?? 0;
  const paddingBottom = Platform.OS === "web" ? 34 + 110 : insets.bottom + 110;

  const totalVideos = posts.length;
  const publishedVideos = posts.filter((p) => p.status === "sent").length;
  const scheduledVideos = posts.filter((p) => p.status === "scheduled" || p.status === "processing" || p.status === "pending").length;
  const failedVideos = posts.filter((p) => p.status === "failed").length;

  const activePlan = data?.activePlan ?? null;
  const planExpiresAt = data?.planExpiresAt ?? null;
  const daysLeft = daysUntil(planExpiresAt);

  const recentVideos = useMemo(() => posts.slice(0, 4), [posts]);

  const paddingTop = Platform.OS === "web" ? insets.top + 48 : insets.top + 12;

  return (
    <View style={s.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6D28D9" />
        }
      >
        <View style={[s.header, { paddingTop }]}>
          <View style={s.headerIcon}>
            <Feather name="video" size={16} color="#EBEBF2" />
            <View style={s.headerOnline} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Nex Bot</Text>
            <View style={s.headerMeta}>
              <View style={s.proBadge}>
                <Text style={s.proBadgeText}>AUTO</Text>
              </View>
              <Text style={s.headerSub}>{user?.name ?? "Usuário"}</Text>
            </View>
          </View>
          <Pressable
            style={s.bellBtn}
            onPress={() => router.push("/notifications" as any)}
            accessibilityLabel="Notificações"
            accessibilityRole="button"
          >
            <Feather name="bell" size={20} color="#8E8E9E" />
            {unreadCount > 0 && (
              <View style={s.bellBadge}>
                <Text style={s.bellBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={s.avatarBtn}
            onPress={() => router.push("/(tabs)/settings")}
            accessibilityLabel="Configurações"
            accessibilityRole="button"
          >
            <Text style={s.avatarText}>{user?.name?.charAt(0).toUpperCase() ?? "U"}</Text>
          </Pressable>
        </View>

        {isLoading && !data ? (
          <DashboardSkeleton />
        ) : isError && !data ? (
          <ErrorView message="Não foi possível carregar o painel" onRetry={refetch} />
        ) : (
          <>
            <Pressable
              style={({ pressed }) => [s.createCard, pressed && { opacity: 0.92 }]}
              onPress={() => router.push("/create-video" as any)}
            >
              <View style={s.createHeader}>
                <View style={s.createIconWrap}>
                  <Feather name="plus" size={16} color="#A78BFA" />
                </View>
                <Text style={s.createTitle}>Postar novo vídeo</Text>
              </View>
              <Text style={s.createDesc}>Cole o link de um TikTok, Instagram ou YouTube e publique automaticamente nas redes selecionadas.</Text>
              <View style={s.platformRow}>
                {(["tiktok", "instagram", "youtube"] as const).map((platform) => {
                  const cfg = PLATFORM_CONFIG[platform];
                  return (
                    <View key={platform} style={s.platformBtn}>
                      <View style={[s.platformIconWrap, { backgroundColor: cfg.bg }]}>
                        <Feather name={cfg.icon as any} size={20} color={cfg.color} />
                      </View>
                      <Text style={s.platformLabel}>{cfg.label}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={s.createCta}>
                <Feather name="send" size={13} color="#A78BFA" />
                <Text style={s.createCtaText}>Tocar para publicar</Text>
              </View>
            </Pressable>

            <View style={s.sectionHeader}>
              <Text style={s.sectionLabel}>VISÃO GERAL</Text>
              <Pressable onPress={() => router.push("/(tabs)/bots")}>
                <Text style={s.sectionLink}>Ver todos <Feather name="chevron-right" size={12} color="#6D28D9" /></Text>
              </Pressable>
            </View>
            <View style={s.statsRow}>
              <View style={s.statCard}>
                <View style={s.statIconRow}>
                  <View style={s.statIconWrap}>
                    <Feather name="check-circle" size={14} color="#22C55E" />
                  </View>
                  <Text style={s.statCardLabel}>Publicados</Text>
                </View>
                <View style={s.statValueRow}>
                  <Text style={s.statBigNum}>{publishedVideos}</Text>
                  <Text style={s.statSmallNum}>/ {totalVideos} total</Text>
                </View>
              </View>
              <View style={s.statCard}>
                <View style={s.statIconRow}>
                  <View style={s.statIconWrap}>
                    <Feather name="clock" size={14} color="#A78BFA" />
                  </View>
                  <Text style={s.statCardLabel}>Em Fila</Text>
                </View>
                <View style={s.statValueRow}>
                  <Text style={s.statBigNum}>{formatNum(scheduledVideos)}</Text>
                  {failedVideos > 0 && <Text style={s.statRed}>{failedVideos} falhas</Text>}
                </View>
              </View>
            </View>

            {recentVideos.length === 0 ? (
              <Pressable
                style={({ pressed }) => [s.firstBotCard, pressed && { opacity: 0.85 }]}
                onPress={() => router.push("/create-video" as any)}
                accessibilityLabel="Postar primeiro vídeo"
                accessibilityRole="button"
              >
                <View style={s.firstBotIconWrap}>
                  <Feather name="video" size={24} color="#A78BFA" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.firstBotTitle}>Poste seu primeiro vídeo</Text>
                  <Text style={s.firstBotSub}>Cole um link e publique nas suas redes em segundos.</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#6D28D9" />
              </Pressable>
            ) : (
              <>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionLabel}>VÍDEOS RECENTES</Text>
                  <View style={s.totalBadge}>
                    <Text style={s.totalBadgeText}>{posts.length} Total</Text>
                  </View>
                </View>

                {recentVideos.map((post) => {
                  const st = STATUS_CFG[post.status] ?? STATUS_CFG.pending;
                  const firstPlatform = PLATFORM_CONFIG[post.platforms[0]] ?? PLATFORM_CONFIG.tiktok;
                  return (
                    <Pressable
                      key={post.id}
                      style={({ pressed }) => [s.botCard, pressed && { opacity: 0.85 }]}
                      onPress={() => Linking.openURL(post.videoUrl).catch(() => {})}
                    >
                      <View style={[s.botTopGlow, { backgroundColor: firstPlatform.color }]} />
                      <View style={s.botTop}>
                        <View style={s.botInfo}>
                          <View style={[s.botIconWrap, { backgroundColor: firstPlatform.bg }]}>
                            <Feather name={firstPlatform.icon as any} size={18} color={firstPlatform.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.botName} numberOfLines={1}>{post.title?.trim() || "Vídeo enviado"}</Text>
                            <View style={s.botBadgeRow}>
                              {post.platforms.slice(0, 3).map((p) => {
                                const cfg = PLATFORM_CONFIG[p] ?? firstPlatform;
                                return (
                                  <View key={p} style={[s.platBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + "30" }]}>
                                    <Text style={[s.platBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                                  </View>
                                );
                              })}
                              <View style={s.statusPill}>
                                <View style={[s.statusDot, { backgroundColor: st.color }]} />
                                <Text style={[s.statusText, { color: st.color }]}>{st.label.toUpperCase()}</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                        <Pressable
                          style={s.botMenuBtn}
                          onPress={() => router.push("/(tabs)/bots")}
                        >
                          <Feather name="more-vertical" size={16} color="#8E8E9E" />
                        </Pressable>
                      </View>
                      <View style={s.botBottom}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={s.botVolumeLabel}>LINK</Text>
                          <Text style={s.botVolumeValue} numberOfLines={1}>{post.videoUrl}</Text>
                        </View>
                        <Pressable
                          style={({ pressed }) => [s.builderBtn, pressed && { opacity: 0.8 }]}
                          onPress={() => router.push("/(tabs)/bots")}
                        >
                          <Feather name="settings" size={14} color="#EBEBF2" />
                          <Text style={s.builderBtnText}>Gerenciar</Text>
                        </Pressable>
                      </View>
                    </Pressable>
                  );
                })}
              </>
            )}

            {activePlan ? (
              <Pressable
                style={({ pressed }) => [s.planCard, pressed && { opacity: 0.9 }]}
                onPress={() => router.push("/(tabs)/plans")}
                accessibilityLabel="Ver detalhes do plano"
                accessibilityRole="button"
              >
                <View style={s.planTop}>
                  <View style={s.planIconWrap}>
                    <Feather name="credit-card" size={18} color="#A78BFA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.planTitle}>{activePlan}</Text>
                    <Text style={s.planSub}>
                      {daysLeft === null
                        ? "Plano ativo"
                        : daysLeft === 0
                        ? "Expira hoje"
                        : `Expira em ${daysLeft} dias`}
                    </Text>
                  </View>
                  <View style={s.planActiveBadge}>
                    <Feather name="check-circle" size={12} color="#22C55E" />
                    <Text style={s.planActiveText}>ATIVO</Text>
                  </View>
                </View>
                <View style={s.meterSection}>
                  <View style={s.meterHeader}>
                    <Text style={s.meterLabel}>Vídeos publicados</Text>
                    <Text style={s.meterValue}>{publishedVideos}</Text>
                  </View>
                  <View style={s.meterTrack}>
                    <View style={[s.meterFill, { width: `${Math.min((publishedVideos / 50) * 100, 100)}%` as any }]} />
                  </View>
                </View>
                <View style={s.meterSection}>
                  <View style={s.meterHeader}>
                    <Text style={s.meterLabel}>Em fila</Text>
                    <Text style={s.meterValue}>{scheduledVideos} <Text style={s.meterMax}>/ {totalVideos} total</Text></Text>
                  </View>
                  <View style={s.meterTrack}>
                    <View style={[s.meterFillGreen, { width: totalVideos > 0 ? `${Math.min((scheduledVideos / totalVideos) * 100, 100)}%` as any : "0%" }]} />
                  </View>
                </View>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [s.upgradeBanner, pressed && { opacity: 0.85 }]}
                onPress={() => router.push("/(tabs)/plans")}
                accessibilityLabel="Ativar plano"
                accessibilityRole="button"
              >
                <View style={s.upgradeLeft}>
                  <View style={s.upgradeIconWrap}>
                    <Feather name="zap" size={20} color="#A78BFA" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.upgradeTitle}>Ative um plano</Text>
                    <Text style={s.upgradeSub}>Desbloqueie publicação ilimitada e recursos avançados</Text>
                  </View>
                </View>
                <View style={s.upgradeArrow}>
                  <Feather name="arrow-right" size={16} color="#A78BFA" />
                </View>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0C0C11" },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#20202B40",
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#6D28D930",
    backgroundColor: "#0C0C11",
    alignItems: "center",
    justifyContent: "center",
  },
  headerOnline: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#0C0C11",
  },
  headerTitle: { fontSize: 16, color: "#EBEBF2", fontFamily: "Inter_600SemiBold" },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  proBadge: {
    backgroundColor: "#6D28D915",
    borderWidth: 1,
    borderColor: "#6D28D930",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proBadgeText: { fontSize: 10, color: "#A78BFA", fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  headerSub: { fontSize: 11, color: "#8E8E9E", fontFamily: "Inter_400Regular" },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#13131D",
    borderWidth: 1,
    borderColor: "#20202B",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#0C0C11",
  },
  bellBadgeText: { fontSize: 9, color: "#FFF", fontFamily: "Inter_700Bold" },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#13131D",
    borderWidth: 1,
    borderColor: "#20202B",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#8E8E9E", fontSize: 14, fontFamily: "Inter_600SemiBold" },

  createCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    backgroundColor: "#13131D",
    borderWidth: 1,
    borderColor: "#20202B",
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  createHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  createIconWrap: { padding: 6, backgroundColor: "#6D28D915", borderRadius: 8 },
  createTitle: { fontSize: 17, color: "#EBEBF2", fontFamily: "Inter_600SemiBold" },
  createDesc: { fontSize: 13, color: "#8E8E9E", fontFamily: "Inter_400Regular", lineHeight: 19 },
  platformRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  platformBtn: {
    flex: 1,
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#20202B",
    backgroundColor: "#0C0C11",
  },
  platformIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  platformLabel: { fontSize: 11, color: "#EBEBF2", fontFamily: "Inter_600SemiBold" },
  createCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4, paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#20202B60" },
  createCtaText: { color: "#A78BFA", fontFamily: "Inter_600SemiBold", fontSize: 12 },

  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, marginBottom: 12,
  },
  sectionLabel: { fontSize: 11, color: "#8E8E9E", fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  sectionLink: { fontSize: 12, color: "#6D28D9", fontFamily: "Inter_500Medium" },
  totalBadge: { backgroundColor: "#13131D", borderWidth: 1, borderColor: "#20202B", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  totalBadgeText: { fontSize: 11, color: "#8E8E9E", fontFamily: "Inter_500Medium" },

  statsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: "#13131D", borderWidth: 1, borderColor: "#20202B", borderRadius: 16, padding: 16, gap: 10 },
  statIconRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statIconWrap: { padding: 4, backgroundColor: "#20202B", borderRadius: 6 },
  statCardLabel: { fontSize: 12, color: "#8E8E9E", fontFamily: "Inter_500Medium" },
  statValueRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  statBigNum: { fontSize: 28, color: "#EBEBF2", fontFamily: "Inter_700Bold" },
  statSmallNum: { fontSize: 12, color: "#8E8E9E", fontFamily: "Inter_500Medium" },
  statRed: { fontSize: 12, color: "#EF4444", fontFamily: "Inter_600SemiBold" },

  firstBotCard: {
    marginHorizontal: 20, marginBottom: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#13131D", borderWidth: 1, borderColor: "#6D28D930", borderRadius: 16, padding: 16,
  },
  firstBotIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: "#6D28D920", alignItems: "center", justifyContent: "center" },
  firstBotTitle: { fontSize: 14, color: "#EBEBF2", fontFamily: "Inter_700Bold" },
  firstBotSub: { fontSize: 11, color: "#8E8E9E", fontFamily: "Inter_400Regular", marginTop: 2 },

  botCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: "#13131D", borderWidth: 1, borderColor: "#20202B", borderRadius: 16, overflow: "hidden" },
  botTopGlow: { height: 1, opacity: 0.4 },
  botTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", padding: 16, paddingBottom: 0 },
  botInfo: { flexDirection: "row", alignItems: "flex-start", gap: 12, flex: 1 },
  botIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  botName: { fontSize: 15, color: "#EBEBF2", fontFamily: "Inter_600SemiBold" },
  botBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" },
  platBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  platBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#0C0C11", borderWidth: 1, borderColor: "#20202B", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  botMenuBtn: { padding: 4 },
  botBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 14, marginTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#20202B60", gap: 12 },
  botVolumeLabel: { fontSize: 9, color: "#8E8E9E", fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  botVolumeValue: { fontSize: 12, color: "#EBEBF2", fontFamily: "Inter_500Medium", marginTop: 2 },
  builderBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#1E1E28", borderWidth: 1, borderColor: "#20202B", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  builderBtnText: { fontSize: 12, color: "#EBEBF2", fontFamily: "Inter_600SemiBold" },

  planCard: { marginHorizontal: 20, marginTop: 12, backgroundColor: "#0C0C11", borderWidth: 1, borderColor: "#20202B", borderRadius: 16, padding: 20, gap: 16 },
  planTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  planIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#13131D", borderWidth: 1, borderColor: "#20202B", alignItems: "center", justifyContent: "center" },
  planTitle: { fontSize: 14, color: "#EBEBF2", fontFamily: "Inter_700Bold" },
  planSub: { fontSize: 11, color: "#8E8E9E", fontFamily: "Inter_500Medium", marginTop: 2 },
  planActiveBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#22C55E15", borderWidth: 1, borderColor: "#22C55E30", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  planActiveText: { color: "#22C55E", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  meterSection: { gap: 6 },
  meterHeader: { flexDirection: "row", justifyContent: "space-between" },
  meterLabel: { fontSize: 11, color: "#8E8E9E", fontFamily: "Inter_500Medium" },
  meterValue: { fontSize: 12, color: "#EBEBF2", fontFamily: "Inter_700Bold" },
  meterMax: { color: "#8E8E9E", fontFamily: "Inter_500Medium" },
  meterTrack: { height: 6, backgroundColor: "#13131D", borderRadius: 3, overflow: "hidden" },
  meterFill: { height: 6, backgroundColor: "#A78BFA", borderRadius: 3 },
  meterFillGreen: { height: 6, backgroundColor: "#22C55E", borderRadius: 3 },

  upgradeBanner: { marginHorizontal: 20, marginTop: 12, backgroundColor: "#13131D", borderWidth: 1, borderColor: "#6D28D930", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  upgradeLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  upgradeIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#6D28D920", alignItems: "center", justifyContent: "center" },
  upgradeTitle: { fontSize: 14, color: "#EBEBF2", fontFamily: "Inter_700Bold" },
  upgradeSub: { fontSize: 11, color: "#8E8E9E", fontFamily: "Inter_400Regular", marginTop: 2 },
  upgradeArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#6D28D915", alignItems: "center", justifyContent: "center" },
});
