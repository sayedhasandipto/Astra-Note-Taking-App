import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============ iOS Blue Palette ============
const IOS_BLUE = "#007AFF";

const NOTE_COLORS = [
  { bg: "#E8F0FE", bar: "#5B9BF5" }, // blue
  { bg: "#FCE8E6", bar: "#F26B5E" }, // red
  { bg: "#E6F4EA", bar: "#4CAF7A" }, // green
  { bg: "#FEF7E0", bar: "#F4B93E" }, // yellow
  { bg: "#F3E8FD", bar: "#A876E0" }, // purple
  { bg: "#F1F3F4", bar: "#9AA0A6" }, // gray
];

// ============ Themes ============
const lightTheme = {
  bg: "#FFFFFF",
  bgSecondary: "#F2F2F7",
  card: "#FFFFFF",
  text: "#000000",
  subText: "#6E6E73",
  hint: "#AEAEB2",
  border: "#E5E5EA",
  searchBg: "#F2F2F7",
  iconBg: "#F2F2F7",
  iconColor: "#1C1C1E",
  headerBg: "#FFFFFF",
};

const darkTheme = {
  bg: "#000000",
  bgSecondary: "#1C1C1E",
  card: "#1C1C1E",
  text: "#FFFFFF",
  subText: "#AEAEB2",
  hint: "#6E6E73",
  border: "#2C2C2E",
  searchBg: "#1C1C1E",
  iconBg: "#1C1C1E",
  iconColor: "#FFFFFF",
  headerBg: "#000000",
};

