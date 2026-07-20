import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';
import { useColorScheme } from 'nativewind';

export interface AlertButton {
  text?: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertConfig {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  options?: { cancelable?: boolean };
}

let alertListener: ((config: AlertConfig | null) => void) | null = null;

export const customAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: { cancelable?: boolean }
  ) => {
    if (alertListener) {
      alertListener({ title, message, buttons, options });
    } else {
      console.warn('CustomAlertContainer chưa được gắn kết vào App root!');
    }
  }
};

export default function CustomAlertContainer() {
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    alertListener = setConfig;
    return () => {
      alertListener = null;
    };
  }, []);

  if (!config) return null;

  const handleButtonPress = (btnPress?: () => void) => {
    setConfig(null);
    if (btnPress) {
      btnPress();
    }
  };

  const defaultButtons: AlertButton[] = [{ text: 'OK' }];
  const activeButtons = config.buttons && config.buttons.length > 0 ? config.buttons : defaultButtons;
  const isRow = activeButtons.length <= 2;

  return (
    <Modal
      transparent
      visible={true}
      animationType="fade"
      onRequestClose={() => {
        if (config.options?.cancelable) setConfig(null);
      }}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={() => {
          if (config.options?.cancelable) setConfig(null);
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={[
            styles.alertBox,
            {
              backgroundColor: isDark ? '#1C162E' : '#FFFFFF',
              borderColor: isDark ? '#2E2840' : '#E2E8F0',
            }
          ]}
        >
          {/* Title */}
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
            {config.title}
          </Text>

          {/* Message */}
          {config.message && (
            <Text style={[styles.message, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              {config.message}
            </Text>
          )}

          {/* Action Buttons */}
          <View 
            style={[
              isRow ? styles.rowButtons : styles.colButtons,
              { borderTopColor: isDark ? '#2E2840' : '#E2E8F0' }
            ]}
          >
            {activeButtons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              
              let textColor = '#038eff';
              if (isDestructive) textColor = '#EF4444';
              else if (isCancel) textColor = isDark ? '#94A3B8' : '#64748B';

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isRow ? { flex: 1 } : { width: '100%' },
                    index > 0 && isRow ? styles.borderLeft : null,
                    index > 0 && !isRow ? styles.borderTop : null,
                    { 
                      borderLeftColor: isDark ? '#2E2840' : '#E2E8F0', 
                      borderTopColor: isDark ? '#2E2840' : '#E2E8F0' 
                    }
                  ]}
                  onPress={() => handleButtonPress(btn.onPress)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.btnText,
                      {
                        color: textColor,
                        fontWeight: isCancel ? 'normal' : 'bold',
                      }
                    ]}
                  >
                    {btn.text || ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: Dimensions.get('window').width * 0.82,
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    paddingTop: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
    lineHeight: 20,
  },
  rowButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    width: '100%',
  },
  colButtons: {
    flexDirection: 'column',
    borderTopWidth: 1,
    width: '100%',
  },
  button: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borderLeft: {
    borderLeftWidth: 1,
  },
  borderTop: {
    borderTopWidth: 1,
  },
  btnText: {
    fontSize: 16,
  },
});
