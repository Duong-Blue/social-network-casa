import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { customAlert } from '@/components/CustomAlert';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { loginThunk, getMeThunk } from '@/features/auth/thunk/auth.thunk';
import { selectAuthLoading } from '@/features/auth/selector/auth.selector';
import { useColorScheme } from 'nativewind';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

// Màn hình đăng nhập dựa trên thiết kế HTML Neon
export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { colorScheme } = useColorScheme();

    const dispatch = useAppDispatch();
    const isLoading = useAppSelector(selectAuthLoading);

    const validateEmail = (emailStr: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(emailStr.trim());
    };

    const getErrorMessage = (error: any): string => {
        if (!error) return 'Đã xảy ra lỗi không xác định.';
        if (typeof error === 'string') {
            if (error.includes('User not found') || error.includes('Bad credentials') || error.includes('Wrong password')) {
                return 'Email hoặc mật khẩu không chính xác.';
            }
            return error;
        }
        
        // Nếu là lỗi validation từ Backend
        if (error.message === 'Validation Error') {
            return error.data || 'Dữ liệu không hợp lệ.';
        }

        const msg = error.data || error.message || '';
        if (msg.includes('User not found') || 
            msg.includes('Invalid password') || 
            msg.includes('Bad credentials') || 
            msg.includes('Wrong password') || 
            msg.includes('password incorrect')) {
            return 'Email hoặc mật khẩu không chính xác.';
        }
        if (msg.includes('locked')) {
            return 'Tài khoản của bạn đã tạm thời bị khóa.';
        }
        if (msg.includes('not verified')) {
            return 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email.';
        }
        if (msg.includes('email không được bỏ trống')) {
            return 'Email không được bỏ trống.';
        }
        if (msg.includes('Mật khẩu không được trống')) {
            return 'Mật khẩu không được bỏ trống.';
        }
        if (msg.includes('Mật khẩu cần ít nhất là 6 ký tự')) {
            return 'Mật khẩu phải có độ dài từ 6 ký tự trở lên.';
        }
        
        return msg || 'Đã xảy ra lỗi đăng nhập, vui lòng thử lại sau.';
    };

    const handleLogin = async () => {
        const emailTrim = email.trim();
        const passwordTrim = password;

        if (!emailTrim) {
            customAlert.alert('Thông báo', 'Vui lòng nhập địa chỉ email.');
            return;
        }
        if (!validateEmail(emailTrim)) {
            customAlert.alert('Thông báo', 'Email không đúng định dạng. Vui lòng kiểm tra lại.');
            return;
        }
        if (!passwordTrim) {
            customAlert.alert('Thông báo', 'Vui lòng nhập mật khẩu.');
            return;
        }
        if (passwordTrim.length < 6) {
            customAlert.alert('Thông báo', 'Mật khẩu phải có độ dài từ 6 ký tự trở lên.');
            return;
        }

        try {
            const resultAction = await dispatch(loginThunk({ email: emailTrim, password: passwordTrim })).unwrap();
            console.log('Login successful, fetching user info...');

            // Gọi getMe để lấy thông tin user (bao gồm userId) sau khi có token
            await dispatch(getMeThunk()).unwrap();

            router.replace('/(tab)');
        } catch (error: any) {
            console.error('Login failed:', error);
            const friendlyMessage = getErrorMessage(error);
            customAlert.alert('Đăng nhập thất bại', friendlyMessage);
        }
    };

    const handleGoogleLogin = () => {
        // TODO: tích hợp Google Sign‑In
        console.log('Google login');
    };

    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="bg-[#f7f6f8] dark:bg-[#0F0A1F]"
        >
            <View className="relative flex-1 px-6 pt-8 pb-32 justify-center">
                {/* Form Container Wrapper */}
                <View className="gap-6 w-full max-w-md mx-auto bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-6"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        elevation: 2,
                    }}
                >
                    {/* Header */}
                    <View className="items-center">
                        <MaskedView
                            maskElement={
                                <Text
                                    style={{
                                        fontSize: 36,
                                        fontWeight: '900',
                                        letterSpacing: 2,
                                    }}
                                >
                                    CASA
                                </Text>
                            }
                        >
                            <LinearGradient
                                colors={['#ac0d71ff', '#038effff']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text
                                    style={{
                                        fontSize: 36,
                                        fontWeight: '900',
                                        letterSpacing: 2,
                                        opacity: 0,
                                    }}
                                >
                                    CASA
                                </Text>
                            </LinearGradient>
                        </MaskedView>
                        <Text className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white text-center mb-2">
                            Chào mừng trở lại
                        </Text>
                    </View>

                    {/* Email */}
                    <View className="relative">
                        <View className="absolute left-5 top-0 bottom-0 justify-center z-10">
                            <MaterialIcons name="mail" size={24} color={colorScheme === 'dark' ? '#a1a1aa' : '#475569'} />
                        </View>
                        <TextInput
                            className="w-full h-14 pl-14 pr-6 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white text-base"
                            placeholder="Địa chỉ Email"
                            placeholderTextColor={colorScheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                            editable={!isLoading}
                        />
                    </View>

                    {/* Password */}
                    <View className="relative">
                        <View className="absolute left-5 top-0 bottom-0 justify-center z-10">
                            <MaterialIcons name="lock" size={24} color={colorScheme === 'dark' ? '#a1a1aa' : '#475569'} />
                        </View>
                        <TextInput
                            className="w-full h-14 pl-14 pr-14 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white text-base"
                            placeholder="Mật khẩu"
                            placeholderTextColor={colorScheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            className="absolute right-5 top-0 bottom-0 justify-center z-10"
                            onPress={() => setShowPassword(!showPassword)}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons
                                name={showPassword ? "visibility" : "visibility-off"}
                                size={24}
                                color={colorScheme === 'dark' ? '#a1a1aa' : '#475569'}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Additional Options */}
                    <View className="flex-row justify-between items-center px-2">
                        <Pressable onPress={() => router.push({ pathname: '/(auth)/forgot-password' })}>
                            <Text className="text-[#06B6D4] text-sm font-medium">
                                Quên mật khẩu?
                            </Text>
                        </Pressable>

                        <TouchableOpacity
                            className="flex-row items-center gap-2"
                            onPress={() => setRememberMe(!rememberMe)}
                            activeOpacity={0.8}
                        >
                            <View
                                className={`w-4 h-4 rounded border items-center justify-center ${rememberMe ? 'bg-[#7c3bed] border-[#7c3bed]' : 'border-slate-400 dark:border-white/30'}`}
                            >
                                {rememberMe && <MaterialIcons name="check" size={12} color="#fff" />}
                            </View>
                            <Text className="text-slate-500 dark:text-white/60 text-sm">Lưu mật khẩu</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        className={`w-full h-[58px] rounded-full items-center justify-center mt-2 ${isLoading ? 'bg-[#7c3bed]/70' : 'bg-[#7c3bed]'}`}
                        onPress={handleLogin}
                        activeOpacity={0.8}
                        disabled={isLoading}
                        style={{
                            shadowColor: '#7c3bed',
                            shadowOffset: { width: 0, height: 10 },
                            shadowOpacity: 0.6,
                            shadowRadius: 20,
                            elevation: 12,
                        }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Đăng nhập</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View className="mt-8 flex-row justify-center items-center">
                    <Text className="text-slate-500 dark:text-white/60 text-sm">Chưa có tài khoản? </Text>
                    <Pressable onPress={() => router.push('/(auth)/register')}>
                        <Text className="text-[#f43f5e] font-bold text-sm">Đăng ký ngay</Text>
                    </Pressable>
                </View>

                {/* Guest Mode */}
                <View className="mt-4 flex-row justify-center items-center pb-4">
                    <TouchableOpacity 
                        onPress={() => router.replace('/(tab)')}
                        className="flex-row items-center gap-1.5 py-2 px-5 rounded-full bg-slate-200 dark:bg-white/10"
                        activeOpacity={0.8}
                    >
                        <Text className="text-slate-600 dark:text-slate-300 text-sm font-semibold">Trải nghiệm không cần đăng nhập</Text>
                        <MaterialIcons name="arrow-forward" size={16} color={colorScheme === 'dark' ? '#cbd5e1' : '#475569'} />
                    </TouchableOpacity>
                </View>

                {/* Decorative circles */}
                <View className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-[#7c3bed]/10" />
                <View className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-[#f43f5e]/10" />
            </View>
        </ScrollView>
    );
}
