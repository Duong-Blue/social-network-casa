import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StatusBar, StyleSheet, Image, Platform, Animated, PanResponder, TextInput, Modal, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { createStoryThunk } from '@/features/story/thunk/story.thunk';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VideoPlayer from '@/components/VideoPlayer';

export default function CreateStoryScreen() {
    const [selectedMedia, setSelectedMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);
    const insets = useSafeAreaInsets();

    // Caption state
    const [captionText, setCaptionText] = useState('');
    const [showCaptionInput, setShowCaptionInput] = useState(false);
    const [containerLayout, setContainerLayout] = useState({ width: 0, height: 0 });

    // Drag-drop gestures
    const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const positionRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const id = pan.addListener((value) => {
            positionRef.current = value;
        });
        return () => {
            pan.removeListener(id);
        };
    }, []);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: positionRef.current.x,
                    y: positionRef.current.y
                });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
            ),
            onPanResponderRelease: () => {
                pan.flattenOffset();
            }
        })
    ).current;

    const pickMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [9, 16],
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedMedia(result.assets[0]);
            // Reset caption khi chọn ảnh mới
            setCaptionText('');
            pan.setValue({ x: 0, y: 0 });
        }
    };

    const handleUpload = async () => {
        if (!selectedMedia || !user) {
            Alert.alert('Lỗi', 'Vui lòng chọn ảnh hoặc video');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('userId', user.userId);
        formData.append('mediaType', selectedMedia.type === 'video' ? 'video' : 'image');
        
        // Chuẩn hóa tọa độ thành tỷ lệ % so với container để tương thích mọi kích thước màn hình
        const percentX = containerLayout.width > 0 ? positionRef.current.x / containerLayout.width : 0;
        const percentY = containerLayout.height > 0 ? positionRef.current.y / containerLayout.height : 0;

        if (captionText.trim() !== '') {
            const captionPayload = JSON.stringify({
                text: captionText.trim(),
                px: percentX,
                py: percentY
            });
            formData.append('caption', captionPayload);
        } else {
            formData.append('caption', '');
        }
        
        const fileName = selectedMedia.uri.split('/').pop();
        const fileType = selectedMedia.type === 'video' ? 'video/mp4' : 'image/jpeg';
        const fileUri = selectedMedia.uri;

        formData.append('file', {
            uri: fileUri,
            name: fileName,
            type: fileType,
        } as any);

        try {
            await dispatch(createStoryThunk(formData)).unwrap();
            Alert.alert('Thành công', 'Tin của bạn đã được đăng');
            router.back();
        } catch (error) {
            console.error('Upload error:', error);
            Alert.alert('Lỗi', 'Không thể đăng tin lúc này');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <View className="flex-1 bg-black">
            <StatusBar barStyle="light-content" />
            
            {/* Header */}
            <View 
                className="flex-row items-center justify-between px-4 pb-3 z-10"
                style={{ paddingTop: 10 }}
            >
                <TouchableOpacity onPress={() => router.back()} className="p-2 bg-white/10 rounded-full">
                    <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold">Tạo tin mới</Text>
                <View style={{ width: 44 }} />
            </View>
 
            {/* Preview Area */}
            <View className="flex-1 justify-center items-center px-10">
                {selectedMedia ? (
                    <View 
                        className="w-full aspect-[9/16] rounded-3xl overflow-hidden border border-white/10 relative"
                        onLayout={(e) => {
                            const { width, height } = e.nativeEvent.layout;
                            setContainerLayout({ width, height });
                        }}
                    >
                        {selectedMedia.type === 'video' ? (
                            <VideoPlayer 
                                uri={selectedMedia.uri} 
                                style={StyleSheet.absoluteFillObject}
                            />
                        ) : (
                            <Image 
                                source={{ uri: selectedMedia.uri }} 
                                style={StyleSheet.absoluteFillObject}
                                resizeMode="cover"
                            />
                        )}

                        {/* Nút viết chữ */}
                        <TouchableOpacity 
                            onPress={() => setShowCaptionInput(true)}
                            className="absolute top-4 left-4 bg-black/60 p-2.5 rounded-full z-20"
                        >
                            <MaterialIcons name="text-fields" size={22} color="white" />
                        </TouchableOpacity>

                        {/* Caption kéo thả di chuyển */}
                        {captionText.trim() !== '' && (
                            <Animated.View
                                {...panResponder.panHandlers}
                                style={[
                                    styles.draggableCaption,
                                    {
                                        transform: [
                                            { translateX: pan.x },
                                            { translateY: pan.y }
                                        ]
                                    }
                                ]}
                            >
                                <Text style={styles.captionBubble}>{captionText}</Text>
                            </Animated.View>
                        )}

                        {/* Nút xóa ảnh */}
                        <TouchableOpacity 
                            onPress={() => {
                                setSelectedMedia(null);
                                setCaptionText('');
                                pan.setValue({ x: 0, y: 0 });
                            }}
                            className="absolute top-4 right-4 bg-black/60 p-2.5 rounded-full z-20"
                        >
                            <MaterialIcons name="delete" size={22} color="white" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity 
                        onPress={pickMedia}
                        className="w-full aspect-[9/16] rounded-3xl border-2 border-dashed border-white/20 items-center justify-center bg-white/5"
                    >
                        <View className="items-center">
                            <LinearGradient
                                colors={['#7c40ed', '#ec4899']}
                                className="w-16 h-16 rounded-full items-center justify-center mb-4"
                            >
                                <MaterialIcons name="add-a-photo" size={32} color="white" />
                            </LinearGradient>
                            <Text className="text-white font-medium text-lg">Chọn ảnh hoặc video</Text>
                            <Text className="text-slate-400 mt-2">Định dạng 9:16 là tốt nhất</Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>
 
            {/* Footer */}
            <View className="p-8 pb-12">
                <TouchableOpacity 
                    disabled={!selectedMedia || isUploading}
                    onPress={handleUpload}
                    className={`w-full py-4 rounded-2xl flex-row items-center justify-center ${(!selectedMedia || isUploading) ? 'bg-slate-800' : 'bg-[#7c40ed]'}`}
                >
                    {isUploading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Text className="text-white font-bold text-lg mr-2">Chia sẻ lên tin</Text>
                            <Ionicons name="send" size={20} color="white" />
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Modal viết caption */}
            <Modal
                visible={showCaptionInput}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCaptionInput(false)}
            >
                <View style={styles.inputModalContainer}>
                    <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowCaptionInput(false)} />
                    <View style={styles.inputModalContent}>
                        <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 12, fontSize: 16 }}>Nhập chữ viết lên tin</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Nhập chữ..."
                            placeholderTextColor="#94A3B8"
                            value={captionText}
                            onChangeText={setCaptionText}
                            autoFocus
                            multiline
                            maxLength={80}
                        />
                        <TouchableOpacity 
                            onPress={() => setShowCaptionInput(false)}
                            className="bg-[#7c40ed] w-full py-3 rounded-xl mt-4 items-center"
                        >
                            <Text className="text-white font-bold">Xong</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    draggableCaption: {
        position: 'absolute',
        top: '40%',
        left: '10%',
        zIndex: 30,
        padding: 10,
    },
    captionBubble: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        backgroundColor: 'rgba(0,0,0,0.65)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    inputModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    inputModalContent: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#1E1B4B',
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    textInput: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 14,
        color: 'white',
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        textAlign: 'center',
        minHeight: 80,
    }
});
