import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { customAlert } from '@/components/CustomAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { registerThunk } from '@/features/auth/thunk/auth.thunk';
import { AppDispatch, RootState } from '@/store';
import { RegisterRequest } from '@/features/auth/type/auth.types';
import { useColorScheme } from 'nativewind';
import MaskedView from '@react-native-masked-view/masked-view';

// Màn hình đăng ký dựa trên thiết kế HTML Neon
export default function RegisterScreen() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { isLoading } = useSelector((state: RootState) => state.auth);
    const { colorScheme } = useColorScheme();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validateEmail = (emailStr: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(emailStr.trim());
    };

    const handleRegister = async () => {
        const fullNameTrim = fullName.trim();
        const emailTrim = email.trim();
        const passwordTrim = password;
        const confirmPasswordTrim = confirmPassword;

        if (!fullNameTrim) {
            customAlert.alert('Thông báo', 'Vui lòng nhập họ và tên của bạn.');
            return;
        }
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
        if (!confirmPasswordTrim) {
            customAlert.alert('Thông báo', 'Vui lòng xác nhận lại mật khẩu.');
            return;
        }
        if (passwordTrim !== confirmPasswordTrim) {
            customAlert.alert('Thông báo', 'Mật khẩu xác nhận không khớp!');
            return;
        }

        const registerData: RegisterRequest = {
            email: emailTrim,
            username: fullNameTrim, // Map Full Name to username as requested
            password: passwordTrim
        };

        try {
            const resultAction = await dispatch(registerThunk(registerData));
            if (registerThunk.fulfilled.match(resultAction)) {
                customAlert.alert('Thành công', 'Đăng ký tài khoản thành công!', [
                    { text: 'OK', onPress: () => router.push('/(auth)/login') }
                ]);
            } else {
                const payload = resultAction.payload as any;
                let errorMsg = 'Đăng ký thất bại. Vui lòng thử lại sau.';

                if (payload) {
                    const dataStr = typeof payload.data === 'string' ? payload.data : '';
                    const msgStr = typeof payload.message === 'string' ? payload.message : '';

                    if (dataStr.includes('Email already exists') || msgStr.includes('Email already exists')) {
                        errorMsg = 'Email này đã được sử dụng trên hệ thống! Vui lòng dùng email khác.';
                    } else if (dataStr.includes('Username already exists') || msgStr.includes('Username already exists') || dataStr.includes('users.UKr43af9ap4edm43mmtq01oddj6')) {
                        errorMsg = 'Tên người dùng đã tồn tại, vui lòng chọn tên khác!';
                    } else if (payload.message === 'Validation Error') {
                        errorMsg = payload.data || 'Dữ liệu đăng ký không hợp lệ.';
                    } else {
                        errorMsg = payload.data || payload.message || errorMsg;
                    }
                }

                customAlert.alert('Đăng ký thất bại', errorMsg);
            }
        } catch (err) {
            customAlert.alert('Lỗi', 'Đã có lỗi xảy ra, vui lòng thử lại sau');
        }
    };

    return (
        <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="bg-[#f7f6f8] dark:bg-[#0F0A1F]"
        >
            <View className="relative flex-1 overflow-hidden px-8 pt-12 pb-8 justify-center bg-[#f7f6f8] dark:bg-[#0F0A1F]">
                {/* Decorative circles */}
                <View className="absolute -top-32 -right-32 w-64 h-64 rounded-full bg-[#7c3bed]/10" />
                <View className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-[#f43f5e]/10" />

                {/* Header */}
                <View className="items-center mb-6">
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
                    <Text className="text-3xl font-bold text-slate-800 dark:text-white text-center mt-2">
                        Tạo Tài Khoản
                    </Text>

                </View>

                {/* Form */}
                <View className="gap-4 w-full mb-8">
                    {/* Full Name */}
                    <View className="relative">
                        <View className="absolute left-5 top-0 bottom-0 justify-center z-10">
                            <MaterialIcons name="person" size={22} color={colorScheme === 'dark' ? '#a1a1aa' : '#475569'} />
                        </View>
                        <TextInput
                            className="w-full h-14 pl-14 pr-6 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white text-base"
                            placeholder="Họ và Tên"
                            placeholderTextColor={colorScheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                            autoCapitalize="words"
                            value={fullName}
                            onChangeText={setFullName}
                        />
                    </View>

                    {/* Email */}
                    <View className="relative">
                        <View className="absolute left-5 top-0 bottom-0 justify-center z-10">
                            <MaterialIcons name="mail" size={22} color={colorScheme === 'dark' ? '#a1a1aa' : '#475569'} />
                        </View>
                        <TextInput
                            className="w-full h-14 pl-14 pr-6 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white text-base"
                            placeholder="Địa chỉ Email"
                            placeholderTextColor={colorScheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    {/* Password */}
                    <View className="relative">
                        <View className="absolute left-5 top-0 bottom-0 justify-center z-10">
                            <MaterialIcons name="lock" size={22} color={colorScheme === 'dark' ? '#a1a1aa' : '#475569'} />
                        </View>
                        <TextInput
                            className="w-full h-14 pl-14 pr-14 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white text-base"
                            placeholder="Mật khẩu"
                            placeholderTextColor={colorScheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity
                            className="absolute right-5 top-0 bottom-0 justify-center z-10"
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <MaterialIcons
                                name={showPassword ? "visibility" : "visibility-off"}
                                size={22}
                                color={colorScheme === 'dark' ? '#a1a1aa' : '#475569'}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Confirm Password */}
                    <View className="relative">
                        <View className="absolute left-5 top-0 bottom-0 justify-center z-10">
                            <MaterialCommunityIcons name="lock-reset" size={22} color={colorScheme === 'dark' ? '#a1a1aa' : '#475569'} />
                        </View>
                        <TextInput
                            className="w-full h-14 pl-14 pr-14 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white text-base"
                            placeholder="Xác nhận mật khẩu"
                            placeholderTextColor={colorScheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity
                            className="absolute right-5 top-0 bottom-0 justify-center z-10"
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <MaterialIcons
                                name={showConfirmPassword ? "visibility" : "visibility-off"}
                                size={22}
                                color={colorScheme === 'dark' ? '#a1a1aa' : '#475569'}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity
                    className={`w-full h-[58px] rounded-full items-center justify-center mb-8 ${isLoading ? 'bg-[#7c3bed]/70' : 'bg-[#7c3bed]'}`}
                    onPress={handleRegister}
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
                        <Text className="text-white font-bold text-lg">Đăng ký ngay</Text>
                    )}
                </TouchableOpacity>

                {/* Footer */}
                <View className="flex-row justify-center items-center">
                    <Text className="text-slate-500 dark:text-white/60 text-sm">Đã có tài khoản? </Text>
                    <Pressable onPress={() => router.push('/(auth)/login')}>
                        <Text className="text-[#f43f5e] font-bold text-sm">Đăng nhập</Text>
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
            </View>
        </ScrollView>
    );
}
