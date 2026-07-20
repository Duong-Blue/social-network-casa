import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const TAGS = ['All', '#Cyberpunk', '#Vaporwave', '#NeonArt', '#Retro', '#Synthwave'];

export default function TrendingTags() {
    const [activeTag, setActiveTag] = useState('All');

    return (
        <View className="mb-4">
            {/* Header */}
            <View className="flex-row justify-between items-end px-4 mb-3">
                <Text className="text-slate-800 dark:text-white text-lg font-bold tracking-tight">Trending Now</Text>
                <TouchableOpacity activeOpacity={0.7}>
                    <Text className="text-[#a855f7] text-sm font-semibold">See All</Text>
                </TouchableOpacity>
            </View>

            {/* Tags Scroll */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
                {TAGS.map((tag) => {
                    const isActive = tag === activeTag;

                    return (
                        <TouchableOpacity
                            key={tag}
                            activeOpacity={0.8}
                            onPress={() => setActiveTag(tag)}
                        >
                            {isActive ? (
                                <LinearGradient
                                    colors={['#7c3bed', '#a855f7']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    className="px-5 py-2.5 rounded-full"
                                >
                                    <Text className="text-white font-semibold text-sm">{tag}</Text>
                                </LinearGradient>
                            ) : (
                                <View className="px-5 py-2.5 bg-slate-200/80 dark:bg-[#1A1525] rounded-full border border-slate-300/60 dark:border-white/5 hover:bg-white/10 transition-colors">
                                    <Text className="text-slate-600 dark:text-slate-300 font-medium text-sm">{tag}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}
