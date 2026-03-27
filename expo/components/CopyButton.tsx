import * as Clipboard from 'expo-clipboard';
import { Copy, Check } from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Alert, Platform } from 'react-native';

interface CopyButtonProps {
  text: string;
  size?: number;
  color?: string;
  label?: string;
  style?: any;
  iconOnly?: boolean;
}

export default function CopyButton({ text, size = 14, color = '#666', label, style, iconOnly = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[CopyButton] Failed to copy:', err);
      if (Platform.OS === 'web') {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          Alert.alert('Copy Failed', 'Could not copy to clipboard');
        }
      }
    }
  }, [text]);

  if (iconOnly) {
    return (
      <TouchableOpacity
        onPress={handleCopy}
        style={[styles.iconButton, style]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.6}
      >
        {copied ? (
          <Check size={size} color="#4CAF50" />
        ) : (
          <Copy size={size} color={color} />
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleCopy}
      style={[styles.button, copied && styles.buttonCopied, style]}
      activeOpacity={0.6}
    >
      {copied ? (
        <View style={styles.row}>
          <Check size={size} color="#4CAF50" />
          <Text style={[styles.label, { color: '#4CAF50' }]}>Copied</Text>
        </View>
      ) : (
        <View style={styles.row}>
          <Copy size={size} color={color} />
          {label && <Text style={[styles.label, { color }]}>{label}</Text>}
        </View>
      )}
    </TouchableOpacity>
  );
}

export function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = useCallback(async (text: string, id?: string) => {
    try {
      await Clipboard.setStringAsync(text);
      if (id) {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
      return true;
    } catch (err) {
      console.error('[useCopyToClipboard] Failed:', err);
      if (Platform.OS === 'web') {
        try {
          await navigator.clipboard.writeText(text);
          if (id) {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
          }
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }, []);

  return { copiedId, copyText };
}

const styles = StyleSheet.create({
  iconButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonCopied: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
});
