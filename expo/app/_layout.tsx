// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { GameProvider } from "@/contexts/GameContext";
import { MavisMemoryProvider } from "@/contexts/MavisMemoryContext";
import { MavisPrimeMemoryProvider } from "@/contexts/MavisPrimePersistentMemory";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GameProvider>
          <MavisMemoryProvider>
            <MavisPrimeMemoryProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </MavisPrimeMemoryProvider>
          </MavisMemoryProvider>
        </GameProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
