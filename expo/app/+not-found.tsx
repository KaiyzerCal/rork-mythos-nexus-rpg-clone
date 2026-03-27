import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Lost in the Abyss" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Realm Not Found</Text>
        <Text style={styles.subtitle}>This domain does not exist in the Tower of Aevara</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Return to Status</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#0A0A0A",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold" as const,
    color: "#DC143C",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
  },
  link: {
    marginTop: 15,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 8,
  },
  linkText: {
    fontSize: 14,
    color: "#FFD700",
    fontWeight: "700" as const,
  },
});