export default function App() {
  const [screen, setScreen] = useState("home");
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [colorIndex, setColorIndex] = useState(0);
  const [isDark, setIsDark] = useState(false);

  const theme = isDark ? darkTheme : lightTheme;
  const styles = getStyles(theme);

  // ============ Load & Save ============
  useEffect(() => {
    loadNotes();
    loadTheme();
  }, []);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    saveTheme(isDark);
  }, [isDark]);

  const loadNotes = async () => {
    try {
      const stored = await AsyncStorage.getItem("@notes");
      if (stored !== null) setNotes(JSON.parse(stored));
    } catch (e) {
      console.log("Load error:", e);
    }
  };

  const saveNotes = async (data) => {
    try {
      await AsyncStorage.setItem("@notes", JSON.stringify(data));
    } catch (e) {
      console.log("Save error:", e);
    }
  };

  const loadTheme = async () => {
    try {
      const stored = await AsyncStorage.getItem("@dark");
      if (stored !== null) setIsDark(JSON.parse(stored));
    } catch (e) {
      console.log("Theme load error:", e);
    }
  };

  const saveTheme = async (val) => {
    try {
      await AsyncStorage.setItem("@dark", JSON.stringify(val));
    } catch (e) {
      console.log("Theme save error:", e);
    }
  };

  // ============ Note actions ============
  const handleSave = () => {
    if (title.trim() === "") {
      Alert.alert("শিরোনাম দিন", "নোটের একটা শিরোনাম দিতে হবে।");
      return;
    }

    const now = new Date().toISOString();

    if (editingId) {
      setNotes(
        notes.map((n) =>
          n.id === editingId
            ? { ...n, title, content, colorIndex, updatedAt: now }
            : n,
        ),
      );
    } else {
      const newNote = {
        id: Date.now().toString(),
        title,
        content,
        colorIndex,
        createdAt: now,
        updatedAt: now,
      };
      setNotes([newNote, ...notes]);
    }

    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
    setColorIndex(0);
    setScreen("home");
  };

  const openEdit = (note) => {
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note.id);
    setColorIndex(note.colorIndex ?? 0);
    setScreen("edit");
  };

  const confirmDelete = (id) => {
    Alert.alert("নোট মুছবেন?", "এই নোটটা পুরোপুরি মুছে যাবে।", [
      { text: "বাতিল", style: "cancel" },
      {
        text: "মুছুন",
        style: "destructive",
        onPress: () => setNotes(notes.filter((n) => n.id !== id)),
      },
    ]);
  };

  const formatDate = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const day = d.getDate();
    const monthNames = [
      "জানু",
      "ফেব",
      "মার্চ",
      "এপ্রি",
      "মে",
      "জুন",
      "জুল",
      "আগ",
      "সেপ",
      "অক্টো",
      "নভে",
      "ডিসে",
    ];
    const month = monthNames[d.getMonth()];
    let hour = d.getHours();
    const min = d.getMinutes().toString().padStart(2, "0");
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${day} ${month}, ${hour}:${min} ${ampm}`;
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()),
  );

  // ============ HOME SCREEN ============
  if (screen === "home") {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.bg}
        />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Notes</Text>
            <Text style={styles.headerSubtitle}>
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setIsDark(!isDark)}
            activeOpacity={0.6}
          >
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={22}
              color={theme.iconColor}
            />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={theme.hint} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={theme.hint}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={theme.hint} />
            </TouchableOpacity>
          )}
        </View>

        {/* Notes List */}
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const palette = NOTE_COLORS[item.colorIndex ?? 0];
            return (
              <TouchableOpacity
                style={styles.noteCard}
                onPress={() => openEdit(item)}
                onLongPress={() => confirmDelete(item.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.colorBar, { backgroundColor: palette.bar }]}
                />
                <View style={styles.noteBody}>
                  <Text style={styles.noteTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.content ? (
                    <Text style={styles.noteContent} numberOfLines={2}>
                      {item.content}
                    </Text>
                  ) : (
                    <Text style={styles.noteEmpty}>No additional text</Text>
                  )}
                  <View style={styles.noteMetaRow}>
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={theme.hint}
                    />
                    <Text style={styles.noteDate}>
                      {formatDate(item.updatedAt || item.createdAt)}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.hint} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name={search ? "search-outline" : "document-text-outline"}
                  size={44}
                  color={theme.hint}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {search ? "No results" : "No notes yet"}
              </Text>
              <Text style={styles.emptyText}>
                {search
                  ? "Try searching something else"
                  : "Tap the + button to add your first note"}
              </Text>
            </View>
          }
        />

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            resetForm();
            setScreen("add");
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ============ ADD / EDIT SCREEN ============
  const isEditing = screen === "edit";
  const palette = NOTE_COLORS[colorIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.bg}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.editorHeader}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={resetForm}
            activeOpacity={0.6}
          >
            <Ionicons name="chevron-back" size={24} color={IOS_BLUE} />
          </TouchableOpacity>
          <Text style={styles.editorHeaderTitle}>
            {isEditing ? "Edit Note" : "New Note"}
          </Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleSave}
            activeOpacity={0.6}
          >
            <Ionicons name="checkmark" size={26} color={IOS_BLUE} />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.editorBody}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor={theme.hint}
            autoFocus={!isEditing}
          />
          <View style={styles.divider} />
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="Start typing..."
            placeholderTextColor={theme.hint}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Color Picker */}
        <View style={styles.colorBarBottom}>
          <Text style={styles.pickerLabel}>COLOR</Text>
          <View style={styles.colorRow}>
            {NOTE_COLORS.map((c, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.colorDot,
                  { backgroundColor: c.bar },
                  colorIndex === idx && styles.colorDotSelected,
                ]}
                onPress={() => setColorIndex(idx)}
                activeOpacity={0.7}
              >
                {colorIndex === idx && (
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: palette.bar }]}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>
              {isEditing ? "Update Note" : "Save Note"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============ STYLES ============
const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    // ---- HEADER ----
    header: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    headerTitle: {
      fontSize: 34,
      fontWeight: "700",
      color: theme.text,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: 13,
      color: theme.subText,
      marginTop: 2,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.iconBg,
      justifyContent: "center",
      alignItems: "center",
    },

    // ---- SEARCH ----
    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.searchBg,
      marginHorizontal: 20,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 2,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      paddingVertical: 10,
      marginLeft: 8,
    },

    // ---- LIST ----
    list: {
      paddingHorizontal: 20,
      paddingBottom: 120,
    },
    noteCard: {
      backgroundColor: theme.card,
      borderRadius: 14,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 12,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: "hidden",
    },
    colorBar: {
      width: 4,
      alignSelf: "stretch",
    },
    noteBody: {
      flex: 1,
      padding: 14,
      paddingLeft: 12,
    },
    noteTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    noteContent: {
      fontSize: 14,
      color: theme.subText,
      lineHeight: 19,
      marginBottom: 6,
    },
    noteEmpty: {
      fontSize: 14,
      color: theme.hint,
      fontStyle: "italic",
      marginBottom: 6,
    },
    noteMetaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    noteDate: {
      fontSize: 12,
      color: theme.hint,
      fontWeight: "500",
    },

    // ---- EMPTY ----
    emptyWrap: {
      alignItems: "center",
      marginTop: 80,
      paddingHorizontal: 40,
    },
    emptyIconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: theme.searchBg,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 18,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: theme.hint,
      textAlign: "center",
      lineHeight: 20,
    },

    // ---- FAB ----
    fab: {
      position: "absolute",
      bottom: 28,
      right: 24,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: IOS_BLUE,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: IOS_BLUE,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 6,
    },

    // ---- EDITOR ----
    editorHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    editorHeaderTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: theme.text,
    },
    editorBody: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    titleInput: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.text,
      paddingVertical: 6,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 12,
    },
    contentInput: {
      fontSize: 16,
      color: theme.text,
      lineHeight: 24,
      minHeight: 200,
      paddingVertical: 4,
    },

    // ---- COLOR PICKER ----
    colorBarBottom: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    pickerLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.hint,
      letterSpacing: 1.2,
      marginBottom: 12,
    },
    colorRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    colorDot: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      justifyContent: "center",
      alignItems: "center",
    },
    colorDotSelected: {
      borderWidth: 3,
      borderColor: "#FFFFFF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    saveBtn: {
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
    },
    saveBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
  });
