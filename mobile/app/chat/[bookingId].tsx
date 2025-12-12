/**
 * Chat Screen - Real-time messaging between Patient and Therapist
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';
import api, { API_BASE_URL } from '@/lib/api';

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: string;
}

interface ChatRoom {
    bookingId: string;
    status: 'OPEN' | 'CLOSED' | 'DISABLED' | 'NOT_FOUND';
    message?: string;
}

export default function ChatScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const params = useLocalSearchParams<{ bookingId: string }>();
    const { user, token } = useAuthStore();
    const flatListRef = useRef<FlatList>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [roomStatus, setRoomStatus] = useState<ChatRoom | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch chat room info
    const fetchRoomInfo = useCallback(async () => {
        try {
            const room = await api.get<ChatRoom>(`/chat/${params.bookingId}`);
            setRoomStatus(room);
            return room;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    }, [params.bookingId]);

    // Fetch messages
    const fetchMessages = useCallback(async () => {
        try {
            const data = await api.get<Message[]>(`/chat/${params.bookingId}/messages`);
            setMessages(data);
        } catch (err: any) {
            console.error('Failed to fetch messages:', err);
        }
    }, [params.bookingId]);

    // Initial load
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            const room = await fetchRoomInfo();
            if (room?.status === 'OPEN') {
                await fetchMessages();
            }
            setIsLoading(false);
        };
        load();
    }, [fetchRoomInfo, fetchMessages]);

    // Poll for new messages (simple polling instead of real-time for now)
    useEffect(() => {
        if (roomStatus?.status !== 'OPEN') return;

        const interval = setInterval(() => {
            fetchMessages();
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(interval);
    }, [roomStatus?.status, fetchMessages]);

    // Send message
    const handleSend = async () => {
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const response = await fetch(`${API_BASE_URL}/chat/${params.bookingId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ text: newMessage.trim() }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Gagal mengirim pesan');
            }

            const sent = await response.json();
            setMessages(prev => [...prev, sent]);
            setNewMessage('');

            // Scroll to bottom
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        } catch (err: any) {
            Alert.alert('Error', err.message);
        } finally {
            setIsSending(false);
        }
    };

    // Parse Firestore timestamp or ISO string
    const parseTimestamp = (ts: any): Date => {
        if (!ts) return new Date();
        // Firestore timestamp object
        if (ts._seconds) return new Date(ts._seconds * 1000);
        // ISO string
        if (typeof ts === 'string') return new Date(ts);
        return new Date();
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.senderId === user?.id;
        const timestamp = parseTimestamp(item.createdAt);
        const timeStr = timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        return (
            <View style={[
                styles.messageBubble,
                isMe ? styles.myMessage : styles.theirMessage,
                { backgroundColor: isMe ? colors.primary : colors.cardBackground }
            ]}>
                {!isMe && (
                    <Text style={[styles.senderName, { color: colors.primary }]}>
                        {item.senderName}
                    </Text>
                )}
                <Text style={[styles.messageText, { color: isMe ? '#fff' : colors.text }]}>
                    {item.text}
                </Text>
                <Text style={[styles.messageTime, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>
                    {timeStr}
                </Text>
            </View>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <Stack.Screen options={{ title: 'Chat' }} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (error || !roomStatus || roomStatus.status === 'NOT_FOUND' || roomStatus.status === 'DISABLED') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <Stack.Screen options={{ title: 'Chat' }} />
                <View style={styles.center}>
                    <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
                    <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                        {roomStatus?.message || error || 'Chat tidak tersedia'}
                    </Text>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.primary }]}>
                        <Text style={styles.backButtonText}>Kembali</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (roomStatus.status === 'CLOSED') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <Stack.Screen options={{ title: 'Chat' }} />
                <View style={styles.center}>
                    <Ionicons name="lock-closed" size={64} color={colors.textMuted} />
                    <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                        Chat sudah ditutup
                    </Text>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.primary }]}>
                        <Text style={styles.backButtonText}>Kembali</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <Stack.Screen options={{ title: 'Chat' }} />
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={90}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                Belum ada pesan. Mulai percakapan!
                            </Text>
                        </View>
                    }
                />

                <View style={[styles.inputContainer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Ketik pesan..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, { backgroundColor: colors.primary, opacity: isSending ? 0.5 : 1 }]}
                        onPress={handleSend}
                        disabled={isSending || !newMessage.trim()}
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="send" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    statusText: {
        fontSize: Typography.fontSize.md,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
    backButton: {
        marginTop: Spacing.lg,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: Typography.fontWeight.semibold,
    },
    messageList: {
        padding: Spacing.md,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: Typography.fontSize.sm,
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    myMessage: {
        alignSelf: 'flex-end',
        marginLeft: '25%',
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        marginRight: '25%',
        borderBottomLeftRadius: 4,
    },
    senderName: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 2,
    },
    messageText: {
        fontSize: Typography.fontSize.md,
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: Spacing.sm,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        marginRight: Spacing.sm,
        fontSize: Typography.fontSize.md,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
