import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Pressable,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useAppDispatch } from '@/store/hook';
import { forgotPasswordThunk } from '@/features/auth/thunk/auth.thunk';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const handleSendReset = async () => {
        if (!email.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email');
            return;
        }

        setIsLoading(true);
        try {
            await dispatch(forgotPasswordThunk({ email: email.trim() })).unwrap();
            Alert.alert(
                'Thành công',
                'Mã xác nhận đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
                [
                    {
                        text: 'Tiếp tục',
                        onPress: () => router.push({
                            pathname: '/(auth)/reset-password',
                            params: { email: email.trim() },
                        }),
                    },
                ]
            );
        } catch (error: any) {
            const errorMsg = error?.message || error?.data || 'Không thể gửi yêu cầu. Vui lòng thử lại.';
            Alert.alert('Lỗi', typeof errorMsg === 'string' ? errorMsg : 'Không thể gửi yêu cầu. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="bg-[#f7f6f8] dark:bg-[#0F0A1F]"
        >
            {/* Ambient background decorations */}
            <View className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-[#7c40ed]/20 rounded-full opacity-20 dark:opacity-40" />
            <View className="absolute -bottom-20 -left-20 w-[250px] h-[250px] bg-[#F43F5E]/20 rounded-full opacity-20 dark:opacity-40" />

            <View className="flex-1 px-6">

                {/* Back Button */}
                <View className="pt-12 pb-8">
                    <Pressable
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full items-center justify-center bg-slate-200/60 dark:bg-white/5 border border-slate-300/50 dark:border-white/10"
                    >
                        <MaterialIcons name="arrow-back" size={20} color={isDark ? "#fff" : "#1E293B"} />
                    </Pressable>
                </View>

                {/* Content Area */}
                <View className="flex-1 items-center justify-center -mt-10">

                    {/* Icon */}
                    <View className="mb-8 items-center justify-center w-24 h-24 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-300/50 dark:border-white/10"
                        style={{
                            shadowColor: '#7c40ed',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: isDark ? 0.6 : 0.3,
                            shadowRadius: 20,
                            elevation: 10,
                        }}
                    >
                        <MaterialIcons name="mark-email-unread" size={48} color="#7c40ed" />
                    </View>

                    {/* Title & Subtitle */}
                    <Text className="text-3xl font-bold text-slate-800 dark:text-white mb-3 text-center">
                        Quên mật khẩu
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-base text-center mb-10 px-4 leading-relaxed">
                        Nhập email đã đăng ký để nhận mã xác nhận đặt lại mật khẩu.
                    </Text>

                    {/* Form */}
                    <View className="w-full gap-5">

                        {/* Email Input */}
                        <View className="relative w-full">
                            <View className="absolute left-5 top-0 bottom-0 items-center justify-center z-10">
                                <MaterialIcons name="mail" size={22} color={isDark ? "#94a3b8" : "#64748b"} />
                            </View>
                            <TextInput
                                className="w-full text-slate-800 dark:text-white text-base rounded-full py-4 pl-14 pr-6 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10"
                                style={{ height: 60 }}
                                placeholder="Địa chỉ Email"
                                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                                editable={!isLoading}
                            />
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleSendReset}
                            activeOpacity={0.88}
                            disabled={isLoading}
                            className={`w-full h-[60px] rounded-full flex-row items-center justify-center gap-2 ${isLoading ? 'bg-[#7C3AED]/70' : 'bg-[#7C3AED]'}`}
                            style={{
                                shadowColor: '#7c3aed',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.5,
                                shadowRadius: 15,
                                elevation: 8,
                            }}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text className="text-white font-bold text-lg">
                                        Gửi mã xác nhận
                                    </Text>
                                    <MaterialIcons name="send" size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Back to Login */}
                    <View className="mt-8">
                        <Pressable
                            onPress={() => router.back()}
                            className="flex-row items-center justify-center gap-1"
                        >
                            <MaterialIcons name="arrow-back-ios" size={14} color="#06B6D4" />
                            <Text className="text-[#06B6D4] font-medium text-base">
                                Quay lại đăng nhập
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* Footer Note */}
                <View className="pb-8 mt-auto">
                    <Text className="text-center text-slate-500 dark:text-white/60 text-sm leading-5">
                        Kiểm tra thư mục Spam nếu bạn không nhận được email trong vài phút.
                    </Text>
                </View>

            </View>
        </ScrollView>
    );
}
