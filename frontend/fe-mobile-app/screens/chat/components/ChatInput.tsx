import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import socketService from '@/utils/helpers/socket_helper';
import { useColorScheme } from 'nativewind';

interface ChatInputProps {
    onSend?: (text: string, imageUris?: string[]) => void; // Cập nhật để nhận thêm danh sách imageUris
    senderId?: string;
    receiverId?: string;
    groupId?: string;
}

export default function ChatInput({ onSend, senderId, receiverId, groupId }: ChatInputProps) {
    const [text, setText] = useState('');
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const typingTimerRef = useRef<any>(null);
    const isTypingRef = useRef(false);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    // ── Chọn ảnh từ thư viện ──
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All, // Cho phép chọn cả ảnh và video
            allowsMultipleSelection: true, // Cho phép chọn nhiều ảnh
            allowsEditing: false,
            quality: 0.9,
        });

        if (!result.canceled) {
            const uris = result.assets.map(asset => asset.uri);
            setSelectedImages(prev => [...prev, ...uris]);
        }
    };

    const handleTyping = useCallback((value: string) => {
        setText(value);
        if (!senderId || (!receiverId && !groupId)) return;

        if (!isTypingRef.current && value.trim()) {
            isTypingRef.current = true;
            socketService.sendTyping({ senderId, receiverId, groupId });
        }

        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            if (isTypingRef.current) {
                isTypingRef.current = false;
                socketService.stopTyping({ senderId, receiverId, groupId });
            }
        }, 2000);
    }, [senderId, receiverId, groupId]);

    const handleSend = () => {
        if (!senderId) return; // Bảo vệ nếu không có senderId

        if ((text.trim() || selectedImages.length > 0) && onSend) {
            if (isTypingRef.current) {
                isTypingRef.current = false;
                if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                socketService.stopTyping({ senderId, receiverId, groupId });
            }
            onSend(text.trim(), selectedImages);
            setText('');
            setSelectedImages([]);
        }
    };

    return (
        <View className={`border-t p-2 pb-6 w-full ${
            isDark ? 'border-white/10 bg-[#0F0A1F]/90' : 'border-slate-200 bg-[#f7f6f8]/95'
        }`}>
            {/* Preview ảnh trước khi gửi */}
            {selectedImages.length > 0 && (
                <View className="px-4 py-2 flex-row">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                        {selectedImages.map((uri, idx) => (
                            <View key={idx} className="relative">
                                <Image source={{ uri }} className="w-20 h-20 rounded-xl" />
                                <TouchableOpacity 
                                    onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                                >
                                    <MaterialIcons name="close" size={14} color="white" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            <View className="flex-row items-end gap-2 px-2">
                {/* Nút thêm ảnh */}
                <TouchableOpacity 
                    onPress={pickImage}
                    className={`shrink-0 p-3 rounded-full ${
                        isDark ? 'active:bg-white/10' : 'active:bg-slate-200'
                    }`}
                >
                    <MaterialIcons name="add-photo-alternate" size={28} color="#06B6D4" />
                </TouchableOpacity>

                {/* Thanh gõ tin nhắn */}
                <View className={`flex-1 min-w-0 rounded-full border flex-row items-center ${
                    isDark ? 'bg-black/40 border-white/10' : 'bg-white border-slate-300'
                }`}>
                    <TextInput
                        className="flex-1 bg-transparent text-slate-800 dark:text-white px-5 py-3 text-base"
                        placeholder="Nhắn tin..."
                        placeholderTextColor={isDark ? "#94A3B8" : "#64748B"}
                        multiline
                        value={text}
                        onChangeText={handleTyping}
                        style={{ maxHeight: 100 }}
                    />
                </View>

                {/* Nút gửi */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSend}
                    disabled={!text.trim() && selectedImages.length === 0}
                >
                    <View style={{ borderRadius: 999, overflow: 'hidden', elevation: 5 }}>
                        <LinearGradient
                            colors={(text.trim() || selectedImages.length > 0) ? ['#7C3AED', '#F43F5E'] : (isDark ? ['#475569', '#334155'] : ['#CBD5E1', '#E2E8F0'])}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="p-3 shadow-lg"
                            style={{ borderRadius: 999 }}
                        >
                            <MaterialIcons 
                                name="send" 
                                size={24} 
                                color={(text.trim() || selectedImages.length > 0) ? "white" : "#94A3B8"} 
                            />
                        </LinearGradient>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}
