import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { selectMyProfile } from '@/features/account/selector/account.selector';
import { updateProfileThunk } from '@/features/account/thunk/account.thunk';
import { updateUser } from '@/features/auth/slice/auth.slice';
import { LinearGradient } from 'expo-linear-gradient';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { useColorScheme } from 'nativewind';

export default function EditProfileScreen() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const profile = useSelector(selectMyProfile);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [username, setUsername] = useState(profile?.username || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [selectedImage, setSelectedImage] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setUsername(profile.username || '');
            setBio(profile.bio || '');
        }
    }, [profile]);

    const pickImage = async () => {
        // Yêu cầu quyền truy cập thư viện ảnh
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Thông báo', 'Chúng tôi cần quyền truy cập thư viện ảnh để thay đổi ảnh đại diện.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0]);
        }
    };

    const handleSave = async () => {
        if (!user?.userId) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng');
            return;
        }

        setIsSaving(true);
        const formData = new FormData();
        if (username) formData.append('username', username);
        if (bio) formData.append('bio', bio);

        if (selectedImage) {
            // Lấy tên file từ uri
            const fileName = selectedImage.uri.split('/').pop();
            const match = /\.(\w+)$/.exec(fileName || '');
            const type = match ? `image/${match[1]}` : `image/jpeg`;
            const fileUri = selectedImage.uri;

            formData.append('profilePicture', {
                uri: fileUri,
                name: fileName || 'profile.jpg',
                type: type,
            } as any);
        }

        try {
            const result = await dispatch(updateProfileThunk({ userId: user.userId, data: formData })).unwrap();

            // Cập nhật lại auth state để các màn hình khác dùng user.profilePicture cũng đổi theo
            dispatch(updateUser({
                username: result.data.username,
                profilePicture: result.data.profilePicture || undefined
            }));

            Alert.alert('Thành công', 'Hồ sơ đã được cập nhật');
            router.back();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật hồ sơ');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
            style={{ backgroundColor: isDark ? '#0f0c18' : '#f7f6f8' }}
        >
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View
                className="flex-row items-center justify-between px-4 pb-3 border-b border-black/5 dark:border-white/10"
                style={{ paddingTop: 10 }}
            >
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Ionicons name="arrow-back" size={24} color={isDark ? 'white' : '#1E293B'} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-slate-800 dark:text-white">Chỉnh sửa hồ sơ</Text>
                <TouchableOpacity onPress={handleSave} disabled={isSaving} className="p-2">
                    <Text className={`font-bold text-lg ${isSaving ? 'text-slate-500' : 'text-[#7c40ed]'}`}>Lưu</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-6 pt-6">
                {/* Avatar Section */}
                <View className="items-center mb-10">
                    <View className="relative">
                        <View className="w-32 h-32 rounded-full border-2 border-primary/30 p-[4px] items-center justify-center">
                            <View className="w-full h-full rounded-full border-2 bg-transparent overflow-hidden" style={{ borderColor: isDark ? '#0F0A1F' : '#f7f6f8' }}>
                                <Image
                                    source={{ uri: selectedImage?.uri || getMediaUrl(profile?.profilePicture) || `https://ui-avatars.com/api/?name=${user?.username}&background=random` }}
                                    className="w-full h-full rounded-full"
                                    resizeMode="cover"
                                />
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={pickImage}
                            className="absolute bottom-0 right-0 bg-[#7c40ed] w-10 h-10 rounded-full items-center justify-center"
                            style={{ borderWidth: 4, borderColor: isDark ? '#0f0c18' : '#f7f6f8' }}
                        >
                            <MaterialIcons name="photo-camera" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Form Fields */}
                <View className="space-y-6">
                    <View>
                        <Text className="text-slate-500 dark:text-slate-400 mb-2 font-medium ml-1">Tên hiển thị</Text>
                        <TextInput
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Nhập tên của bạn"
                            placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                            className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl p-4 border border-slate-300 dark:border-slate-800 focus:border-[#7c40ed]"
                        />
                    </View>

                    <View className="mt-6">
                        <Text className="text-slate-500 dark:text-slate-400 mb-2 font-medium ml-1">Tiểu sử (Bio)</Text>
                        <TextInput
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Kể chút về bản thân bạn..."
                            placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            className="bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl p-4 border border-slate-300 dark:border-slate-800 focus:border-[#7c40ed] min-h-[120px]"
                        />
                    </View>
                </View>

                <View className="h-20" />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
