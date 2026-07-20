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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useAppDispatch } from '@/store/hook';
import { resetPasswordThunk, forgotPasswordThunk } from '@/features/auth/thunk/auth.thunk';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { email } = useLocalSearchParams<{ email: string }>();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const handleResetPassword = async () => {
        if (!token.trim()) {
            Alert.alert('Thông báo', 'Vui lòng nhập mã xác nhận từ email');
            return;
        }
        if (!newPassword) {
            Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu mới');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Thông báo', 'Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return;
        }

        setIsLoading(true);
        try {
            await dispatch(resetPasswordThunk({
                token: token.trim(),
                newPassword,
            })).unwrap();
            Alert.alert(
                'Thành công',
                'Mật khẩu đã được đặt lại thành công! Vui lòng đăng nhập với mật khẩu mới.',
                [
                    {
                        text: 'Đăng nhập',
                        onPress: () => router.replace('/(auth)/login'),
                    },
                ]
            );
        } catch (error: any) {
            const errorMsg = error?.message || error?.data || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
            Alert.alert('Lỗi', typeof errorMsg === 'string' ? errorMsg : 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!email) {
            Alert.alert('Lỗi', 'Không tìm thấy email. Vui lòng quay lại bước trước.');
            return;
        }

        setIsResending(true);
        try {
            await dispatch(forgotPasswordThunk({ email })).unwrap();
            Alert.alert('Thành công', 'Mã xác nhận mới đã được gửi đến email của bạn.');
        } catch (error: any) {
            Alert.alert('Lỗi', 'Không thể gửi lại mã. Vui lòng thử lại.');
        } finally {
            setIsResending(false);
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
                <View className="pt-12 pb-6">
                    <Pressable
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full items-center justify-center bg-slate-200/60 dark:bg-white/5 border border-slate-300/50 dark:border-white/10"
                    >
                        <MaterialIcons name="arrow-back" size={20} color={isDark ? "#fff" : "#1E293B"} />
                    </Pressable>
                </View>

                {/* Content Area */}
                <View className="flex-1 items-center justify-center -mt-6">

                    {/* Icon */}
                    <View className="mb-6 items-center justify-center w-24 h-24 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-300/50 dark:border-white/10"
                        style={{
                            shadowColor: '#7c40ed',
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: isDark ? 0.6 : 0.3,
                            shadowRadius: 20,
                            elevation: 10,
                        }}
                    >
                        <MaterialIcons name="lock-reset" size={48} color="#7c40ed" />
                    </View>

                    {/* Title & Subtitle */}
                    <Text className="text-3xl font-bold text-slate-800 dark:text-white mb-2 text-center">
                        Đặt lại mật khẩu
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8 px-4 leading-relaxed">
                        Nhập mã xác nhận đã gửi đến{' '}
                        <Text className="text-[#7C3AED] font-semibold">{email || 'email của bạn'}</Text>
                        {' '}và tạo mật khẩu mới.
                    </Text>

                    {/* Form */}
                    <View className="w-full gap-4">

                        {/* Token Input */}
                        <View className="relative w-full">
                            <View className="absolute left-5 top-0 bottom-0 items-center justify-center z-10">
                                <MaterialIcons name="vpn-key" size={22} color={isDark ? "#94a3b8" : "#64748b"} />
                            </View>
                            <TextInput
                                className="w-full text-slate-800 dark:text-white text-base rounded-full py-4 pl-14 pr-6 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10"
                                style={{ height: 60 }}
                                placeholder="Mã xác nhận"
                                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                                autoCapitalize="none"
                                value={token}
                                onChangeText={setToken}
                                editable={!isLoading}
                            />
                        </View>

                        {/* New Password Input */}
                        <View className="relative w-full">
                            <View className="absolute left-5 top-0 bottom-0 items-center justify-center z-10">
                                <MaterialIcons name="lock" size={22} color={isDark ? "#94a3b8" : "#64748b"} />
                            </View>
                            <TextInput
                                className="w-full text-slate-800 dark:text-white text-base rounded-full py-4 pl-14 pr-14 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10"
                                style={{ height: 60 }}
                                placeholder="Mật khẩu mới"
                                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                                secureTextEntry={!showNewPassword}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                className="absolute right-5 top-0 bottom-0 justify-center z-10"
                                onPress={() => setShowNewPassword(!showNewPassword)}
                            >
                                <MaterialIcons
                                    name={showNewPassword ? "visibility" : "visibility-off"}
                                    size={22}
                                    color={isDark ? '#a1a1aa' : '#475569'}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Confirm Password Input */}
                        <View className="relative w-full">
                            <View className="absolute left-5 top-0 bottom-0 items-center justify-center z-10">
                                <MaterialIcons name="lock-outline" size={22} color={isDark ? "#94a3b8" : "#64748b"} />
                            </View>
                            <TextInput
                                className="w-full text-slate-800 dark:text-white text-base rounded-full py-4 pl-14 pr-14 bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10"
                                style={{ height: 60 }}
                                placeholder="Xác nhận mật khẩu mới"
                                placeholderTextColor={isDark ? "#64748b" : "#94a3b8"}
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                editable={!isLoading}
                            />
                            <TouchableOpacity
                                className="absolute right-5 top-0 bottom-0 justify-center z-10"
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <MaterialIcons
                                    name={showConfirmPassword ? "visibility" : "visibility-off"}
                                    size={22}
                                    color={isDark ? '#a1a1aa' : '#475569'}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleResetPassword}
                            activeOpacity={0.88}
                            disabled={isLoading}
                            className={`w-full h-[60px] rounded-full flex-row items-center justify-center gap-2 mt-2 ${isLoading ? 'bg-[#7C3AED]/70' : 'bg-[#7C3AED]'}`}
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
                                    <MaterialIcons name="check-circle" size={22} color="#fff" />
                                    <Text className="text-white font-bold text-lg">
                                        Đặt lại mật khẩu
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Resend Code */}
                        <View className="flex-row items-center justify-center mt-3 gap-1">
                            <Text className="text-slate-500 dark:text-white/60 text-sm">
                                Không nhận được mã?
                            </Text>
                            <TouchableOpacity
                                onPress={handleResendCode}
                                disabled={isResending}
                                activeOpacity={0.7}
                            >
                                {isResending ? (
                                    <ActivityIndicator size="small" color="#06B6D4" />
                                ) : (
                                    <Text className="text-[#06B6D4] font-semibold text-sm">
                                        Gửi lại
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Back to Login */}
                    <View className="mt-8">
                        <Pressable
                            onPress={() => router.replace('/(auth)/login')}
                            className="flex-row items-center justify-center gap-1"
                        >
                            <MaterialIcons name="arrow-back-ios" size={14} color="#06B6D4" />
                            <Text className="text-[#06B6D4] font-medium text-base">
                                Quay lại đăng nhập
                            </Text>
                        </Pressable>
                    </View>
                </View>

                {/* Footer spacing */}
                <View className="pb-8 mt-auto" />

            </View>
        </ScrollView>
    );
}
