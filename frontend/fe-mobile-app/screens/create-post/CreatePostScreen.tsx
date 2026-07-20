import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { createPostThunk, getPostByIdThunk, updatePostThunk } from '@/features/post/thunk/post.thunk';
import { selectAuthUser } from '@/features/auth/selector/auth.selector';
import { getMediaUrl } from '@/utils/helpers/media_helper';
import { Alert, ActivityIndicator, Image } from 'react-native';
import { useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import dayjs from 'dayjs';

const SUGGESTED_USERS = [
    { id: '1', name: 'Jessica Wong', handle: '@jess_w', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByDaENjM69eeFRa3U0lUGL7eC-XzYqpxqhr5x6-9mrWqnY_-3fDGVy53iYZFTpis9gPXItSJFZ28q87TOJQzyI6NQtksPyBK2tJ1x7yix4uphODMeJs7RhXespKWUDD4XAYHJv5MCRIMx6E19IYRyNxqE38_Vbw4xJNwff6fh9LaGJrObhrpMCkAx7lFfeakk1KyLRRV5NCZXE618A2CYSXR2lm2kSktu3cnsnlCpXGqPtKv_oPTaz_sxrBDNqTGdmqkZ3vD1BI74', isOnline: true },
    { id: '2', name: 'David Kim', handle: '@dkim_dev', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALM2zHezmVb411jw70Xmzn_GPu93OwM6JhIaIziWiCkRie-cEmz6NFgIr3530Habu2v1IcwlpT9JtZxYP01B0JvKlHjJMRUQvJpHUEgQ4hAb7FDxUC5BEvEsHVfyZpVhsuJRBMuq_5thaZapDM7ERt2V4gDs1Ss7RzXQuj6Tmtj7hz6_egJZK_1qRyNNSc9TAnssSY11OxbaqNyz9_9DP6BqNYbwbxFgZtZiPyJdQQAKG-r2icODCG0JSm1VTgiRgEeAyW673z65U', isOnline: false }
];

const INITIAL_TAGGED = [
    { id: '3', handle: '@sarah_j', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCemqiqLPdFhMrhHTAXs5eKJmTKbuijEEqHujDJWynaYMcciRnu8Xp_JdaXD2Kck0xiAHErdDOXvZB8jqNOmytn5UqCvbfOgkaNYhhVz86IUQrMHapjSQTV23wJAo6QCuCdGjN9sTTRNxhCzpjddwgHj8jWPZdj3Wk74f-iCAniLD5pSXtU2OANrNNrSm-UuLUCexhCpS01cWQOUGzNpQjIAX4g1e0e7Ycqpgnv6ZVpxN8UsKWlO-aDq7NqBpBn1P2SHqy1868ztXQ' },
    { id: '4', handle: '@mike_neon', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYlp_Cr6JBMsLCO4QDYXGnQxL_EmidbuIi0PMFRcoFZFXtmtFYgEYBc_nCQ3qDmj-dnpWOcv9RbHFYQ1tbNC7kQN_sCPwvnnHPQLyqlUW492fU_HmUPeS9hu3hHTVCVucudoG4aROJvsVQk0JrE7QtNB2PJbppMNt2RXwhTH6a_ZZVxcBa9f8Omum0pENZw7C_vPhT0LxEYUkr6SmPp23Ao2vaPZhP6iUp3xTLYp6raJgOYaYRB0MKaTaF6JU60lIejWnrHNJv0mE' }
];

export default function CreatePostScreen() {
    const router = useRouter();
    const { postId, sharedPostId } = useLocalSearchParams<{ postId: string; sharedPostId: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const insets = useSafeAreaInsets();
    const { colorScheme } = useColorScheme();

    const user = useSelector(selectAuthUser);
    const { isLoading } = useSelector((state: RootState) => state.post);

    const [content, setContent] = useState('');
    const [selectedImages, setSelectedImages] = useState<any[]>([]);
    const [privacyLevel, setPrivacyLevel] = useState('PUBLIC');
    const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);
    const [sharedPost, setSharedPost] = useState<any>(null);

    useEffect(() => {
        if (sharedPostId) {
            dispatch(getPostByIdThunk(sharedPostId)).unwrap()
                .then((response) => {
                    if (response?.data) {
                        setSharedPost(response.data);
                    }
                })
                .catch((error) => {
                    console.error('Failed to fetch shared post:', error);
                });
        }
    }, [sharedPostId, dispatch]);

    useEffect(() => {
        if (postId) {
            dispatch(getPostByIdThunk(postId)).unwrap()
                .then((response) => {
                    const post = response.data;
                    setContent(post.content || '');
                    setPrivacyLevel(post.privacyLevel || 'PUBLIC');
                    if (post.mediaUrls) {
                        // Map existing URLs to a format similar to selectedImages but marked as remote
                        setExistingMediaUrls(post.mediaUrls);
                        const remoteImages = post.mediaUrls.map(url => ({
                            uri: getMediaUrl(url),
                            isRemote: true,
                            originalUrl: url
                        }));
                        setSelectedImages(remoteImages);
                    }
                })
                .catch((error) => {
                    console.error('Failed to fetch post for edit:', error);
                    Alert.alert('Lỗi', 'Không thể tải thông tin bài viết để chỉnh sửa.');
                });
        }
    }, [postId, dispatch]);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Thông báo', 'Chúng tôi cần quyền truy cập thư viện ảnh để đăng bài.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsMultipleSelection: true,
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedImages([...selectedImages, ...result.assets]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...selectedImages];
        newImages.splice(index, 1);
        setSelectedImages(newImages);
    };

    const handleSavePost = async () => {
        if (!content.trim() && selectedImages.length === 0 && !sharedPostId) {
            Alert.alert('Thông báo', 'Vui lòng nhập nội dung hoặc chọn ảnh');
            return;
        }

        if (!user?.userId) {
            Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
            return;
        }

        const formData = new FormData();

        // 1. Tạo object post data
        const postData: any = {
            user: user.userId,
            content: content.trim(),
            privacyLevel: privacyLevel,
            isPublicPost: privacyLevel === 'PUBLIC',
            isPublicComment: true
        };

        if (sharedPostId) {
            postData.sharedPostId = sharedPostId;
        }

        if (postId) {
            // Danh sách các ảnh cũ được giữ lại
            const keepMediaUrls = selectedImages
                .filter(img => img.isRemote)
                .map(img => img.originalUrl);

            // Gửi mảng URL ảnh cũ dưới dạng chuỗi JSON thuần túy
            formData.append('keepMediaUrls', JSON.stringify(keepMediaUrls));
        }

        // 2. Append post data dưới dạng chuỗi JSON thuần túy để tránh lỗi Network Error trong React Native
        const postDataString = JSON.stringify(postData);
        formData.append('post', postDataString);

        // 3. Append NEW files only (hỗ trợ cả ảnh và video)
        selectedImages.forEach((image, index) => {
            if (!image.isRemote) {
                const fileName = image.uri.split('/').pop();
                const isVideo = image.type === 'video' || image.mimeType?.startsWith('video');
                const mimeType = isVideo ? 'video/mp4' : 'image/jpeg';
                const prefix = isVideo ? 'video' : 'image';
                const name = fileName || `${prefix}_new_${index}.${isVideo ? 'mp4' : 'jpg'}`;
                const fileUri = image.uri;

                formData.append('files', {
                    uri: fileUri,
                    name,
                    type: mimeType,
                } as any);
            }
        });

        const clearForm = () => {
            setContent('');
            setSelectedImages([]);
            setPrivacyLevel('PUBLIC');
            setExistingMediaUrls([]);
        };

        try {
            if (postId) {
                await dispatch(updatePostThunk({ postId, data: formData })).unwrap();
                clearForm();
                Alert.alert('Thành công', 'Bài viết đã được cập nhật!', [
                    { text: 'OK', onPress: () => router.replace('/(tab)') }
                ]);
            } else {
                await dispatch(createPostThunk(formData)).unwrap();
                clearForm();
                Alert.alert('Thành công', 'Bài viết của bạn đã được đăng!', [
                    { text: 'OK', onPress: () => router.replace('/(tab)') }
                ]);
            }
        } catch (error: any) {
            console.error(postId ? 'Update post failed:' : 'Create post failed:', error);
            Alert.alert('Lỗi', typeof error === 'string' ? error : `Không thể ${postId ? 'cập nhật' : 'đăng'} bài viết. Vui lòng thử lại.`);
        }
    };

    const handleClose = () => {
        setContent('');
        setSelectedImages([]);
        setPrivacyLevel('PUBLIC');
        setExistingMediaUrls([]);
        router.back();
    };

    return (
        <View className="flex-1 bg-[#f7f6f8] dark:bg-[#0F0A1F]">
            <View className="flex-1">
                {/* Top App Bar */}
                <View 
                    className="flex-row items-center justify-between px-4 pb-3 border-b border-black/5 dark:border-white/10 bg-white dark:bg-[#0F0A1F]"
                    style={{ paddingTop: 10 }}
                >
                    <TouchableOpacity onPress={handleClose} className="w-8 h-8 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 active:opacity-75">
                        <MaterialIcons name="close" size={24} color={colorScheme === 'dark' ? 'white' : '#1E293B'} />
                    </TouchableOpacity>
                    <Text className="text-lg font-bold text-slate-800 dark:text-white">{postId ? 'Sửa bài viết' : 'Tạo bài viết'}</Text>
                    <TouchableOpacity
                        onPress={handleSavePost}
                        disabled={isLoading}
                        className={`px-4 py-1.5 rounded-full ${isLoading ? 'bg-slate-700' : 'bg-[#7c3bed]'}`}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text className="text-white font-bold text-sm">{postId ? 'Cập nhật' : 'Đăng'}</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                >
                    <ScrollView
                        className="flex-1 px-4"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* User Info & Privacy */}
                        <View className="flex-row items-center gap-3 py-4">
                            <Image
                                source={{ uri: getMediaUrl(user?.profilePicture) || `https://ui-avatars.com/api/?name=${user?.username}&background=random` }}
                                className="w-12 h-12 rounded-full border-2 border-primary/30 bg-transparent"
                            />
                            <View>
                                <Text className="text-slate-800 dark:text-white font-bold text-base">{user?.username}</Text>
                                <TouchableOpacity
                                    onPress={() => setPrivacyLevel(privacyLevel === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC')}
                                    className="flex-row items-center bg-slate-200 dark:bg-white/10 px-2 py-1 rounded-md mt-1"
                                >
                                    <MaterialIcons name={privacyLevel === 'PUBLIC' ? 'public' : 'lock'} size={14} color={colorScheme === 'dark' ? '#94a3b8' : '#475569'} />
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1 font-medium">
                                        {privacyLevel === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}
                                    </Text>
                                    <MaterialIcons name="arrow-drop-down" size={16} color={colorScheme === 'dark' ? '#94a3b8' : '#475569'} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Content Section */}
                        <View className="w-full relative mt-2">
                            <TextInput
                                className="w-full min-h-[120px] text-slate-800 dark:text-white p-0 text-lg"
                                placeholder={sharedPostId ? "Hãy viết cảm nghĩ của bạn về bài viết này..." : "Bạn đang nghĩ gì thế?"}
                                placeholderTextColor={colorScheme === 'dark' ? '#94a3b8' : '#64748B'}
                                multiline
                                textAlignVertical="top"
                                value={content}
                                onChangeText={setContent}
                                style={{ paddingTop: 0 }}
                                editable={!isLoading}
                            />
                        </View>

                        {/* Shared Post Box Preview */}
                        {sharedPost && (
                            <View className="mt-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-white/5 shadow-sm">
                                <View className="flex-row items-center gap-2 mb-3">
                                    <Image 
                                        source={{ uri: getMediaUrl(sharedPost.user?.profilePicture) || `https://ui-avatars.com/api/?name=${sharedPost.user?.username}&background=random` }}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <View>
                                        <Text className="text-xs font-bold text-slate-800 dark:text-white">{sharedPost.user?.username}</Text>
                                        <Text className="text-[10px] text-slate-500 dark:text-slate-400">{dayjs(sharedPost.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                                    </View>
                                </View>
                                {sharedPost.content ? (
                                    <Text className="text-xs text-slate-700 dark:text-slate-300 leading-snug mb-3" numberOfLines={4}>
                                        {sharedPost.content}
                                    </Text>
                                ) : null}
                                {sharedPost.mediaUrls && sharedPost.mediaUrls.length > 0 && (
                                    <Image 
                                        source={{ uri: getMediaUrl(sharedPost.mediaUrls[0]) }} 
                                        className="w-full h-44 rounded-xl mt-1" 
                                        resizeMode="cover" 
                                    />
                                )}
                            </View>
                        )}

                        {/* Image Preview Section */}
                        {!sharedPostId && (
                            <View className="mt-6">
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-lg font-bold text-slate-800 dark:text-white">Ảnh & Video</Text>
                                    <Text className="text-slate-500 dark:text-slate-400 text-xs">{selectedImages.length} tệp</Text>
                                </View>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
                                    {selectedImages.map((image, index) => {
                                        const isVideo = image.type?.startsWith('video') || image.mimeType?.startsWith('video');
                                        return (
                                            <View key={index} className="relative">
                                                <Image source={{ uri: image.uri }} className="w-28 h-36 rounded-xl" />
                                                {isVideo && (
                                                    <View className="absolute inset-0 items-center justify-center">
                                                        <View className="bg-black/40 w-10 h-10 rounded-full items-center justify-center">
                                                            <MaterialIcons name="play-arrow" size={24} color="white" />
                                                        </View>
                                                    </View>
                                                )}
                                                <TouchableOpacity
                                                    onPress={() => removeImage(index)}
                                                    className="absolute top-1 right-1 bg-black/50 w-6 h-6 rounded-full items-center justify-center border border-white/20"
                                                >
                                                    <MaterialIcons name="close" size={14} color="white" />
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })}

                                    <TouchableOpacity
                                        onPress={pickImage}
                                        className="w-28 h-36 rounded-xl border-2 border-dashed border-slate-300 dark:border-white/20 items-center justify-center bg-slate-200/50 dark:bg-white/5"
                                    >
                                        <View className="bg-primary/20 p-2 rounded-full mb-1">
                                            <MaterialIcons name="add-a-photo" size={20} color="#7c3bed" />
                                        </View>
                                        <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-medium">Thêm ảnh</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            </View>
                        )}

                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
}
